const http = require("http");

const OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions";
const MODEL = "qwen2.5:1.5b";

function sendMessage(msg) {
  const json = JSON.stringify(msg);
  const len = Buffer.byteLength(json);
  const header = Buffer.alloc(4);
  header.writeUInt32LE(len, 0);
  process.stdout.write(header);
  process.stdout.write(json);
}

function readMessage() {
  return new Promise((resolve, reject) => {
    const header = process.stdin.read(4);
    if (!header) {
      process.stdin.once("readable", () => resolve(readMessage()));
      return;
    }
    const len = header.readUInt32LE(0);
    const data = process.stdin.read(len);
    if (!data) {
      process.stdin.once("readable", () => resolve(readMessage()));
      return;
    }
    resolve(JSON.parse(data.toString()));
  });
}

async function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a homework assistant. Given a list of form fields with their labels, types, and options, return a JSON object mapping each field's selector to the best answer. Only respond with valid JSON, no extra text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const req = http.request(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            const content = (parsed.choices?.[0]?.message?.content || "").replace(/```(?:json)?/g, "").trim();
            resolve({ ok: true, data: JSON.parse(content) });
          } catch (e) {
            resolve({ ok: false, error: "Parse error: " + e.message });
          }
        } else {
          resolve({ ok: false, error: `HTTP ${res.statusCode}: ${data.substring(0, 200)}` });
        }
      });
    });
    req.on("error", err => resolve({ ok: false, error: err.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  while (true) {
    try {
      const msg = await readMessage();
      if (msg.action === "callOllama") {
        const result = await callOllama(msg.prompt);
        sendMessage(result);
      } else if (msg.action === "ping") {
        sendMessage({ ok: true, pong: true });
      }
    } catch (e) {
      sendMessage({ ok: false, error: e.message });
    }
  }
}

main();

const http = require("http");

const OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions";
const MODEL = "qwen2.5:1.5b";

function sendMessage(msg) {
  try {
    const json = JSON.stringify(msg);
    const len = Buffer.byteLength(json);
    const header = Buffer.alloc(4);
    header.writeUInt32LE(len, 0);
    process.stdout.write(header);
    process.stdout.write(json);
  } catch (e) {
    process.exit(1);
  }
}

let buffer = Buffer.alloc(0);

function processData() {
  while (buffer.length >= 4) {
    const len = buffer.readUInt32LE(0);
    if (buffer.length < 4 + len) break;
    const json = buffer.subarray(4, 4 + len).toString();
    buffer = buffer.subarray(4 + len);
    handleMessage(JSON.parse(json));
  }
}

function handleMessage(msg) {
  if (msg.action === "ping") {
    sendMessage({ ok: true, pong: true });
    return;
  }

  if (msg.action === "callOllama") {
    callOllama(msg.prompt).then(sendMessage);
    return;
  }

  sendMessage({ ok: false, error: "Unknown action: " + msg.action });
}

function callOllama(prompt) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a homework assistant. Given a list of form fields, return a JSON object mapping each field selector to the best answer. Only respond with valid JSON." },
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
          resolve({ ok: false, error: "HTTP " + res.statusCode + ": " + data.substring(0, 200) });
        }
      });
    });
    req.on("error", err => resolve({ ok: false, error: err.message }));
    req.write(body);
    req.end();
  });
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  processData();
});

process.stdin.on("end", () => process.exit(0));

const NATIVE_HOST = "com.homework.ollama";
const ENDPOINTS = [
  "http://127.0.0.1:11434/v1/chat/completions",
  "http://localhost:11434/v1/chat/completions",
];
const MODEL = "qwen2.5:1.5b";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callOllama") {
    callOllama(request.prompt)
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (request.action === "diagnoseOllama") {
    diagnose()
      .then(results => sendResponse({ results }))
      .catch(err => sendResponse({ results: [`Error: ${err.message}`] }));
    return true;
  }
});

function callOllamaViaNative(prompt) {
  return new Promise((resolve, reject) => {
    let port;
    try {
      port = chrome.runtime.connectNative(NATIVE_HOST);
    } catch (e) {
      reject(new Error("Native messaging host not found. Run install-bridge.ps1 first."));
      return;
    }

    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        port.disconnect();
        reject(new Error("Native bridge timed out. Is Ollama running?"));
      }
    }, 30000);

    port.onMessage.addListener((msg) => {
      if (responded) return;
      responded = true;
      clearTimeout(timeout);
      port.disconnect();
      if (msg.ok) resolve(msg.data);
      else reject(new Error(msg.error || "Unknown bridge error"));
    });

    port.onDisconnect.addListener(() => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        reject(new Error("Native bridge disconnected unexpectedly. Run install-bridge.ps1"));
      }
    });

    port.postMessage({ action: "callOllama", prompt });
  });
}

async function tryFetchEndpoint(url, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  }
}

async function callOllamaDirect(prompt) {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a homework assistant. Given a list of form fields with their labels, types, and options, return a JSON object mapping each field's selector to the best answer. Only respond with valid JSON, no extra text." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  };

  const errors = [];
  for (const url of ENDPOINTS) {
    const r = await tryFetchEndpoint(url, body);
    if (r.ok) {
      const data = JSON.parse(r.body);
      const content = (data.choices?.[0]?.message?.content || "").replace(/```(?:json)?/g, "").trim();
      return JSON.parse(content);
    }
    errors.push(`  ${url}\n    → ${r.status}: ${r.body || "(empty)"}`);
  }
  throw new Error(
    "Ollama unreachable via fetch.\n\nTried:\n" + errors.join("\n") +
    "\n\nRun install-bridge.ps1 for native messaging, or allow localhost in Brave settings."
  );
}

async function callOllama(prompt) {
  try {
    return await callOllamaViaNative(prompt);
  } catch {
    return await callOllamaDirect(prompt);
  }
}

async function diagnose() {
  const results = [];

  // Test native messaging
  try {
    await callOllamaViaNative("Respond with exactly: pong");
    results.push("✓ Native bridge (com.homework.ollama) → OK");
  } catch (e) {
    results.push("✗ Native bridge → " + e.message.split("\n")[0]);
  }

  // Test direct fetch
  for (const url of ENDPOINTS) {
    const r = await tryFetchEndpoint(url, { model: MODEL, messages: [{ role: "user", content: "hi" }], stream: false });
    if (r.ok) results.push(`✓ ${url} → ${r.status} OK`);
    else results.push(`✗ ${url} → ${r.status}: ${r.body.substring(0, 200) || "(empty)"}`);
  }

  return results;
}

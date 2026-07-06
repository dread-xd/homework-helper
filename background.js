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

async function tryEndpoint(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function callOllama(prompt) {
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
    const r = await tryEndpoint(url, body);
    if (r.ok) {
      const data = JSON.parse(r.body);
      const content = (data.choices?.[0]?.message?.content || "").replace(/```(?:json)?/g, "").trim();
      return JSON.parse(content);
    }
    errors.push(`  ${url}\n    → ${r.status}: ${r.body || "(empty)"}`);
  }

  throw new Error(
    "Ollama unreachable.\n\nTried:\n" +
    errors.join("\n") +
    "\n\nMake sure: Ollama is running (ollama serve) and " + MODEL + " is pulled (ollama pull " + MODEL + ")."
  );
}

async function diagnose() {
  const results = [];
  for (const url of ENDPOINTS) {
    const r = await tryEndpoint(url, { model: MODEL, messages: [{ role: "user", content: "hi" }], stream: false });
    if (r.ok) {
      results.push(`✓ ${url} → ${r.status} OK`);
    } else {
      results.push(`✗ ${url} → ${r.status}: ${r.body.substring(0, 200) || "(empty)"}`);
    }
  }
  return results;
}

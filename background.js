const DEFAULT_ENDPOINT = "http://localhost:11434/v1/chat/completions";
const DEFAULT_MODEL = "qwen2.5:1.5b";

async function callLLM(prompt) {
  const { apiKey, apiModel } = await chrome.storage.local.get(["apiKey", "apiModel"]);
  const model = apiModel || DEFAULT_MODEL;

  const isLocal = DEFAULT_ENDPOINT.includes("localhost") || DEFAULT_ENDPOINT.includes("127.0.0.1");
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  if (!apiKey && !isLocal) {
    throw new Error("No API key configured. Set it in the extension popup.");
  }

  const res = await fetch(DEFAULT_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a homework assistant. Given a list of form fields with their labels, types, and options, return a JSON object mapping each field's selector to the best answer. Only respond with valid JSON, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const json = text.replace(/```(?:json)?/g, "").trim();
  return JSON.parse(json);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callLLM") {
    callLLM(request.prompt)
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

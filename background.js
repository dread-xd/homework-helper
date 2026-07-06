const DEFAULTS = {
  apiEndpoint: "http://localhost:11434/v1/chat/completions",
  apiModel: "qwen2.5:1.5b",
  apiKey: "",
  useAi: false,
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(Object.keys(DEFAULTS), (data) => {
    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (data[k] === undefined) toSet[k] = v;
    }
    if (Object.keys(toSet).length) chrome.storage.local.set(toSet);
  });
});

async function callLLM(prompt) {
  const { apiEndpoint, apiKey, apiModel } = await chrome.storage.local.get([
    "apiEndpoint", "apiKey", "apiModel",
  ]);

  if (!apiKey) {
    throw new Error("No API key configured. Set it in the extension popup.");
  }

  const res = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: apiModel,
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

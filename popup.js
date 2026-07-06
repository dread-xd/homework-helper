const fillBtn = document.getElementById("fillBtn");
const revertBtn = document.getElementById("revertBtn");
const diagnoseBtn = document.getElementById("diagnoseBtn");
const statusEl = document.getElementById("status");
const statsEl = document.getElementById("stats");
const statFields = document.getElementById("statFields");
const statSelects = document.getElementById("statSelects");
const statSkipped = document.getElementById("statSkipped");
const modeDumb = document.getElementById("modeDumb");
const modeSmart = document.getElementById("modeSmart");
const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");
const apiKeyInput = document.getElementById("apiKey");
const apiEndpointInput = document.getElementById("apiEndpoint");
const apiModelInput = document.getElementById("apiModel");

let useAi = false;

function setStatus(msg, type = "info") {
  statusEl.className = `status ${type}`;
  statusEl.textContent = msg;
}

async function getActiveTab() {
  return (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
}

function showStats(results) {
  if (!results) return;
  statFields.textContent = results.fields || 0;
  statSelects.textContent = results.selects || 0;
  statSkipped.textContent = results.skipped || 0;
  statsEl.classList.add("visible");
}

function setMode(aiMode) {
  useAi = aiMode;
  modeDumb.classList.toggle("active", !aiMode);
  modeSmart.classList.toggle("active", aiMode);
  chrome.storage.local.set({ useAi: aiMode });
}

modeDumb.addEventListener("click", () => setMode(false));
modeSmart.addEventListener("click", () => setMode(true));

settingsToggle.addEventListener("click", () => {
  settingsPanel.classList.toggle("open");
});

function saveSettings() {
  chrome.storage.local.set({
    apiKey: apiKeyInput.value,
    apiEndpoint: apiEndpointInput.value,
    apiModel: apiModelInput.value,
  });
}

apiKeyInput.addEventListener("change", saveSettings);
apiEndpointInput.addEventListener("change", saveSettings);
apiModelInput.addEventListener("change", saveSettings);

const ENDPOINTS = [
  "http://127.0.0.1:11434/v1/chat/completions",
  "http://localhost:11434/v1/chat/completions",
];

const AI_MODEL = "qwen2.5:1.5b";

async function tryEndpoint(url, prompt) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
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
    throw new Error(
      `HTTP ${res.status}\n` +
      `URL: ${url}\n` +
      `Status: ${res.status} ${res.statusText}\n` +
      `Body: ${text || "(empty)"}`
    );
  }

  return res.json();
}

async function callOllama(prompt) {
  const errors = [];

  for (const url of ENDPOINTS) {
    try {
      const data = await tryEndpoint(url, prompt);
      const text = data.choices?.[0]?.message?.content || "";
      const json = text.replace(/```(?:json)?/g, "").trim();
      return JSON.parse(json);
    } catch (err) {
      errors.push(err.message);
    }
  }

  throw new Error(
    "Ollama unreachable on both 127.0.0.1 and localhost.\n\n" +
    "Tried:\n" +
    errors.map((e, i) => `  ${ENDPOINTS[i]}\n    → ${e.split("\n")[0]}`).join("\n") + "\n\n" +
    "Make sure Ollama is running (ollama serve) and qwen2.5:1.5b is pulled (ollama pull qwen2.5:1.5b)."
  );
}

async function diagnoseConnection() {
  const results = [];

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: AI_MODEL, messages: [{ role: "user", content: "hi" }], stream: false }),
      });
      const text = await res.text();
      if (res.ok) {
        results.push(`✓ ${url} → ${res.status} OK`);
      } else {
        results.push(`✗ ${url} → ${res.status} ${res.statusText}: ${text.substring(0, 100)}`);
      }
    } catch (err) {
      results.push(`✗ ${url} → ${err.message}`);
    }
  }

  return results;
}

async function diagnose() {
  setStatus("Running diagnostics...", "loading");
  let lines = [];

  lines.push("=== Ollama Check ===");
  (await diagnoseConnection()).forEach(l => lines.push(l));

  try {
    const tab = await getActiveTab();
    const fields = await chrome.tabs.sendMessage(tab.id, { action: "scrapeFields" });
    lines.push(`\n=== Page Check ===`);
    lines.push(`✓ Content script: loaded`);
    lines.push(`✓ Fillable fields: ${fields.length}`);
    fields.slice(0, 5).forEach(f => lines.push(`  ${f.selector}: "${f.label}" (${f.type})`));
    if (fields.length > 5) lines.push(`  ... and ${fields.length - 5} more`);
  } catch (e) {
    lines.push(`\n=== Page Check ===`);
    lines.push(`✗ Content script: NOT FOUND`);
    lines.push(`  Reload the page (F5) and try again.`);
  }

  lines.push(`\n=== Extension Info ===`);
  lines.push(`Version: ${chrome.runtime.getManifest().version}`);
  lines.push(`Mode: ${useAi ? "Smart (AI)" : "Canned"}`);

  setStatus(lines.join("\n"), "info");
  fillBtn.disabled = false;
  fillBtn.textContent = "Auto-Fill This Page";
}

diagnoseBtn.addEventListener("click", diagnose);

fillBtn.addEventListener("click", async () => {
  fillBtn.disabled = true;
  fillBtn.textContent = useAi ? "Asking AI..." : "Filling...";
  setStatus("");

  try {
    const tab = await getActiveTab();

    if (useAi) {
      setStatus("Scraping page...", "loading");

      let fields;
      try {
        fields = await chrome.tabs.sendMessage(tab.id, { action: "scrapeFields" });
      } catch {
        setStatus(
          "Content script not found.\n\n" +
          "Try: Reload the page (F5) and click Auto-Fill again.\n" +
          "If it still fails, the extension may need reloading in brave://extensions.",
          "error"
        );
        fillBtn.disabled = false;
        fillBtn.textContent = "Auto-Fill This Page";
        return;
      }

      if (!fields || fields.length === 0) {
        setStatus("No fillable fields (inputs, selects, textareas) found on this page.", "error");
        fillBtn.disabled = false;
        fillBtn.textContent = "Auto-Fill This Page";
        return;
      }

      setStatus(`Calling Ollama (${fields.length} fields)...`, "loading");

      const prompt = `Given these form fields, return a JSON object where keys are the field selectors and values are the best answers to fill in:\n\n${JSON.stringify(fields, null, 2)}\n\nRules:\n- For text inputs: provide a realistic answer\n- For selects: pick the best option value\n- For checkboxes/radios: answer true or false\n- For textareas: provide a complete sentence answer\n- For email: provide a valid email\n- For tel: provide a valid phone number\n- For number: provide a numeric value\n- For date: provide a date in YYYY-MM-DD format\n- Only respond with valid JSON.`;

      let answers;
      try {
        answers = await callOllama(prompt);
      } catch (err) {
        setStatus(err.message, "error");
        fillBtn.disabled = false;
        fillBtn.textContent = "Auto-Fill This Page";
        return;
      }

      setStatus("Filling answers...", "loading");

      const fillResult = await chrome.tabs.sendMessage(tab.id, {
        action: "applyAiAnswers",
        answers,
      });

      setStatus(`Done! Filled ${(fillResult.fields || 0) + (fillResult.selects || 0)} fields with AI answers.`, "success");
      showStats(fillResult);
      revertBtn.style.display = "block";
    } else {
      let results;
      try {
        results = await chrome.tabs.sendMessage(tab.id, { action: "autoFill" });
      } catch {
        setStatus(
          "Content script not found.\n\n" +
          "Try: Reload the page (F5) and click Auto-Fill again.\n" +
          "If it still fails, the extension may need reloading in brave://extensions.",
          "error"
        );
        fillBtn.disabled = false;
        fillBtn.textContent = "Auto-Fill This Page";
        return;
      }
      setStatus(`Done! Filled ${(results.fields || 0) + (results.selects || 0)} fields.`, "success");
      showStats(results);
      revertBtn.style.display = "block";
    }
  } catch (err) {
    setStatus("Unexpected error: " + (err.message || err), "error");
  }

  fillBtn.disabled = false;
  fillBtn.textContent = "Auto-Fill This Page";
});

revertBtn.addEventListener("click", async () => {
  setStatus("");
  try {
    const tab = await getActiveTab();
    await chrome.tabs.sendMessage(tab.id, { action: "revertFill" });
    if (chrome.runtime.lastError) {
      setStatus("Could not revert. Was the page reloaded since the fill?", "error");
      return;
    }
    setStatus("Fill reverted to original values.", "info");
    statsEl.classList.remove("visible");
    revertBtn.style.display = "none";
  } catch (err) {
    setStatus("Error: " + err.message, "error");
  }
});

chrome.storage.local.get(["useAi", "apiKey", "apiEndpoint", "apiModel", "lastResult"], (data) => {
  if (data.useAi !== undefined) setMode(data.useAi);
  if (data.apiKey) apiKeyInput.value = data.apiKey;
  apiEndpointInput.value = data.apiEndpoint || "http://localhost:11434/v1/chat/completions";
  apiModelInput.value = data.apiModel || "qwen2.5:1.5b";
  if (data.lastResult) {
    showStats(data.lastResult);
    revertBtn.style.display = "block";
  }
});

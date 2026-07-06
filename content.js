const LABEL_ANSWERS = {
  name: ["John Doe", "Jane Smith", "Alex Johnson", "Sam Wilson"],
  email: ["johndoe@example.com", "janesmith@example.com"],
  phone: ["555-123-4567", "555-987-6543", "555-555-5555"],
  address: ["123 Main St, Springfield, IL 62701"],
  date: ["2026-07-06", "2026-07-07", "2026-07-08"],
  city: ["Springfield", "Riverside", "Fairview", "Madison"],
  state: ["California", "Texas", "New York", "Illinois", "Florida"],
  zip: ["62701", "90210", "10001", "73301", "33101"],
  country: ["United States", "USA"],
  school: ["Springfield High School", "Lincoln Middle School"],
  grade: ["A", "B", "C", "A-", "B+"],
  score: ["95", "87", "92", "78", "100"],
  yes: ["Yes"],
  no: ["No"],
  true: ["True"],
  false: ["False"],
  agree: ["Agree"],
  disagree: ["Disagree"],
  comment: ["Looks good to me.", "I have completed the assignment.", "No comments."],
  answer: ["42", "The quick brown fox jumps over the lazy dog."],
  description: ["Test description for PoC purposes."],
  title: ["Homework Assignment PoC"],
};

function getLabelText(el) {
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim().toLowerCase();
  }
  const parent = el.closest("label");
  if (parent) return parent.textContent.trim().toLowerCase();
  const container = el.closest("div, fieldset, td, li, p, section");
  if (container) {
    const text = container.textContent.trim().toLowerCase();
    const parts = text.split(el.name || el.type || "").filter(Boolean);
    return parts[0] || text;
  }
  return (el.placeholder || el.name || el.title || "").toLowerCase();
}

function buildSelector(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  if (el.name) {
    const tag = el.tagName.toLowerCase();
    const type = el.type ? `[type="${el.type}"]` : "";
    return `${tag}[name="${el.name}"]${type}`;
  }
  let sel = el.tagName.toLowerCase();
  if (el.className && typeof el.className === "string") {
    sel += `.${el.className.trim().split(/\s+/).map(c => CSS.escape(c)).join(".")}`;
  }
  return sel;
}

function findAnswer(labelText) {
  for (const [key, answers] of Object.entries(LABEL_ANSWERS)) {
    if (labelText.includes(key)) {
      return answers[Math.floor(Math.random() * answers.length)];
    }
  }
  return null;
}

function getMultiChoiceAnswer(labelText) {
  if (labelText.includes("yes") || labelText.includes("agree") || labelText.includes("true")) return "Yes";
  if (labelText.includes("no") || labelText.includes("disagree") || labelText.includes("false")) return "No";
  return null;
}

function fillInput(input, forcedValue) {
  if (input.disabled || input.readOnly) return null;

  let val;

  if (forcedValue !== undefined) {
    val = forcedValue;
  } else {
    const labelText = getLabelText(input);

    if (input.type === "text" || input.type === "url" || input.type === "tel") {
      val = findAnswer(labelText);
    } else if (input.type === "email") {
      val = LABEL_ANSWERS.email[0];
    } else if (input.type === "number") {
      val = "42";
    } else if (input.type === "checkbox") {
      const answer = getMultiChoiceAnswer(labelText);
      if (answer === "Yes") { input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); return "checked"; }
      if (forcedValue === true) { input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); return "checked"; }
      if (forcedValue === false) { input.checked = false; input.dispatchEvent(new Event("change", { bubbles: true })); return "unchecked"; }
      return null;
    } else if (input.type === "radio") {
      const group = document.getElementsByName(input.name);
      const answer = getMultiChoiceAnswer(labelText);
      if (answer === "Yes" || forcedValue === true) { input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); return "selected"; }
      if (answer === "No" && group.length > 0) { const last = group[group.length - 1]; if (last !== input) { last.checked = true; last.dispatchEvent(new Event("change", { bubbles: true })); return "selected (fallback)"; } }
      return null;
    } else if (input.type === "date") {
      val = "2026-07-06";
    } else if (input.tagName === "TEXTAREA") {
      val = findAnswer(labelText) || "Sample text for worksheet completion.";
    } else {
      val = null;
    }
  }

  if (val !== null && val !== undefined) {
    input.value = val;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return String(val);
  }

  return null;
}

function fillSelect(select, forcedValue) {
  if (select.disabled) return null;
  const options = Array.from(select.options).filter((o) => o.value && !o.disabled);
  if (options.length === 0) return null;

  let targetValue = forcedValue;

  if (targetValue === undefined) {
    const labelText = getLabelText(select);
    for (const opt of options) {
      const optText = opt.textContent.trim().toLowerCase();
      if (labelText.includes("state") && optText.length === 2) { targetValue = opt.value; break; }
      if (labelText.includes("country") && (optText === "united states" || optText === "usa")) { targetValue = opt.value; break; }
    }
  }

  if (targetValue === undefined) {
    const opt = options[Math.floor(Math.random() * options.length)];
    targetValue = opt.value;
  }

  const match = options.find((o) => o.value === targetValue || o.textContent.trim() === targetValue);
  const finalValue = match ? match.value : options[0].value;

  select.value = finalValue;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return finalValue;
}

function getFillableElements() {
  const inputs = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]):not([type="password"]):not([type="image"])'
  );
  const selects = document.querySelectorAll("select");
  return { inputs, selects };
}

function autoFill() {
  const results = { fields: 0, selects: 0, skipped: 0 };
  const { inputs, selects } = getFillableElements();

  for (const input of inputs) {
    const val = fillInput(input);
    if (val !== null) results.fields++;
    else results.skipped++;
  }

  for (const select of selects) {
    const val = fillSelect(select);
    if (val !== null) results.selects++;
    else results.skipped++;
  }

  chrome.storage.local.set({ lastResult: results });
  return results;
}

function scrapeFields() {
  const fields = [];
  const { inputs, selects } = getFillableElements();

  for (const el of inputs) {
    if (el.disabled || el.readOnly) continue;
    const options = el.type === "checkbox" || el.type === "radio"
      ? Array.from(document.getElementsByName(el.name)).map((r) => ({ value: r.value, label: getLabelText(r) }))
      : undefined;
    fields.push({
      selector: buildSelector(el),
      label: getLabelText(el),
      type: el.tagName === "TEXTAREA" ? "textarea" : el.type || "text",
      currentValue: el.value,
      options,
    });
  }

  for (const el of selects) {
    if (el.disabled) continue;
    fields.push({
      selector: buildSelector(el),
      label: getLabelText(el),
      type: "select",
      currentValue: el.value,
      options: Array.from(el.options).filter((o) => o.value).map((o) => ({ value: o.value, label: o.textContent.trim() })),
    });
  }

  return fields;
}

function saveSnapshot() {
  const snapshot = [];
  const { inputs, selects } = getFillableElements();
  for (const el of [...inputs, ...selects]) {
    if (el.tagName === "SELECT") {
      snapshot.push({ tag: "SELECT", id: el.id, name: el.name, value: el.value, selectedIndex: el.selectedIndex });
    } else if (el.tagName === "TEXTAREA") {
      snapshot.push({ tag: "TEXTAREA", id: el.id, name: el.name, value: el.value });
    } else if (el.type === "checkbox" || el.type === "radio") {
      snapshot.push({ tag: "INPUT", id: el.id, name: el.name, type: el.type, checked: el.checked, value: el.value });
    } else {
      snapshot.push({ tag: "INPUT", id: el.id, name: el.name, type: el.type, value: el.value });
    }
  }
  return snapshot;
}

function restoreSnapshot(snapshot) {
  for (const entry of snapshot) {
    let el = null;
    if (entry.id) el = document.getElementById(entry.id);
    if (!el && entry.name) {
      if (entry.type === "radio" || entry.type === "checkbox") {
        const els = document.getElementsByName(entry.name);
        for (const e of els) {
          if (e.type === entry.type) { el = e; break; }
        }
      } else {
        el = document.querySelector(`[name="${CSS.escape(entry.name)}"]`);
      }
    }
    if (!el) continue;

    if (entry.tag === "SELECT") {
      if (entry.selectedIndex >= 0 && entry.selectedIndex < el.options.length) el.selectedIndex = entry.selectedIndex;
      else el.value = entry.value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (entry.type === "checkbox" || entry.type === "radio") {
      el.checked = entry.checked;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      el.value = entry.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

document.addEventListener("homework:autoFill", () => {
  const snapshot = saveSnapshot();
  const results = autoFill();
  chrome.storage.local.set({ lastSnapshot: snapshot, lastResult: results });
  document.dispatchEvent(new CustomEvent("homework:filled", { detail: results }));
});

document.addEventListener("homework:revertFill", () => {
  chrome.storage.local.get("lastSnapshot", (data) => {
    if (data.lastSnapshot) {
      restoreSnapshot(data.lastSnapshot);
      chrome.storage.local.remove(["lastSnapshot", "lastResult"]);
      document.dispatchEvent(new CustomEvent("homework:reverted", { detail: { ok: true } }));
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autoFill") {
    const snapshot = saveSnapshot();
    const results = autoFill();
    chrome.storage.local.set({ lastSnapshot: snapshot, lastResult: results });
    sendResponse(results);
  }

  if (request.action === "scrapeFields") {
    const fields = scrapeFields();
    sendResponse(fields);
  }

  if (request.action === "applyAiAnswers") {
    const snapshot = saveSnapshot();
    const results = { fields: 0, selects: 0, skipped: 0 };
    const { inputs, selects } = getFillableElements();

    for (const el of [...inputs, ...selects]) {
      const sel = buildSelector(el);
      const answer = request.answers[sel];
      if (answer === undefined || answer === null) { results.skipped++; continue; }

      if (el.tagName === "SELECT") {
        const val = fillSelect(el, String(answer));
        if (val !== null) results.selects++;
        else results.skipped++;
      } else {
        const val = fillInput(el, answer);
        if (val !== null) results.fields++;
        else results.skipped++;
      }
    }

    chrome.storage.local.set({ lastSnapshot: snapshot, lastResult: results });
    sendResponse(results);
  }

  if (request.action === "revertFill") {
    chrome.storage.local.get("lastSnapshot", (data) => {
      if (data.lastSnapshot) {
        restoreSnapshot(data.lastSnapshot);
        chrome.storage.local.remove(["lastSnapshot", "lastResult"]);
        sendResponse({ reverted: true });
      } else {
        sendResponse({ reverted: false, error: "No snapshot found" });
      }
    });
    return true;
  }
});

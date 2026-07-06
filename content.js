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

function getLabelText(input) {
  const id = input.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim().toLowerCase();
  }
  const parent = input.closest("label");
  if (parent) return parent.textContent.trim().toLowerCase();
  const labels = input.closest("div, fieldset, td, li, p");
  if (labels) {
    const text = labels.textContent.trim().toLowerCase();
    const parts = text.split(input.name || input.type || "").filter(Boolean);
    return parts[0] || text;
  }
  return (input.placeholder || input.name || "").toLowerCase();
}

function findAnswer(labelText) {
  for (const [key, answers] of Object.entries(LABEL_ANSWERS)) {
    if (labelText.includes(key)) {
      const idx = Math.floor(Math.random() * answers.length);
      return answers[idx];
    }
  }
  return null;
}

function getMultiChoiceAnswer(labelText) {
  if (labelText.includes("yes") || labelText.includes("agree") || labelText.includes("true")) return "Yes";
  if (labelText.includes("no") || labelText.includes("disagree") || labelText.includes("false")) return "No";
  return null;
}

function fillInput(input) {
  if (input.disabled || input.readOnly) return null;

  const labelText = getLabelText(input);
  const answer = findAnswer(labelText);

  if (input.type === "text" || input.type === "url" || input.type === "tel") {
    if (answer) {
      input.value = answer;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return answer;
    }
  }

  if (input.type === "email") {
    const email = LABEL_ANSWERS.email[0];
    input.value = email;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return email;
  }

  if (input.type === "number") {
    const val = "42";
    input.value = val;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return val;
  }

  if (input.type === "checkbox") {
    const shouldCheck = getMultiChoiceAnswer(labelText);
    if (shouldCheck === "Yes") {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return "checked";
    }
    return null;
  }

  if (input.type === "radio") {
    const group = document.getElementsByName(input.name);
    const shouldCheck = getMultiChoiceAnswer(labelText);
    if (shouldCheck === "Yes") {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return "selected";
    }
    if (shouldCheck === "No" && group.length > 0) {
      const firstRadio = group[group.length - 1];
      if (firstRadio !== input) {
        firstRadio.checked = true;
        firstRadio.dispatchEvent(new Event("change", { bubbles: true }));
        return "selected (fallback)";
      }
    }
    return null;
  }

  if (input.type === "date") {
    const val = "2026-07-06";
    input.value = val;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return val;
  }

  if (input.type === "textarea" || input.tagName === "TEXTAREA") {
    const val = answer || "Sample text for worksheet completion.";
    input.value = val;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return val;
  }

  return null;
}

function fillSelect(select) {
  if (select.disabled) return null;
  const options = Array.from(select.options).filter((o) => o.value && !o.disabled);
  if (options.length === 0) return null;

  const labelText = getLabelText(select);

  for (const opt of options) {
    const optText = opt.textContent.trim().toLowerCase();
    if (labelText.includes("state") && optText.length === 2) {
      select.value = opt.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return opt.textContent.trim();
    }
    if (labelText.includes("country") && (optText === "united states" || optText === "usa")) {
      select.value = opt.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return opt.textContent.trim();
    }
  }

  const idx = Math.floor(Math.random() * options.length);
  select.value = options[idx].value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return options[idx].textContent.trim();
}

function autoFill() {
  const results = { fields: 0, selects: 0, skipped: 0 };

  const inputs = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]):not([type="password"]):not([type="image"])'
  );

  for (const input of inputs) {
    const val = fillInput(input);
    if (val !== null) {
      results.fields++;
    } else {
      results.skipped++;
    }
  }

  const selects = document.querySelectorAll("select");
  for (const select of selects) {
    const val = fillSelect(select);
    if (val !== null) {
      results.selects++;
    } else {
      results.skipped++;
    }
  }

  chrome.storage.local.set({ lastResult: results });
  return results;
}

function saveSnapshot() {
  const snapshot = [];
  const inputs = document.querySelectorAll("input, select, textarea");
  for (const el of inputs) {
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
    if (!el && entry.name) el = document.querySelector(`[name="${entry.name}"]`);
    if (!el) continue;

    if (entry.tag === "SELECT") {
      if (entry.selectedIndex >= 0 && entry.selectedIndex < el.options.length) {
        el.selectedIndex = entry.selectedIndex;
      } else {
        el.value = entry.value;
      }
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autoFill") {
    const snapshot = saveSnapshot();
    const results = autoFill();
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

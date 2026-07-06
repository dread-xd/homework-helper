const fillBtn = document.getElementById("fillBtn");
const revertBtn = document.getElementById("revertBtn");
const statusEl = document.getElementById("status");
const statsEl = document.getElementById("stats");
const statFields = document.getElementById("statFields");
const statSelects = document.getElementById("statSelects");
const statSkipped = document.getElementById("statSkipped");

function setStatus(msg, type = "info") {
  statusEl.className = `status ${type}`;
  statusEl.textContent = msg;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function showStats(results) {
  if (!results) return;
  statFields.textContent = results.fields || 0;
  statSelects.textContent = results.selects || 0;
  statSkipped.textContent = results.skipped || 0;
  statsEl.classList.add("visible");
}

fillBtn.addEventListener("click", async () => {
  fillBtn.disabled = true;
  fillBtn.textContent = "Filling...";
  setStatus("");

  try {
    const tab = await getActiveTab();
    const results = await chrome.tabs.sendMessage(tab.id, { action: "autoFill" });

    if (chrome.runtime.lastError) {
      setStatus("Could not communicate with page. Reload and try again.", "error");
      fillBtn.disabled = false;
      fillBtn.textContent = "Auto-Fill This Page";
      return;
    }

    setStatus(`Done! Filled ${(results.fields || 0) + (results.selects || 0)} fields.`, "success");
    showStats(results);
    revertBtn.style.display = "block";
  } catch (err) {
    setStatus("Error: " + err.message, "error");
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
      setStatus("Could not revert.", "error");
      return;
    }

    setStatus("Fill reverted.", "info");
    statsEl.classList.remove("visible");
    revertBtn.style.display = "none";
  } catch (err) {
    setStatus("Error: " + err.message, "error");
  }
});

chrome.storage.local.get("lastResult", (data) => {
  if (data.lastResult) {
    showStats(data.lastResult);
    revertBtn.style.display = "block";
  }
});

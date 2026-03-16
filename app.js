// Categories you want to track
const CATEGORIES = ["Men", "Women", "Teenagers", "Children", "Newcomers"];

let currentServiceKey = null;
let currentCounts = {};
let statusTextEl;
let saveButton;
let exportButton;

function init() {
  buildCounters();

  statusTextEl = document.getElementById("statusText");
  saveButton = document.getElementById("saveService");
  exportButton = document.getElementById("exportData");

  document.getElementById("loadService").addEventListener("click", loadOrCreateService);
  saveButton.addEventListener("click", saveCurrentService);
  exportButton.addEventListener("click", exportData);

  toggleSave(false);
  loadServiceList();
  setStatus("Load or create a service to start tracking.", "idle");
}

function buildCounters() {
  const container = document.getElementById("counters");
  container.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const row = document.createElement("div");
    row.className = "counter-row";

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = cat;

    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.addEventListener("click", () => changeCount(cat, -1));

    const value = document.createElement("span");
    value.className = "value";
    value.id = `value-${cat}`;
    value.textContent = "0";

    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", () => changeCount(cat, 1));

    row.appendChild(label);
    row.appendChild(minusBtn);
    row.appendChild(value);
    row.appendChild(plusBtn);

    container.appendChild(row);
  });
}

function changeCount(category, delta) {
  if (!currentCounts[category]) currentCounts[category] = 0;
  currentCounts[category] = Math.max(0, currentCounts[category] + delta);
  document.getElementById(`value-${category}`).textContent = currentCounts[category];
  updateTotal();

  if (!currentServiceKey) {
    setStatus("Counting in quick mode. Load/create a service to save these numbers.", "warning");
  } else {
    setStatus(`Tracking: ${currentServiceKey.replace("__", " — ")}`, "ok");
  }
}

function updateTotal() {
  const total = CATEGORIES.reduce((sum, cat) => sum + (currentCounts[cat] || 0), 0);
  document.getElementById("totalCount").textContent = total;
}

function loadOrCreateService() {
  const date = document.getElementById("serviceDate").value;
  const name = document.getElementById("serviceName").value.trim();

  if (!date || !name) {
    alert("Please enter both date and service name.");
    return;
  }

  currentServiceKey = `${date}__${name}`;
  const stored = localStorage.getItem(currentServiceKey);

  if (stored) {
    currentCounts = JSON.parse(stored);
    setStatus(`Loaded: ${name} (${date})`, "ok");
  } else {
    currentCounts = {};
    CATEGORIES.forEach(cat => currentCounts[cat] = 0);
    setStatus(`New service ready: ${name} (${date})`, "ok");
  }

  CATEGORIES.forEach(cat => {
    document.getElementById(`value-${cat}`).textContent = currentCounts[cat] || 0;
  });
  updateTotal();
  toggleSave(true);
}

function saveCurrentService() {
  if (!currentServiceKey) {
    alert("Load or create a service first.");
    return;
  }

  localStorage.setItem(currentServiceKey, JSON.stringify(currentCounts));
  setStatus("Service saved. Great job!", "ok");
  loadServiceList();
}

function loadServiceList() {
  const list = document.getElementById("serviceList");
  list.innerHTML = "";

  const keys = Object.keys(localStorage).filter(k => k.includes("__"));
  keys.sort();

  keys.forEach(key => {
    const [date, name] = key.split("__");
    const li = document.createElement("li");
    li.textContent = `${date} - ${name}`;
    li.addEventListener("click", () => {
      currentServiceKey = key;
      currentCounts = JSON.parse(localStorage.getItem(key));
      document.getElementById("serviceDate").value = date;
      document.getElementById("serviceName").value = name;
      CATEGORIES.forEach(cat => {
        document.getElementById(`value-${cat}`).textContent = currentCounts[cat] || 0;
      });
      updateTotal();
      toggleSave(true);
      setStatus(`Loaded: ${name} (${date})`, "ok");
    });
    list.appendChild(li);
  });
}

function exportData() {
  const keys = Object.keys(localStorage).filter(k => k.includes("__"));
  const data = keys.map(key => {
    const [date, name] = key.split("__");
    const counts = JSON.parse(localStorage.getItem(key));
    return { date, name, counts };
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "church_attendance_export.json";
  a.click();

  URL.revokeObjectURL(url);
  setStatus("Data exported (JSON).", "ok");
}

function setStatus(message, tone = "idle") {
  if (!statusTextEl) return;
  statusTextEl.textContent = message;
  const dot = document.querySelector(".status-dot");
  if (!dot) return;
  const colors = {
    ok: "var(--blue)",
    warning: "var(--gold)",
    idle: "var(--gold)",
  };
  dot.style.background = colors[tone] || "var(--gold)";
  dot.style.boxShadow = `0 0 0 6px ${tone === "ok" ? "rgba(30, 136, 229, 0.18)" : "rgba(255, 143, 0, 0.12)"}`;
}

function toggleSave(enabled) {
  if (saveButton) saveButton.disabled = !enabled;
}

document.addEventListener("DOMContentLoaded", init);

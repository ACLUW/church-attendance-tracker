// Categories you want to track
const CATEGORIES = ["Men", "Women", "Teenagers", "Children", "Newcomers"];

let currentServiceKey = null;
let currentCounts = {};

function init() {
  buildCounters();
  document.getElementById("loadService").addEventListener("click", loadOrCreateService);
  document.getElementById("saveService").addEventListener("click", saveCurrentService);
  document.getElementById("exportData").addEventListener("click", exportData);
  loadServiceList();
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
  } else {
    currentCounts = {};
    CATEGORIES.forEach(cat => currentCounts[cat] = 0);
  }

  // Update UI
  CATEGORIES.forEach(cat => {
    document.getElementById(`value-${cat}`).textContent = currentCounts[cat] || 0;
  });
  updateTotal();
}

function saveCurrentService() {
  if (!currentServiceKey) {
    alert("Load or create a service first.");
    return;
  }

  localStorage.setItem(currentServiceKey, JSON.stringify(currentCounts));
  alert("Service saved.");
  loadServiceList();
}

function loadServiceList() {
  const list = document.getElementById("serviceList");
  list.innerHTML = "";

  const keys = Object.keys(localStorage).filter(k => k.includes("__"));
  keys.sort(); // by date/name

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
}

document.addEventListener("DOMContentLoaded", init);
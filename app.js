// Categories you want to track
const CATEGORIES = ["Men", "Women", "Teenagers", "Children", "Newcomers"];

let currentServiceKey = null;
let currentCounts = {};
let currentPreacher = "";
let statusTextEl;
let saveButton;
let exportButton;
let emailButton;

function init() {
  buildCounters();

  statusTextEl = document.getElementById("statusText");
  saveButton = document.getElementById("saveService");
  exportButton = document.getElementById("exportData");
  emailButton = document.getElementById("sendEmail");

  document.getElementById("loadService").addEventListener("click", loadOrCreateService);
  saveButton.addEventListener("click", saveCurrentService);
  exportButton.addEventListener("click", exportData);
  emailButton.addEventListener("click", sendViaEmail);

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
    setStatus(`Tracking: ${currentServiceKey.replace("__", " - ")}`, "ok");
  }
}

function updateTotal() {
  const total = CATEGORIES.reduce((sum, cat) => sum + (currentCounts[cat] || 0), 0);
  document.getElementById("totalCount").textContent = total;
}

function loadOrCreateService() {
  const date = document.getElementById("serviceDate").value;
  const name = document.getElementById("serviceName").value.trim();
  const preacher = document.getElementById("preacherName").value.trim();

  if (!date || !name) {
    alert("Please enter both date and service name.");
    return;
  }

  currentServiceKey = `${date}__${name}`;
  const stored = localStorage.getItem(currentServiceKey);

  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object" && parsed.counts) {
      currentCounts = parsed.counts;
      currentPreacher = parsed.preacher || preacher;
    } else {
      currentCounts = parsed || {};
      currentPreacher = preacher;
    }
    setStatus(`Loaded: ${name} (${date})`, "ok");
  } else {
    currentCounts = {};
    CATEGORIES.forEach(cat => currentCounts[cat] = 0);
    currentPreacher = preacher;
    setStatus(`New service ready: ${name} (${date})`, "ok");
  }

  CATEGORIES.forEach(cat => {
    document.getElementById(`value-${cat}`).textContent = currentCounts[cat] || 0;
  });
  updateTotal();
  document.getElementById("preacherName").value = currentPreacher || "";
  toggleSave(true);
}

function saveCurrentService() {
  if (!currentServiceKey) {
    alert("Load or create a service first.");
    return;
  }

  const preacher = document.getElementById("preacherName").value.trim();
  currentPreacher = preacher;
  localStorage.setItem(currentServiceKey, JSON.stringify({ counts: currentCounts, preacher }));
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
      const parsed = JSON.parse(localStorage.getItem(key));
      if (parsed && typeof parsed === "object" && parsed.counts) {
        currentCounts = parsed.counts;
        currentPreacher = parsed.preacher || "";
      } else {
        currentCounts = parsed || {};
        currentPreacher = "";
      }
      document.getElementById("serviceDate").value = date;
      document.getElementById("serviceName").value = name;
      document.getElementById("preacherName").value = currentPreacher || "";
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

function sendViaEmail() {
  const email = document.getElementById("emailTo").value.trim();
  if (!email) {
    alert("Add a Gmail address first.");
    return;
  }
  const dataset = collectData();
  if (!dataset.length) {
    alert("No services to export yet.");
    return;
  }
  const csv = buildCsv(dataset);
  const mailto = [
    "mailto:" + encodeURIComponent(email),
    "?subject=" + encodeURIComponent("JFFI Attendance Export (CSV)"),
    "&body=" + encodeURIComponent(
      "Attached below is the CSV export. Copy and paste into Gmail if the attachment is not included automatically.\n\n" + csv
    ),
  ].join("");
  window.location.href = mailto;
  setStatus("Opened Gmail with CSV in the email body.", "ok");
}

function collectData() {
  const keys = Object.keys(localStorage).filter(k => k.includes("__"));
  return keys.map(key => {
    const [date, name] = key.split("__");
    const parsed = JSON.parse(localStorage.getItem(key));
    if (parsed && typeof parsed === "object" && parsed.counts) {
      return { date, name, counts: parsed.counts, preacher: parsed.preacher || "" };
    }
    return { date, name, counts: parsed || {}, preacher: "" };
  });
}

function buildCsv(data) {
  const headers = ["Date", "Service Name", "Preacher", "Category", "Count", "Total"];
  const rows = [headers.join(",")];

  data.forEach(entry => {
    const total = CATEGORIES.reduce((sum, cat) => sum + (entry.counts?.[cat] ?? 0), 0);
    CATEGORIES.forEach(cat => {
      const count = entry.counts?.[cat] ?? 0;
      rows.push([entry.date, entry.name, entry.preacher || "", cat, count, total].map(sanitizeCsv).join(","));
    });
  });

  return rows.join("\n");
}

function sanitizeCsv(value) {
  if (value == null) return "";
  const str = String(value);
  return /[\",\n]/.test(str) ? `"${str.replace(/\"/g, '""')}"` : str;
}

// Export to CSV for Android download friendliness
function exportData() {
  const data = collectData();
  if (!data.length) {
    alert("No services saved yet.");
    return;
  }

  const csv = buildCsv(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "jffi_attendance_export.csv";
  a.click();

  URL.revokeObjectURL(url);
  setStatus("CSV downloaded to device.", "ok");
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

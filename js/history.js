// js/history.js
import { guardPage } from "./auth.js";
import { injectNav, checkFirebaseAvailability } from "./app.js";
import {
  getRecentGlucoseLogs, getRecentInsulinLogs, getRecentMeals,
  getRecentRiskPredictions, filterByWindow
} from "./firestore.js";
import { showToast, formatDateTime, escapeHtml, friendlyFirestoreError } from "./ui.js";

injectNav("history");

let currentUser = null;
let allData     = { glucose: [], insulin: [], meals: [], risk: [] };
let activeWindow = "today";
let activeTab    = "glucose";

function toDate(ts) {
  return ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
}

async function loadAll() {
  try {
    const [glucose, insulin, meals, risk] = await Promise.all([
      getRecentGlucoseLogs(currentUser.uid, 200),
      getRecentInsulinLogs(currentUser.uid, 200),
      getRecentMeals(currentUser.uid, 200),
      getRecentRiskPredictions(currentUser.uid, 100)
    ]);
    allData = { glucose, insulin, meals, risk };
    render();
  } catch (err) {
    console.error(err);
    showToast(friendlyFirestoreError(err), "error");
  }
}

function render() {
  const g    = filterByWindow(allData.glucose, "timestamp", activeWindow);
  const ins  = filterByWindow(allData.insulin, "timestamp", activeWindow);
  const meals = filterByWindow(allData.meals, "mealTime", activeWindow);
  const risk  = filterByWindow(allData.risk, "timestamp", activeWindow);

  renderChart(g);
  renderSummaryStats({ g, ins, meals, risk }, activeTab);

  const list = document.getElementById("history-list");
  let rows = [];

  if (activeTab === "glucose") {
    rows = g.map((r) => ({
      title: `${r.value} ${r.unit || "mg/dL"}`,
      sub:   `${escapeHtml(r.context || "")} · ${formatDateTime(toDate(r.timestamp))}`,
      value: ""
    }));
  } else if (activeTab === "insulin") {
    rows = ins.map((r) => ({
      title: `${r.dose}u ${escapeHtml(r.type || "")}`,
      sub:   formatDateTime(toDate(r.timestamp)),
      value: ""
    }));
  } else if (activeTab === "meals") {
    rows = meals.map((r) => ({
      title: escapeHtml((r.items || []).map((i) => i.name).join(", ") || "Meal"),
      sub:   formatDateTime(toDate(r.mealTime)),
      value: `${r.totalCarbs}g`
    }));
  } else if (activeTab === "risk") {
    rows = risk.map((r) => ({
      title: r.level,
      sub:   formatDateTime(toDate(r.timestamp)),
      value: `${r.score}/100`
    }));
  }

  if (!list) return;
  list.innerHTML = rows.length
    ? rows.map((r) => `
        <li class="list-row">
          <div><div class="list-row-title">${r.title}</div><div class="list-row-sub">${r.sub}</div></div>
          <div class="list-row-value">${r.value}</div>
        </li>`).join("")
    : `<li class="empty-state">No records in this time range. <a href="add.html" style="color:var(--color-primary)">Log some data</a>.</li>`;
}

/** Render summary stats above the list for the active tab + window. */
function renderSummaryStats(data, tab) {
  const container = document.getElementById("history-summary");
  if (!container) return;

  let html = "";

  if (tab === "glucose" && data.g.length) {
    const vals = data.g.map((r) => r.value);
    const avg  = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    html = `
      <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:13px;">
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Readings</span><br><strong>${data.g.length}</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Average</span><br><strong>${avg} mg/dL</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Min</span><br><strong style="color:var(--color-danger)">${min} mg/dL</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Max</span><br><strong style="color:var(--color-warning)">${max} mg/dL</strong></div>
      </div>`;
  } else if (tab === "insulin" && data.ins.length) {
    const total = data.ins.reduce((s, r) => s + (r.dose || 0), 0);
    const avg   = (total / data.ins.length).toFixed(1);
    html = `
      <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:13px;">
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Doses</span><br><strong>${data.ins.length}</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Total</span><br><strong>${total.toFixed(1)}u</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Average</span><br><strong>${avg}u per dose</strong></div>
      </div>`;
  } else if (tab === "meals" && data.meals.length) {
    const total = data.meals.reduce((s, r) => s + (r.totalCarbs || 0), 0);
    const avg   = (total / data.meals.length).toFixed(0);
    html = `
      <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:13px;">
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Meals</span><br><strong>${data.meals.length}</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Total Carbs</span><br><strong>${total}g</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Avg per Meal</span><br><strong>${avg}g</strong></div>
      </div>`;
  } else if (tab === "risk" && data.risk.length) {
    const latest = data.risk[0];
    html = `
      <div style="display:flex; gap:20px; flex-wrap:wrap; font-size:13px;">
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Records</span><br><strong>${data.risk.length}</strong></div>
        <div><span style="color:var(--color-text-soft); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.04em;">Latest</span><br><strong>${latest.level} (${latest.score}/100)</strong></div>
      </div>`;
  }

  if (html) {
    container.innerHTML  = html;
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

function renderChart(glucoseLogs) {
  const canvas = document.getElementById("history-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const points   = [...glucoseLogs].reverse();
  const hypoLine = points.map(() => 70);
  const highLine = points.map(() => 180);

  if (window.__historyChart) window.__historyChart.destroy();
  window.__historyChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: points.map((p) => formatDateTime(toDate(p.timestamp))),
      datasets: [
        {
          label: "Glucose", data: points.map((p) => p.value),
          borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.12)",
          tension: 0.3, fill: true, pointRadius: 2
        },
        {
          label: "Hypo (70)", data: hypoLine,
          borderColor: "#ef4444", borderDash: [6, 3], pointRadius: 0, fill: false, borderWidth: 1.5
        },
        {
          label: "High (180)", data: highLine,
          borderColor: "#f59e0b", borderDash: [6, 3], pointRadius: 0, fill: false, borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
        y: { grid: { color: "rgba(0,0,0,0.06)" } }
      }
    }
  });
}

function wireControls() {
  document.querySelectorAll("[data-window]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-window]").forEach((b) => b.classList.remove("chip-active"));
      btn.classList.add("chip-active");
      activeWindow = btn.dataset.window;
      render();
    });
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((b) => b.classList.remove("tab-active"));
      btn.classList.add("tab-active");
      activeTab = btn.dataset.tab;
      render();
    });
  });
}

guardPage((user, ready) => {
  if (!ready) { checkFirebaseAvailability(); return; }
  if (!user) return;
  currentUser = user;
  wireControls();
  loadAll();
});

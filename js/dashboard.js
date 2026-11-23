// js/dashboard.js
import { guardPage } from "./auth.js";
import { injectNav, checkFirebaseAvailability } from "./app.js";
import {
  getRecentGlucoseLogs, getRecentInsulinLogs, getRecentMeals,
  saveRiskPrediction, filterByWindow
} from "./firestore.js";
import { computeHypoRisk } from "./risk.js";
import { showToast, formatDateTime, escapeHtml, friendlyFirestoreError } from "./ui.js";

injectNav("dashboard");

function toDate(ts) {
  return ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
}

async function loadDashboard(user) {
  const greetingEl = document.getElementById("greeting-name");
  if (greetingEl) {
    greetingEl.textContent = user.displayName ? user.displayName.split(" ")[0] : "there";
  }

  try {
    const [glucoseLogs, insulinLogs, meals] = await Promise.all([
      getRecentGlucoseLogs(user.uid, 30),
      getRecentInsulinLogs(user.uid, 10),
      getRecentMeals(user.uid, 10)
    ]);

    renderCurrentGlucose(glucoseLogs);
    renderTrendChart(glucoseLogs);
    renderTodayStats(glucoseLogs, insulinLogs, meals);
    renderRecentMeals(meals);
    renderRecentGlucose(glucoseLogs.slice(0, 6));

    const risk = computeHypoRisk({
      currentGlucose:      glucoseLogs[0] ? glucoseLogs[0].value : null,
      recentGlucoseSeries: glucoseLogs.slice(0, 6).reverse().map((g) => ({ value: g.value, timestamp: toDate(g.timestamp) })),
      recentInsulin:       insulinLogs.map((i) => ({ dose: i.dose, timestamp: toDate(i.timestamp) })),
      recentMeals:         meals.map((m) => ({ totalCarbs: m.totalCarbs, mealTime: toDate(m.mealTime) })),
      recentActivity:      [],
      now:                 new Date()
    });

    renderRiskCard(risk);
    saveRiskPrediction(user.uid, risk).catch((e) => console.error("Could not persist risk prediction:", e));
  } catch (err) {
    console.error(err);
    showToast(friendlyFirestoreError(err), "error");
  }
}

function renderCurrentGlucose(logs) {
  const el    = document.getElementById("current-glucose-value");
  const ctxEl = document.getElementById("current-glucose-context");
  if (!logs.length) {
    if (el) el.textContent = "—";
    if (ctxEl) ctxEl.textContent = "No readings logged yet";
    return;
  }
  const latest = logs[0];
  if (el) el.textContent = `${latest.value}`;
  if (ctxEl) ctxEl.textContent = `${latest.unit || "mg/dL"} · ${latest.context || "—"} · ${formatDateTime(toDate(latest.timestamp))}`;
}

function renderTrendChart(logs) {
  const canvas = document.getElementById("glucose-trend-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const points = [...logs].reverse();
  if (window.__trendChart) window.__trendChart.destroy();

  // Build reference-line arrays (same length as data points)
  const hypoLine = points.map(() => 70);
  const highLine = points.map(() => 180);

  window.__trendChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: points.map((p) => formatDateTime(toDate(p.timestamp))),
      datasets: [
        {
          label: "Glucose (mg/dL)",
          data: points.map((p) => p.value),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3
        },
        {
          label: "Hypo threshold (70)",
          data: hypoLine,
          borderColor: "#ef4444",
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
          borderWidth: 1.5
        },
        {
          label: "High threshold (180)",
          data: highLine,
          borderColor: "#f59e0b",
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { suggestedMin: 50, suggestedMax: 220, grid: { color: "rgba(0,0,0,0.06)" } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
      }
    }
  });
}

function renderTodayStats(glucoseLogs, insulinLogs, meals) {
  const todayGlucose = filterByWindow(glucoseLogs, "timestamp", "today");
  const todayInsulin = filterByWindow(insulinLogs, "timestamp", "today");
  const todayMeals   = filterByWindow(meals, "mealTime", "today");

  const carbsEl   = document.getElementById("stat-carbs-today");
  const insulinEl = document.getElementById("stat-insulin-today");
  const readingsEl = document.getElementById("stat-readings-today");

  if (carbsEl)    carbsEl.textContent   = `${todayMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0)}g`;
  if (insulinEl)  insulinEl.textContent = `${todayInsulin.reduce((s, i) => s + (i.dose || 0), 0)}u`;
  if (readingsEl) readingsEl.textContent = `(${todayGlucose.length} reading${todayGlucose.length !== 1 ? "s" : ""} today)`;
}

function renderRecentMeals(meals) {
  const list = document.getElementById("recent-meals-list");
  if (!list) return;
  if (!meals.length) {
    list.innerHTML = `<li class="empty-state">No meals logged yet. <a href="meals.html" style="color:var(--color-primary)">Add your first meal</a>.</li>`;
    return;
  }
  list.innerHTML = meals.slice(0, 5).map((m) => `
    <li class="list-row">
      <div>
        <div class="list-row-title">${escapeHtml((m.items || []).map((i) => i.name).join(", ") || "Meal")}</div>
        <div class="list-row-sub">${formatDateTime(toDate(m.mealTime))}${m.mealType ? ` · ${escapeHtml(m.mealType)}` : ""}</div>
      </div>
      <div class="list-row-value">${m.totalCarbs}g carbs</div>
    </li>
  `).join("");
}

function renderRecentGlucose(logs) {
  const list = document.getElementById("recent-glucose-list");
  if (!list) return;
  if (!logs.length) {
    list.innerHTML = `<li class="empty-state">No readings yet. <a href="add.html" style="color:var(--color-primary)">Log your first reading</a>.</li>`;
    return;
  }
  list.innerHTML = logs.map((g) => `
    <li class="list-row">
      <div>
        <div class="list-row-title">${g.value} ${g.unit || "mg/dL"}</div>
        <div class="list-row-sub">${escapeHtml(g.context || "")} · ${formatDateTime(toDate(g.timestamp))}</div>
      </div>
      <div class="badge badge-${glucoseBand(g.value)}">${glucoseBand(g.value)}</div>
    </li>
  `).join("");
}

function glucoseBand(value) {
  if (value < 70)  return "low";
  if (value > 180) return "high";
  return "normal";
}

function renderRiskCard(risk) {
  const levelEl  = document.getElementById("risk-level");
  const scoreEl  = document.getElementById("risk-score");
  const reasonEl = document.getElementById("risk-reason");
  const card     = document.getElementById("risk-card");
  if (!levelEl) return;

  levelEl.textContent  = risk.level;
  scoreEl.textContent  = `Score: ${risk.score}/100`;
  reasonEl.textContent = risk.reasons[0] || "";
  if (card) card.className = `card risk-card risk-${risk.level.toLowerCase()}`;

  const warning = document.getElementById("high-risk-warning");
  if (warning) warning.style.display = risk.level === "HIGH" ? "flex" : "none";
}

guardPage((user, ready) => {
  if (!ready) { checkFirebaseAvailability(); return; }
  if (user) loadDashboard(user);
});

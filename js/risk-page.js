// js/risk-page.js — controller for risk.html (detailed risk breakdown view)

import { guardPage } from "./auth.js";
import { injectNav, checkFirebaseAvailability } from "./app.js";
import { getRecentGlucoseLogs, getRecentInsulinLogs, getRecentMeals, saveRiskPrediction } from "./firestore.js";
import { computeHypoRisk } from "./risk.js";
import { showToast, formatDateTime, escapeHtml, friendlyFirestoreError } from "./ui.js";

injectNav("dashboard"); // Risk is reached from the dashboard quick action; no dedicated nav tab

let currentUser = null;

function toDate(ts) {
  return ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
}

async function loadRisk(user) {
  try {
    const [glucoseLogs, insulinLogs, meals] = await Promise.all([
      getRecentGlucoseLogs(user.uid, 10),
      getRecentInsulinLogs(user.uid, 10),
      getRecentMeals(user.uid, 10)
    ]);

    const risk = computeHypoRisk({
      currentGlucose:      glucoseLogs[0] ? glucoseLogs[0].value : null,
      recentGlucoseSeries: glucoseLogs.slice(0, 6).reverse().map((g) => ({ value: g.value, timestamp: toDate(g.timestamp) })),
      recentInsulin:       insulinLogs.map((i) => ({ dose: i.dose, timestamp: toDate(i.timestamp) })),
      recentMeals:         meals.map((m) => ({ totalCarbs: m.totalCarbs, mealTime: toDate(m.mealTime) })),
      recentActivity:      [],
      now:                 new Date()
    });

    // Score and badge
    const scoreEl = document.getElementById("risk-page-score");
    const badgeEl = document.getElementById("risk-page-badge");
    if (scoreEl) scoreEl.textContent = `${risk.score} / 100`;
    if (badgeEl) {
      badgeEl.textContent = risk.level;
      badgeEl.className   = `risk-badge risk-${risk.level.toLowerCase()}`;
    }

    // Timestamp
    const tsEl = document.getElementById("risk-page-timestamp");
    if (tsEl) tsEl.textContent = formatDateTime(risk.timestamp);

    // Contributing factors list
    const reasonsEl = document.getElementById("risk-page-reasons");
    if (reasonsEl) {
      reasonsEl.innerHTML = risk.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
    }

    // Summary stat cards
    const glucoseEl  = document.getElementById("risk-page-glucose");
    const insulinEl  = document.getElementById("risk-page-insulin");
    const mealEl     = document.getElementById("risk-page-meal");
    if (glucoseEl) glucoseEl.textContent = glucoseLogs[0] ? `${glucoseLogs[0].value} mg/dL` : "No data";
    if (insulinEl) insulinEl.textContent = insulinLogs[0] ? `${insulinLogs[0].dose}u ${escapeHtml(insulinLogs[0].type || "")}` : "No data";
    if (mealEl)    mealEl.textContent    = meals[0] ? `${meals[0].totalCarbs}g carbs` : "No data";

    // HIGH risk warning banner
    const warningEl = document.getElementById("risk-page-warning");
    if (warningEl) warningEl.style.display = risk.level === "HIGH" ? "flex" : "none";

    // Animate gauge bar
    const gaugeBar = document.getElementById("risk-gauge-bar");
    if (gaugeBar) {
      gaugeBar.style.width  = risk.score + "%";
      gaugeBar.className    = "risk-gauge-bar risk-gauge-" + risk.level.toLowerCase();
    }

    // Persist the prediction
    saveRiskPrediction(user.uid, risk).catch((e) => console.error("Could not persist risk prediction:", e));

  } catch (err) {
    console.error(err);
    showToast(friendlyFirestoreError(err), "error");
  }
}

guardPage((user, ready) => {
  if (!ready) { checkFirebaseAvailability(); return; }
  if (!user) return;
  currentUser = user;
  loadRisk(user);

  // Wire refresh button
  const refreshBtn = document.getElementById("risk-refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      if (currentUser) loadRisk(currentUser);
    });
  }
});

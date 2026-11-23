// js/risk.js
// ---------------------------------------------------------------------------
// Hypoglycemia risk scoring.
//
// HONESTY NOTE: This is a transparent, rule-based heuristic — not a trained
// clinical model, and not a diagnosis. It is meant purely as decision
// support for a prototype. Every factor it uses is listed in the "reasons"
// output so the user can see exactly why a score was produced.
// Never wire this to automatic insulin dosing.
// ---------------------------------------------------------------------------

/**
 * Compute a hypoglycemia risk score from recent patient data.
 *
 * @param {object} input
 * @param {number|null}  input.currentGlucose        Current glucose in mg/dL
 * @param {Array}        input.recentGlucoseSeries   [{value, timestamp}] oldest-to-newest
 * @param {Array}        input.recentInsulin         [{dose, timestamp}]
 * @param {Array}        input.recentMeals           [{totalCarbs, mealTime}]
 * @param {Array}        input.recentActivity        [{durationMinutes, intensity, timestamp}]
 * @param {Date}         input.now
 * @returns {{ level: string, score: number, reasons: string[], timestamp: Date }}
 */
export function computeHypoRisk(input) {
  const {
    currentGlucose     = null,
    recentGlucoseSeries = [],
    recentInsulin       = [],
    recentMeals         = [],
    recentActivity      = [],
    now                 = new Date()
  } = input;

  let score   = 0;
  const reasons = [];

  // ── 1. Absolute glucose level ─────────────────────────────────────────────
  if (currentGlucose != null) {
    if (currentGlucose < 70) {
      score += 45;
      reasons.push(`Current glucose (${currentGlucose} mg/dL) is already in the hypoglycemic range (<70).`);
    } else if (currentGlucose < 90) {
      score += 25;
      reasons.push(`Current glucose (${currentGlucose} mg/dL) is low-normal and trending toward the hypo range.`);
    } else if (currentGlucose < 110) {
      score += 8;
      reasons.push(`Current glucose (${currentGlucose} mg/dL) is on the lower side of normal.`);
    }
  } else {
    reasons.push("No recent glucose reading available — risk estimate is less reliable.");
    score += 5;
  }

  // ── 2. Trend (rate of change over the recent series) ──────────────────────
  if (recentGlucoseSeries.length >= 2) {
    const first = recentGlucoseSeries[0].value;
    const last  = recentGlucoseSeries[recentGlucoseSeries.length - 1].value;
    const delta = last - first;

    if (delta <= -30) {
      score += 25;
      reasons.push(`Glucose is dropping quickly (${Math.abs(delta)} mg/dL over recent readings).`);
    } else if (delta <= -15) {
      score += 12;
      reasons.push(`Glucose is trending downward (${Math.abs(delta)} mg/dL over recent readings).`);
    }
  }

  // ── 3. Recent insulin without matching carbs (within last 2 hours) ────────
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const recentBolus = recentInsulin.filter((i) => i.timestamp >= twoHoursAgo);
  const recentCarbs = recentMeals
    .filter((m) => m.mealTime >= twoHoursAgo)
    .reduce((sum, m) => sum + (m.totalCarbs || 0), 0);

  if (recentBolus.length > 0) {
    const totalDose = recentBolus.reduce((s, i) => s + (i.dose || 0), 0);
    if (recentCarbs < 10 && totalDose > 0) {
      score += 20;
      reasons.push(`Insulin logged in the last 2 hours (${totalDose}u) with little or no matching carbohydrate intake.`);
    } else {
      reasons.push(`Recent insulin (${totalDose}u) appears matched with ~${recentCarbs}g carbs in the last 2 hours.`);
    }
  }

  // ── 4. Recent physical activity ───────────────────────────────────────────
  const recentIntenseActivity = recentActivity.find(
    (a) => a.timestamp >= new Date(now.getTime() - 3 * 60 * 60 * 1000) &&
           (a.intensity === "high" || a.durationMinutes >= 30)
  );
  if (recentIntenseActivity) {
    score += 12;
    reasons.push("Recent physical activity can continue lowering glucose for several hours afterward.");
  }

  // ── 5. Time-of-day (overnight carries elevated hypo risk) ─────────────────
  const hour = now.getHours();
  if (hour >= 0 && hour < 6) {
    score += 8;
    reasons.push("Overnight hours (12am–6am) carry a generally elevated hypoglycemia risk window.");
  }

  // ── Clamp, classify, and return ───────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  let level = "LOW";
  if (score >= 55)      level = "HIGH";
  else if (score >= 28) level = "MODERATE";

  if (reasons.length === 0) {
    reasons.push("No significant risk factors detected in recent data.");
  }

  return { level, score, reasons, timestamp: now };
}

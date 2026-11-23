# GlucoGuard-T1D — Feature Reference

This document describes every feature in GlucoGuard-T1D, its current implementation status, how it works, and known limitations.

**Status legend:**
| Symbol | Meaning |
|---|---|
| ✅ Implemented | Fully working end-to-end |
| ⚙️ Partial | Working but with known gaps or limitations |
| 🔮 Planned | UI/placeholder exists; backend not implemented |

---

## 1. User Authentication ✅

**How it works:**
- Email and password authentication via Firebase Authentication.
- New users register on `register.html` — a display name, email, and password are required.
- Existing users sign in on `login.html`.
- Every authenticated page calls `guardPage()` on load, which uses `onAuthStateChanged` to redirect unauthenticated visitors to `login.html`.
- Logout clears the Firebase session and redirects to `index.html`.

**Validations:**
- Password must be at least 6 characters (Firebase minimum).
- Confirm-password field must match.
- Email format validated by Firebase.

**Known limitations:**
- No "Forgot password" / password reset flow in the UI (Firebase supports it via `sendPasswordResetEmail` but the button is not wired up).
- No third-party OAuth (Google sign-in, etc.).
- No email verification step.

---

## 2. Dashboard ✅

**How it works:**
- Displays a greeting, today's glucose statistics (latest, average, min, max, reading count), and a 7-day glucose trend chart.
- Chart uses Chart.js 4 with two reference lines: 70 mg/dL (hypoglycaemia threshold, red) and 180 mg/dL (hyperglycaemia threshold, orange).
- Quick-action cards link to Add Reading, Scan Food, and Risk Check.
- Empty state shown when no readings exist for today.

**Known limitations:**
- Dashboard statistics are computed client-side from the latest 20 Firestore records.
- No server-side aggregation; large datasets may feel slow on first load.

---

## 3. Glucose Logging ✅

**How it works:**
- User enters a blood glucose value (mg/dL), an optional insulin dose and type, and optional notes on `add.html`.
- Input validated: glucose must be 1–600 mg/dL; insulin dose (if provided) must be 0.5–100 U.
- Data is written to `/users/{uid}/glucose/{autoId}` and `/users/{uid}/insulin/{autoId}` in Firestore.
- After saving, the user is redirected to the dashboard.

**Known limitations:**
- No continuous glucose monitor (CGM) integration — all values are manually entered.
- No duplicate detection (the same value can be logged twice in quick succession).

---

## 4. Insulin Logging ✅

**How it works:**
- Logged alongside a glucose reading on `add.html`.
- Insulin type (rapid-acting, long-acting, mixed) is recorded with the dose.
- Stored in `/users/{uid}/insulin/{autoId}`.

**Known limitations:**
- Insulin data is displayed in history but not in a dedicated insulin-only chart.
- No basal/bolus split tracking.
- Insulin-on-board calculation is a simple time-based proxy (not pharmacokinetic).

---

## 5. Meal Logging ✅

**How it works:**
- User searches the Indian food database (38 foods) by name on `meals.html`.
- Results show GI, carbs per 100 g, typical portion size, and food category.
- User selects a food, enters a portion size (grams), and chooses a meal type (breakfast, lunch, dinner, snack).
- Carbohydrate total is calculated and saved to `/users/{uid}/meals/{autoId}`.
- Meal history is displayed below the search form.

**Known limitations:**
- Food database is static and limited to 38 Indian foods.
- No custom food entry.
- No calorie or micronutrient tracking — only carbohydrates.
- Portion size is in grams only (no cup/spoon conversions).

---

## 6. Indian Food Database ⚙️

**How it works:**
- A static JavaScript array in `food-database.js` with 38 foods.
- Each entry includes: name, category, carbs per 100 g, glycaemic index, typical portion in grams, and a short description.

**Current food categories:**
Staples · Rice dishes · Breads & rotis · Lentils & legumes · Vegetables · Snacks · Sweets · Beverages

**Foods included (38):**
Roti, Rice (white/brown), Idli, Poha, Upma, Puri, Bhatura, Aloo Paratha, Naan, Dal Tadka, Rajma, Chana, Sambar, Curd, Paneer, Chicken Curry, Fish Curry, Matar Paneer, Palak Paneer, Aloo Sabzi, Chana Dal, Moong Dal, Masala Dosa, Uttapam, Dhokla, Jalebi, Gulab Jamun, Lassi (sweet), Samosa, Pakora, Tea with milk, Sugarcane Juice, Mango (seasonal), Banana, Apple, Orange, Grapes, and more.

**Known limitations:**
- 38 foods is a small subset of the Indian food landscape.
- GI values are general averages — actual GI varies by preparation method, ripeness, and individual response.
- No branded/packaged food entries.
- Cannot add custom foods.

---

## 7. Food Scanning ⚙️ (Partial — Manual Fallback)

**How it works (actual):**
- User can upload or drag-and-drop a food photo on `scan.html`.
- File is validated (must be an image, max 8 MB).
- **The AI recognition endpoint (`RECOGNITION_ENDPOINT`) is set to `null`** — no actual image classification is performed.
- The app falls back gracefully to a manual search input that queries the same Indian food database.
- Matched food details (GI, carbs) are displayed inline.

> **Important:** The food scanning feature is a **UI prototype**. It does not use AI or machine learning to identify food from photos. The fallback manual search is fully functional.

**Known limitations:**
- No real computer vision / AI integration.
- Photo is not uploaded to Firebase Storage from this page (only profile photos use Storage).
- Scan results are not saved automatically — the user must log the meal separately via `meals.html`.

---

## 8. Hypoglycaemia Risk Assessment ✅

**How it works:**
- Risk score (0–100) is computed by `risk.js` from the user's recent Firestore data.
- Five factors are evaluated (each contributes up to 20 points):

| Factor | Trigger |
|---|---|
| Recent hypoglycaemia | Any glucose reading < 70 mg/dL in last 24 hours |
| High glucose variability | Standard deviation of recent readings > 40 mg/dL |
| Downward trend | Last reading notably below 3-reading moving average |
| Long gap since last meal | Meal logged more than 4 hours ago |
| Recent insulin | Insulin dose logged within last 3 hours |

- Risk level: **LOW** (< 28), **MODERATE** (28–54), **HIGH** (≥ 55).
- Result is displayed with a colour-coded card, animated gauge bar, and plain-language explanation.
- A refresh button re-runs the calculation against fresh Firestore data.

**Known limitations:**
- Rule-based heuristic only — not a clinical algorithm.
- Does not account for exercise, stress, illness, or medication changes.
- **This is not a medical device. Do not use this score to make insulin or treatment decisions.**

---

## 9. History & Analytics ✅

**How it works:**
- `history.html` shows a time-series chart (last 30 readings) with glucose reference lines at 70 and 180 mg/dL.
- Tabs switch between Glucose, Insulin, and Meals views.
- Summary statistics (average, min, max, in-range %) are computed and displayed.
- A data table below the chart lists all entries with timestamps.

**Known limitations:**
- Maximum 30 entries loaded per tab (Firestore query limit for performance).
- No export (CSV, PDF) functionality.
- No date range filter.
- No A1c estimation.
- No time-in-range breakdown chart.

---

## 10. User Profile ✅

**How it works:**
- `profile.html` lets the user update their display name, age, diagnosis year, and insulin types.
- Profile data is stored in `/users/{uid}/profile` as a single Firestore document.
- Profile photo upload uses Firebase Storage at `/users/{uid}/photo.jpg`.
- Validation: name must be 2+ characters; age must be 1–120.

**Known limitations:**
- Profile photo upload is wired but not all browsers handle the preview consistently.
- No account deletion workflow.
- Diagnosis year is stored as a string; not validated beyond being a 4-digit number.

---

## 11. Caregiver SMS Notifications 🔮 (Planned)

**Current state:**
- UI for entering a caregiver phone number exists in `profile.html`.
- **No backend implementation.** Entered numbers are not saved or used.
- No SMS or push notification service is connected.

**Planned implementation would require:**
- A Firebase Cloud Function (server-side) to trigger on HIGH risk events.
- Integration with an SMS provider (e.g. Twilio, MSG91).
- User consent flow for the caregiver.

---

## 12. Navigation & Mobile Experience ✅

**How it works:**
- Side navigation on screens ≥ 900 px wide (desktop/tablet landscape).
- Bottom navigation bar on screens < 900 px (phone/tablet portrait).
- Navigation HTML is injected dynamically by `app.js` — a single source of truth for all nav items.
- Active page is highlighted automatically based on `window.location.pathname`.
- `prefers-reduced-motion` CSS media query respects user accessibility preferences.

**Known limitations:**
- No swipe gesture support for mobile navigation.
- No dark mode.

---

## Medical Disclaimer

> GlucoGuard-T1D is a **personal logging and educational tool**. It is **not** a certified medical device and **not** a substitute for professional medical advice, clinical monitoring, or treatment decisions. Always consult your healthcare provider regarding your diabetes management plan. Never adjust insulin doses or treatment based solely on information from this application.

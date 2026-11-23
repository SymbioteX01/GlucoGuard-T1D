# GlucoGuard-T1D — Architecture

## Overview

GlucoGuard-T1D is a **client-side web application** with no traditional backend server. All business logic runs in the browser. Firebase provides authentication, database, and storage services.

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (Client)                      │
│                                                          │
│  HTML Pages ──► ES Module JS ──► Firebase SDK (compat)  │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │  HTTPS
         ┌─────────────▼──────────────────┐
         │          Firebase              │
         │  ┌──────────────────────────┐  │
         │  │  Firebase Authentication │  │
         │  │  (Email / Password)      │  │
         │  ├──────────────────────────┤  │
         │  │  Cloud Firestore         │  │
         │  │  (NoSQL document store)  │  │
         │  ├──────────────────────────┤  │
         │  │  Firebase Storage        │  │
         │  │  (Profile photos)        │  │
         │  └──────────────────────────┘  │
         └────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Markup | HTML5 | — |
| Styling | CSS3 (custom properties, flexbox, grid) | — |
| Scripting | Vanilla JavaScript ES Modules | ES2020+ |
| Charts | Chart.js | 4.4.4 (CDN) |
| Auth | Firebase Authentication | 9 compat |
| Database | Cloud Firestore | 9 compat |
| Storage | Firebase Storage | 9 compat |
| Fonts | Google Fonts (Plus Jakarta Sans, Manrope) | — |

No build tools, bundlers, or frameworks are required. The application runs directly in any modern browser.

---

## Project Structure

```
GlucoGuard-T1D/
│
├── index.html          # Landing / marketing page (public)
├── login.html          # Email+password sign-in
├── register.html       # New account registration
├── dashboard.html      # Main authenticated home screen
│
├── add.html            # Log glucose reading + insulin dose
├── meals.html          # Indian food database + meal logging
├── scan.html           # Food photo scan (stub → manual fallback)
├── risk.html           # Hypoglycemia risk assessment
├── history.html        # Historical charts and data table
├── profile.html        # User settings and profile photo
│
├── css/
│   ├── style.css       # Design tokens, base, typography, layout
│   ├── components.css  # Reusable UI components
│   └── responsive.css  # Breakpoints + mobile nav
│
├── js/
│   ├── firebase-config.js  # Firebase initialisation
│   ├── auth.js             # Authentication helpers + guardPage()
│   ├── firestore.js        # All Firestore read/write helpers
│   ├── app.js              # Nav injection + global UI setup
│   ├── ui.js               # Shared DOM/formatting utilities
│   ├── food-database.js    # Static Indian food GI + carb data
│   ├── dashboard.js        # Dashboard page controller
│   ├── add.js              # Glucose/insulin logging controller
│   ├── meals.js            # Meal search + logging controller
│   ├── history.js          # History charts + table controller
│   ├── risk.js             # Risk scoring algorithm
│   ├── risk-page.js        # Risk page controller + gauge
│   ├── scan.js             # Scan utilities + drag-and-drop
│   └── scan-page.js        # Scan page controller
│
├── assets/
│   ├── icons/favicon.svg
│   └── screenshots/        # App screenshots for README
│
├── docs/
│   ├── ARCHITECTURE.md     # This file
│   ├── FIREBASE_SETUP.md   # Firebase project setup guide
│   └── FEATURES.md         # Feature reference + status
│
├── firestore.rules         # Firestore security rules
├── storage.rules           # Firebase Storage security rules
├── .gitignore
├── .env.example
├── LICENSE
├── README.md
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## JavaScript Module Architecture

### Module Dependency Graph

```
firebase-config.js
       │
       ▼
   auth.js ◄──────────────── (every page)
   firestore.js ◄─────────── (every data page)
       │
       ├──► dashboard.js
       ├──► add.js
       ├──► meals.js
       ├──► history.js
       ├──► risk.js ◄──── risk-page.js
       ├──► scan.js ◄──── scan-page.js
       └──► profile.js (implicit via auth.js)

app.js    ──► injected into every authenticated page
ui.js     ──► shared utilities, imported where needed
food-database.js ──► meals.js, scan-page.js
```

### Key Module Responsibilities

#### `firebase-config.js`
Initialises the Firebase app and exports `auth`, `db`, and `storage` instances. This is the **single source of Firebase credentials** — all other modules import from here.

#### `auth.js`
- `guardPage()` — Wraps every authenticated page. Redirects to `login.html` if no user is signed in. Calls `app.js#initNav()` and the page's own init function once auth state is confirmed.
- `registerUser(email, password, displayName)` — Creates a new Firebase Auth user and sets their `displayName`.
- `loginUser(email, password)` — Firebase `signInWithEmailAndPassword` wrapper.
- `logoutUser()` — Firebase `signOut` + redirect to `index.html`.

#### `firestore.js`
Thin wrapper around Firestore SDK. All reads and writes are **scoped to the authenticated user's UID**:
```
/users/{uid}/glucose/{autoId}
/users/{uid}/insulin/{autoId}
/users/{uid}/meals/{autoId}
/users/{uid}/profile  (single document)
```
Exported helpers: `addGlucose`, `getRecentGlucose`, `addInsulin`, `addMeal`, `getMeals`, `getHistory`, `saveProfile`, `getProfile`.

#### `app.js`
Injected into every authenticated page via a `<script type="module">` tag. Renders the side-navigation (desktop) and bottom-navigation (mobile) by inserting HTML into `#nav-container`. Sets the active state on the current page link.

#### `risk.js`
Pure scoring function — no DOM, no Firebase. Accepts an array of recent glucose readings and returns `{ score, level, factors }`.

**Scoring factors (each contributes up to 20 points, total max 100):**
| Factor | Trigger |
|---|---|
| Recent hypoglycaemia | Any reading < 70 mg/dL in last 24 h |
| Glucose variability | Standard deviation > 40 mg/dL |
| Trend direction | Last reading significantly lower than 3-reading average |
| Time since last meal | Meal logged > 4 hours ago |
| Insulin-on-board proxy | Insulin dose logged within last 3 hours |

**Thresholds:** LOW < 28 · MODERATE 28–54 · HIGH ≥ 55

#### `food-database.js`
Static array of 38 common Indian foods with:
- `name`, `category`, `carbsPer100g`, `gi` (glycaemic index), `portionG` (typical serving), `description`.

---

## Authentication Flow

```
User visits any authenticated page
           │
           ▼
     guardPage() called
           │
           ▼
   onAuthStateChanged()
      ┌────┴────┐
      │         │
   Signed in  Not signed in
      │         │
      ▼         ▼
  initNav()  redirect to
  initPage()  login.html
```

---

## Data Flow — Logging a Glucose Reading

```
User fills add.html form
        │
        ▼
Validate inputs (client-side)
  glucose: 1–600 mg/dL
  insulin: 0.5–100 U (optional)
        │
        ▼
addGlucose(uid, { value, timestamp, notes })
addInsulin(uid, { dose, type, timestamp })  ← if dose provided
        │
        ▼
Firestore writes to:
  /users/{uid}/glucose/{autoId}
  /users/{uid}/insulin/{autoId}
        │
        ▼
Redirect to dashboard.html
```

---

## Responsive Layout

| Viewport | Navigation | Layout |
|---|---|---|
| ≥ 900 px | Side navigation (left panel) | Multi-column dashboard |
| < 900 px | Bottom navigation bar | Single-column stacked |

CSS custom properties define the design system:
- `--primary` `--teal` `--success` `--warning` `--danger`
- `--bg` `--surface` `--surface-alt`
- `--text-primary` `--text-secondary` `--text-muted`
- `--border` `--shadow` `--radius` `--radius-lg`

---

## Firebase Integration Notes

- The Firebase SDK is loaded via CDN (`compat` v9 namespace: `firebase/app`, `firebase/auth`, etc.). This avoids a build step while keeping module isolation via native ES modules.
- Firestore **offline persistence** is not enabled by default — adding `enableIndexedDbPersistence(db)` would add offline support but is left for a future release.
- Firebase Analytics is initialised but no custom events are tracked beyond the default page-view event.

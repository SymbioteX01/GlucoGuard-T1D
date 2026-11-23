<div align="center">

<!-- Project Logo / Banner -->
<img src="assets/icons/favicon.svg" width="72" height="72" alt="GlucoGuard-T1D Logo"/>

# GlucoGuard-T1D

### Intelligent Glucose Management for Type 1 Diabetes

*A personal blood glucose tracker, meal logger, and hypoglycaemia risk tool —  
built for the Indian dietary context.*

<br/>

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org)

[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![No Build Step](https://img.shields.io/badge/No%20Build%20Step-required-blue?style=flat-square)]()

</div>

---

> **⚠️ Medical Disclaimer**
> GlucoGuard-T1D is a **personal logging and educational tool**. It is **not** a certified medical device and **not** a substitute for professional medical advice, clinical monitoring, or insulin dosing decisions. Always consult a qualified healthcare professional for your diabetes management plan.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Firebase Configuration](#firebase-configuration)
- [Run Locally](#run-locally)
- [Deploy to GitHub Pages](#deploy-to-github-pages)
- [Security](#security)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

---

## Overview

GlucoGuard-T1D is a **client-side web application** designed to help individuals with Type 1 Diabetes (T1D) track their blood glucose levels, log insulin doses, monitor their meals, and assess their risk of hypoglycaemia — all within a clean, mobile-friendly interface.

The application runs entirely in the browser with no backend server. Firebase handles authentication, real-time data storage, and file storage. No data is ever processed on a third-party server beyond Firebase's own infrastructure.

---

## Problem Statement

Living with Type 1 Diabetes in India presents unique challenges:

- 🍛 **Indian food lacks GI data** in mainstream apps — most glucose trackers focus on Western diets.
- 📊 **Scattered data** — people juggle multiple tools: a glucometer, a food diary, a calculator, and a doctor's notes.
- 📱 **Mobile-first need** — most Indian T1D patients use smartphones, not desktops.
- ⚠️ **Hypoglycaemia risk is poorly communicated** — patients rarely get a real-time risk signal.

---

## Our Solution

GlucoGuard-T1D brings together **glucose tracking, Indian meal logging, and risk assessment** in a single, offline-capable progressive web application:

| Pain Point | GlucoGuard-T1D Solution |
|---|---|
| Western-only food databases | 38 common Indian foods with GI + carb data |
| Fragmented data | Single dashboard: glucose + insulin + meals |
| Complex apps | Zero-installation, works in any browser |
| Risk blindness | Rule-based hypoglycaemia risk score with plain-English explanation |

---

## Key Features

| Feature | Status | Description |
|---|---|---|
| 🔐 **User Authentication** | ✅ | Secure email/password login via Firebase Auth |
| 📊 **Dashboard** | ✅ | Today's stats + 7-day glucose trend chart |
| 🩸 **Glucose Logging** | ✅ | Manual entry with validation (1–600 mg/dL) |
| 💉 **Insulin Logging** | ✅ | Dose + type (rapid, long-acting, mixed) |
| 🍛 **Meal Tracking** | ✅ | Search & log from 38-food Indian database |
| 📷 **Food Scanning** | ⚙️ | UI prototype with manual search fallback |
| ⚠️ **Hypo Risk Score** | ✅ | 5-factor rule-based risk engine + gauge |
| 📈 **History & Charts** | ✅ | 30-entry time-series charts + data table |
| 👤 **User Profile** | ✅ | Name, age, diagnosis year, photo upload |
| 📱 **Mobile-First** | ✅ | Responsive layout with bottom nav on mobile |
| 📲 **Caregiver SMS** | 🔮 | Planned — UI placeholder present |

**Status:** ✅ Implemented · ⚙️ Partial (working with limitations) · 🔮 Planned

---

## Technology Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure (10 pages) |
| **CSS3** | Custom design system with CSS variables, flexbox, grid |
| **Vanilla JavaScript (ES Modules)** | All application logic — no frameworks |
| **Firebase Authentication** | Email/password user accounts |
| **Cloud Firestore** | Real-time NoSQL database, per-user data |
| **Firebase Storage** | Profile photo uploads |
| **Chart.js 4.4.4** | Blood glucose trend charts and history views |
| **Google Fonts** | Plus Jakarta Sans, Manrope |

**No build tools. No npm install. No frameworks. Runs in any modern browser.**

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  10 HTML pages                                   │
│  ├── 3 CSS files (design system)                 │
│  └── 14 JS ES Modules                            │
│       ├── firebase-config.js  (SDK init)         │
│       ├── auth.js             (Auth + guardPage) │
│       ├── firestore.js        (DB helpers)       │
│       ├── app.js              (Nav injection)    │
│       ├── ui.js               (Shared utilities) │
│       ├── food-database.js    (38 Indian foods)  │
│       └── [page controllers]  (1 per page)       │
│                                                  │
└───────────────────┬──────────────────────────────┘
                    │ HTTPS
         ┌──────────▼──────────┐
         │      Firebase        │
         │  ┌───────────────┐  │
         │  │  Auth         │  │
         │  ├───────────────┤  │
         │  │  Firestore    │  │
         │  │  /users/{uid} │  │
         │  │    /glucose   │  │
         │  │    /insulin   │  │
         │  │    /meals     │  │
         │  │    /profile   │  │
         │  ├───────────────┤  │
         │  │  Storage      │  │
         │  │  /users/{uid} │  │
         │  └───────────────┘  │
         └─────────────────────┘
```

For a full architecture breakdown, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Project Structure

```
GlucoGuard-T1D/
│
├── index.html          # Landing page (public)
├── login.html          # Sign in
├── register.html       # Create account
├── dashboard.html      # Main dashboard
│
├── add.html            # Log glucose + insulin
├── meals.html          # Meal tracking + food search
├── scan.html           # Food photo scan (prototype)
├── risk.html           # Hypoglycaemia risk assessment
├── history.html        # Charts + data history
├── profile.html        # User settings
│
├── css/
│   ├── style.css       # Design tokens, base styles
│   ├── components.css  # UI components
│   └── responsive.css  # Mobile breakpoints
│
├── js/
│   ├── firebase-config.js  # ← Add your Firebase config here
│   ├── auth.js
│   ├── firestore.js
│   ├── app.js
│   ├── ui.js
│   ├── food-database.js
│   ├── dashboard.js
│   ├── add.js
│   ├── meals.js
│   ├── history.js
│   ├── risk.js
│   ├── risk-page.js
│   ├── scan.js
│   └── scan-page.js
│
├── assets/
│   ├── icons/favicon.svg
│   └── screenshots/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FIREBASE_SETUP.md
│   └── FEATURES.md
│
├── firestore.rules
├── storage.rules
├── .gitignore
├── .env.example
├── LICENSE
├── README.md           # This file
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## Getting Started

### Prerequisites

- A modern browser (Chrome, Firefox, Safari, Edge)
- A [Firebase](https://firebase.google.com) account (free Spark tier is sufficient)
- Python 3 or Node.js (to run a local HTTP server)

### 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/GlucoGuard-T1D.git
cd GlucoGuard-T1D
```

### 2 — Set up Firebase

Follow the step-by-step guide in [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

### 3 — Add your Firebase config

Open `js/firebase-config.js` and replace the placeholder values with your project's `firebaseConfig` object (copied from the Firebase console).

### 4 — Run locally

```bash
python -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

> The app must be served over HTTP (not opened as a local `file://` URL) because ES Modules require a server origin.

---

## Firebase Configuration

The file `js/firebase-config.js` contains your Firebase project credentials. These are **web API keys** — they are designed to be public and do not grant administrative access. Security is enforced by Firestore and Storage rules, not by hiding the key.

> See [SECURITY.md](SECURITY.md) for a full explanation of the security model.

For teams or public forks: replace the config with your own Firebase project values so contributors use their own isolated environment.

Full setup instructions: [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)

---

## Run Locally

| Method | Command |
|---|---|
| Python 3 | `python -m http.server 8080` |
| Python 2 | `python -m SimpleHTTPServer 8080` |
| Node.js | `npx serve .` |
| VS Code | Right-click `index.html` → Open with Live Server |

Then visit **http://localhost:8080**.

---

## Deploy to GitHub Pages

GlucoGuard-T1D is a fully static site — it deploys to GitHub Pages with zero build steps.

```bash
# 1. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/GlucoGuard-T1D.git
git branch -M main
git push -u origin main

# 2. Enable GitHub Pages
# Repository Settings → Pages → Source: Deploy from branch → main / (root) → Save

# 3. Add your GitHub Pages URL to Firebase Auth authorised domains
# Firebase Console → Authentication → Settings → Authorised domains → Add domain
# e.g. yourusername.github.io
```

Your app will be live at `https://YOUR_USERNAME.github.io/GlucoGuard-T1D/`.

---

## Security

- **Per-user data isolation** via Firestore security rules — no user can access another's data.
- **Image-only, 8 MB max** file uploads via Storage security rules.
- **Input validation** on all forms (client-side) + Firebase rules (server-side boundary).
- **XSS prevention** via `escapeHtml()` on all dynamic DOM insertions.
- **No private credentials** in source code — `firebase-config.js` contains only public web config values.

See [SECURITY.md](SECURITY.md) for the full security policy and vulnerability reporting process.

---

## Screenshots

> 📸 Screenshots coming soon.
>
> To capture screenshots: set up your Firebase project, run the app locally (`python -m http.server 8080`), register an account, add some glucose readings, and take browser screenshots of each page. Add them to `assets/screenshots/`.

---

## Roadmap

| Feature | Priority |
|---|---|
| Password reset / forgot password flow | High |
| Caregiver SMS alerts (Twilio / MSG91 via Cloud Functions) | High |
| Offline support via IndexedDB persistence | Medium |
| A1c estimation from 90-day average | Medium |
| Expanded food database (200+ Indian foods) | Medium |
| Dark mode | Medium |
| CSV / PDF export of history | Low |
| CGM integration (Dexcom / Libre API) | Future |
| Android / iOS PWA installability | Future |

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

**Good first issues:**
- Add more Indian foods to `js/food-database.js` (with cited GI values)
- Implement the forgot-password flow in `login.html`
- Add CSV export to `history.html`
- Write a Content Security Policy header recommendation

---

## GitHub Upload Instructions

```bash
# From the GlucoGuard-T1D directory:
git init
git add .
git commit -m "feat: initial release — GlucoGuard-T1D v1.0.0

- 10-page healthcare web application for T1D management
- Firebase Auth, Firestore, Storage integration
- Glucose, insulin, and meal logging
- 38-food Indian food database
- Hypoglycaemia risk scoring engine
- Responsive mobile-first UI
- Professional documentation and GitHub assets"

# Create the repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/GlucoGuard-T1D.git
git branch -M main
git push -u origin main
```

**Recommended repository topics:**  
`type1-diabetes` `diabetes-management` `firebase` `healthcare` `indian-food` `carb-counting` `hypoglycemia` `javascript` `pwa` `glucose-tracker`

---

## Author

**[YOUR NAME]**

- GitHub: [@SymbioteX01](https://github.com/SymbioteX01)
- Email: symbiotex01@gmail.com

> Replace the placeholders above with your real details before publishing.

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ for the T1D community

**GlucoGuard-T1D** · Not a medical device · Always consult your doctor

</div>

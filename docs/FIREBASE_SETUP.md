# GlucoGuard-T1D — Firebase Setup Guide

This guide walks you through creating a Firebase project from scratch and connecting it to GlucoGuard-T1D.

---

## Prerequisites

- A Google account
- A modern browser
- The GlucoGuard-T1D repository cloned locally

---

## Step 1 — Create a Firebase Project

1. Open [https://console.firebase.google.com](https://console.firebase.google.com).
2. Click **Add project**.
3. Enter a project name (e.g. `glucoguard-t1d`).
4. Choose whether to enable Google Analytics (optional — the app supports it but does not require it).
5. Click **Create project** and wait for provisioning.

---

## Step 2 — Register a Web App

1. In the Firebase console, click the **</>** (Web) icon on the project overview page.
2. Enter an app nickname (e.g. `GlucoGuard Web`).
3. Leave **Firebase Hosting** unchecked (we use GitHub Pages or a local server).
4. Click **Register app**.
5. Copy the `firebaseConfig` object — you will need it in Step 7.

---

## Step 3 — Enable Email/Password Authentication

1. In the left sidebar, click **Authentication**.
2. Click the **Sign-in method** tab.
3. Click **Email/Password**.
4. Enable **Email/Password** (the first toggle).
5. Leave **Email link (passwordless)** disabled.
6. Click **Save**.

---

## Step 4 — Create a Firestore Database

1. In the left sidebar, click **Firestore Database**.
2. Click **Create database**.
3. Select **Start in production mode** (security rules are applied immediately).
4. Choose a Cloud Firestore location close to your users (e.g. `asia-south1` for India).
5. Click **Enable**.

### Deploy Security Rules

After the database is created:

1. Click the **Rules** tab.
2. Replace the default rules with the contents of `firestore.rules` from this repository.
3. Click **Publish**.

The rules ensure each user can only access their own data:

```
/users/{uid}/**  — readable and writable only by the user with matching uid
/*               — everything else denied
```

### (Optional) Create Composite Indexes

If Firestore warns about missing indexes when querying history with ordering + limits, create the following composite index:

| Collection | Fields | Order |
|---|---|---|
| `glucose` | `timestamp` | Descending |
| `insulin` | `timestamp` | Descending |
| `meals` | `timestamp` | Descending |

You can create indexes from **Firestore → Indexes → Composite → Add index**.

---

## Step 5 — Enable Firebase Storage

1. In the left sidebar, click **Storage**.
2. Click **Get started**.
3. Select **Start in production mode**.
4. Choose the same location as your Firestore database.
5. Click **Done**.

### Deploy Storage Rules

1. Click the **Rules** tab.
2. Replace the default rules with the contents of `storage.rules` from this repository.
3. Click **Publish**.

The rules allow authenticated users to upload images up to 8 MB into their own `/users/{uid}/` path only.

---

## Step 6 — Add Authorised Domains

If you plan to host on GitHub Pages or any other domain, add it to the Firebase Auth authorised domain list:

1. Go to **Authentication → Settings → Authorised domains**.
2. Click **Add domain**.
3. Enter your domain (e.g. `yourusername.github.io`).
4. Click **Add**.

---

## Step 7 — Configure the Application

1. Open `js/firebase-config.js` in the repository.
2. Replace the placeholder values with your `firebaseConfig` values from Step 2:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "G-YOUR_MEASUREMENT_ID"   // optional
};
```

> **Note:** Firebase web API keys are designed to be public — they identify your project in the browser. Access control is enforced by Firebase Authentication and Firestore/Storage security rules, not by hiding the key. See the [official Firebase documentation](https://firebase.google.com/docs/projects/api-keys) for details.

---

## Step 8 — Restrict the API Key (Recommended)

To prevent your API key from being used on unauthorised domains:

1. Open [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2. Find your Firebase auto-generated API key (named **Browser key (auto created by Firebase)**).
3. Click the pencil (edit) icon.
4. Under **Application restrictions**, select **HTTP referrers (web sites)**.
5. Add your allowed referrers:
   - `http://localhost:*/*`
   - `https://yourusername.github.io/*`
   - Any other domain you deploy to
6. Click **Save**.

---

## Step 9 — Run the Application Locally

Because the app uses ES modules, it must be served over HTTP (not opened as a local `file://` URL).

**Option A — Python (no install required):**
```bash
cd GlucoGuard-T1D
python -m http.server 8080
# Then open: http://localhost:8080
```

**Option B — Node.js `serve`:**
```bash
npx serve .
# Then open the URL printed in the terminal
```

**Option C — VS Code Live Server extension:**
Right-click `index.html` → **Open with Live Server**.

---

## Step 10 — Deploy to GitHub Pages (Optional)

GlucoGuard-T1D is a static site — it deploys to GitHub Pages with no build step.

1. Push the repository to GitHub (see [GitHub Publication steps in README](../README.md#-github-upload-instructions)).
2. In the repository settings, go to **Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Choose `main` branch, `/ (root)` folder.
5. Click **Save**.
6. GitHub Pages will publish your site at `https://yourusername.github.io/GlucoGuard-T1D/`.
7. Add this URL as an authorised domain in Firebase Auth (Step 6 above).

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `auth/configuration-not-found` | Email/Password provider not enabled | Enable it in Authentication → Sign-in method |
| `Missing or insufficient permissions` | Firestore rules not deployed | Deploy `firestore.rules` from the Rules tab |
| Blank page, no errors | Opened `index.html` as `file://` URL | Use `python -m http.server 8080` instead |
| Login works but data doesn't save | Wrong `projectId` in config | Double-check `firebaseConfig.projectId` |
| Images don't upload | Storage rules not deployed | Deploy `storage.rules` from the Rules tab |
| `auth/api-key-not-valid` | API key restricted and domain not allowlisted | Add `localhost` and your domain to the API key referrers |

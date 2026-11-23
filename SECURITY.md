# Security Policy

## Medical Disclaimer

> **GlucoGuard-T1D is not a certified medical device.** It is a personal logging and educational tool. Do not make insulin dosing or treatment decisions based on information from this application. Always consult a qualified healthcare professional for medical advice.

---

## Supported Versions

| Version | Supported |
|---|---|
| v1.x (current) | ✅ Yes |

---

## Security Architecture

### Authentication

- User authentication is provided by **Firebase Authentication** using the Email/Password provider.
- Passwords are hashed and managed entirely by Firebase — the application never stores or transmits raw passwords.
- Session tokens are managed by the Firebase SDK and stored in browser `localStorage`.

### Data Isolation — Firestore Security Rules

Every user's data is stored under `/users/{uid}/` in Cloud Firestore.

The deployed security rules enforce **strict per-user isolation**:

```
// Users can ONLY read and write their own documents.
match /users/{uid} {
  allow read, write: if request.auth != null
                     && request.auth.uid == uid;
  match /{subcollection}/{docId} {
    allow read, write: if request.auth != null
                       && request.auth.uid == uid;
  }
}

// Everything else is denied.
match /{document=**} {
  allow read, write: if false;
}
```

No user can access another user's data, even if they know their UID.

### Storage Security Rules

Profile photos are stored under `/users/{uid}/` in Firebase Storage.

Rules enforce:
- Authenticated access only.
- UID in the path must match the authenticated user's UID.
- Maximum file size: **8 MB**.
- Allowed content types: **images only** (`image/*`).

### Firebase Web API Key

The `apiKey` value in `firebase-config.js` is a **Firebase web app identifier** — it is intentionally public (similar to a project ID). It does not grant administrative access.

Security for data access is enforced by:
1. **Firebase Authentication** — only signed-in users receive valid tokens.
2. **Firestore security rules** — data is scoped per authenticated UID.
3. **API key HTTP referrer restrictions** — restrict which domains can use the key (see [FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md#step-8--restrict-the-api-key-recommended)).

**Never commit** Firebase service-account JSON files or Admin SDK private keys — these grant unrestricted administrative access.

### Input Validation

Client-side validation is applied to all user inputs:
- Glucose readings: 1–600 mg/dL
- Insulin doses: 0.5–100 Units
- User age: 1–120
- Display name: 2+ characters
- File uploads: image MIME type, max 8 MB

> Note: Client-side validation is for user experience. Firestore security rules are the authoritative security boundary — they reject malformed or unauthorized writes regardless of client behaviour.

### XSS Prevention

All dynamic HTML content rendered from user data or Firestore is passed through the `escapeHtml()` utility in `ui.js`, which escapes `< > & " '` before inserting content into the DOM.

### Dependencies

The application has no npm runtime dependencies. CDN-loaded libraries are:
- **Chart.js 4.4.4** — loaded via jsDelivr CDN
- **Firebase SDK 9 (compat)** — loaded via Google's CDN

CDN integrity can be pinned using `integrity` attributes on `<script>` tags — recommended for production deployments.

---

## Reporting a Vulnerability

If you discover a security vulnerability in GlucoGuard-T1D, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Open a **private** GitHub issue (if the repository has private security reporting enabled), or email the repository owner directly.
3. Mark the issue title with `[SECURITY]`.
4. Include:
   - A description of the vulnerability.
   - Steps to reproduce.
   - Potential impact.
   - Suggested fix (if available).

We will acknowledge the report within 72 hours and work on a fix.

---

## Known Limitations

- No server-side session revocation (Firebase handles token expiry, but instant revocation is not implemented).
- No CSRF protection (not applicable to this pure-client architecture — all state changes go through Firebase Auth tokens, not cookies).
- No Content Security Policy (CSP) header (depends on hosting environment; recommended for production).
- Caregiver phone numbers entered in the profile UI are **not currently saved** (the SMS feature is unimplemented).

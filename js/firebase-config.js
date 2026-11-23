// js/firebase-config.js
// ---------------------------------------------------------------------------
// Firebase initialization for GlucoGuard-T1D.
//
// SETUP — before using this app, follow these steps:
//   1. Go to https://console.firebase.google.com and create a project.
//   2. Add a Web App to the project (the </> icon) and copy the config object
//      Firebase gives you into firebaseConfig below.
//   3. Enable Authentication > Sign-in method > Email/Password.
//   4. Create a Firestore database (production mode) and paste the rules
//      from firestore.rules into Firestore > Rules.
//   5. Enable Storage if you want food-image uploads persisted.
//
// IMPORTANT: Before publishing to GitHub, replace the values below with your
// own Firebase project config. See docs/FIREBASE_SETUP.md for full instructions.
// Never commit private service-account keys or .env files with real credentials.
//
// This file is imported by every page as a shared ES module.
// ---------------------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ---- REPLACE WITH YOUR OWN FIREBASE PROJECT CONFIG -------------------------
// Get this from: Firebase Console > Project Settings > Your Apps > Web App
const firebaseConfig = {
  apiKey: "AIzaSyBVS1LWDzGZBQ1qZ4fjDoSayK4QmY1jSoU",
  authDomain: "tiva-ba0c9.firebaseapp.com",
  projectId: "tiva-ba0c9",
  storageBucket: "tiva-ba0c9.firebasestorage.app",
  messagingSenderId: "686250677033",
  appId: "1:686250677033:web:ce4c8b02d9cadaa9c5dd38",
  measurementId: "G-9L1PFFPYC2"
};
// ----------------------------------------------------------------------------

let app, auth, db, storage, firebaseReady = true, firebaseInitError = null;

try {
  app     = initializeApp(firebaseConfig);
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);

  // Keep users logged in across browser tabs and refreshes
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Auth persistence error:", err);
  });
} catch (err) {
  // If the config is still placeholder values or the network is unreachable,
  // surface a friendly banner instead of a blank page.
  firebaseReady     = false;
  firebaseInitError = err;
  console.error("Firebase failed to initialize:", err);
}

export { app, auth, db, storage, firebaseReady, firebaseInitError };

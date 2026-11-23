// js/auth.js — real Firebase Authentication logic. No demo/fake auth here.

import { auth, db, firebaseReady } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PROTECTED_PAGES  = [
  "dashboard.html", "meals.html", "scan.html", "add.html",
  "history.html", "profile.html", "risk.html"
];
const PUBLIC_ONLY_PAGES = ["index.html", "login.html", "register.html", ""];

/**
 * Create a brand-new account: Firebase Auth user + Firestore profile document.
 * Throws the original Firebase error on failure so callers can show a
 * friendly message via ui.js's friendlyAuthError().
 */
export async function registerUser({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user       = credential.user;

  await updateProfile(user, { displayName: name });

  await setDoc(doc(db, "users", user.uid), {
    uid:                  user.uid,
    name,
    email,
    createdAt:            serverTimestamp(),
    onboardingComplete:   false,
    caregiver:            null,
    notificationPreference: "app",
    diabetesType:         "T1D"
  });

  return user;
}

/** Log in an existing user. Throws on invalid credentials. */
export async function loginUser({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Sign the current user out and send them back to the login page. */
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "login.html";
}

/** Send a password-reset email. */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/** Fetch the current user's Firestore profile document. */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Route guard — call this at the top of every page.
 *
 * - On protected pages: redirects to login.html if not authenticated.
 * - On public-only pages (landing/login/register): redirects already logged-in
 *   users straight to dashboard.html so they don't see the login form again.
 *
 * Calls onReady(user, ready) once auth state is known:
 *   user  — Firebase User object (or null if not signed in)
 *   ready — false only when Firebase itself failed to initialize
 */
export function guardPage(onReady) {
  const page = window.location.pathname.split("/").pop();

  if (!firebaseReady) {
    // Firebase itself is unavailable — don't silently let anyone through,
    // and don't leave the page blank either. Callers show a banner.
    onReady(null, false);
    return;
  }

  onAuthStateChanged(auth, (user) => {
    const isProtected  = PROTECTED_PAGES.includes(page);
    const isPublicOnly = PUBLIC_ONLY_PAGES.includes(page);

    if (!user && isProtected) {
      window.location.href = "login.html";
      return;
    }
    if (user && isPublicOnly && page !== "index.html") {
      window.location.href = "dashboard.html";
      return;
    }
    onReady(user, true);
  });
}

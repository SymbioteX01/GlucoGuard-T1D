// js/firestore.js — every function here requires a uid and only ever reads
// or writes under users/{uid}/... . No cross-user access is possible from
// the client, and Firestore security rules (see firestore.rules) enforce
// this server-side as well.

import { db } from "./firebase-config.js";
import {
  collection, doc, addDoc, updateDoc, setDoc, getDoc, getDocs,
  query, orderBy, limit, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/** Returns a reference to a user's subcollection. */
function userCol(uid, sub) {
  return collection(db, "users", uid, sub);
}

// ------------------------------------------------------------------ Glucose --

export async function addGlucoseLog(uid, { value, unit, context, timestamp }) {
  return addDoc(userCol(uid, "glucose_logs"), {
    value:     Number(value),
    unit,
    context,
    timestamp: timestamp ? Timestamp.fromDate(new Date(timestamp)) : serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

export async function getRecentGlucoseLogs(uid, maxResults = 20) {
  const q    = query(userCol(uid, "glucose_logs"), orderBy("timestamp", "desc"), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ------------------------------------------------------------------ Insulin --

export async function addInsulinLog(uid, { type, dose, mealAssociation, notes, timestamp }) {
  return addDoc(userCol(uid, "insulin_logs"), {
    type,
    dose:            Number(dose),
    mealAssociation: mealAssociation || null,
    notes:           notes || "",
    timestamp:       timestamp ? Timestamp.fromDate(new Date(timestamp)) : serverTimestamp(),
    createdAt:       serverTimestamp()
  });
}

export async function getRecentInsulinLogs(uid, maxResults = 20) {
  const q    = query(userCol(uid, "insulin_logs"), orderBy("timestamp", "desc"), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// -------------------------------------------------------------------- Meals --

export async function addMeal(uid, { items, totalCarbs, totalCalories, mealTime, mealType, source }) {
  return addDoc(userCol(uid, "meals"), {
    items,                                                    // [{ name, quantity, unit, carbs, calories }]
    totalCarbs:    Number(totalCarbs) || 0,
    totalCalories: totalCalories != null ? Number(totalCalories) : null,
    mealTime:      mealTime ? Timestamp.fromDate(new Date(mealTime)) : serverTimestamp(),
    mealType:      mealType || null,                          // 'breakfast'|'lunch'|'dinner'|'snack'|null
    source:        source || "manual",                        // 'manual' | 'scan'
    createdAt:     serverTimestamp()
  });
}

export async function getRecentMeals(uid, maxResults = 20) {
  const q    = query(userCol(uid, "meals"), orderBy("mealTime", "desc"), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ------------------------------------------------------- Risk predictions --

export async function saveRiskPrediction(uid, { level, score, reasons }) {
  return addDoc(userCol(uid, "risk_predictions"), {
    level, score, reasons,
    timestamp: serverTimestamp()
  });
}

export async function getRecentRiskPredictions(uid, maxResults = 10) {
  const q    = query(userCol(uid, "risk_predictions"), orderBy("timestamp", "desc"), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------------------------------------------------------------- Activity --

export async function addActivityLog(uid, { type, durationMinutes, intensity, timestamp }) {
  return addDoc(userCol(uid, "activity"), {
    type,
    durationMinutes: Number(durationMinutes) || 0,
    intensity:       intensity || "moderate",
    timestamp:       timestamp ? Timestamp.fromDate(new Date(timestamp)) : serverTimestamp()
  });
}

// --------------------------------------------------------------- Caregiver --

export async function saveCaregiver(uid, { name, phone, notificationPreference }) {
  return setDoc(doc(db, "users", uid, "caregiver", "profile"), {
    name:                   name || "",
    phone:                  phone || "",
    notificationPreference: notificationPreference || "app",
    updatedAt:              serverTimestamp()
  });
}

export async function getCaregiver(uid) {
  const snap = await getDoc(doc(db, "users", uid, "caregiver", "profile"));
  return snap.exists() ? snap.data() : null;
}

// ------------------------------------------------------------------ Profile --

export async function updateUserProfile(uid, data) {
  return updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}

// ---------------------------------------------------------------- Utilities --

/**
 * Filter an already-fetched array of Firestore documents to a time window.
 * @param {Array}  docs      Array of Firestore document objects
 * @param {string} field     The timestamp field name on each document
 * @param {string} windowKey 'today' | '7d' | '30d' | 'all'
 */
export function filterByWindow(docs, field, windowKey) {
  if (windowKey === "all") return docs;

  const now    = Date.now();
  const ranges = { today: 1000 * 60 * 60 * 24, "7d": 7 * 86400000, "30d": 30 * 86400000 };
  const ms     = ranges[windowKey];
  if (!ms) return docs;

  const cutoff = windowKey === "today"
    ? new Date().setHours(0, 0, 0, 0)
    : now - ms;

  return docs.filter((d) => {
    const t    = d[field];
    const date = t && t.toDate ? t.toDate() : (t ? new Date(t) : null);
    return date && date.getTime() >= cutoff;
  });
}

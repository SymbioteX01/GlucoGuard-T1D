// js/add.js — "Add" quick-action page: log glucose or insulin.
import { guardPage } from "./auth.js";
import { injectNav, checkFirebaseAvailability } from "./app.js";
import { addGlucoseLog, addInsulinLog } from "./firestore.js";
import {
  showToast,
  setButtonLoading,
  friendlyFirestoreError,
  showInlineError,
  clearInlineError
} from "./ui.js";

injectNav("add");
let currentUser = null;

function wireTabs() {
  const tabs   = document.querySelectorAll("[data-add-tab]");
  const panels = document.querySelectorAll("[data-add-panel]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t)   => t.classList.remove("tab-active"));
      panels.forEach((p) => p.classList.remove("panel-active"));
      tab.classList.add("tab-active");
      document.querySelector(`[data-add-panel="${tab.dataset.addTab}"]`).classList.add("panel-active");
    });
  });
}

function wireGlucoseForm() {
  const form = document.getElementById("glucose-form");
  if (!form) return;

  const errorEl = form.querySelector(".form-error") || null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) clearInlineError(errorEl);

    const btn       = form.querySelector("button[type=submit]");
    const rawValue  = document.getElementById("glucose-value").value;
    const unit      = document.getElementById("glucose-unit").value;
    const context   = document.getElementById("glucose-context").value;
    const timestamp = document.getElementById("glucose-timestamp").value;

    const numValue = Number(rawValue);

    // Validate glucose value
    if (!rawValue || numValue <= 0) {
      const msg = "Please enter a valid glucose value greater than zero.";
      if (errorEl) showInlineError(errorEl, msg);
      else showToast(msg, "error");
      return;
    }

    // Unit-specific upper-bound validation
    if (unit === "mmol/L" && numValue > 33) {
      const msg = "Glucose value seems too high for mmol/L (max 33). Please check and re-enter.";
      if (errorEl) showInlineError(errorEl, msg);
      else showToast(msg, "error");
      return;
    }
    if (unit !== "mmol/L" && numValue > 600) {
      const msg = "Glucose value seems too high for mg/dL (max 600). Please check and re-enter.";
      if (errorEl) showInlineError(errorEl, msg);
      else showToast(msg, "error");
      return;
    }

    setButtonLoading(btn, true, "Saving\u2026");
    try {
      await addGlucoseLog(currentUser.uid, {
        value: numValue,
        unit,
        context,
        timestamp: timestamp || null
      });
      showToast("Glucose reading saved.", "success");
      form.reset();
      // Redirect to dashboard after a short delay so the user sees the toast.
      setTimeout(() => { window.location.href = "dashboard.html"; }, 1200);
    } catch (err) {
      console.error(err);
      showToast(friendlyFirestoreError(err), "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

function wireInsulinForm() {
  const form = document.getElementById("insulin-form");
  if (!form) return;

  const errorEl = form.querySelector(".form-error") || null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) clearInlineError(errorEl);

    const btn             = form.querySelector("button[type=submit]");
    const type            = document.getElementById("insulin-type").value;
    const rawDose         = document.getElementById("insulin-dose").value;
    const mealAssociation = document.getElementById("insulin-meal").value;
    const notes           = document.getElementById("insulin-notes").value;
    const timestamp       = document.getElementById("insulin-timestamp").value;

    const numDose = Number(rawDose);

    // Validate insulin dose
    if (!rawDose || numDose <= 0) {
      const msg = "Please enter a valid insulin dose greater than zero.";
      if (errorEl) showInlineError(errorEl, msg);
      else showToast(msg, "error");
      return;
    }
    if (numDose < 0.5) {
      const msg = "Insulin dose must be at least 0.5 units.";
      if (errorEl) showInlineError(errorEl, msg);
      else showToast(msg, "error");
      return;
    }
    if (numDose > 100) {
      const msg = "Insulin dose cannot exceed 100 units. Please verify before saving.";
      if (errorEl) showInlineError(errorEl, msg);
      else showToast(msg, "error");
      return;
    }

    setButtonLoading(btn, true, "Saving\u2026");
    try {
      await addInsulinLog(currentUser.uid, {
        type,
        dose: numDose,
        mealAssociation,
        notes,
        timestamp: timestamp || null
      });
      showToast("Insulin dose saved.", "success");
      form.reset();
      // Redirect to dashboard after a short delay so the user sees the toast.
      setTimeout(() => { window.location.href = "dashboard.html"; }, 1200);
    } catch (err) {
      console.error(err);
      showToast(friendlyFirestoreError(err), "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

guardPage((user, ready) => {
  if (!ready) { checkFirebaseAvailability(); return; }
  if (!user) return;
  currentUser = user;
  wireTabs();
  wireGlucoseForm();
  wireInsulinForm();
});

// js/profile.js — User profile and caregiver settings page.
import { guardPage, getUserProfile, logoutUser } from "./auth.js";
import { injectNav, checkFirebaseAvailability } from "./app.js";
import { updateUserProfile, saveCaregiver, getCaregiver } from "./firestore.js";
import { showToast, setButtonLoading, friendlyFirestoreError, showInlineError, clearInlineError } from "./ui.js";

injectNav("profile");
let currentUser = null;

async function loadProfile() {
  document.getElementById("profile-email").textContent = currentUser.email;
  document.getElementById("profile-name-input").value  = currentUser.displayName || "";

  try {
    const [profile, caregiver] = await Promise.all([
      getUserProfile(currentUser.uid),
      getCaregiver(currentUser.uid)
    ]);
    if (profile && profile.age) {
      document.getElementById("profile-age-input").value = profile.age;
    }
    if (caregiver) {
      document.getElementById("caregiver-name-input").value         = caregiver.name || "";
      document.getElementById("caregiver-phone-input").value        = caregiver.phone || "";
      document.getElementById("caregiver-notify-select").value      = caregiver.notificationPreference || "app";
    }
  } catch (err) {
    console.error(err);
    showToast(friendlyFirestoreError(err), "error");
  }
}

function wireProfileForm() {
  const form    = document.getElementById("profile-form");
  const errorEl = form ? form.querySelector(".form-error") : null;

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) clearInlineError(errorEl);

    const btn  = form.querySelector("button[type=submit]");
    const name = document.getElementById("profile-name-input").value.trim();
    const age  = document.getElementById("profile-age-input").value;

    // Validate: name must not be empty
    if (!name) {
      const msg = "Name cannot be empty. Please enter your name.";
      if (errorEl) showInlineError(errorEl, msg);
      else showToast(msg, "error");
      return;
    }

    // Validate: age must be between 1 and 120 when provided
    if (age !== "" && age !== null) {
      const ageNum = Number(age);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        const msg = "Age must be a whole number between 1 and 120.";
        if (errorEl) showInlineError(errorEl, msg);
        else showToast(msg, "error");
        return;
      }
    }

    setButtonLoading(btn, true, "Saving\u2026");
    try {
      await updateUserProfile(currentUser.uid, { name, age: age ? Number(age) : null });
      showToast("Profile updated.", "success");
    } catch (err) {
      console.error(err);
      showToast(friendlyFirestoreError(err), "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

function wireCaregiverForm() {
  const form = document.getElementById("caregiver-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn                 = form.querySelector("button[type=submit]");
    const name                = document.getElementById("caregiver-name-input").value.trim();
    const phone               = document.getElementById("caregiver-phone-input").value.trim();
    const notificationPreference = document.getElementById("caregiver-notify-select").value;

    setButtonLoading(btn, true, "Saving\u2026");
    try {
      await saveCaregiver(currentUser.uid, { name, phone, notificationPreference });
      showToast("Caregiver info saved.", "success");
    } catch (err) {
      console.error(err);
      showToast(friendlyFirestoreError(err), "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

function wireLogout() {
  const btn = document.getElementById("profile-logout-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      try { await logoutUser(); } catch (e) { console.error(e); }
    });
  }
}

guardPage((user, ready) => {
  if (!ready) { checkFirebaseAvailability(); return; }
  if (!user) return;
  currentUser = user;
  loadProfile();
  wireProfileForm();
  wireCaregiverForm();
  wireLogout();
});

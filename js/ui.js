// js/ui.js — shared UI helpers used across all pages.

/** Show a transient toast notification. type: 'success' | 'error' | 'info' */
export function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${iconFor(type)}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-visible"));
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function iconFor(type) {
  if (type === "success") return "\u2713"; // ✓ checkmark
  if (type === "error")   return "\u26A0"; // ⚠ warning
  return "\u2139";                          // ℹ information
}

/** Render a full-page-safe banner when Firebase itself failed to init. */
export function showFirebaseUnavailableBanner(reason = "") {
  const banner = document.createElement("div");
  banner.className = "global-banner global-banner-error";
  banner.innerHTML = `
    <strong>Connection problem.</strong>
    We can't reach the GlucoGuard backend right now. Some features may not work
    until this is resolved. ${reason ? `<span class="banner-detail">(${escapeHtml(reason)})</span>` : ""}
  `;
  document.body.prepend(banner);
}

/** Render an inline error message inside a given container element. */
export function showInlineError(container, message) {
  if (!container) return;
  container.textContent = message;
  container.classList.add("visible");
}

export function clearInlineError(container) {
  if (!container) return;
  container.textContent = "";
  container.classList.remove("visible");
}

/** Toggle a button into a loading state (spinner + disabled) and back. */
export function setButtonLoading(button, isLoading, loadingText = "Please wait\u2026") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.dataset.originalText || button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
  }
}

/** Friendly translation of common Firebase Auth error codes. */
export function friendlyAuthError(error) {
  const code = error && error.code ? error.code : "";
  const map = {
    "auth/email-already-in-use": "That email already has an account. Try logging in instead.",
    "auth/invalid-email":        "That doesn't look like a valid email address.",
    "auth/weak-password":        "Please choose a password with at least 6 characters.",
    "auth/user-not-found":       "No account found with that email.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/invalid-credential":   "Incorrect email or password.",
    "auth/too-many-requests":    "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/user-disabled":        "This account has been disabled. Contact support."
  };
  return map[code] || "Something went wrong. Please try again.";
}

/** Friendly translation of common Firestore error codes. */
export function friendlyFirestoreError(error) {
  const code = error && error.code ? error.code : "";
  const map = {
    "permission-denied": "You don't have permission to access this data.",
    "unavailable":       "The database is temporarily unavailable. Please try again shortly.",
    "not-found":         "That record couldn't be found."
  };
  return map[code] || "We couldn't save/load your data right now. Please try again.";
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

/**
 * Format a date/time value with relative time for recent events:
 *   - Under 1 minute  : "just now"
 *   - Under 60 minutes: "X min ago"
 *   - Under 24 hours  : "X hours ago"
 *   - Older           : absolute locale date/time string
 */
export function formatDateTime(date) {
  if (!date) return "\u2014";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "\u2014";

  const nowMs  = Date.now();
  const diffMs = nowMs - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);

  if (diffMs >= 0) {
    // Past events
    if (diffSec < 60)  return "just now";
    if (diffMin < 60)  return `${diffMin} min ago`;
    if (diffHr  < 24)  return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  }

  // Fallback: absolute date/time
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

/**
 * Returns just the relative time string for a given date.
 * Mirrors the relative logic of formatDateTime without an absolute fallback.
 */
export function formatRelativeTime(date) {
  if (!date) return "\u2014";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "\u2014";

  const diffMs  = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr  / 24);

  if (diffSec < 0)   return "in the future";
  if (diffSec < 60)  return "just now";
  if (diffMin < 60)  return `${diffMin} min ago`;
  if (diffHr  < 24)  return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

/**
 * Renders skeleton loading placeholder rows into a container element.
 * @param {Element} container - DOM element to fill with skeletons.
 * @param {number}  count     - Number of skeleton rows to render.
 */
export function renderSkeletonList(container, count = 4) {
  if (!container) return;
  const rows = Array.from({ length: count }, () => `
    <div class="skeleton-row" aria-hidden="true">
      <div class="skeleton skeleton-icon"></div>
      <div class="skeleton-lines">
        <div class="skeleton skeleton-line skeleton-line-primary"></div>
        <div class="skeleton skeleton-line skeleton-line-secondary"></div>
      </div>
    </div>
  `).join("");
  container.innerHTML = rows;
}

export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Simple mobile bottom-nav + desktop sidenav active-state highlighter. */
export function highlightActiveNav(pageName) {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.classList.toggle("nav-active", el.dataset.nav === pageName);
  });
}

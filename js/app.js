// js/app.js — shared bootstrap included on every page: injects nav,
// wires the logout button, and shows a banner if Firebase is unreachable.

import { firebaseReady, firebaseInitError } from "./firebase-config.js";
import { logoutUser } from "./auth.js";
import { showFirebaseUnavailableBanner, highlightActiveNav } from "./ui.js";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "home"    },
  { key: "meals",     label: "Meals",     href: "meals.html",     icon: "meal"    },
  { key: "scan",      label: "Scan",      href: "scan.html",      icon: "scan"    },
  { key: "add",       label: "Add",       href: "add.html",       icon: "plus"    },
  { key: "history",   label: "History",   href: "history.html",   icon: "history" },
  { key: "risk",      label: "Risk",      href: "risk.html",      icon: "risk"    },
  { key: "profile",   label: "Profile",   href: "profile.html",   icon: "profile" }
];

const ICONS = {
  home:    '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  meal:    '<path d="M6 3v7a2 2 0 0 0 4 0V3"/><path d="M8 10v11"/><path d="M17 3c-1.5 0-3 1.5-3 4s1.5 4 3 4v10"/>',
  scan:    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/>',
  plus:    '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  risk:    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 6-6 8-6s6.5 2 8 6"/>',
  logout:  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
};

function svgIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

export function injectNav(activePage) {
  const mount = document.getElementById("app-nav");
  if (!mount) return;

  const items = NAV_ITEMS.map(
    (item) => `
      <a href="${item.href}" class="nav-item" data-nav="${item.key}">
        <span class="nav-icon">${svgIcon(item.icon)}</span>
        <span class="nav-label">${item.label}</span>
      </a>`
  ).join("");

  mount.innerHTML = `
    <nav class="sidenav" aria-label="Primary">
      <div class="sidenav-brand">
        <span class="brand-mark">GG</span>
        <span class="brand-text">GlucoGuard<span class="brand-accent">-T1D</span></span>
      </div>
      <div class="sidenav-items">${items}</div>
      <button class="sidenav-logout" id="logout-btn" type="button">
        <span class="nav-icon">${svgIcon("logout")}</span> Log out
      </button>
    </nav>
    <nav class="bottomnav" aria-label="Primary mobile">
      ${items}
    </nav>
  `;

  highlightActiveNav(activePage);

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try { await logoutUser(); } catch (e) { console.error(e); window.location.href = "login.html"; }
    });
  }
}

export function checkFirebaseAvailability() {
  if (!firebaseReady) {
    showFirebaseUnavailableBanner(firebaseInitError ? firebaseInitError.message : "");
  }
  return firebaseReady;
}

// js/scan-page.js — UI wiring for scan.html. Kept separate from scan.js so
// that scan.js remains a pure, isolated recognition module.

import { guardPage } from "./auth.js";
import { injectNav, checkFirebaseAvailability } from "./app.js";
import { recognizeFood, previewImage, setupDragAndDrop } from "./scan.js";
import { addMeal } from "./firestore.js";
import { searchFood, getFoodById } from "./food-database.js";
import { showToast, setButtonLoading, escapeHtml, friendlyFirestoreError } from "./ui.js";

let currentUser    = null;
let confirmedItems = []; // items the user has accepted after (optionally) correcting predictions

injectNav("scan");

// ── Fallback / prediction rendering ─────────────────────────────────────────

function showFallback(message) {
  const fallbackEl = document.getElementById("scan-fallback");
  const msgEl      = document.getElementById("scan-fallback-message");
  const predsEl    = document.getElementById("scan-predictions");

  if (fallbackEl) fallbackEl.style.display = "block";
  if (msgEl)      msgEl.textContent = message;
  if (predsEl)    predsEl.style.display = "none";

  // Show inline manual food search in the fallback area
  renderInlineSearch();
}

function renderInlineSearch() {
  const manualLink = document.getElementById("manual-search-link");
  if (!manualLink) return;

  manualLink.innerHTML = `
    <div style="margin-top:16px;">
      <div style="font-weight:600; font-size:13.5px; margin-bottom:8px;">Search food manually:</div>
      <div class="field"><input type="text" id="inline-food-search" placeholder="Try roti, dal, dosa…" /></div>
      <ul id="inline-food-results" style="max-height:220px; overflow:auto;"></ul>
    </div>
  `;

  const searchInput = document.getElementById("inline-food-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const results = searchFood(searchInput.value);
      const list    = document.getElementById("inline-food-results");
      if (!list) return;
      list.innerHTML = results.slice(0, 10).map((f) => `
        <li class="food-result-row">
          <div>
            <div class="list-row-title">${escapeHtml(f.name)}</div>
            <div class="list-row-sub">${f.carbsPerUnit}g carbs / ${f.unit}</div>
          </div>
          <button class="btn btn-small btn-outline" data-inline-food-id="${f.id}" type="button">Add</button>
        </li>
      `).join("");

      list.querySelectorAll("[data-inline-food-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const food = getFoodById(btn.dataset.inlineFoodId);
          if (!food) return;
          confirmedItems.push({ ...food, quantity: 1 });
          renderConfirmed();
          showToast(`Added ${food.name}. Verify before logging insulin.`, "info");
        });
      });
    });
  }
}

function showPredictions(predictions) {
  const fallbackEl  = document.getElementById("scan-fallback");
  const container   = document.getElementById("scan-predictions");
  if (fallbackEl) fallbackEl.style.display = "none";
  if (!container) return;

  container.style.display = "block";
  container.innerHTML = `
    <p class="ai-disclaimer">AI estimate — verify before using for insulin decisions.</p>
    ${predictions.map((p, idx) => `
      <div class="prediction-row">
        <div>
          <div class="list-row-title">${escapeHtml(p.label)}</div>
          <div class="list-row-sub">Confidence: ${(p.confidence * 100).toFixed(0)}%</div>
        </div>
        <button class="btn btn-small btn-outline" type="button" data-accept="${idx}">
          ${p.matchedFood ? "Use this" : "No match — search manually"}
        </button>
      </div>
    `).join("")}
  `;

  container.querySelectorAll("[data-accept]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pred = predictions[Number(btn.dataset.accept)];
      if (pred && pred.matchedFood) {
        confirmedItems.push({ ...pred.matchedFood, quantity: 1 });
        renderConfirmed();
        showToast(`Added ${pred.matchedFood.name}. Please verify before logging insulin.`, "info");
      } else {
        // Scroll to manual search area
        const ms = document.getElementById("manual-search-link");
        if (ms) ms.scrollIntoView({ behavior: "smooth" });
        renderInlineSearch();
      }
    });
  });
}

function renderConfirmed() {
  const list    = document.getElementById("confirmed-items");
  const saveBtn = document.getElementById("save-scan-meal-btn");
  if (!confirmedItems.length) {
    if (list) list.innerHTML = `<li class="empty-state">No items confirmed yet.</li>`;
    if (saveBtn) saveBtn.disabled = true;
    return;
  }
  if (saveBtn) saveBtn.disabled = false;
  if (list) {
    list.innerHTML = confirmedItems.map((i, idx) => `
      <li class="list-row">
        <div class="list-row-title">${escapeHtml(i.name)}</div>
        <div class="list-row-value">${i.carbsPerUnit * (i.quantity || 1)}g</div>
        <button class="remove-btn" type="button" data-remove="${idx}" aria-label="Remove">✕</button>
      </li>
    `).join("");

    list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        confirmedItems.splice(Number(btn.dataset.remove), 1);
        renderConfirmed();
      });
    });
  }
}

// ── Image handling ───────────────────────────────────────────────────────────

async function handleImageSelected(file) {
  if (!file) return;

  // Client-side validation
  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file (JPG or PNG).", "error");
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showToast("File too large. Maximum size is 8 MB.", "error");
    return;
  }

  const previewEl = document.getElementById("scan-image-preview");
  try {
    const dataUrl       = await previewImage(file);
    if (previewEl) { previewEl.src = dataUrl; previewEl.style.display = "block"; }
  } catch (err) {
    showToast("Could not preview that image.", "error");
    return;
  }

  const statusEl = document.getElementById("scan-status");
  if (statusEl) statusEl.textContent = "Analyzing image…";

  const result = await recognizeFood(file);
  if (statusEl) statusEl.textContent = "";

  if (!result.ok) {
    showFallback(result.fallbackReason || "Food recognition unavailable. Search and select food manually.");
    return;
  }
  showPredictions(result.predictions);
}

// ── Save scanned meal ────────────────────────────────────────────────────────

async function saveScanMeal() {
  const saveBtn = document.getElementById("save-scan-meal-btn");
  if (!confirmedItems.length) return;

  setButtonLoading(saveBtn, true, "Saving…");
  try {
    const totalCarbs    = confirmedItems.reduce((s, i) => s + i.carbsPerUnit * (i.quantity || 1), 0);
    const totalCalories = confirmedItems.reduce((s, i) => s + (i.caloriesPerUnit || 0) * (i.quantity || 1), 0);
    await addMeal(currentUser.uid, {
      items: confirmedItems.map((i) => ({
        name: i.name, quantity: i.quantity || 1, unit: i.unit,
        carbs: i.carbsPerUnit * (i.quantity || 1), calories: i.caloriesPerUnit * (i.quantity || 1)
      })),
      totalCarbs, totalCalories, mealTime: new Date(), source: "scan"
    });
    showToast("Meal saved from scan.", "success");
    confirmedItems = [];
    renderConfirmed();
    const predsEl   = document.getElementById("scan-predictions");
    const previewEl = document.getElementById("scan-image-preview");
    if (predsEl)   predsEl.style.display   = "none";
    if (previewEl) previewEl.style.display = "none";
  } catch (err) {
    console.error(err);
    showToast(friendlyFirestoreError(err), "error");
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

// ── Page bootstrap ───────────────────────────────────────────────────────────

guardPage((user, ready) => {
  if (!ready) { checkFirebaseAvailability(); return; }
  if (!user) return;
  currentUser = user;
  renderConfirmed();

  // Wire file input
  const fileInput = document.getElementById("scan-file-input");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => handleImageSelected(e.target.files[0]));
  }

  // Wire drag-and-drop on the dropzone label
  const dropzone = document.querySelector(".scan-dropzone");
  if (dropzone && fileInput) {
    setupDragAndDrop(dropzone, fileInput, handleImageSelected);
  }

  // Wire save button
  const saveBtn = document.getElementById("save-scan-meal-btn");
  if (saveBtn) saveBtn.addEventListener("click", saveScanMeal);

  // Wire manual search redirect button
  const manualBtn = document.getElementById("go-manual-search-btn");
  if (manualBtn) manualBtn.addEventListener("click", () => { window.location.href = "meals.html"; });
});

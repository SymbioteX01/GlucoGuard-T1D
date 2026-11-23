// js/meals.js
import { guardPage } from "./auth.js";
import { injectNav, checkFirebaseAvailability } from "./app.js";
import { addMeal, getRecentMeals } from "./firestore.js";
import { searchFood, getFoodById } from "./food-database.js";
import { showToast, setButtonLoading, formatDateTime, escapeHtml, friendlyFirestoreError } from "./ui.js";

injectNav("meals");

let currentUser   = null;
let selectedItems = []; // [{ id, name, unit, quantity, carbsPerUnit, caloriesPerUnit }]

/** Simple debounce utility. */
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function renderSearchResults(items) {
  const list = document.getElementById("food-results");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = `<li class="empty-state">No foods matched. Try another search term.</li>`;
    return;
  }
  list.innerHTML = items.map((f) => `
    <li class="food-result-row">
      <div>
        <div class="list-row-title">${escapeHtml(f.name)}</div>
        <div class="list-row-sub">${f.carbsPerUnit}g carbs / ${f.unit} · ${f.category}</div>
      </div>
      <button class="btn btn-small btn-outline" data-food-id="${f.id}" type="button">Add</button>
    </li>
  `).join("");

  list.querySelectorAll("[data-food-id]").forEach((btn) => {
    btn.addEventListener("click", () => addSelectedFood(btn.dataset.foodId));
  });
}

function addSelectedFood(foodId) {
  const food = getFoodById(foodId);
  if (!food) return;

  const existing = selectedItems.find((i) => i.id === food.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    selectedItems.push({
      id: food.id, name: food.name, unit: food.unit, quantity: 1,
      carbsPerUnit: food.carbsPerUnit, caloriesPerUnit: food.caloriesPerUnit
    });
  }
  renderSelectedItems();
}

function renderSelectedItems() {
  const container = document.getElementById("selected-items");
  const totalsEl  = document.getElementById("meal-totals");
  if (!container) return;

  if (!selectedItems.length) {
    container.innerHTML = `<li class="empty-state">No foods added yet. Search above to add items.</li>`;
    if (totalsEl) totalsEl.textContent = "";
    return;
  }

  container.innerHTML = selectedItems.map((item, idx) => `
    <li class="selected-item-row">
      <div class="list-row-title">${escapeHtml(item.name)}</div>
      <div class="qty-stepper">
        <button type="button" data-action="dec" data-idx="${idx}">−</button>
        <span>${item.quantity} ${item.unit}${item.quantity > 1 ? "s" : ""}</span>
        <button type="button" data-action="inc" data-idx="${idx}">+</button>
      </div>
      <div class="list-row-value">${item.carbsPerUnit * item.quantity}g</div>
      <button class="remove-btn" type="button" data-action="remove" data-idx="${idx}" aria-label="Remove">✕</button>
    </li>
  `).join("");

  const totalCarbs    = selectedItems.reduce((s, i) => s + i.carbsPerUnit * i.quantity, 0);
  const totalCalories = selectedItems.reduce((s, i) => s + (i.caloriesPerUnit || 0) * i.quantity, 0);
  if (totalsEl) totalsEl.innerHTML = `<strong>${totalCarbs}g</strong> total carbs · ${totalCalories} kcal`;

  container.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx    = Number(btn.dataset.idx);
      const action = btn.dataset.action;
      if (action === "inc")    selectedItems[idx].quantity += 1;
      if (action === "dec")    selectedItems[idx].quantity = Math.max(1, selectedItems[idx].quantity - 1);
      if (action === "remove") selectedItems.splice(idx, 1);
      renderSelectedItems();
    });
  });
}

async function saveCurrentMeal() {
  const saveBtn = document.getElementById("save-meal-btn");
  if (!selectedItems.length) {
    showToast("Add at least one food item first.", "error");
    return;
  }

  const mealTimeInput = document.getElementById("meal-time");
  const mealTypeInput = document.getElementById("meal-type-select");
  const totalCarbs    = selectedItems.reduce((s, i) => s + i.carbsPerUnit * i.quantity, 0);
  const totalCalories = selectedItems.reduce((s, i) => s + (i.caloriesPerUnit || 0) * i.quantity, 0);

  setButtonLoading(saveBtn, true, "Saving…");
  try {
    await addMeal(currentUser.uid, {
      items: selectedItems.map((i) => ({
        name: i.name, quantity: i.quantity, unit: i.unit,
        carbs: i.carbsPerUnit * i.quantity, calories: i.caloriesPerUnit * i.quantity
      })),
      totalCarbs,
      totalCalories,
      mealTime: mealTimeInput && mealTimeInput.value ? mealTimeInput.value : new Date(),
      mealType: mealTypeInput && mealTypeInput.value ? mealTypeInput.value : null,
      source:   "manual"
    });
    showToast("Meal saved.", "success");
    selectedItems = [];
    renderSelectedItems();
    loadRecentMeals();
  } catch (err) {
    console.error(err);
    showToast(friendlyFirestoreError(err), "error");
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

async function loadRecentMeals() {
  const list = document.getElementById("meal-history-list");
  if (!list) return;
  try {
    const meals = await getRecentMeals(currentUser.uid, 15);
    if (!meals.length) {
      list.innerHTML = `<li class="empty-state">No meals logged yet.</li>`;
      return;
    }
    list.innerHTML = meals.map((m) => {
      const dt = m.mealTime && m.mealTime.toDate ? m.mealTime.toDate() : new Date(m.mealTime);
      return `
        <li class="list-row">
          <div>
            <div class="list-row-title">${escapeHtml((m.items || []).map((i) => i.name).join(", ") || "Meal")}</div>
            <div class="list-row-sub">${formatDateTime(dt)}${m.mealType ? ` · ${escapeHtml(m.mealType)}` : ""}${m.source === "scan" ? " · via Scan" : ""}</div>
          </div>
          <div class="list-row-value">${m.totalCarbs}g</div>
        </li>`;
    }).join("");
  } catch (err) {
    console.error(err);
    showToast(friendlyFirestoreError(err), "error");
  }
}

function wireSearch() {
  const input = document.getElementById("food-search-input");
  if (!input) return;
  renderSearchResults(searchFood(""));
  input.addEventListener("input", debounce(() => renderSearchResults(searchFood(input.value)), 150));
}

guardPage((user, ready) => {
  if (!ready) { checkFirebaseAvailability(); return; }
  if (!user) return;
  currentUser = user;
  wireSearch();
  renderSelectedItems();
  loadRecentMeals();

  const saveBtn = document.getElementById("save-meal-btn");
  if (saveBtn) saveBtn.addEventListener("click", saveCurrentMeal);
});

// js/food-database.js
// A curated carbohydrate/calorie reference for common Indian foods.
// Values are approximate per the stated typical serving unit, based on
// standard Indian food composition references (IFCT-style estimates).
// These are ESTIMATES for decision support — not lab-verified nutrition facts.

export const FOOD_DATABASE = [
  // ── Grains ─────────────────────────────────────────────────────────────────
  { id: "roti",         name: "Roti / Chapati (medium)",      unit: "piece",   carbsPerUnit: 15, caloriesPerUnit: 71,  category: "Grains" },
  { id: "rice",         name: "Cooked Rice",                   unit: "cup",     carbsPerUnit: 45, caloriesPerUnit: 205, category: "Grains" },
  { id: "paratha",      name: "Paratha (plain, medium)",       unit: "piece",   carbsPerUnit: 27, caloriesPerUnit: 210, category: "Grains" },
  { id: "puri",         name: "Puri (deep-fried bread)",       unit: "piece",   carbsPerUnit: 18, caloriesPerUnit: 95,  category: "Grains" },
  { id: "bhatura",      name: "Bhatura",                       unit: "piece",   carbsPerUnit: 42, caloriesPerUnit: 315, category: "Grains" },
  { id: "aloo-paratha", name: "Aloo Paratha (stuffed)",        unit: "piece",   carbsPerUnit: 36, caloriesPerUnit: 280, category: "Grains" },
  { id: "naan",         name: "Naan (plain, medium)",          unit: "piece",   carbsPerUnit: 38, caloriesPerUnit: 262, category: "Grains" },

  // ── Breakfast ──────────────────────────────────────────────────────────────
  { id: "poha",         name: "Poha",                          unit: "cup",     carbsPerUnit: 27, caloriesPerUnit: 158, category: "Breakfast" },
  { id: "upma",         name: "Upma",                          unit: "cup",     carbsPerUnit: 30, caloriesPerUnit: 220, category: "Breakfast" },
  { id: "idli",         name: "Idli (medium)",                 unit: "piece",   carbsPerUnit: 12, caloriesPerUnit: 39,  category: "Breakfast" },
  { id: "dosa",         name: "Plain Dosa",                    unit: "piece",   carbsPerUnit: 29, caloriesPerUnit: 168, category: "Breakfast" },
  { id: "masala-dosa",  name: "Masala Dosa",                   unit: "piece",   carbsPerUnit: 45, caloriesPerUnit: 280, category: "Breakfast" },
  { id: "uttapam",      name: "Uttapam (medium)",              unit: "piece",   carbsPerUnit: 30, caloriesPerUnit: 185, category: "Breakfast" },
  { id: "vada",         name: "Medu Vada (piece)",             unit: "piece",   carbsPerUnit: 12, caloriesPerUnit: 97,  category: "Breakfast" },

  // ── Lentils ────────────────────────────────────────────────────────────────
  { id: "dal",          name: "Dal (cooked, any variety)",     unit: "cup",     carbsPerUnit: 20, caloriesPerUnit: 198, category: "Lentils" },
  { id: "chana-dal",    name: "Chana Dal",                     unit: "cup",     carbsPerUnit: 29, caloriesPerUnit: 215, category: "Lentils" },
  { id: "moong-dal",    name: "Moong Dal",                     unit: "cup",     carbsPerUnit: 25, caloriesPerUnit: 212, category: "Lentils" },

  // ── Main Course ────────────────────────────────────────────────────────────
  { id: "pavbhaji",     name: "Pav Bhaji (1 pav + bhaji)",     unit: "plate",   carbsPerUnit: 55, caloriesPerUnit: 400, category: "Main Course" },
  { id: "biryani",      name: "Biryani (veg or chicken)",      unit: "cup",     carbsPerUnit: 43, caloriesPerUnit: 350, category: "Main Course" },
  { id: "khichdi",      name: "Khichdi",                       unit: "cup",     carbsPerUnit: 35, caloriesPerUnit: 250, category: "Main Course" },

  // ── Curries ────────────────────────────────────────────────────────────────
  { id: "rajma",        name: "Rajma (kidney bean curry)",     unit: "cup",     carbsPerUnit: 40, caloriesPerUnit: 240, category: "Curries" },
  { id: "chole",        name: "Chole (chickpea curry)",        unit: "cup",     carbsPerUnit: 45, caloriesPerUnit: 269, category: "Curries" },
  { id: "paneer",       name: "Paneer Sabzi",                  unit: "cup",     carbsPerUnit: 6,  caloriesPerUnit: 265, category: "Curries" },
  { id: "matar-paneer", name: "Matar Paneer",                  unit: "cup",     carbsPerUnit: 18, caloriesPerUnit: 290, category: "Curries" },
  { id: "palak-paneer", name: "Palak Paneer",                  unit: "cup",     carbsPerUnit: 12, caloriesPerUnit: 268, category: "Curries" },
  { id: "sambhar",      name: "Sambhar",                       unit: "cup",     carbsPerUnit: 18, caloriesPerUnit: 130, category: "Curries" },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  { id: "vegetables",   name: "Mixed Vegetable Sabzi",         unit: "cup",     carbsPerUnit: 12, caloriesPerUnit: 110, category: "Vegetables" },
  { id: "aloo-sabzi",   name: "Aloo Sabzi",                    unit: "cup",     carbsPerUnit: 22, caloriesPerUnit: 180, category: "Vegetables" },

  // ── Snacks ─────────────────────────────────────────────────────────────────
  { id: "samosa",       name: "Samosa (medium)",               unit: "piece",   carbsPerUnit: 24, caloriesPerUnit: 262, category: "Snacks" },
  { id: "dhokla",       name: "Dhokla (2 pieces)",             unit: "serving", carbsPerUnit: 20, caloriesPerUnit: 145, category: "Snacks" },

  // ── Sweets ─────────────────────────────────────────────────────────────────
  { id: "jalebi",       name: "Jalebi (2 pieces)",             unit: "serving", carbsPerUnit: 50, caloriesPerUnit: 310, category: "Sweets" },
  { id: "gulab-jamun",  name: "Gulab Jamun (1 piece)",         unit: "piece",   carbsPerUnit: 20, caloriesPerUnit: 175, category: "Sweets" },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  { id: "fruit-banana", name: "Banana (medium)",               unit: "piece",   carbsPerUnit: 27, caloriesPerUnit: 105, category: "Fruits" },
  { id: "fruit-apple",  name: "Apple (medium)",                unit: "piece",   carbsPerUnit: 25, caloriesPerUnit: 95,  category: "Fruits" },
  { id: "fruit-mango",  name: "Mango (medium)",                unit: "piece",   carbsPerUnit: 50, caloriesPerUnit: 202, category: "Fruits" },

  // ── Dairy ──────────────────────────────────────────────────────────────────
  { id: "milk",         name: "Milk",                          unit: "cup",     carbsPerUnit: 12, caloriesPerUnit: 149, category: "Dairy" },
  { id: "curd",         name: "Curd / Yogurt",                 unit: "cup",     carbsPerUnit: 11, caloriesPerUnit: 138, category: "Dairy" },

  // ── Drinks ─────────────────────────────────────────────────────────────────
  { id: "lassi-sweet",  name: "Lassi (sweet, 1 glass)",        unit: "glass",   carbsPerUnit: 32, caloriesPerUnit: 220, category: "Drinks" },
];

/**
 * Search the food database by name, id, or category.
 * Returns all foods if query is empty.
 */
export function searchFood(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return FOOD_DATABASE;
  return FOOD_DATABASE.filter(
    (f) => f.name.toLowerCase().includes(q) || f.id.includes(q) || f.category.toLowerCase().includes(q)
  );
}

/** Look up a food by its unique id. Returns null if not found. */
export function getFoodById(id) {
  return FOOD_DATABASE.find((f) => f.id === id) || null;
}

/**
 * Best-effort fuzzy match — maps a free-text label (e.g. from an image model)
 * onto a known database entry. Returns null if nothing close is found.
 */
export function fuzzyMatchFood(label) {
  const q = (label || "").trim().toLowerCase();
  if (!q) return null;

  // 1. Exact name or id match
  const exact = FOOD_DATABASE.find((f) => f.name.toLowerCase() === q || f.id === q);
  if (exact) return exact;

  // 2. Substring match — id in label or label in name
  return FOOD_DATABASE.find(
    (f) => q.includes(f.id) ||
           f.name.toLowerCase().includes(q) ||
           q.includes(f.name.toLowerCase().split(" ")[0])
  ) || null;
}

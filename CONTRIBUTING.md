# Contributing to GlucoGuard-T1D

Thank you for your interest in contributing! This document explains how to contribute code, documentation, and food database improvements to GlucoGuard-T1D.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and welcoming environment for everyone. Be constructive, be kind, and focus on the work.

---

## Getting Started

### 1. Fork the repository

Click **Fork** on the GitHub repository page to create your own copy.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/GlucoGuard-T1D.git
cd GlucoGuard-T1D
```

### 3. Set up Firebase

Follow [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) to create your own Firebase project for development. Do not use the production Firebase project for testing.

### 4. Run locally

```bash
python -m http.server 8080
# Open http://localhost:8080
```

### 5. Create a feature branch

```bash
git checkout -b feat/your-feature-name
```

---

## Development Guidelines

### Technology Constraints

GlucoGuard-T1D is **deliberately framework-free**. Please do not introduce:
- React, Vue, Angular, or any other UI framework
- npm runtime packages (devtools like a linter are fine)
- Build tools (webpack, Vite, etc.)
- CSS preprocessors (Sass, Less)
- jQuery or other DOM utility libraries

The goal is to keep the project accessible to beginners and deployable as a static site with no build step.

### JavaScript Style

- Use **ES Modules** (`import` / `export`) — no CommonJS.
- Use `const` and `let` — never `var`.
- Use `async/await` for asynchronous code — avoid `.then()` chains.
- Add **JSDoc comments** for exported functions:

```javascript
/**
 * Adds a glucose reading to Firestore.
 * @param {string} uid   - The authenticated user's UID.
 * @param {Object} data  - Reading data: { value, timestamp, notes }.
 * @returns {Promise<DocumentReference>}
 */
export async function addGlucose(uid, data) { ... }
```

- Use `escapeHtml()` from `ui.js` before inserting any user-supplied text into the DOM.

### CSS Style

- Use the existing CSS custom properties from `style.css` — do not hardcode colours or spacing.
- Add new components to `components.css`.
- Add breakpoint overrides to `responsive.css`.
- Prefer `rem` units over `px` for typography; use `px` for borders and fine details.

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add password reset flow to login page
fix: prevent duplicate glucose entries on rapid submit
docs: update FIREBASE_SETUP.md with index instructions
style: normalize card padding across dashboard widgets
refactor: extract chart config into shared helper
```

---

## Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of the upstream repository.
3. Fill in the PR template:
   - **What does this PR do?**
   - **Which issue does it fix?** (if applicable — reference with `Closes #123`)
   - **How was it tested?**
   - **Screenshots** (for UI changes)

4. Ensure:
   - Your branch is up to date with `main` before opening the PR.
   - No console errors appear when running the app.
   - Your changes are responsive (test at both desktop and mobile widths).
   - No hardcoded Firebase credentials are included.

---

## Contributing to the Food Database

The Indian food database (`js/food-database.js`) is one of the most impactful areas to contribute to. When adding foods:

### Data Quality Standards

- **GI values** must be sourced from a credible reference (e.g. the International Tables of Glycemic Index, published studies, or established nutrition databases). Cite your source in the PR description.
- **Carbs per 100 g** should use standard nutritional data (USDA FoodData Central, IFCT 2017, or equivalent).
- **Typical portion** should reflect a realistic Indian serving size.
- Do not add branded or packaged products — focus on traditional, home-cooked foods.

### Adding a Food Entry

```javascript
{
  id: "your-food-id",        // lowercase-hyphen, unique
  name: "Your Food Name",    // Display name, properly capitalised
  category: "Category",      // Match an existing category
  carbsPer100g: 00,          // Number, grams of carbs per 100 g
  gi: 00,                    // Glycaemic Index (1–100)
  portionG: 000,             // Typical serving size in grams
  description: "Brief plain-language description including GI category."
}
```

Include a GI category note in the description: `Low GI (< 55)`, `Medium GI (55–69)`, or `High GI (≥ 70)`.

### Medical Accuracy

Changes to the food database or risk scoring algorithm will be reviewed carefully. Incorrect nutritional data could mislead people managing a serious medical condition. If you are unsure about a value, open an issue to discuss it before submitting a PR.

---

## Reporting Issues

- **Bugs:** Open a GitHub issue. Include browser name/version, steps to reproduce, expected and actual behaviour.
- **Security vulnerabilities:** See [SECURITY.md](SECURITY.md) — do not use public issues.
- **Feature requests:** Open a GitHub issue with the `enhancement` label. Explain the use case.

---

## Questions

If you have questions about the codebase, open a GitHub Discussion or comment on a relevant issue. We're happy to help.

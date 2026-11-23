// js/scan.js
// ---------------------------------------------------------------------------
// "Scan Food" feature — deliberately isolated. If the recognition API is not
// configured, unreachable, or errors, the rest of the app keeps working and
// the user is offered manual food search instead.
//
// TO CONNECT A REAL AI MODEL:
//   Set RECOGNITION_ENDPOINT to a real HTTPS endpoint that accepts a
//   multipart/form-data POST with field "image" and returns JSON:
//     { predictions: [{ label: "idli", confidence: 0.82 }, ...] }
//   Until that is configured, recognizeFood() always resolves to the
//   "unavailable" fallback path — it never fakes a confident result.
// ---------------------------------------------------------------------------

import { fuzzyMatchFood } from "./food-database.js";

const RECOGNITION_ENDPOINT = null; // e.g. "https://your-model-host/api/recognize-food"
const REQUEST_TIMEOUT_MS   = 12000;

/**
 * Set up drag-and-drop on a dropzone element.
 * @param {HTMLElement} dropzoneEl  Element to receive drag events
 * @param {HTMLInputElement} fileInputEl  Hidden file input to sync with
 * @param {Function} onFileFn  Called with the dropped File object
 */
export function setupDragAndDrop(dropzoneEl, fileInputEl, onFileFn) {
  if (!dropzoneEl) return;

  dropzoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzoneEl.classList.add("drag-active");
  });
  dropzoneEl.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropzoneEl.classList.add("drag-active");
  });
  dropzoneEl.addEventListener("dragleave", () => {
    dropzoneEl.classList.remove("drag-active");
  });
  dropzoneEl.addEventListener("dragend", () => {
    dropzoneEl.classList.remove("drag-active");
  });
  dropzoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzoneEl.classList.remove("drag-active");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFileFn(file);
  });
}

/**
 * Attempt food recognition on an image file.
 * Always resolves (never throws) with a shape describing what happened,
 * so the UI can render either real predictions or a manual fallback.
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   predictions: Array<{ label: string, confidence: number, matchedFood: object|null }>,
 *   fallbackReason: string|null
 * }>}
 */
export async function recognizeFood(imageFile) {
  // ── File validation ────────────────────────────────────────────────────────
  if (!imageFile.type.startsWith("image/")) {
    return {
      ok: false,
      predictions: [],
      fallbackReason: "Please select an image file (JPG or PNG)."
    };
  }
  if (imageFile.size > 8 * 1024 * 1024) {
    return {
      ok: false,
      predictions: [],
      fallbackReason: "Image file too large. Maximum size is 8 MB."
    };
  }

  // ── Endpoint not configured ────────────────────────────────────────────────
  if (!RECOGNITION_ENDPOINT) {
    return {
      ok: false,
      predictions: [],
      fallbackReason: "Food recognition is not yet connected. Search and select food manually below."
    };
  }

  // ── API call ───────────────────────────────────────────────────────────────
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(RECOGNITION_ENDPOINT, {
      method: "POST",
      body:   formData,
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`Recognition API returned ${res.status}`);
    const data = await res.json();

    const predictions = (data.predictions || []).map((p) => ({
      label:       p.label,
      confidence:  typeof p.confidence === "number" ? p.confidence : 0,
      matchedFood: fuzzyMatchFood(p.label)
    }));

    if (predictions.length === 0) {
      return {
        ok: false,
        predictions: [],
        fallbackReason: "No food could be identified in this image. Search and select food manually."
      };
    }

    return { ok: true, predictions, fallbackReason: null };
  } catch (err) {
    console.error("Food recognition failed:", err);
    return {
      ok: false,
      predictions: [],
      fallbackReason: "Food recognition unavailable. Search and select food manually."
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Read an image File into a data URL for local preview before upload. */
export function previewImage(file) {
  return new Promise((resolve, reject) => {
    const reader    = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

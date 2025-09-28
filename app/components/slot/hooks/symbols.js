// app/components/slot/symbols.js
import { assetPath } from "../../../lib/assetPath";

// Public path where your symbol images live
export const IMG_BASE = assetPath("/symbols");

// File names for all symbols used in the grid
export const SYMBOLS = [
  "A.png",
  "K.png",
  "Q.png",
  "cigarate.png",
  "level_clearance.png", // the special "L" joker with a digit
  "cap.png",
  "police_mice.png",
  "detective_mice.png",
  "mafia_mice.png",
];

// Convenience
export const CLEARANCE_IMG = "level_clearance.png";

// ---- Clearance digit rolling (ONLY 1..9) ----
// Higher weight for smaller numbers (1 is the most common)
const CLEARANCE_WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2, 1]; // maps to digits 1..9

function weightedPick(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** Returns a digit in 1..9 with 1 being most likely */
export function rollClearanceValue() {
  return weightedPick(CLEARANCE_WEIGHTS) + 1; // 1..9
}

// ---- Symbol helpers ----
export function isClearance(sym) {
  return !!sym && sym.img === CLEARANCE_IMG;
}

// ---- Optional random grid helper (used by labs / bootstrap) ----
export const makeRandomGrid = () =>
  Array.from({ length: 6 }, () =>
    Array.from({ length: 6 }, () => {
      const img = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      if (img === CLEARANCE_IMG) {
        return { img, clearance: rollClearanceValue() };
      }
      return { img };
    })
  );


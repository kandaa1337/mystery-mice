// app/components/slot/symbols.js
export const IMG_BASE = "/symbols";
 
// Keep your existing filenames for preloading, etc.
export const SYMBOLS = [
  "A.png",
  "K.png",
  "Q.png",
  "cigarate.png",
  "cap.png",
  "police_mice.png",
  "detective_mice.png",
  "mafia_mice.png",
  "level_clearance.png",
];
 
const CLEARANCE_IMG = "level_clearance.png";
 
// Higher weight for smaller numbers (1 is most common)
const CLEARANCE_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // for 1..10
 
function weightedPick(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}
 
export function rollClearanceValue() {
  return weightedPick(CLEARANCE_WEIGHTS) + 1; // 1..10
}
 
export function isClearance(sym) {
  return sym && sym.img === CLEARANCE_IMG;
}
 
// Each cell is now an object: { img: "file.png", clearance?: number }
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
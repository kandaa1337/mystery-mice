export const IMG_BASE = "/symbols";
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

export const makeRandomGrid = () =>
  Array.from({ length: 6 }, () =>
    Array.from(
      { length: 6 },
      () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    )
  );

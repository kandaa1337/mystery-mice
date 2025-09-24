// app/components/slot/winLogic.js
// Pure engine: detect wins (5+ orth-connected, with L as joker), resolve, gravity.

import { SYMBOLS, rollClearanceValue } from "./symbols";

// File name for the joker in your art set
const CLEARANCE_IMG = "level_clearance.png";
// All non-joker symbols (by filename)
const BASE_IMGS = SYMBOLS.filter((img) => img !== CLEARANCE_IMG);

// 4-dir adjacency
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const cloneGrid = (g) => g.map((row) => row.map((c) => (c ? { ...c } : c)));
const isL = (cell) =>
  !!cell && (cell.img === CLEARANCE_IMG || cell === CLEARANCE_IMG);
const cellImg = (cell) => (cell && cell.img) || cell || null;

/** New cell for refills */
export function randomFiller() {
  const img = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  if (img === CLEARANCE_IMG) {
    const val =
      typeof rollClearanceValue === "function"
        ? rollClearanceValue()
        : 7 + Math.floor(Math.random() * 4); // fallback: 7..10
    return { img, clearance: val };
  }
  return { img };
}

/**
 * Find all wins for each base img symbol.
 * A win is a cluster (BFS) of size >= 5 consisting of (symbol OR L),
 * with at least one non-L cell of that symbol present.
 * Returns { wins, usedL }:
 *   wins: [{ img, cells: [[r,c]...], lCells: [[r,c]...] }, ...]
 *   usedL: Set("r,c") — each L that participated (decrement once per check)
 */
export function findWins(grid) {
  const H = grid.length;
  const W = grid[0].length;
  const wins = [];
  const usedL = new Set();

  for (const imgSym of BASE_IMGS) {
    const seen = Array.from({ length: H }, () => Array(W).fill(false));

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (seen[r][c]) continue;

        const start = grid[r][c];
        if (!start || (cellImg(start) !== imgSym && !isL(start))) {
          seen[r][c] = true;
          continue;
        }

        // BFS over (imgSym OR L)
        const q = [[r, c]];
        seen[r][c] = true;

        const cells = [];
        const lCells = [];
        let hasReal = false;

        while (q.length) {
          const [y, x] = q.shift();
          const cur = grid[y][x];
          cells.push([y, x]);

          if (isL(cur)) lCells.push([y, x]);
          if (cellImg(cur) === imgSym) hasReal = true;

          for (const [dy, dx] of DIRS) {
            const ny = y + dy,
              nx = x + dx;
            if (ny < 0 || ny >= H || nx < 0 || nx >= W) continue;
            if (seen[ny][nx]) continue;
            const nxt = grid[ny][nx];
            if (!nxt) continue;
            const im = cellImg(nxt);
            if (im === imgSym || isL(nxt)) {
              seen[ny][nx] = true;
              q.push([ny, nx]);
            }
          }
        }

        if (hasReal && cells.length >= 5) {
          wins.push({ img: imgSym, cells, lCells });
          for (const [y, x] of lCells) usedL.add(`${y},${x}`);
        }
      }
    }
  }

  return { wins, usedL };
}

/**
 * Apply one resolve step:
 *  - Clear all winning non-L cells.
 *  - Decrement each used L by 1 (once total per check); remove if reaches 0.
 *  - Gravity per column.
 *  - Refill using `filler(x, y)`.
 */
export function resolveWins(grid, wins, usedL, filler) {
  const H = grid.length;
  const W = grid[0].length;
  const next = cloneGrid(grid);

  // Mark non-L winners
  const toClear = Array.from({ length: H }, () => Array(W).fill(false));
  for (const w of wins) {
    for (const [y, x] of w.cells) {
      const cell = next[y][x];
      if (cell && !isL(cell)) toClear[y][x] = true;
    }
  }

  // Clear marked
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (toClear[y][x]) next[y][x] = null;
    }
  }

  // Decrement each participating L by 1 total
  for (const key of usedL) {
    const [ys, xs] = key.split(",");
    const y = +ys,
      x = +xs;
    const cell = next[y]?.[x];
    if (cell && isL(cell)) {
      const cur = typeof cell.clearance === "number" ? cell.clearance : 1;
      const dec = Math.max(0, cur - 1);
      if (dec <= 0) next[y][x] = null;
      else next[y][x] = { ...cell, clearance: dec };
    }
  }

  // Gravity per column, bottom compaction
  for (let x = 0; x < W; x++) {
    let write = H - 1;
    for (let y = H - 1; y >= 0; y--) {
      if (next[y][x]) {
        if (write !== y) {
          next[write][x] = next[y][x];
          next[y][x] = null;
        }
        write--;
      }
    }
    for (let y = write; y >= 0; y--) {
      next[y][x] = filler(x, y);
    }
  }

  return next;
}

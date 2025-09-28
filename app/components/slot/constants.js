// Geometry (design space)
export const SIZE = { w: 900, h: 700 };
export const INSET = { top: 20, right: 150, bottom: 50, left: 150 };
export const GAP_AT_DESIGN = 6; // px at design inner width

// Timing (gravity)
export const EXIT_MS_PER_CELL = 70;
export const ENTER_MS_PER_CELL = 70;
export const EXTRA_MARGIN = 12;
export const COLUMN_STAGGER_MS = 50;

// Helpers
export const ROWS = [0, 1, 2, 3, 4, 5];
export const COLS = [0, 1, 2, 3, 4, 5];

// Timing (spin preload / fake spin)
export const FAKE_SPIN_MS = 2000; // how long the "fake spin" runs
export const PRE_SPIN_SPAWN_MS = 90; // how often a temp symbol is spawned per column


export const LINES = 20;
// coin steps shown in the BET popup
export const COIN_VALUES = [0.01, 0.07, 0.1, 0.2, 0.5, 1.2];

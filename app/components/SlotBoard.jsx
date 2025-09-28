// app/components/SlotBoard.jsx
"use client";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import LinesOverlay from "./slot/LinesOverlay";
import StaticGrid from "./slot/StaticGrid";
import PlayPieces from "./slot/PlayPieces";
import WinOverlay from "./slot/WinOverlay";
import WinFXLayer, { durationForFx } from "./slot/WinFXLayer";

import { usePlayAreaDims } from "./slot/hooks/usePlayAreaDims";
import { useSpritesPreload } from "./slot/hooks/useSpritesPreload";
import {
  SIZE,
  INSET,
  ROWS,
  COLS,
  EXIT_MS_PER_CELL,
  ENTER_MS_PER_CELL,
  EXTRA_MARGIN,
  COLUMN_STAGGER_MS,
  PRE_SPIN_SPAWN_MS,
} from "./slot/constants";

import { makeRandomGrid } from "./slot/symbols";
import {
  raf,
  sleep,
  animateToTranslateY,
  landingBounce,
  fadeOutOpacity,
} from "./slot/anim";
import { findWins, resolveWins, randomFiller } from "./slot/winLogic";
import { payoutTable } from "./slot/payoutTable";

// --- calc payout (из версии друга)
function calcWinAmount(wins, betPerLine = 1) {
  let total = 0;
  for (const win of wins) {
    const symbol = win.img;
    const count = win.cells.length;
    const payoutRow = payoutTable[symbol];
    let base = 0;
    if (payoutRow) {
      const thresholds = Object.keys(payoutRow)
        .map((key) => Number(key))
        .sort((a, b) => a - b);
      for (const t of thresholds) if (count >= t) base = payoutRow[t];
    }
    total += base * betPerLine;
  }
  return total;
}

const SlotBoard = forwardRef(({ onStateChange, onWin, totalBet }, ref) => {
  // --- Layout metrics (design space -> responsive %) ---
  const metrics = useMemo(() => {
    const innerW = SIZE.w - INSET.left - INSET.right;
    const innerH = SIZE.h - INSET.top - INSET.bottom;
    return {
      insetPct: {
        top: `${(INSET.top / SIZE.h) * 114}%`,
        right: `${(INSET.right / SIZE.w) * 114}%`,
        bottom: `${(INSET.bottom / SIZE.h) * 114}%`,
        left: `${(INSET.left / SIZE.w) * 114}%`,
      },
      innerDesignW: innerW,
      innerDesignH: innerH,
    };
  }, []);

  // --- Win pause / pending ---
  const [winMarks, setWinMarks] = useState([]); // [{r,c}]
  const [awaiting, setAwaiting] = useState(false);
  const pendingWinsRef = useRef(null);
  const pendingUsedLRef = useRef(null);

  // --- Grid & anim state ---
  const [grid, setGrid] = useState(null);
  const [phase, setPhase] = useState("idle"); // "idle" | "anim"
  const [cycle, setCycle] = useState(0);
  const [autoResolve, setAutoResolve] = useState(true); // Auto (no Continue) vs Manual

  const [pieces, setPieces] = useState([]); // {id,sym,x,y,w,h}
  const pieceRefs = useRef(new Map());
  const setPieceRef = (id) => (el) => {
    if (el) pieceRefs.current.set(id, el);
    else pieceRefs.current.delete(id);
  };

  // --- FX layer state ---
  const [fxItems, setFxItems] = useState([]); // [{r,c,sym}]
  const [fxKey, setFxKey] = useState(0);

  // --- Play area dims (px) ---
  const playRef = useRef(null);
  const dims = usePlayAreaDims(playRef, metrics.innerDesignW);

  // --- Preload sprites ---
  useSpritesPreload();

  // --- Initial grid ---
  useEffect(() => {
    setGrid(makeRandomGrid());
  }, []);

  // --- Helpers to manage floating piece DOM nodes for spin animation ---
  const spawnPiece = ({ id, sym, col, topY }) => {
    const { cellW, cellH, gapPx } = dims;
    const x = Math.round(col * (cellW + gapPx));
    const y = Math.round(topY);
    setPieces((p) => [...p, { id, sym, x, y, w: cellW, h: cellH }]);
  };
  const removePiece = (id) => setPieces((p) => p.filter((q) => q.id !== id));

  const snapshotGridToPieces = () => {
    if (!dims || !grid) return;
    const { cellW, cellH, gapPx } = dims;
    const all = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const id = `cell-${cycle}-${r}-${c}`;
        const x = Math.round(c * (cellW + gapPx));
        const y = Math.round(r * (cellH + gapPx));
        all.push({ id, sym: grid[r][c], x, y, w: cellW, h: cellH });
      }
    }
    setPieces(all);
  };

  const runColumn = async (c, newColSyms) => {
    const { innerH, cellH, gapPx } = dims;
    const exitSpeedPxPerMs = (cellH + gapPx) / EXIT_MS_PER_CELL;
    const enterSpeedPxPerMs = (cellH + gapPx) / ENTER_MS_PER_CELL;
    const exitStagger = (cellH + gapPx) / exitSpeedPxPerMs;
    const enterStagger = (cellH + gapPx) / enterSpeedPxPerMs;

    // EXIT existing
    await Promise.all(
      Array.from({ length: 6 }, (_, i) => 5 - i).map((r) => {
        const startTop = r * (cellH + gapPx);
        const id = `cell-${cycle}-${r}-${c}`;
        const travel = innerH + EXTRA_MARGIN - startTop;
        const duration = travel / exitSpeedPxPerMs;
        const delay = (5 - r) * exitStagger;
        return (async () => {
          await sleep(delay);
          await animateToTranslateY(pieceRefs, id, travel, duration);
          removePiece(id);
        })();
      })
    );

    // ENTER new
    await Promise.all(
      Array.from({ length: 6 }, (_, k) => k).map((k) => {
        const targetRow = 5 - k;
        const startTop = -cellH - EXTRA_MARGIN;
        const targetTop = targetRow * (cellH + gapPx);
        const id = `in-${cycle}-${c}-${targetRow}`;
        const travel = targetTop - startTop;
        const duration = travel / enterSpeedPxPerMs;
        const delay = k * enterStagger;
        return (async () => {
          await sleep(delay);
          spawnPiece({
            id,
            sym: newColSyms[targetRow],
            col: c,
            topY: startTop,
          });
          await raf();
          await animateToTranslateY(pieceRefs, id, travel, duration);
          await landingBounce(pieceRefs, id, travel, cellH);
        })();
      })
    );
  };

  // --- Spin handler (exposed to parent) ---
  const tumbleAll = async () => {
    if (!grid || !dims || phase !== "idle") return;

    // reset any paused state
    setAwaiting(false);
    setWinMarks([]);
    pendingWinsRef.current = null;
    pendingUsedLRef.current = null;

    setPhase("anim");
    snapshotGridToPieces();
    await raf();

    const nextGrid = makeRandomGrid();

    await Promise.all(
      COLS.map((c) =>
        (async () => {
          await sleep(c * COLUMN_STAGGER_MS);
          const newColSyms = ROWS.map((r) => nextGrid[r][c]);
          await runColumn(c, newColSyms);
        })()
      )
    );

    setGrid(nextGrid);
    setPieces([]);
    setCycle((n) => n + 1);
    setPhase("idle");
    onStateChange?.("idle");
  };

  useImperativeHandle(ref, () => ({ tumbleAll }));

  // --- Detect wins (pause and wait) whenever a settled grid is visible ---
  useEffect(() => {
    if (!grid || phase !== "idle" || awaiting) return;

    const { wins, usedL } = findWins(grid);

    if (!wins.length) {
      setWinMarks([]);
      pendingWinsRef.current = null;
      pendingUsedLRef.current = null;
      return;
    }

    const marks = wins.flatMap((w) => w.cells.map(([r, c]) => ({ r, c })));
    if (!autoResolve) setWinMarks(marks);
    setAwaiting(true);
    pendingWinsRef.current = wins;
    pendingUsedLRef.current = usedL;
  }, [grid, phase, awaiting, autoResolve]);

  // --- Continue handler (plays FX, clears, gravity, refill, commit) ---
  const handleContinue = useCallback(async () => {
    if (!awaiting || !pendingWinsRef.current) return;
    if (!dims || !grid) return;

    setAwaiting(false);
    setWinMarks([]);
    setPhase("anim");

    // Snapshot current grid into movable pieces
    snapshotGridToPieces();
    await raf();

    const wins = pendingWinsRef.current;
    const usedL = pendingUsedLRef.current;

    // payout
    try {
      const betPerLine = (totalBet ?? 0) / 20;
      const payout = calcWinAmount(wins, betPerLine);
      onWin?.(payout);
    } catch (_) {}

    // Cells to clear
    const toClearSet = new Set();
    for (const w of wins) {
      for (const [r, c] of w.cells) {
        const cell = grid[r][c];
        if (cell && cell.img !== "level_clearance.png") {
          toClearSet.add(`${r},${c}`);
        }
      }
    }
    for (const key of pendingUsedLRef.current || []) {
      const [rs, cs] = key.split(",");
      const r = +rs, c = +cs;
      const cell = grid[r]?.[c];
      if (cell?.img === "level_clearance.png") {
        const cur = typeof cell.clearance === "number" ? cell.clearance : 1;
        if (cur <= 1) toClearSet.add(`${r},${c}`);
      }
    }

    const idFor = (r, c) => `cell-${cycle}-${r}-${c}`;

    // --- FX for supported symbols; fade for others
    const withFx = new Set([
      "A.png",
      "K.png",
      "Q.png",
      "cigarate.png",
      "police_mice.png",
      "mafia_mice.png",
      "detective_mice.png",
      "cap.png",
    ]);
    const fxList = [];
    const fadePromises = [];
    let maxFx = 0;

    for (const key of toClearSet) {
      const [rs, cs] = key.split(",");
      const r = +rs, c = +cs;
      const sym = grid[r][c];
      const name = sym?.img;

      if (withFx.has(name)) {
        const id = idFor(r, c);
        const el = pieceRefs.current.get(id);
        if (el) el.style.opacity = "0";
        fxList.push({ r, c, sym });
        maxFx = Math.max(maxFx, durationForFx(name));
      } else {
        fadePromises.push(fadeOutOpacity(pieceRefs, idFor(r, c), 260));
      }
    }

    if (fxList.length) {
      setFxItems(fxList);
      setFxKey((n) => n + 1);
    }
    await Promise.all([
      ...fadePromises,
      fxList.length ? sleep(maxFx + 30) : Promise.resolve(),
    ]);
    setFxItems([]);

    // Remove faded pieces from floating layer
    if (toClearSet.size > 0) {
      setPieces((prev) =>
        prev.filter((p) => {
          const m = p.id.match(/^cell-\d+-(\d+)-(\d+)$/);
          if (!m) return true;
          return !toClearSet.has(`${m[1]},${m[2]}`);
        })
      );
      await raf();
    }

    // Survivors (from old grid)
    const survivorsByCol = new Map();
    for (let c = 0; c < 6; c++) {
      const surv = [];
      for (let r = 0; r < 6; r++) {
        const key = `${r},${c}`;
        if (toClearSet.has(key)) continue;
        const cell = grid[r][c];
        if (cell) surv.push({ r, c, cell });
      }
      survivorsByCol.set(c, surv);
    }

    // Resolve next logical grid
    const nextGrid = resolveWins(grid, wins, usedL, (x, y) => randomFiller(x, y));

    // Animate survivors falling + spawn new
    const { cellH, gapPx } = dims;
    const enterSpeedPxPerMs = (cellH + gapPx) / ENTER_MS_PER_CELL;

    const fallPromises = [];
    for (let c = 0; c < 6; c++) {
      const surv = survivorsByCol.get(c);
      const survLen = surv?.length || 0;
      const newCount = 6 - survLen;
      const bottomStart = 6 - survLen;

      if (survLen) {
        for (let i = 0; i < survLen; i++) {
          const { r, c: col } = surv[i];
          const targetRow = bottomStart + i;
          const deltaRows = targetRow - r;
          if (deltaRows <= 0) continue;
          const distance = deltaRows * (cellH + gapPx);
          const duration = distance / enterSpeedPxPerMs;
          const id = idFor(r, col);
          fallPromises.push(
            (async () => {
              await animateToTranslateY(pieceRefs, id, distance, duration);
              await landingBounce(pieceRefs, id, distance, cellH);
            })()
          );
        }
      }

      for (let fillRow = 0; fillRow < newCount; fillRow++) {
        const targetRow = fillRow;
        const startTop = -cellH - EXTRA_MARGIN;
        const targetTop = targetRow * (cellH + gapPx);
        const travel = targetTop - startTop;
        const duration = Math.abs(travel) / enterSpeedPxPerMs;
        const id = `in-${cycle}-c${c}-r${targetRow}`;
        const sym = nextGrid[targetRow][c];

        fallPromises.push(
          (async () => {
            await sleep(fillRow * 20);
            spawnPiece({ id, sym, col: c, topY: startTop });
            await raf();
            await animateToTranslateY(pieceRefs, id, travel, duration);
            await landingBounce(pieceRefs, id, travel, cellH);
          })()
        );
      }
    }

    await Promise.all(fallPromises);

    // Commit new grid and clean up
    pendingWinsRef.current = null;
    pendingUsedLRef.current = null;

    setGrid(nextGrid);
    setPieces([]);
    setCycle((n) => n + 1);
    setPhase("idle");
    onStateChange?.("idle");
  }, [awaiting, grid, dims, cycle, totalBet, onWin, onStateChange]);

  // --- Auto-continue when enabled ---
  useEffect(() => {
    if (!awaiting || !autoResolve || !dims || !grid) return;
    const t = setTimeout(() => {
      handleContinue();
    }, 0);
    return () => clearTimeout(t);
  }, [awaiting, autoResolve, dims, grid, handleContinue]);

  // --- Keyboard shortcut while paused (only in Manual) ---
  useEffect(() => {
    if (!awaiting || autoResolve) return;
    const onKey = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [awaiting, autoResolve, handleContinue]);

  // --- Render ---
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Outer wrapper maintains aspect */}
      <div
        className="relative bottom-[52px] w-full max-w-[900px]"
        style={{
          aspectRatio: "900 / 630",
          height: "75vh",
        }}
      >
        {/* Border */}
        <Image
          src="/ui/slot_border.png"
          alt="Slot Border"
          fill
          className="object-contain"
          priority
        />

        {/* Play area */}
        <div
          ref={playRef}
          className="absolute overflow-hidden"
          style={{
            top: metrics.insetPct.top,
            right: metrics.insetPct.right,
            bottom: metrics.insetPct.bottom,
            left: metrics.insetPct.left,
          }}
        >
          {/* Auto/Manual toggle */}
          <div className="absolute left-2 top-2 z-40">
            <button
              onClick={() => setAutoResolve((v) => !v)}
              className="px-3 py-1 rounded-md bg-white/80 text-black text-xs shadow hover:bg-white"
            >
              {autoResolve ? "Auto: ON" : "Auto: OFF"}
            </button>
          </div>

          {(phase === "idle" || phase === "spin") && (
            <StaticGrid
              grid={grid}
              dims={dims}
              rows={ROWS}
              cols={COLS}
              cycle={cycle}
            />
          )}

          <PlayPieces pieces={pieces} setPieceRef={setPieceRef} />

          {/* Win FX overlay (plays during resolve) */}
          <WinFXLayer dims={dims} items={fxItems} playKey={fxKey} />

          {/* Lines always visible */}
          <LinesOverlay dims={dims} />
          {/* Yellow borders (marks) only in Manual mode */}
          {!autoResolve && <WinOverlay dims={dims} marks={winMarks} />}

          {/* Manual Continue overlay (hidden in Auto mode) */}
          {awaiting && !autoResolve && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <button
                onClick={handleContinue}
                className="pointer-events-auto px-5 py-2 rounded-xl bg-black/80 text-white text-sm shadow-lg hover:bg-black"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SlotBoard;

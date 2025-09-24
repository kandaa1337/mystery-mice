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
  PRE_SPIN_MS,
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

const SlotBoard = forwardRef((props, ref) => {
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

  // --- Win pause UI state ---
  const [winMarks, setWinMarks] = useState([]); // [{r,c}]
  const [awaiting, setAwaiting] = useState(false);
  const pendingWinsRef = useRef(null);
  const pendingUsedLRef = useRef(null);

  // --- Grid & animation state ---
  const [grid, setGrid] = useState(null);
  const [phase, setPhase] = useState("idle"); // "idle" | "anim"
  const [cycle, setCycle] = useState(0);

  const [pieces, setPieces] = useState([]); // {id,sym,x,y,w,h}
  const pieceRefs = useRef(new Map());
  const setPieceRef = (id) => (el) => {
    if (el) pieceRefs.current.set(id, el);
    else pieceRefs.current.delete(id);
  };

  // --- Play area dims (px) ---
  const playRef = useRef(null);
  const dims = usePlayAreaDims(playRef, metrics.innerDesignW);

  // --- Preload sprites (kept for readiness; not used directly here) ---
  const spritesReady = useSpritesPreload();

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

  // --- Stream random symbols down a column for a duration (visual pre-spin)
  const streamColumn = async (c, durationMs) => {
    if (!dims) return;
    const { innerH, cellH, gapPx } = dims;
    const enterSpeedPxPerMs = (cellH + gapPx) / ENTER_MS_PER_CELL;
    const travel = innerH + EXTRA_MARGIN + cellH; // from just above top to beyond bottom
    const runDur = travel / enterSpeedPxPerMs;
    const endAt = performance.now() + durationMs;
    let seq = 0;
    const inflight = [];

    while (performance.now() < endAt) {
      const id = `spin-${cycle}-${c}-${seq++}`;
      const startTop = -cellH - EXTRA_MARGIN;
      const sym = randomFiller();
      spawnPiece({ id, sym, col: c, topY: startTop });
      await raf();
      // fire-and-forget this one piece; remove when done
      inflight.push(
        (async () => {
          await animateToTranslateY(pieceRefs, id, travel, runDur);
          removePiece(id);
        })()
      );
      // small cadence so pieces appear like a continuous stream
      await sleep(PRE_SPIN_SPAWN_MS);
    }

    // wait all streamed pieces to finish falling out of view
    await Promise.all(inflight);
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
    setWinMarks(marks);
    setAwaiting(true);
    pendingWinsRef.current = wins;
    pendingUsedLRef.current = usedL;

    console.log(
      "Wins found:",
      wins.map((w) => w.img)
    );
  }, [grid, phase, awaiting]);
  // inside SlotBoard component
  const handleContinue = useCallback(async () => {
    if (!awaiting || !pendingWinsRef.current) return;
    if (!dims || !grid) return;

    // pause UI and switch to anim-only rendering
    setAwaiting(false);
    setWinMarks([]);
    setPhase("anim");

    // ---- A) Snapshot current grid into movable pieces
    snapshotGridToPieces();
    await raf();

    const wins = pendingWinsRef.current;
    const usedL = pendingUsedLRef.current;

    // Compute cells that should fade (non-L winners + L that will hit 0)
    const toClearSet = new Set();
    const willRemoveL = new Set();
    for (const w of wins) {
      for (const [r, c] of w.cells) {
        const cell = grid[r][c];
        // winners include L in cluster, but we DON'T clear L unless it will hit 0
        if (cell && cell.img !== "level_clearance.png") {
          toClearSet.add(`${r},${c}`);
        }
      }
    }
    // L used this step that will reach 0 -> also fade/remove
    for (const key of usedL) {
      const [rs, cs] = key.split(",");
      const r = +rs,
        c = +cs;
      const cell = grid[r]?.[c];
      if (cell && cell.img === "level_clearance.png") {
        const cur = typeof cell.clearance === "number" ? cell.clearance : 1;
        if (cur <= 1) {
          willRemoveL.add(key);
          toClearSet.add(`${r},${c}`);
        }
      }
    }

    const { innerH, cellH, gapPx } = dims;
    const exitSpeedPxPerMs = (cellH + gapPx) / EXIT_MS_PER_CELL;
    const enterSpeedPxPerMs = (cellH + gapPx) / ENTER_MS_PER_CELL;

    // Helper to build snapshot piece id (matches snapshotGridToPieces)
    const idFor = (r, c) => `cell-${cycle}-${r}-${c}`;

    // ---- B) Fade out all tiles that will disappear
    const fadePromises = [];
    for (const key of toClearSet) {
      const [rs, cs] = key.split(",");
      const r = +rs,
        c = +cs;
      fadePromises.push(fadeOutOpacity(pieceRefs, idFor(r, c), 260));
    }
    await Promise.all(fadePromises);

    // Remove faded pieces from the "pieces" state (so they don't fall)
    if (toClearSet.size > 0) {
      setPieces((prev) =>
        prev.filter((p) => {
          const m = p.id.match(/^cell-\d+-(\d+)-(\d+)$/);
          if (!m) return true;
          const key = `${m[1]},${m[2]}`;
          return !toClearSet.has(key);
        })
      );
      await raf();
    }

    // ---- C) Compute target positions after gravity (without mutating grid)
    // Per column, list survivors TOP -> BOTTOM (so order is preserved correctly)
    const survivorsByCol = new Map();
    for (let c = 0; c < 6; c++) {
      const surv = [];
      for (let r = 0; r < 6; r++) {
        const key = `${r},${c}`;
        if (toClearSet.has(key)) continue; // removed (winners or L reaching 0)
        const cell = grid[r][c];
        if (cell) surv.push({ r, c, cell });
      }
      survivorsByCol.set(c, surv); // top -> bottom order
    }

    // Resolve the logical next grid (so we know which new symbols to spawn)
    const nextGrid = resolveWins(grid, wins, usedL, (x, y) =>
      randomFiller(x, y)
    );

    // ---- D) Animate survivors falling to their compacted rows
    const fallPromises = [];
    for (let c = 0; c < 6; c++) {
      const surv = survivorsByCol.get(c);
      const survLen = surv?.length || 0;
      const newCount = 6 - survLen; // rows at the TOP to fill
      const bottomStart = 6 - survLen; // survivors end up in [bottomStart .. 5]

      if (survLen) {
        for (let i = 0; i < survLen; i++) {
          const { r, c: col } = surv[i]; // original row of this survivor
          const targetRow = bottomStart + i; // minimal drop, preserve order
          const deltaRows = targetRow - r;
          if (deltaRows <= 0) continue; // nothing to move
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

      // ---- E) Spawn new pieces for the top gap and drop them in
      for (let fillRow = 0; fillRow < newCount; fillRow++) {
        const targetRow = fillRow; // top rows get filled: 0..newCount-1
        const startTop = -cellH - EXTRA_MARGIN;
        const targetTop = targetRow * (cellH + gapPx);
        const travel = targetTop - startTop;
        const duration = Math.abs(travel) / enterSpeedPxPerMs;
        const id = `in-${cycle}-c${c}-r${targetRow}`;
        const sym = nextGrid[targetRow][c];

        fallPromises.push(
          (async () => {
            // slight per-row stagger for a natural look
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

    // ---- F) Commit new grid and clean up
    pendingWinsRef.current = null;
    pendingUsedLRef.current = null;

    setGrid(nextGrid); // static grid re-renders in final positions
    setPieces([]); // remove floating layers
    setCycle((n) => n + 1);
    setPhase("idle"); // re-enable detection for the next cascade step
  }, [awaiting, grid, dims, cycle]);

  // --- Keyboard shortcut while paused ---
  useEffect(() => {
    if (!awaiting) return;
    const onKey = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [awaiting, handleContinue]);

  // --- Render ---
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Outer wrapper maintains aspect */}
      <div
        className="relative bottom-[52px]"
        style={{ width: "min(80vw, 900px)", aspectRatio: "900 / 630" }}
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
          <LinesOverlay dims={dims} />
          <WinOverlay dims={dims} marks={winMarks} />

          {awaiting && (
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

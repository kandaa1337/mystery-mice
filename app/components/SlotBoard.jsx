"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import LinesOverlay from "./slot/LinesOverlay";
import StaticGrid from "./slot/StaticGrid";
import PlayPieces from "./slot/PlayPieces";
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
} from "./slot/constants";
import { makeRandomGrid } from "./slot/symbols";
import { raf, sleep, animateToTranslateY, landingBounce } from "./slot/anim";

const SlotBoard = forwardRef((props, ref) => {
  // Metrics for border/play area (design-space)
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

  // Grid state
    const [grid, setGrid] = useState(null);
    const [phase, setPhase] = useState("idle"); // idle | anim
    const [cycle, setCycle] = useState(0);
  
    // Floating pieces
    const [pieces, setPieces] = useState([]); // {id,img,x,y,w,h}
    const pieceRefs = useRef(new Map());
    const setPieceRef = (id) => (el) => {
      if (el) pieceRefs.current.set(id, el);
      else pieceRefs.current.delete(id);
    };
  
    // Play area dims (px)
    const playRef = useRef(null);
    const dims = usePlayAreaDims(playRef, metrics.innerDesignW);
  
    // Preload sprites to avoid pop-in
    const spritesReady = useSpritesPreload();
  
    // initial grid
    useEffect(() => {
      setGrid(makeRandomGrid());
    }, []);
  
    // helpers to spawn/remove
    const spawnPiece = ({ id, sym, col, topY }) => {
      const { cellW, cellH, gapPx } = dims;
      const x = Math.round(col * (cellW + gapPx));
      const y = Math.round(topY);
      setPieces((p) => [...p, { id, sym, x, y, w: cellW, h: cellH }]);
    };
    const removePiece = (id) => setPieces((p) => p.filter((q) => q.id !== id));
  
    // snapshot current grid -> floating pieces (all visible for EXIT)
    const snapshotGridToPieces = () => {
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
  
    // one column gravity + refill
    const runColumn = async (c, newColSyms) => {
      const { innerH, cellH, gapPx } = dims;
      const exitSpeedPxPerMs = (cellH + gapPx) / EXIT_MS_PER_CELL;
      const enterSpeedPxPerMs = (cellH + gapPx) / ENTER_MS_PER_CELL;
      const exitStagger = (cellH + gapPx) / exitSpeedPxPerMs;
      const enterStagger = (cellH + gapPx) / enterSpeedPxPerMs;
  
      // EXIT (bottom->top) with gravity stagger
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
  
      // ENTER (bottom->top) with same stagger + landing bounce
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
  
    const tumbleAll = async () => {
      if (!grid || !dims || phase !== "idle") return;
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
  
    const isBusy = phase !== "idle";
  
    return (
      <div className="w-full h-full flex items-center justify-center">
        {/* Outer wrapper maintains aspect */}
        <div
          className="relative bottom-[50px]"
          style={{ width: "min(95vw, 1070px)", aspectRatio: "900 / 630" }}
        >
          {/* Border */}
          <Image
            src="/ui/slot_border.png"
            alt="Slot Border"
            fill
            className="object-contain"
            priority
          />
  
          {/* Play area (clips) */}
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
            {/* Static grid when idle */}
            {phase === "idle" && (
              <StaticGrid
                grid={grid}
                dims={dims}
                rows={ROWS}
                cols={COLS}
                cycle={cycle}
              />
            )}
  
            {/* Floating pieces during animation */}
            <PlayPieces pieces={pieces} setPieceRef={setPieceRef} />
  
            {/* Lines on top */}
            <LinesOverlay dims={dims} />
          </div>
  
      
        </div>
      </div>
    );
});
export default SlotBoard;

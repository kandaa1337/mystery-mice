// app/components/SlotBoard.jsx
"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

export default function SlotBoard() {
  // Design reference (kept for ratios)
  const SIZE = { w: 900, h: 700 };
  const INSET = { top: 20, right: 150, bottom: 50, left: 150 };
  const GAP = 6; // px at design size
  const LINE_THICKNESS = 8; // px at design size

  // Precompute % values so everything scales with the container
  const metrics = useMemo(() => {
    const innerW = SIZE.w - INSET.left - INSET.right;
    const innerH = SIZE.h - INSET.top - INSET.bottom;
    return {
      insetPct: {
        top: `${(INSET.top / SIZE.h) * 100}%`,
        right: `${(INSET.right / SIZE.w) * 100}%`,
        bottom: `${(INSET.bottom / SIZE.h) * 100}%`,
        left: `${(INSET.left / SIZE.w) * 100}%`,
      },
      gapPct: `${(GAP / innerW) * 100}%`,
      lineWidthPct: `${(LINE_THICKNESS / innerW) * 100}%`,
    };
  }, []);

  const IMG_BASE = "/symbols";
  const SYMBOLS = [
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

  const rows = Array.from({ length: 6 }, (_, r) => r);
  const cols = Array.from({ length: 6 }, (_, c) => c);
  const [grid, setGrid] = useState(null);

  useEffect(() => {
    const picks = Array.from({ length: 6 }, () =>
      Array.from({ length: 6 }, () => {
        const idx = Math.floor(Math.random() * SYMBOLS.length);
        return SYMBOLS[idx];
      })
    );
    setGrid(picks);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* This box scales to screen while keeping the original aspect ratio */}
      <div
        className="relative"
        style={{ width: "min(92vw, 900px)", aspectRatio: "900 / 700" }}
      >
        {/* Decorative border always fits inside the box */}
        <Image
          src="/ui/slot_border.png"
          alt="Slot Border"
          fill
          className="object-contain"
          priority
        />

        {/* Play area uses % insets so it scales perfectly */}
        <div
          className="absolute"
          style={{
            top: metrics.insetPct.top,
            right: metrics.insetPct.right,
            bottom: metrics.insetPct.bottom,
            left: metrics.insetPct.left,
          }}
        >
          {/* Vertical separators behind cells */}
          <div className="absolute inset-0 pointer-events-none">
            {cols.slice(1).map((c) => {
              const leftPct = (c / 6) * 100;
              return (
                <div
                  key={`v-${c}`}
                  className="absolute top-0 h-full -translate-x-1/2"
                  style={{ left: `${leftPct}%`, width: metrics.lineWidthPct }}
                >
                  <Image
                    src="/ui/line.png"
                    alt="Vertical separator"
                    fill
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>

          {/* 6x6 grid; gap in % keeps spacing consistent at any size */}
          <div
            className="relative grid w-full h-full"
            style={{
              gridTemplateColumns: "repeat(6, 1fr)",
              gridTemplateRows: "repeat(6, 1fr)",
              gap: metrics.gapPct,
              zIndex: 5,
            }}
          >
            {rows.map((r) =>
              cols.map((c) => {
                const name = grid ? grid[r][c] : null;
                return (
                  <div key={`${r}-${c}`} className="relative">
                    {name && (
                      <Image
                        src={`${IMG_BASE}/${name}`}
                        alt={name.replace(".png", "").replaceAll("_", " ")}
                        fill
                        className="object-contain"
                        sizes="100vw"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

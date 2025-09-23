"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function SlotBoard() {
  // keep your tuned sizes
  const SIZE = { w: 900, h: 700 };
  const INSET = { top: 20, right: 150, bottom: 50, left: 150 };
  const GAP = 6;
  const LINE_THICKNESS = 8;

  // put these files in /public/symbols/
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
    // build a 6x6 grid of random filenames (client-only)
    const picks = Array.from({ length: 6 }, () =>
      Array.from({ length: 6 }, () => {
        const idx = Math.floor(Math.random() * SYMBOLS.length);
        return SYMBOLS[idx];
      })
    );
    setGrid(picks);
  }, []);

  return (
    <div className="h-screen w-full flex justify-center">
      <div className="relative" style={{ width: SIZE.w, height: SIZE.h }}>
        {/* Outer decorative border */}
        <Image
          src="/ui/slot_border.png"
          alt="Slot Border"
          fill
          className="object-contain"
          priority
        />

        {/* Inner play area */}
        <div
          className="absolute"
          style={{
            top: INSET.top,
            right: INSET.right,
            bottom: INSET.bottom,
            left: INSET.left,
          }}
        >
          {/* Vertical lines between columns (behind cells) */}
          <div className="absolute inset-0 pointer-events-none">
            {cols.slice(1).map((c) => {
              const leftPct = (c / 6) * 100;
              return (
                <div
                  key={`v-${c}`}
                  className="absolute top-0 h-full -translate-x-1/2"
                  style={{ left: `${leftPct}%`, width: LINE_THICKNESS }}
                >
                  <Image
                    src="/ui/line.png"
                    alt="Vertical separator"
                    fill
                    className="object-cover"
                    sizes="(max-width: 900px) 100vw, 900px"
                  />
                </div>
              );
            })}
          </div>

          {/* 6x6 cells (SSR-safe: always render 36 cells) */}
          <div
            className="relative grid w-full h-full"
            style={{
              gridTemplateColumns: "repeat(6, 1fr)",
              gridTemplateRows: "repeat(6, 1fr)",
              gap: GAP,
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
                        alt={(name || "")
                          .replace(".png", "")
                          .replaceAll("_", " ")}
                        fill
                        className="object-contain"
                        sizes="(max-width: 900px) 100vw, 900px"
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

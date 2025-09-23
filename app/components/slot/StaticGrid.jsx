// app/components/slot/StaticGrid.jsx
"use client";
import Image from "next/image";
import { IMG_BASE, isClearance } from "./symbols";
 
export default function StaticGrid({ grid, dims, rows, cols, cycle }) {
  if (!grid || !dims) return null;
  const fontPx = Math.round(dims.cellH * 0.28); // tweak if you want bigger/smaller
 
  return (
    <div
      className="grid w-full h-full"
      style={{
        gridTemplateColumns: "repeat(6, 1fr)",
        gridTemplateRows: "repeat(6, 1fr)",
        gap: `${(dims.gapPx / dims.innerW) * 100}%`,
      }}
    >
      {rows.map((r) =>
        cols.map((c) => {
          const sym = grid[r][c]; // { img, clearance? }
          const src = `${IMG_BASE}/${sym.img}`;
          return (
            <div key={`cell-${r}-${c}-${cycle}`} className="relative">
              <Image
                src={src}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
              />
              {isClearance(sym) && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                             font-extrabold select-none leading-none"
                  style={{
                    fontSize: `${fontPx}px`,
                    color: "var(--clearance-num-color, #dc2626)",
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  {sym.clearance}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
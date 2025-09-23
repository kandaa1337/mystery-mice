"use client";
import Image from "next/image";
import { IMG_BASE } from "./symbols";

export default function StaticGrid({ grid, dims, rows, cols, cycle }) {
  if (!grid || !dims) return null;
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
        cols.map((c) => (
          <div key={`cell-${r}-${c}-${cycle}`} className="relative">
            <Image
              src={`${IMG_BASE}/${grid[r][c]}`}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        ))
      )}
    </div>
  );
}

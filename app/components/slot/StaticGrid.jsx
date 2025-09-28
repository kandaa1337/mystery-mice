"use client";
import Image from "next/image";
import { IMG_BASE, isClearance } from "./symbols";
import ClearanceBadge from "../ClearanceBadge";

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
        cols.map((c) => {
          const sym = grid[r][c];
          const src = `${IMG_BASE}/${sym.img}`;

          return (
            <div key={`cell-${r}-${c}-${cycle}`} className="relative">
              {!isClearance(sym) ? (
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              ) : (
                // Center the layered badge in the square cell
                <div className="absolute inset-0 flex items-center justify-center">
                  <ClearanceBadge
                    digit={sym.clearance}
                    size="95%"
                    offset="-7px"
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

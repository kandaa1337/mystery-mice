"use client";
import Image from "next/image";

export default function LinesOverlay({ dims }) {
  if (!dims) return null;
  const { cellW, gapPx } = dims;
  const lineW = Math.max(2, Math.min(12, Math.round(gapPx)));

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {[1, 2, 3, 4, 5].map((cut, i) => {
        const left = cut * cellW + (cut - 1) * gapPx + gapPx / 2 - lineW / 2;
        return (
          <div
            key={`vline-${i}`}
            className="absolute top-0 h-full"
            style={{ left: `${left}px`, width: `${lineW}px` }}
          >
            <Image
              src="/ui/line.png"
              alt="Separator"
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        );
      })}
    </div>
  );
}

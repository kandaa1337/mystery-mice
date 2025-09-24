// app/components/slot/WinOverlay.jsx
"use client";

export default function WinOverlay({ dims, marks }) {
  if (!dims || !marks?.length) return null;
  const { cellW, cellH, gapPx } = dims;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {marks.map(({ r, c }, i) => {
        const left = Math.round(c * (cellW + gapPx));
        const top = Math.round(r * (cellH + gapPx));
        return (
          <div
            key={`${r}-${c}-${i}`}
            className="absolute rounded-xl ring-4 ring-yellow-400/80 bg-yellow-200/20 animate-pulse"
            style={{ left, top, width: cellW, height: cellH }}
          />
        );
      })}
    </div>
  );
}

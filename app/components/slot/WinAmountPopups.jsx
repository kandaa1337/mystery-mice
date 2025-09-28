"use client";

export default function WinAmountPopups({ dims, items = [], playKey }) {
  if (!dims || !items?.length) return null;
  const { cellW, cellH, gapPx } = dims;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {items.map(({ r, c, amount }, i) => {
        const left = Math.round(c * (cellW + gapPx));
        const top = Math.round(r * (cellH + gapPx));
        return (
          <div
            key={`${r}-${c}-${i}-${playKey}`}
            className="absolute"
            style={{ left, top, width: cellW, height: cellH }}
          >
            <div
              className="
                absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                font-extrabold select-none win-amount-pop
                drop-shadow-[0_2px_0_rgba(0,0,0,.9)]
                text-sm md:text-base lg:text-lg
                text-green-400
              "
            >
              ${Number(amount).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// app/components/slot/PlayPieces.jsx
"use client";
import Image from "next/image";
import { IMG_BASE, isClearance } from "./symbols";
 
export default function PlayPieces({ pieces, setPieceRef }) {
  return pieces.map((p) => {
    const src = `${IMG_BASE}/${p.sym.img}`;
    const fontPx = Math.round(p.h * 0.28);
    return (
      <div
        key={p.id}
        ref={setPieceRef(p.id)}
        className="absolute z-10"
        style={{
          left: `${p.x}px`,
          top: `${p.y}px`,
          width: `${p.w}px`,
          height: `${p.h}px`,
          transform: "translateY(0)",
          transformOrigin: "50% 100%",
          willChange: "transform",
        }}
      >
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
        {isClearance(p.sym) && (
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
            {p.sym.clearance}
          </div>
        )}
      </div>
    );
  });
}
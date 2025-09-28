"use client";
import Image from "next/image";
import { IMG_BASE, isClearance } from "./symbols";
import ClearanceBadge from "../ClearanceBadge";

export default function PlayPieces({ pieces, setPieceRef }) {
  return pieces.map((p) => {
    const src = `${IMG_BASE}/${p.sym.img}`;

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
        {!isClearance(p.sym) ? (
          <Image src={src} alt="" fill className="object-contain" sizes="100vw" priority />
        ) : (
          // Use the layered badge for falling/animated pieces too
          <ClearanceBadge digit={p.sym.clearance} size="100%" />
        )}
      </div>
    );
  });
}

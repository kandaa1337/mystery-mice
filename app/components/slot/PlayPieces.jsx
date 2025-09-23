"use client";
import Image from "next/image";
import { IMG_BASE } from "./symbols";

export default function PlayPieces({ pieces, setPieceRef }) {
  return pieces.map((p) => (
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
        src={`${IMG_BASE}/${p.img}`}
        alt=""
        fill
        className="object-contain"
        sizes="100vw"
        loading="eager"
        priority
      />
    </div>
  ));
}

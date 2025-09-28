// app/components/slot/WinFXLayer.jsx
"use client";

import { useEffect, useState } from "react";
import { IMG_BASE } from "./symbols";
import LetterFX from "../LetterFX";
import CigaretteFX from "../CigaretteFX";
import CapFX from "../CapFX";
import { assetPath } from "../../lib/assetPath";

/* ===== Durations (ms) =====
   All FX now start immediately at t=0.
   SlotBoard waits for the longest FX based on durationForFx(). */
const LETTER_UNDER_FRAMES = 7;
const LETTER_UNDER_MS = LETTER_UNDER_FRAMES * 70; // 490
const LETTER_WAIT_MS = 500;

const FIRE_FRAMES = 8;
const FIRE_FRAME_MS = 70;
const FIRE_TOTAL_MS = FIRE_FRAMES * FIRE_FRAME_MS; // 560

const CIG_UNDER_FRAMES = 3;
const CIG_UNDER_MS = CIG_UNDER_FRAMES * 90; // 270
const CIG_WAIT_MS = 500;

const LETTER_TOTAL_MS = LETTER_UNDER_MS + LETTER_WAIT_MS + FIRE_TOTAL_MS; // 1550
const CIG_TOTAL_MS = CIG_UNDER_MS + CIG_WAIT_MS + FIRE_TOTAL_MS; // 1330
const CLEAR_TOTAL_MS = FIRE_TOTAL_MS; // 560
const CAP_TOTAL_MS = 1550; // match letters

// GIF symbols (start instantly, show for 2s)
const GIF_TOTAL_MS = 2500; // police/mafia/detective

/** Public duration (ms) used by SlotBoard to pause while FX plays */
export function durationForFx(imgName) {
  if (imgName === "A.png" || imgName === "K.png" || imgName === "Q.png")
    return LETTER_TOTAL_MS;
  if (imgName === "cigarate.png") return CIG_TOTAL_MS;
  if (imgName === "level_clearance.png") return CLEAR_TOTAL_MS;
  if (imgName === "cap.png") return CAP_TOTAL_MS;

  // New GIF-based mice
  if (imgName === "police_mice.png") return GIF_TOTAL_MS;
  if (imgName === "mafia_mice.png") return GIF_TOTAL_MS;
  if (imgName === "detective_mice.png") return GIF_TOTAL_MS;

  return 300; // fallback pulse for any non-FX symbol
}

function cellRect(dims, r, c) {
  const { cellW, cellH, gapPx } = dims;
  return {
    left: Math.round(c * (cellW + gapPx)),
    top: Math.round(r * (cellH + gapPx)),
    width: cellW,
    height: cellH,
  };
}

export default function WinFXLayer({ dims, items = [], playKey }) {
  if (!dims || !items.length) return null;

  // All FX render immediately at t=0
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {items.map(({ r, c, sym }, i) => {
        const rect = cellRect(dims, r, c);
        const name = sym?.img;

        const isLetter =
          name === "A.png" || name === "K.png" || name === "Q.png";
        const isCig = name === "cigarate.png";
        const isClearance = name === "level_clearance.png";
        const isCap = name === "cap.png";

        const isPolice = name === "police_mice.png";
        const isMafia = name === "mafia_mice.png";
        const isDetective = name === "detective_mice.png";

        return (
          <div
            key={`${r}-${c}-${i}-${playKey}`}
            className="absolute grid place-items-center"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }}
          >
            {isLetter ? (
              <LetterFX
                letterSrc={`${IMG_BASE}/${name}`}
                size="100%"
                playKey={playKey}
                underFrames={LETTER_UNDER_FRAMES}
                fireFrames={FIRE_FRAMES}
                underFrameMs={70}
                fireFrameMs={FIRE_FRAME_MS}
                pauseMs={LETTER_WAIT_MS}
              />
            ) : isCig ? (
              <CigaretteFX
                symbolSrc={`${IMG_BASE}/${name}`}
                size="100%"
                playKey={playKey}
                particleFrames={CIG_UNDER_FRAMES}
                particleFrameMs={90}
                pauseMs={CIG_WAIT_MS}
                fireFrames={FIRE_FRAMES}
                fireFrameMs={FIRE_FRAME_MS}
              />
            ) : isCap ? (
              <CapFX
                symbolSrc={`${IMG_BASE}/${name}`}
                size="100%"
                playKey={playKey}
              />
            ) : isPolice ? (
              <SymbolGifFX
                size="100%"
                playKey={playKey}
                basePng={`${IMG_BASE}/police_mice.png`}
                gifSrc={`${IMG_BASE}/police.gif`}
              />
            ) : isMafia ? (
              <SymbolGifFX
                size="100%"
                playKey={playKey}
                basePng={`${IMG_BASE}/mafia_mice.png`}
                gifSrc={`${IMG_BASE}/mafia.gif`}
              />
            ) : isDetective ? (
              <SymbolGifFX
                size="100%"
                playKey={playKey}
                basePng={`${IMG_BASE}/detective_mice.png`}
                gifSrc={`${IMG_BASE}/detective.gif`}
              />
            ) : isClearance ? (
              <FireOnlyFX
                size="100%"
                playKey={playKey}
                frames={FIRE_FRAMES}
                frameMs={FIRE_FRAME_MS}
              />
            ) : (
              // Fallback: small pulse so non-animated symbols still do something
              <div className="w-full h-full rounded-xl ring-4 ring-yellow-300/70 bg-yellow-200/10 animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Simple 8-frame fire burst (clearance removal), starts immediately */
function FireOnlyFX({
  size = "100%",
  playKey = 0,
  frames = FIRE_FRAMES,
  frameMs = FIRE_FRAME_MS,
}) {
  const [idx, setIdx] = useState(1); // start at 1 immediately

  useEffect(() => {
    let i = 1;
    setIdx(1);
    const fireTimer = setInterval(() => {
      i += 1;
      if (i > frames) {
        clearInterval(fireTimer);
        return;
      }
      setIdx(i);
    }, frameMs);

    return () => {
      clearInterval(fireTimer);
      setIdx(1);
    };
  }, [playKey, frames, frameMs]);

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath(`/ui/fire/fire-${idx}.png`)}
        alt=""
        className="absolute inset-0 m-auto w-[72%] h-[72%] object-contain pointer-events-none"
      />
    </div>
  );
}

/** Generic PNG→GIF overlay for mice symbols (police/mafia/detective).
 *  Starts immediately, shows PNG until GIF decodes (fade-in). */
function SymbolGifFX({ size = "100%", playKey = 0, basePng, gifSrc }) {
  const [gifLoaded, setGifLoaded] = useState(false);

  useEffect(() => {
    setGifLoaded(false);
  }, [playKey, basePng, gifSrc]);

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {/* Show PNG instantly at t=0 so there’s never a blank gap */}
      {!gifLoaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={basePng}
          alt=""
          className="absolute inset-0 m-auto w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* GIF starts immediately; fades in when decoded */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${gifSrc}?v=${playKey}`}
        alt=""
        onLoad={() => setGifLoaded(true)}
        className="absolute inset-0 m-auto w-full h-full object-contain pointer-events-none"
        style={{
          opacity: gifLoaded ? 1 : 0,
          transition: "opacity 120ms ease-out",
        }}
      />
    </div>
  );
}




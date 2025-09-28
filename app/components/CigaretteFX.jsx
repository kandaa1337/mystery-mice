"use client";
import { useEffect, useRef, useState } from "react";
import { assetPath } from "../lib/assetPath";

/**
 * CigaretteFX (UNDER → WAIT → FIRE)
 * - UNDER lasts exactly `underMs` and loops particles during that time.
 * - If `lockPreFireSync` is true, we keep UNDER+PAUSE = 990ms so all symbols explode together.
 */
export default function CigaretteFX({
  symbolSrc,
  size = "240px",
  playKey = 0,

  // particles
  particleFrames = 3,
  particleFrameMs = 90,

  // timings
  underMs = 7 * 70, // ← make this longer/shorter as needed (default 490ms)
  pauseMs = 500, // used only when lockPreFireSync = false
  fireFrames = 8,
  fireFrameMs = 70,

  // sync
  lockPreFireSync = true,
  preFireTotalMs = 990, // UNDER + PAUSE target when locking sync
}) {
  const [phase, setPhase] = useState("idle"); // idle | under | wait | fire | done
  const [pIdx, setPIdx] = useState(1); // 1..particleFrames (loops)
  const [fIdx, setFIdx] = useState(1); // 1..fireFrames
  const timers = useRef({});
  const inner = "w-[72%] h-[72%] object-contain";

  // compute pause respecting sync preference
  const actualPauseMs = lockPreFireSync
    ? Math.max(preFireTotalMs - underMs, 0)
    : pauseMs;

  useEffect(() => {
    cleanup();
    setPhase("under");
    setPIdx(1);
    setFIdx(1);

    // UNDER: loop particles for exactly `underMs`
    if (particleFrames > 0) {
      timers.current.particles = setInterval(() => {
        setPIdx((n) => (n % particleFrames) + 1);
      }, particleFrameMs);
    }
    timers.current.underEnd = setTimeout(() => {
      // end UNDER
      if (timers.current.particles) clearInterval(timers.current.particles);
      setPhase("wait");
      timers.current.pause = setTimeout(() => startFire(), actualPauseMs);
    }, underMs);

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, underMs, actualPauseMs, particleFrames, particleFrameMs]);

  function startFire() {
    setPhase("fire");
    let j = 1;
    timers.current.fire = setInterval(() => {
      j += 1;
      if (j > fireFrames) {
        clearInterval(timers.current.fire);
        setPhase("done");
        return;
      }
      setFIdx(j);
    }, fireFrameMs);
  }

  function cleanup() {
    const t = timers.current;
    if (t.particles) clearInterval(t.particles);
    if (t.underEnd) clearTimeout(t.underEnd);
    if (t.pause) clearTimeout(t.pause);
    if (t.fire) clearInterval(t.fire);
    timers.current = {};
  }

  const particleSrc = assetPath(`/ui/cigarette/glowing_particles_${pIdx}.png`);

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {/* CIGARETTE: moves only during UNDER, holds during WAIT, visible during FIRE */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={symbolSrc}
        alt="cigarate"
        className={[
          "absolute inset-0 m-auto z-10",
          inner,
          phase === "under" ? "fx-cig-circle-scale" : "",
        ].join(" ")}
        style={{
          animationDuration: phase === "under" ? `${underMs}ms` : undefined,
          transformOrigin: "50% 80%",
        }}
        key={`cig-${playKey}-${phase}`}
      />

      {/* UNDER: particles */}
      {phase === "under" && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={particleSrc}
            alt=""
            className={inner}
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = assetPath(`/ui/glowing_particles/particle_${pIdx}.png`);
              }
            }}
            style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.35))" }}
          />
        </div>
      )}

      {/* FIRE: fire-1..N overlay */}
      {phase === "fire" && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(`/ui/fire/fire-${fIdx}.png`)} alt="" className={inner} />
        </div>
      )}

      {/* Scoped keyframes */}
      <style jsx>{`
        /* Small circular drift + gentle scale up/down */
        @keyframes fx-cig-circle-scale {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate(3%, -3%) scale(1.04) rotate(-1deg);
          }
          40% {
            transform: translate(0%, -5%) scale(1.08) rotate(0deg);
          }
          60% {
            transform: translate(-3%, -3%) scale(1.06) rotate(1deg);
          }
          80% {
            transform: translate(-2%, 0%) scale(1.03) rotate(0deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
        }
        .fx-cig-circle-scale {
          animation-name: fx-cig-circle-scale;
          animation-timing-function: ease-in-out;
          animation-iteration-count: 1;
          animation-fill-mode: both; /* hold pose into WAIT */
        }
      `}</style>
    </div>
  );
}





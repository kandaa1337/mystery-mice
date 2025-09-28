"use client";
import { useEffect, useRef, useState } from "react";
import { assetPath } from "../lib/assetPath";

/**
 * CapFX (shake + particles → wait → fire-1..8 → end hidden)
 * Particles run only during SHAKE and stop at exactly shakeMs.
 * Sync rule with letters: shakeMs + pauseMs = 990ms (then fire).
 */
export default function CapFX({
  symbolSrc,
  size = "240px",
  playKey = 0,

  // particles
  particleFrames = 5,
  particleFrameMs = 70,

  // timings (keep shakeMs + pauseMs === 990 to sync with others)
  shakeMs = 10 * 70, // 490ms
  pauseMs = 500, // 490 + 500 = 990 → then fire
  fireFrames = 8,
  fireFrameMs = 70,

  // motion
  amplitudePct = 4,
}) {
  const [phase, setPhase] = useState("idle"); // idle | shake | wait | fire | done
  const [pFrame, setPFrame] = useState(1);
  const [fireFrame, setFireFrame] = useState(1);
  const timers = useRef({
    particleInterval: null,
    toWait: null,
    toFire: null,
    fireInterval: null,
    end: null,
  });

  useEffect(() => {
    cleanup();
    setPhase("shake");
    setPFrame(1);
    setFireFrame(1);

    // Particles loop ONLY during the shake stage
    timers.current.particleInterval = setInterval(() => {
      setPFrame((n) => (n >= particleFrames ? 1 : n + 1));
    }, particleFrameMs);

    // At shake end: stop particles immediately and go to "wait"
    timers.current.toWait = setTimeout(() => {
      if (timers.current.particleInterval) {
        clearInterval(timers.current.particleInterval);
        timers.current.particleInterval = null;
      }
      setPhase("wait");
    }, shakeMs);

    // After wait: start fire
    timers.current.toFire = setTimeout(() => {
      setPhase("fire");
      let i = 1;
      setFireFrame(1);
      timers.current.fireInterval = setInterval(() => {
        i += 1;
        if (i > fireFrames) {
          clearInterval(timers.current.fireInterval);
          timers.current.fireInterval = null;
          return;
        }
        setFireFrame(i);
      }, fireFrameMs);
    }, shakeMs + pauseMs);

    // End hidden
    const total = shakeMs + pauseMs + fireFrames * fireFrameMs;
    timers.current.end = setTimeout(() => {
      setPhase("done");
      cleanup();
    }, total);

    return cleanup;
  }, [
    playKey,
    particleFrames,
    particleFrameMs,
    shakeMs,
    pauseMs,
    fireFrames,
    fireFrameMs,
  ]);

  function cleanup() {
    const t = timers.current;
    if (t.particleInterval) clearInterval(t.particleInterval);
    if (t.fireInterval) clearInterval(t.fireInterval);
    if (t.toWait) clearTimeout(t.toWait);
    if (t.toFire) clearTimeout(t.toFire);
    if (t.end) clearTimeout(t.end);
    timers.current = {
      particleInterval: null,
      toWait: null,
      toFire: null,
      fireInterval: null,
      end: null,
    };
  }

  const inner = "w-[72%] h-[72%] object-contain";
  const showSymbol = phase !== "done";
  const showParticles = phase === "shake"; // ← only during SHAKE
  const showFire = phase === "fire";

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {showSymbol && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={symbolSrc}
          alt="cap"
          className={[
            "absolute inset-0 m-auto z-10",
            inner,
            phase === "shake" ? "fx-cap-shake" : "",
            phase === "fire" ? "fx-cap-blink" : "",
          ].join(" ")}
          style={{
            transformOrigin: "50% 80%",
            animationDuration:
              phase === "shake"
                ? `${shakeMs}ms`
                : phase === "fire"
                ? `${fireFrames * fireFrameMs}ms`
                : undefined,
          }}
          key={`cap-${playKey}-${phase}`}
        />
      )}

      {showParticles && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(`/ui/glowing_particles/particle_${pFrame}.png`)}
            alt=""
            className={inner}
            style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.35))" }}
            draggable={false}
          />
        </div>
      )}

      {showFire && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(`/ui/fire/fire-${fireFrame}.png`)}
            alt=""
            className={inner}
            draggable={false}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fx-cap-shake-kf {
          0% {
            transform: translateX(0%) rotate(0deg);
          }
          8% {
            transform: translateX(-${amplitudePct}%) rotate(-2deg);
          }
          16% {
            transform: translateX(${amplitudePct}%) rotate(2deg);
          }
          24% {
            transform: translateX(-${amplitudePct * 0.85}%) rotate(-1.8deg);
          }
          32% {
            transform: translateX(${amplitudePct * 0.85}%) rotate(1.8deg);
          }
          40% {
            transform: translateX(-${amplitudePct * 0.7}%) rotate(-1.5deg);
          }
          48% {
            transform: translateX(${amplitudePct * 0.7}%) rotate(1.5deg);
          }
          56% {
            transform: translateX(-${amplitudePct * 0.5}%) rotate(-1.2deg);
          }
          64% {
            transform: translateX(${amplitudePct * 0.5}%) rotate(1.2deg);
          }
          72% {
            transform: translateX(-${amplitudePct * 0.3}%) rotate(-0.8deg);
          }
          80% {
            transform: translateX(${amplitudePct * 0.3}%) rotate(0.8deg);
          }
          92% {
            transform: translateX(0%) rotate(0deg);
          }
          100% {
            transform: translateX(0%) rotate(0deg);
          }
        }
        .fx-cap-shake {
          animation-name: fx-cap-shake-kf;
          animation-timing-function: ease-in-out;
          animation-iteration-count: 1;
          animation-fill-mode: both;
        }

        @keyframes fx-cap-blink-kf {
          0% {
            opacity: 1;
          }
          20% {
            opacity: 0;
          }
          55% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .fx-cap-blink {
          animation-name: fx-cap-blink-kf;
          animation-timing-function: ease-in-out;
          animation-iteration-count: 1;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}




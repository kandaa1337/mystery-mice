// app/components/GameLoading.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import { assetPath } from "../lib/assetPath";

export default function GameLoading({ durationMs = 3500, onComplete }) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const pct = Math.floor(t * 100);
      setProgress(pct);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, onComplete]);

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('${assetPath("/ui/loading.png")}')` }}
    >
      <div className="relative w-3/4 max-w-4xl">
        <img
          src={assetPath("/ui/progressbar.png")}
          alt="progress frame"
          className="absolute top-0 left-0 w-full z-10"
        />

        <img
          src={assetPath("/ui/progress_hollow.png")}
          alt="progress hollow"
          className="absolute top-12 left-15 w-[86%] z-20"
        />

        <div
          className="absolute left-15 top-4 h-[100px] w-[90%] overflow-hidden z-20"
          style={{ width: `${progress + 10}%` }}
        >
          <img
            src={assetPath("/ui/progress_active.png")}
            alt="progress active"
            className="w-[78%] h-full object-cover"
          />
        </div>

        <div
          className="absolute ml-30 top-4 h-[100px] items-center z-40"
          style={{ left: `${progress * 0.79}%`, transform: "translateX(-50%)" }}
        >
          <img
            src={assetPath("/ui/progress_fire.png")}
            alt="progress fire"
            className="relative h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
// app/components/GameLoading.jsx
"use client";
import { useEffect, useRef, useState } from "react";

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
      className="w-screen h-screen flex items-center justify-center bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: `url('/ui/loading.png')` }}
    >
      <div className="relative w-11/12 max-w-4xl">
        <img src="/ui/progressbar.png" alt="frame" className="absolute top-0 left-0 w-full z-10" />
        <img src="/ui/progress_hollow.png" alt="hollow" className="absolute top-12 left-4 w-[86%] z-20" />

        <div
          className="absolute top-4 left-4 h-[100px] z-30 overflow-hidden"
          style={{ width: `calc(${progress}% + 10%)` }}
        >
          <img src="/ui/progress_active.png" alt="active" className="w-[85%] h-full object-cover" />
        </div>

        <div
          className="absolute top-8 h-[100px] flex items-center z-40"
          style={{ left: `calc(${progress}% + 10%)`, transform: "translateX(-50%)" }}
        >
          <img src="/ui/progress_fire.png" alt="flame" className="h-16" />
        </div>
      </div>
    </div>
  );
}

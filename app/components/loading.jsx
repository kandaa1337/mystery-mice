import React, { useEffect, useState } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : 100));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('/ui/loading.png')` }}
    >
      <div className="relative w-3/4 max-w-4xl">
        <img src="/ui/progressbar.png" alt="progress frame" className="absolute top-0 left-0 w-full z-10" />

        <img src="/ui/progress_hollow.png" alt="progress hollow" className="absolute top-12 left-15 w-[86%] z-20" />

        <div className="absolute left-15 top-4 h-[100px] w-[80%] overflow-hidden z-30" style={{ width: `${progress +10}%` }}>
          <img src="/ui/progress_active.png" alt="progress active" className="w-[85%] h-full object-cover" />
        </div>

        <div
          className="absolute left-15 top-8 h-[100px] flex items-center z-40"
          style={{ left: `${progress + 10}%`, transform: "translateX(-50%)" }}
        >
          <img src="/ui/progress_fire.png" alt="progress fire" className="h-16" />
        </div>
      </div>
    </div>
  );
}
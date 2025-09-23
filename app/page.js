// app/page.js
"use client";
import { useState } from "react";
import SlotBoard from "./components/SlotBoard";
import GameLoading from "./components/GameLoading";

export default function Home() {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return <GameLoading onComplete={() => setReady(true)} />;
  }

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-[#0b0f1a]">
      {/* Background image (no crop) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/ui/city.png')" }}
      />
      {/* Foreground game */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
        <SlotBoard />
      </div>
    </main>
  );
}

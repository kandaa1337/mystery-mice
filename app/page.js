"use client";
import { useState, useRef } from "react";
import SlotBoard from "./components/SlotBoard";
import BetControls from "./components/BetControls";
import GameLoading from "./components/GameLoading";

export default function Home() {
  const [ready, setReady] = useState(false);
  const slotRef = useRef(null);

  if (!ready) {
    return <GameLoading onComplete={() => setReady(true)} />;
  }

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-[#0b0f1a] flex flex-col items-center">

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/ui/city.png')" }}
      />

      <div className="absolute bottom-0 w-[75%] bg-black-800 z-0">
        <img
          src="/ui/bet_background.png"
          alt="bet background"
          className="w-full object-cover"
        />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-2">
        <SlotBoard ref={slotRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <BetControls
          credit={100000}
          bet={2}
          onSpin={() => slotRef.current?.tumbleAll()}
        />
      </div>
    </main>
  );
}

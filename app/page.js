// app/page.js
"use client";
import { useCallback, useRef, useState } from "react";
import SlotBoard from "./components/SlotBoard";
import BetControls from "./components/BetControls";
import GameLoading from "./components/GameLoading";

export default function Home() {
  const [ready, setReady] = useState(false);
  const slotRef = useRef(null);

  const [credit, setCredit] = useState(100000);
  const [totalBet, setTotalBet] = useState(24);
  const [boardState, setBoardState] = useState("idle");
  const [roundWin, setRoundWin] = useState(0);

  const handleSpin = useCallback(
    (wager, options = {}) => {
      if (boardState !== "idle") return false;

      const spinBet = typeof wager === "number" ? wager : totalBet;
      if (credit < spinBet) return false;

      const turboActive = !!options?.turbo;
      const speedMultiplier = turboActive ? 3 : 1;
      const spinStarted = !!slotRef.current?.tumbleAll?.({ speedMultiplier });
      if (!spinStarted) return false;

      setBoardState("spinning");
      setRoundWin(0);
      console.log("Spin!", {
        creditBefore: credit,
        wager: spinBet,
        turbo: turboActive,
      });
      setCredit((c) => c - spinBet);
      setTotalBet(spinBet);
      return true;
    },
    [boardState, credit, totalBet]
  );

  const handleWin = useCallback((amount) => {
    // add step win to the running round win and to credit
    setRoundWin((w) => w + amount);
    setCredit((c) => c + amount);
  }, []);

  const handleBoardStateChange = useCallback((state) => {
    setBoardState(state || "idle");
  }, []);

  // One source of truth for both SlotBoard and BetControls
  const BOARD_MAX_PX = 1070; // change once, both update
  const BOARD_VW = 95; // e.g. 70 if you made the board smaller

  if (!ready) return <GameLoading onComplete={() => setReady(true)} />;

  return (
    <main className="relative aspect-16/9 h-dvh w-dvw overflow-hidden bg-[#0b0f1a] flex flex-col items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/ui/city.png')" }}
      />

      <div className="absolute bottom-0 w-[75%] z-0">
        <img
          src="/ui/bet_background.png"
          alt="bet background"
          className="w-full object-cover"
        />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-2">
        <SlotBoard
          ref={slotRef}
          onWin={handleWin}
          totalBet={totalBet}
          onStateChange={handleBoardStateChange}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <BetControls
          credit={credit}
          roundWin={roundWin}
          onSpin={handleSpin}
          maxWidth={BOARD_MAX_PX}
          vwWidth={BOARD_VW}
          setTotalBet={setTotalBet}
          canSpin={boardState === "idle"}
        />
      </div>
    </main>
  );
}

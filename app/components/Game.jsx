"use client";
import { useCallback, useRef, useState } from "react";
import BetControls from "./BetControls";
import SlotBoard from "./SlotBoard";

export default function Game() {
  const [credit, setCredit] = useState(100000);
  const [totalBet, setTotalBet] = useState(24);
  const [boardState, setBoardState] = useState("idle");
  const slotRef = useRef(null);

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
      console.log("Spin!", { creditBefore: credit, wager: spinBet, turbo: turboActive });
      setCredit((c) => c - spinBet);
      setTotalBet(spinBet);
      return true;
    },
    [boardState, credit, totalBet]
  );

  const handleWin = useCallback((amount) => {
    console.log("Win!", { amount });
    setCredit((c) => c + amount);
  }, []);

  const handleBoardStateChange = useCallback((state) => {
    setBoardState(state || "idle");
  }, []);

  return (
    <div>
      <BetControls
        credit={credit}
        totalBet={totalBet}
        setTotalBet={setTotalBet}
        onSpin={handleSpin}
        canSpin={boardState === "idle"}
      />
      <SlotBoard
        totalBetValue={100}
        onStateChange={(state) => console.log("Board state:", state)}
        onWin={(amount) => console.log("Payout:", amount)}
        
      />
    </div>
  );
}

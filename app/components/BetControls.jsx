// app/components/BetControls.jsx
"use client";
import Image from "next/image";
import { useState } from "react";

export default function BetControls({ credit = 100000, bet = 2, onSpin }) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      onSpin?.();
      setIsSpinning(false);
    }, 0);
  };

  return (
    <div className="relative w-full flex items-center justify-between px-3 sm:px-6 md:px-10 py-2">
      {/*left*/}
      <div className="flex flex-col items-start gap-3 ml-60">
        <div className="flex items-center gap-3">
          <button className="relative w-[28px] h-[28px] top-1 sm:w-[28px] sm:h-[28px]">
            <Image
              src="/ui/settings.png"
              alt="menu"
              fill
              className="object-contain"
            />
          </button>
          <button className="relative w-[44px] h-[44px] top-6 sm:w-[50px] sm:h-[50px]">
            <Image
              src="/ui/info.png"
              alt="info"
              fill
              className="object-contain"
            />
          </button>
        </div>
        <button className="relative w-[32px] h-[32px] bottom-1 sm:w-[28px] sm:h-[28px]">
          <Image
            src="/ui/settings.png"
            alt="sound"
            fill
            className="object-contain"
          />
        </button>
      </div>

      {/*center*/}
      <div className="flex flex-col items-start font-bold leading-tight text-[20px] ml-6">
        <div>
          CREDIT{" "}
          <span className="text-yellow-400 text-[22px]">
            ${credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          BET{" "}
          <span className="text-orange-400">
            ${bet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/*center for space*/}
      <div className="flex-1 ml-5 flex">
        <p
          className="text-white mb-8 font-extrabold uppercase text-center leading-none"
          style={{ fontSize: "clamp(24px, 3.5vw, 25px)" }}
        >
          HOLD SPACE FOR TURBO SPINS
        </p>
      </div>

      {/*right*/}
      <div className="flex items-center mr-75 gap-3 sm:gap-5">
        <button className="relative w-[50px] h-[50px] sm:w-[50px] sm:h-[50px]">
          <Image
            src="/ui/lessbet.png"
            alt="lessbet"
            fill
            className="object-contain"
          />
        </button>
        <div className="-mt-4">
          <button
            onClick={handleSpin}
            className="relative flex items-center justify-center 
                    w-[150px] h-[150px] 
                    sm:w-[150px] sm:h-[150px] 
                    md:w-[150px] md:h-[150px] 
                    overflow-hidden"
          >
            <Image
              src="/ui/play_button.png"
              alt="spin"
              fill
              className="object-contain"
            />
            <Image
              src="/ui/play_button_animated.png"
              alt="spin"
              fill
              className="object-contain ml-3 mt-3"
            />
          </button>
        </div>
        <button className="relative w-[50px] h-[50px] sm:w-[50px] sm:h-[50px]">
          <Image
            src="/ui/addbet.png"
            alt="addbet"
            fill
            className="object-contain"
          />
        </button>
      </div>
    </div>
  );
}

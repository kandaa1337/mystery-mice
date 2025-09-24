// app/components/BetControls.jsx
"use client";
import Image from "next/image";
import { useState } from "react";

export default function BetControls({
  credit = 100000,
  bet = 2,
  onSpin,
  // Match SlotBoard’s width so both scale together
  maxWidth = 1070,
  vwWidth = 95,
}) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      onSpin?.();
      setIsSpinning(false);
    }, 0);
  };

  // Reusable sizes with clamp() = scales across device sizes
  const ICON_WH = "clamp(24px, 4.5vw, 36px)";
  const BIG_BTN_WH = "clamp(110px, 16vw, 160px)";
  const NUM_FONT = "clamp(18px, 2.4vw, 22px)";
  const TIP_FONT = "clamp(14px, 2.2vw, 24px)";

  return (
    <div className="w-full pointer-events-auto">
      {/* Centered container that matches SlotBoard width */}
      <div
        className="mx-auto px-3 sm:px-4 md:px-6 py-2"
        style={{ width: `min(${vwWidth}vw, ${maxWidth}px)` }}
      >
        {/* ===== Tablet & Desktop (md+) ===== */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-x-8 lg:gap-x-16 xl:gap-x-24">
          {/* LEFT */}
          <div className="flex flex-col items-start gap-3">
            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/settings.png"
                alt="menu"
                fill
                className="object-contain"
              />
            </button>
            <button
              className="relative"
              style={{
                width: `calc(${ICON_WH} * 1.4)`,
                height: `calc(${ICON_WH} * 1.4)`,
              }}
            >
              <Image
                src="/ui/info.png"
                alt="info"
                fill
                className="object-contain"
              />
            </button>
            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/settings.png"
                alt="sound"
                fill
                className="object-contain"
              />
            </button>
          </div>

          {/* CENTER */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <p
              className="text-white font-extrabold uppercase text-center leading-none"
              style={{ fontSize: TIP_FONT }}
            >
              HOLD SPACE FOR TURBO SPINS
            </p>
            <div className="flex items-center gap-8 lg:gap-12 flex-wrap justify-center md:justify-start">
              <div className="font-bold text-white">
                CREDIT
                <span
                  className="text-yellow-400 pl-2"
                  style={{ fontSize: NUM_FONT }}
                >
                  $
                  {credit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="font-bold text-white">
                BET
                <span
                  className="text-orange-400 pl-2"
                  style={{ fontSize: NUM_FONT }}
                >
                  ${bet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 sm:gap-5 justify-end">
            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/lessbet.png"
                alt="lessbet"
                fill
                className="object-contain"
              />
            </button>

            <div>
              <button
                onClick={handleSpin}
                className="relative flex items-center justify-center overflow-hidden"
                style={{ width: BIG_BTN_WH, height: BIG_BTN_WH }}
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

            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/addbet.png"
                alt="addbet"
                fill
                className="object-contain"
              />
            </button>
          </div>
        </div>

        {/* ===== Mobile (under md) ===== */}
        <div className="md:hidden flex flex-col items-center gap-3">
          <p
            className="text-white font-extrabold uppercase text-center leading-none"
            style={{ fontSize: TIP_FONT }}
          >
            HOLD SPACE FOR TURBO SPINS
          </p>

          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="font-bold">
              CREDIT{" "}
              <span className="text-yellow-400" style={{ fontSize: NUM_FONT }}>
                $
                {credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="font-bold">
              BET
              <span className="text-orange-400" style={{ fontSize: NUM_FONT }}>
                ${bet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Buttons row: less | BIG spin | add */}
          <div className="w-full flex items-center justify-between">
            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/lessbet.png"
                alt="lessbet"
                fill
                className="object-contain"
              />
            </button>

            <button
              onClick={handleSpin}
              className="relative flex items-center justify-center overflow-hidden"
              style={{ width: BIG_BTN_WH, height: BIG_BTN_WH }}
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

            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/addbet.png"
                alt="addbet"
                fill
                className="object-contain"
              />
            </button>
          </div>

          {/* Utility icons row */}
          <div className="flex items-center gap-5">
            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/settings.png"
                alt="menu"
                fill
                className="object-contain"
              />
            </button>
            <button
              className="relative"
              style={{
                width: `calc(${ICON_WH} * 1.2)`,
                height: `calc(${ICON_WH} * 1.2)`,
              }}
            >
              <Image
                src="/ui/info.png"
                alt="info"
                fill
                className="object-contain"
              />
            </button>
            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
            >
              <Image
                src="/ui/settings.png"
                alt="sound"
                fill
                className="object-contain"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

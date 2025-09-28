"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import GameRulesPopup from "./GameRulesPopup";
import SettingsPopup from "./SettingsPopup";
import { COIN_VALUES, LINES } from "./slot/constants";
export default function BetControls({
  credit = 100000,
  onSpin,
  maxWidth = 1070,
  vwWidth = 95,
  setTotalBet,
  canSpin = true,
}) {
  const [isSpinning, setIsSpinning] = useState(false);

  // единственный контроллер модалок
  // modal: null | "settings" | "rules" | "bet"
  const [modal, setModal] = useState(null);
  const [betAnchored, setBetAnchored] = useState(false); // где рисовать bet popup

  // для SettingsPopup (его внутренние контролы)
  const [totalBetSettings, setTotalBetSettings] = useState(2.0);

  const [bet, setBet] = useState(10);
  const [coinIndex, setCoinIndex] = useState(() => {
    const i = COIN_VALUES.indexOf(1.2); // default to $1.20 if present
    return i >= 0 ? i : COIN_VALUES.length - 1;
  });
  const coinValue = COIN_VALUES[coinIndex];
  const totalBet = bet * coinValue * LINES;

  // turbo по Space/Enter
  const turboHeldRef = useRef(false);

  // пробрасываем TOTAL BET наверх
  useEffect(() => {
    if (typeof setTotalBet === "function") setTotalBet(totalBet);
  }, [totalBet, setTotalBet]);

  // линейка TOTAL BET для +/- по общему знач.
  const allCombos = [];
  for (let c = 0; c < COIN_VALUES.length; c++) {
    for (let b = 1; b <= 10; b++) {
      allCombos.push({
        bet: b,
        coinIndex: c,
        totalBet: b * COIN_VALUES[c] * LINES,
      });
    }
  }
  const sortedCombos = allCombos.sort((a, b) => a.totalBet - b.totalBet);
  const currentIndex = sortedCombos.findIndex(
    (c) => c.bet === bet && c.coinIndex === coinIndex
  );

  // ресет локального "идёт спин", если извне можно крутить
  useEffect(() => {
    if (canSpin) {
      setIsSpinning(false);
      turboHeldRef.current = false;
    }
  }, [canSpin]);

  const handleSpin = useCallback(
    async (options = {}) => {
      if (!canSpin || isSpinning) return;
      if (credit < totalBet) return;
      setIsSpinning(true);
      const started = await Promise.resolve(onSpin?.(totalBet, options));
      if (started === false) setIsSpinning(false);
    },
    [canSpin, isSpinning, credit, totalBet, onSpin]
  );

  // хоткеи
  useEffect(() => {
    const shouldIgnoreTarget = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };

    const handleKeyDown = (event) => {
      if (event.code !== "Space" && event.code !== "Enter") return;
      if (shouldIgnoreTarget(event.target)) return;
      event.preventDefault();
      if (event.repeat) turboHeldRef.current = true;
      const turbo = turboHeldRef.current || event.repeat;
      void handleSpin({ turbo });
    };

    const handleKeyUp = (event) => {
      if (event.code !== "Space" && event.code !== "Enter") return;
      turboHeldRef.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleSpin]);

  // блокируем скролл фона при любой модалке
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    if (modal) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [modal]);

  const handleBetMax = () => {
    setBet(10);
    setCoinIndex(COIN_VALUES.length - 1);
  };

  // единый BET popup (якорный или фуллскрин)
  const BetPopup = ({ anchored = false }) => (
    <div
      className={
        anchored
          ? "absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-80 max-w-[84vw] bg-[#111] text-white rounded-lg shadow-2xl p-6 z-50"
          : "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      }
      role="dialog"
      aria-modal="true"
    >
      <div
        className={
          anchored
            ? ""
            : "w-full sm:w-[480px] bg-[#111] text-white rounded-t-2xl sm:rounded-2xl p-6 relative"
        }
      >
        <button
          onClick={() => setModal(null)}
          className="absolute right-3 top-3 text-2xl"
          aria-label="Close bet popup"
        >
          ✕
        </button>

        <h2 className="text-center text-yellow-400 font-extrabold text-lg mb-5">
          BET MULTIPLIER {LINES}x
        </h2>

        <div className="mb-8">
          <p className="text-center text-sm text-gray-300 mb-2">BET</p>
          <div className="flex items-center justify-between gap-4">
            <button
              disabled={bet <= 1}
              onClick={() => setBet((b) => Math.max(1, b - 1))}
              className="relative disabled:opacity-40"
              style={{ width: 60, height: 60 }}
            >
              <Image
                src="/ui/lessbet_popup.png"
                alt="-"
                fill
                className="object-contain"
              />
            </button>
            <div className="bg-black text-white text-lg font-bold px-6 py-4 rounded-md min-w-20 text-center">
              {bet}
            </div>
            <button
              disabled={bet >= 10}
              onClick={() => setBet((b) => Math.min(10, b + 1))}
              className="relative disabled:opacity-40"
              style={{ width: 60, height: 60 }}
            >
              <Image
                src="/ui/addbet_popup.png"
                alt="+"
                fill
                className="object-contain"
              />
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-center text-sm text-gray-300 mb-2">COIN VALUE</p>
          <div className="flex items-center justify-between gap-4">
            <button
              disabled={coinIndex <= 0}
              onClick={() => setCoinIndex((i) => Math.max(0, i - 1))}
              className="relative disabled:opacity-40"
              style={{ width: 60, height: 60 }}
            >
              <Image
                src="/ui/lessbet_popup.png"
                alt="-"
                fill
                className="object-contain"
              />
            </button>
            <div className="bg-black text-white text-lg font-bold px-6 py-4 rounded-md min-w-24 text-center">
              ${coinValue.toFixed(2)}
            </div>
            <button
              disabled={coinIndex >= COIN_VALUES.length - 1}
              onClick={() =>
                setCoinIndex((i) => Math.min(COIN_VALUES.length - 1, i + 1))
              }
              className="relative disabled:opacity-40"
              style={{ width: 60, height: 60 }}
            >
              <Image
                src="/ui/addbet_popup.png"
                alt="+"
                fill
                className="object-contain"
              />
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-center text-sm text-gray-300 mb-2">TOTAL BET</p>
          <div className="flex items-center justify-between gap-4">
            <button
              disabled={currentIndex <= 0}
              onClick={() => {
                if (currentIndex > 0) {
                  setBet(sortedCombos[currentIndex - 1].bet);
                  setCoinIndex(sortedCombos[currentIndex - 1].coinIndex);
                }
              }}
              className="relative disabled:opacity-40"
              style={{ width: 60, height: 60 }}
            >
              <Image
                src="/ui/lessbet_popup.png"
                alt="-"
                fill
                className="object-contain"
              />
            </button>
            <div className="bg-black text-white text-lg font-bold px-6 py-4 rounded-md min-w-28 text-center">
              ${totalBet.toFixed(2)}
            </div>
            <button
              disabled={currentIndex >= sortedCombos.length - 1}
              onClick={() => {
                if (currentIndex < sortedCombos.length - 1) {
                  setBet(sortedCombos[currentIndex + 1].bet);
                  setCoinIndex(sortedCombos[currentIndex + 1].coinIndex);
                }
              }}
              className="relative disabled:opacity-40"
              style={{ width: 60, height: 60 }}
            >
              <Image
                src="/ui/addbet_popup.png"
                alt="+"
                fill
                className="object-contain"
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleBetMax}
          className="w-full bg-green-500 hover:bg-green-600 py-3 rounded-lg font-extrabold text-lg"
        >
          BET MAX
        </button>
      </div>
    </div>
  );

  // размеры UI
  const ICON_WH = "clamp(24px, 4.5vw, 36px)";
  const BIG_BTN_WH = "clamp(96px, 18vw, 160px)";
  const NUM_FONT = "clamp(16px, 3.5vw, 22px)";
  const TIP_FONT = "clamp(12px, 3.6vw, 20px)";

  return (
    <div className="w-full pointer-events-auto relative">
      <div
        className="mx-auto px-3 sm:px-4 md:px-6 py-2"
        style={{ width: `min(${vwWidth}vw, ${maxWidth}px)` }}
      >
        {/* ===== Desktop ===== */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-x-8 lg:gap-x-16 xl:gap-x-24">
          {/* Left buttons */}
          <div className="flex flex-col items-start gap-3">
            <button
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
              onClick={() => setModal("settings")}
              aria-label="Open settings"
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
              onClick={() => setModal("rules")}
              aria-label="Open rules"
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
              aria-label="Toggle sound"
            >
              <Image
                src="/ui/sound.png"
                alt="sound"
                fill
                className="object-contain"
              />
            </button>
          </div>

          {/* Center info */}
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
                  $
                  {totalBet.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 sm:gap-5 justify-end">
            <button
              onClick={() => {
                setBetAnchored(true);
                setModal("bet");
              }}
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
              aria-label="Decrease bet / open popup"
            >
              <Image
                src="/ui/lessbet.png"
                alt="lessbet"
                fill
                className="object-contain"
              />
            </button>

            <div className="relative flex items-center justify-center">
              <button
                onClick={() => void handleSpin()}
                disabled={!canSpin || isSpinning || credit < totalBet}
                className="relative flex items-center justify-center overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
                style={{ width: BIG_BTN_WH, height: BIG_BTN_WH }}
                aria-label="Spin"
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
                  className="object-contain ml-3 mt-3 pointer-events-none"
                />
              </button>

              {/* единственный anchored bet popup (desktop) */}
              {modal === "bet" && betAnchored && <BetPopup anchored />}
            </div>

            <button
              onClick={() => {
                setBetAnchored(true);
                setModal("bet");
              }}
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
              aria-label="Increase bet / open popup"
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

        {/* ===== Mobile ===== */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <button
                className="relative"
                style={{ width: ICON_WH, height: ICON_WH }}
                onClick={() => setModal("settings")}
                aria-label="Open settings"
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
                  width: `calc(${ICON_WH} * 1.1)`,
                  height: `calc(${ICON_WH} * 1.1)`,
                }}
                onClick={() => setModal("rules")}
                aria-label="Open rules"
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
                aria-label="Toggle sound"
              >
                <Image
                  src="/ui/sound.png"
                  alt="sound"
                  fill
                  className="object-contain"
                />
              </button>
            </div>

            <p
              className="text-white font-extrabold uppercase leading-none"
              style={{ fontSize: TIP_FONT }}
            >
              HOLD SPACE FOR TURBO
            </p>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="font-bold text-white">
              CREDIT
              <span
                className="text-yellow-400 pl-1.5"
                style={{ fontSize: NUM_FONT }}
              >
                $
                {credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="font-bold text-white">
              BET
              <span
                className="text-orange-400 pl-1.5"
                style={{ fontSize: NUM_FONT }}
              >
                $
                {totalBet.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 mt-1">
            <button
              onClick={() => {
                setBetAnchored(false);
                setModal("bet");
              }}
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
              aria-label="Decrease bet / open popup"
            >
              <Image
                src="/ui/lessbet.png"
                alt="lessbet"
                fill
                className="object-contain"
              />
            </button>

            <button
              onClick={() => void handleSpin()}
              disabled={!canSpin || isSpinning || credit < totalBet}
              className="relative flex items-center justify-center overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
              style={{ width: BIG_BTN_WH, height: BIG_BTN_WH }}
              aria-label="Spin"
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
                className="object-contain ml-2 mt-2 pointer-events-none"
              />
            </button>

            <button
              onClick={() => {
                setBetAnchored(false);
                setModal("bet");
              }}
              className="relative"
              style={{ width: ICON_WH, height: ICON_WH }}
              aria-label="Increase bet / open popup"
            >
              <Image
                src="/ui/addbet.png"
                alt="addbet"
                fill
                className="object-contain"
              />
            </button>
          </div>

          {/* единственный mobile bet popup (fullscreen) */}
          {modal === "bet" && !betAnchored && <BetPopup anchored={false} />}
        </div>

        {/* === единственные экземпляры модалок === */}
        {modal === "settings" && (
          <SettingsPopup
            key="settings-modal"
            onClose={() => setModal(null)}
            totalBet={totalBetSettings}
            setTotalBet={setTotalBetSettings}
          />
        )}
        {modal === "rules" && (
          <GameRulesPopup
            key="rules-modal"
            onClose={() => setModal(null)}
            totalBet={totalBet}
          />
        )}
      </div>
    </div>
  );
}

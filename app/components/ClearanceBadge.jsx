"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Layered Level-Clearance badge with chained sequences:
 *  - Main paper/glow/stamp animation (triggered by playKey)
 *  - Then digit decrement: current fades out while fire frames play, (digit-1) fades in
 *
 * Props:
 *  - digit (number|string)
 *  - size (string)
 *  - offset (string|number)
 *  - playKey (any): change value to trigger the main sequence
 *  - onDecrement?: () => void  // called when we commit (digit-1)
 *  - className (string)
 */
export default function ClearanceBadge({
  digit = 1,
  size = "260px",
  offset = "0",
  playKey = null,
  onDecrement, // optional callback to commit the new digit in parent
  className = "",
}) {
  const rootRef = useRef(null);

  // --- fire frames for the digit swap (we advance 1..8 during the swap) ---
  const [fireFrame, setFireFrame] = useState(1);
  const clamp1to9 = (n) => ((n - 1 + 9) % 9) + 1;

  const [shifting, setShifting] = useState(false);
  const [renderCur, setRenderCur] = useState(Number(digit) || 1);
  const [renderNext, setRenderNext] = useState(
    clamp1to9((Number(digit) || 1) - 1)
  );

  // lengths derived from the *render* digits so sizing matches the snapshot
  const curChars = String(renderCur).split("");
  const nextChars = String(renderNext).split("");

  // compute a slot width that fits both current and next digits so there’s no jump
  const widthPctFor = (len) => (len === 2 ? 38 : 22);
  const slotWidthPct = Math.max(
    widthPctFor(curChars.length),
    widthPctFor(nextChars.length)
  );
  const gapPct = (len) => (len === 2 ? 6 : 0);
  const imgWidthPct = (len) => (len === 2 ? 46 : 100);

  // --- kick the main stamp sequence when playKey changes ---
  useEffect(() => {
    if (playKey === null) return;

    const el = rootRef.current;
    if (!el) return;

    // 1) run your existing sequence
    el.classList.remove("playing");
    void el.offsetHeight;
    el.classList.add("playing");

    // 2) when that finishes, trigger the digit decrement sequence
    //    your printer/stamp timeline is ~0.9–1.0s; start shift a tad after that
    const startShiftTimer = setTimeout(() => runDigitShift(), 1020);

    // clean up the playing class a bit later
    const stopPlayingTimer = setTimeout(
      () => el.classList.remove("playing"),
      1200
    );

    return () => {
      clearTimeout(startShiftTimer);
      clearTimeout(stopPlayingTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);
  useEffect(() => {
    if (!shifting) {
      const d = Number(digit) || 1;
      setRenderCur(d);
      setRenderNext(clamp1to9(d - 1));
    }
  }, [digit, shifting]); 

  // runs the fire clip + crossfade digits, then commits (digit-1)
  const runDigitShift = () => {
    const el = rootRef.current;
    if (!el) return;

    // snapshot at the moment the shift starts
    const base = Number(digit) || renderCur;
    const next = clamp1to9(base - 1);

    setRenderCur(base);
    setRenderNext(next);
    setShifting(true);
    el.classList.add("digit-shifting");

    // fire frames
    setFireFrame(1);
    const FRAMES = 8;
    const INTERVAL = 55;
    let f = 1;
    const frameTimer = setInterval(() => {
      f = f >= FRAMES ? 1 : f + 1;
      setFireFrame(f);
    }, INTERVAL);

    // commit right after fade-out completes
    const commitTimer = setTimeout(() => {
      onDecrement?.(next); // parent updates to 'next'
      setRenderCur(next); // lock UI to the new value immediately
    }, 240);

    const endTimer = setTimeout(() => {
      clearInterval(frameTimer);
      setShifting(false);
      el.classList.remove("digit-shifting");
    }, 560);

    return () => {
      clearInterval(frameTimer);
      clearTimeout(commitTimer);
      clearTimeout(endTimer);
    };
  };

  return (
    <div style={{ width: size, marginTop: offset }} className={className}>
      <div ref={rootRef} className="fx-badge">
        {/* glow */}
        <img className="layer glow" src="/symbols/clearance/glow.png" alt="" />

        {/* paper stack */}
        <img
          className="layer bottomPaper"
          src="/symbols/clearance/bottom_paper.png"
          alt=""
        />
        <img
          className="layer topPaper"
          src="/symbols/clearance/top_paper.png"
          alt=""
        />
        <img
          className="layer paper"
          src="/symbols/clearance/paper.png"
          alt=""
        />

        {/* border */}
        <img
          className="layer border"
          src="/symbols/clearance/inner_border.png"
          alt=""
        />

        {/* stars & labels */}
        <img className="layer starL" src="/symbols/clearance/star.png" alt="" />
        <img className="layer starR" src="/symbols/clearance/star.png" alt="" />
        <img
          className="layer levelTxt"
          src="/symbols/clearance/level.png"
          alt="LEVEL"
        />
        <img
          className="layer clearTxt"
          src="/symbols/clearance/clearance.png"
          alt="CLEARANCE"
        />

        {/* DIGIT SLOT (two stacked groups + fire overlay) */}
        <div
          className="layer digitWrap"
          style={{ width: `${slotWidthPct}%`, left: "44%", top: "46%" }}
        >
          {/* current digits (fade OUT) */}
          <div
            className="digits-cur"
            style={{ gap: `${gapPct(curChars.length)}%` }}
          >
            {curChars.map((ch, i) => (
              <img
                key={`cur-${i}`}
                src={`/symbols/clearance/digits/${ch}.png`}
                alt={ch}
                style={{ width: `${imgWidthPct(curChars.length)}%` }}
              />
            ))}
          </div>

          {/* next digits (fade IN) */}
          <div
            className="digits-next"
            style={{ gap: `${gapPct(nextChars.length)}%` }}
          >
            {nextChars.map((ch, i) => (
              <img
                key={`next-${i}`}
                src={`/symbols/clearance/digits/${ch}.png`}
                alt={ch}
                style={{ width: `${imgWidthPct(nextChars.length)}%` }}
              />
            ))}
          </div>
        </div>

        {/* NEW: big fire overlay matching inner border box */}
        <div
          className="fireMask"
          style={{ visibility: shifting ? "visible" : "hidden" }}
        >
          <img
            className="fireOverlay"
            src={`/ui/fire/fire-${fireFrame}.png`}
            alt=""
          />
        </div>

        {/* stamps */}
        <img
          className="layer winMark"
          src="/symbols/clearance/win_mark.png"
          alt="WIN"
        />
        <img
          className="layer printMark"
          src="/symbols/clearance/print_win_mark.png"
          alt="PRINTER"
        />
      </div>
    </div>
  );
}

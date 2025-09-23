export const raf = () => new Promise((res) => requestAnimationFrame(res));
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export const waitTransitionEnd = (el, ms) =>
  new Promise((resolve) => {
    let done = false;
    const onEnd = (e) => {
      if (e.propertyName === "transform") {
        done = true;
        el.removeEventListener("transitionend", onEnd);
        resolve();
      }
    };
    el.addEventListener("transitionend", onEnd);
    setTimeout(() => {
      if (!done) {
        el.removeEventListener("transitionend", onEnd);
        resolve();
      }
    }, ms + 10);
  });

export async function animateToTranslateY(
  pieceRefs,
  id,
  distancePx,
  durationMs
) {
  await raf();
  const el = pieceRefs.current.get(id);
  if (!el) return;

  // Commit start
  el.style.transition = "none";
  el.style.transform = "translateY(0px)";
  void el.getBoundingClientRect();

  // Animate
  const dur = Math.max(1, Math.round(durationMs));
  el.style.transition = `transform ${dur}ms linear`;
  el.style.transform = `translateY(${Math.round(distancePx)}px)`;

  await waitTransitionEnd(el, dur);
}

export async function landingBounce(pieceRefs, id, baseTranslatePx, cellH) {
  const el = pieceRefs.current.get(id);
  if (!el) return;
  const OV = Math.max(4, Math.min(14, Math.round(cellH * 0.1)));

  el.style.transition = `transform 80ms ease-out`;
  el.style.transform = `translateY(${Math.round(
    baseTranslatePx + OV
  )}px) scaleY(0.92)`;
  await waitTransitionEnd(el, 80);

  el.style.transition = `transform 110ms ease-out`;
  el.style.transform = `translateY(${Math.round(
    baseTranslatePx - OV * 0.35
  )}px) scaleY(1.03)`;
  await waitTransitionEnd(el, 110);

  el.style.transition = `transform 90ms ease-in`;
  el.style.transform = `translateY(${Math.round(baseTranslatePx)}px) scaleY(1)`;
  await waitTransitionEnd(el, 90);
}

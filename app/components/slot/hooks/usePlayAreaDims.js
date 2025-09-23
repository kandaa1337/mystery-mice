"use client";
import { useLayoutEffect, useState } from "react";
import { GAP_AT_DESIGN } from "../constants";

export function usePlayAreaDims(ref, metricsInnerDesignW) {
  const [dims, setDims] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const innerW = rect.width;
      const innerH = rect.height;
      const gapPx = (GAP_AT_DESIGN / metricsInnerDesignW) * innerW;
      const cellW = (innerW - gapPx * 5) / 6;
      const cellH = (innerH - gapPx * 5) / 6;
      setDims({ innerW, innerH, cellW, cellH, gapPx });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref, metricsInnerDesignW]);

  return dims;
}

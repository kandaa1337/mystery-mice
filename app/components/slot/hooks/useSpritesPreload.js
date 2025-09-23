"use client";
import { useEffect, useState } from "react";
import { IMG_BASE, SYMBOLS } from "../symbols";

export function useSpritesPreload() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const preload = async () => {
      const loaders = SYMBOLS.map((name) => {
        const img = new window.Image();
        img.src = `${IMG_BASE}/${name}`;
        return img.decode
          ? img.decode().catch(() => {})
          : new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            });
      });
      await Promise.all(loaders);
      if (active) setReady(true);
    };
    if (typeof window !== "undefined") preload();
    return () => {
      active = false;
    };
  }, []);

  return ready;
}

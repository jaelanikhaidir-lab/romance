"use client";

import { useState, useEffect } from "react";

export function InstructionOverlay() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 6000);
    const hideTimer = setTimeout(() => setVisible(false), 7500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center transition-opacity duration-1000 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <p className="rounded-lg bg-black/60 px-5 py-2.5 text-sm text-foreground/80 backdrop-blur-sm">
        Double-click anywhere for interactive effects. Drag to move, zoom in or
        out.
      </p>
    </div>
  );
}

"use client";

import * as React from "react";

// useScrollVelocity — tracks the page scroll velocity in px/s.
// Returns a ref to read the current velocity (avoids re-renders).
export function useScrollVelocity() {
  const velocityRef = React.useRef(0);
  const lastScrollY = React.useRef(0);
  const lastTime = React.useRef(performance.now());

  React.useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime.current);
      const dy = window.scrollY - lastScrollY.current;
      velocityRef.current = (dy / dt) * 1000; // px/s
      lastScrollY.current = window.scrollY;
      lastTime.current = now;
      // Decay velocity when scrolling stops
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Decay loop — velocity returns to 0 when not scrolling
  React.useEffect(() => {
    let raf = 0;
    const loop = () => {
      velocityRef.current *= 0.92;
      if (Math.abs(velocityRef.current) < 1) velocityRef.current = 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return velocityRef;
}

// useMediaMode — simulates "video watching" detection.
// In a real app this would hook into <video> elements or media sessions.
// Here we expose a setter so the shell can toggle it (e.g. when an app
// that plays media is opened, or via a command palette action).
export function useMediaMode() {
  const [mediaMode, setMediaMode] = React.useState(false);
  return { mediaMode, setMediaMode };
}

// useDragToCenter — detects when the orb is dragged near the screen center.
// Returns a boolean that's true while the orb is within the center zone.
export function useDragToCenter() {
  const [inCenter, setInCenter] = React.useState(false);
  const check = React.useCallback((x: number, y: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    setInCenter(dist < Math.min(window.innerWidth, window.innerHeight) * 0.25);
  }, []);
  return { inCenter, check };
}

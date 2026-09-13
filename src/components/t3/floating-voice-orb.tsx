"use client";

import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import { AdvancedFuturisticVoiceOrb, type OrbMode } from "./advanced-voice-orb";
import { LiquidScreenBorder } from "./liquid-screen-border";
import { useT3Store } from "@/lib/t3/store";
import { voiceIsActive } from "@/lib/t3/types";

// FloatingVoiceOrb — global draggable orb with advanced reactivity:
//   - idle breathing + scroll-reactive wobble
//   - drag-to-center triggers liquid screen-edge border
//   - media mode (passed in) transforms the orb + activates border
//   - audio-reactive waveform when voice is active
export function FloatingVoiceOrb({
  retreat,
  mediaMode = false,
}: {
  retreat: boolean;
  mediaMode?: boolean;
}) {
  const liveVoiceState = useT3Store((s) => s.liveVoiceState);
  const activeTheme = useT3Store((s) => s.activeTheme);
  const toggleLiveVoice = useT3Store((s) => s.toggleLiveVoice);

  const controls = useAnimation();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    return { x: window.innerWidth - 96, y: 76 };
  });
  const [liquify, setLiquify] = React.useState(0);
  const [inCenter, setInCenter] = React.useState(false);
  const [scrollVel, setScrollVel] = React.useState(0);
  const velRef = React.useRef(0);
  const lastScrollY = React.useRef(0);
  const lastTime = React.useRef(performance.now());

  // Scroll velocity tracking
  React.useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime.current);
      const dy = window.scrollY - lastScrollY.current;
      velRef.current = (dy / dt) * 1000;
      lastScrollY.current = window.scrollY;
      lastTime.current = now;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Decay loop for scroll velocity + drag-to-center check
  React.useEffect(() => {
    let raf = 0;
    const loop = () => {
      velRef.current *= 0.9;
      if (Math.abs(velRef.current) < 1) velRef.current = 0;
      setScrollVel(velRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // retreat → slide to nearest horizontal edge
  React.useEffect(() => {
    if (!retreat) {
      setLiquify(0);
      controls.start({
        x: pos.x,
        y: pos.y,
        scale: 1,
        transition: { type: "spring", stiffness: 320, damping: 28 },
      });
      return;
    }
    const w = window.innerWidth;
    const targetX = pos.x < w / 2 ? 12 : w - 96;
    setLiquify(1);
    controls.start({
      x: targetX,
      transition: { type: "spring", stiffness: 200, damping: 18 },
    });
  }, [retreat]);

  const active = voiceIsActive(liveVoiceState);
  const level = liveVoiceState.amplitudes[0] ?? 0;

  // Compute orb mode
  const orbMode: OrbMode = mediaMode
    ? "media"
    : dragging
    ? "dragging"
    : active
    ? "active"
    : "idle";

  // Liquid border activates when: orb in center, media playing, or dragging near center
  const borderActive = inCenter || mediaMode;

  const statusLabel = liveVoiceState.isConnecting
    ? "Connecting…"
    : liveVoiceState.isListening
    ? "Listening"
    : liveVoiceState.isSpeaking
    ? "Speaking"
    : mediaMode
    ? "Media active"
    : "Tap to talk";

  // Check if orb is near center
  const checkCenter = (x: number, y: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    setInCenter(dist < Math.min(window.innerWidth, window.innerHeight) * 0.28);
  };

  return (
    <>
      {/* Liquid screen-edge border */}
      <LiquidScreenBorder
        active={borderActive}
        theme={activeTheme}
        intensity={mediaMode ? 1 : inCenter ? 0.85 : 0}
        mode={mediaMode ? "media" : "edge"}
      />

      <motion.div
        ref={containerRef}
        drag={!retreat}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ left: 8, right: window.innerWidth - 92, top: 8, bottom: window.innerHeight - 92 }}
        onDragStart={() => setDragging(true)}
        onDrag={(_, info) => {
          const currentX = pos.x + info.offset.x;
          const currentY = pos.y + info.offset.y;
          checkCenter(currentX, currentY);
        }}
        onDragEnd={(_, info) => {
          setDragging(false);
          const newX = pos.x + info.offset.x;
          const newY = pos.y + info.offset.y;
          setPos({ x: newX, y: newY });
          checkCenter(newX, newY);
        }}
        onDoubleClick={() => {
          const w = window.innerWidth;
          const cx = w / 2 - 42;
          const cy = window.innerHeight / 2 - 42;
          setPos({ x: cx, y: cy });
          setInCenter(true);
          controls.start({ x: cx, y: cy, transition: { type: "spring", stiffness: 300, damping: 22 } });
        }}
        animate={controls}
        initial={{ x: pos.x, y: pos.y, scale: 1 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 84,
          height: 84,
          zIndex: 60,
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        <button
          aria-label={statusLabel}
          onClick={() => toggleLiveVoice()}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <AdvancedFuturisticVoiceOrb
            theme={activeTheme}
            level={active ? level : 0}
            mode={orbMode}
            size={84}
            scrollVelocity={scrollVel}
          />
        </button>
        {liquify < 0.35 && (
          <div
            style={{
              position: "absolute",
              top: 86,
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 600,
                color: "#FCF9F3",
                background: "rgba(34,30,25,0.78)",
                border: "1px solid rgba(252,249,243,0.18)",
                boxShadow: "0 2px 8px -2px rgba(34,30,25,0.35)",
              }}
            >
              {statusLabel}
            </span>
          </div>
        )}
      </motion.div>
    </>
  );
}

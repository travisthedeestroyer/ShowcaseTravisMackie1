"use client";

import * as React from "react";
import type { GenerativeTheme, UiDesignConfig } from "@/lib/t3/types";

// DesignMockup — single canonical live-preview surface.
// Scales live by UiDesignConfig spacingScale/radiusScale/typeScale.
export function DesignMockup({
  theme,
  config,
}: {
  theme: GenerativeTheme;
  config: UiDesignConfig;
}) {
  const pad = (n: number) => `${n * config.spacingScale}px`;
  const rad = (n: number) => `${n * config.radiusScale}px`;
  const ty = (n: number) => `${n * config.typeScale}px`;

  return (
    <div
      style={{
        height: 168 * config.spacingScale,
        borderRadius: rad(20),
        overflow: "hidden",
        border: "1px solid var(--glass-border)",
        background: `linear-gradient(135deg, ${theme.bgGradientColors[0]}, ${theme.bgGradientColors[1]})`,
      }}
    >
      {/* status pill */}
      <div className="flex items-center justify-between px-3 py-2" style={{ height: 32 * config.spacingScale }}>
        <span
          className="t3-mono font-semibold"
          style={{ fontSize: ty(10), color: theme.textColor, opacity: 0.7 }}
        >
          T³ · Live
        </span>
        <span
          style={{
            fontSize: ty(9),
            fontWeight: 600,
            padding: `2px ${6 * config.spacingScale}px`,
            borderRadius: 999,
            color: "#FCF9F3",
            background: theme.primaryColor,
          }}
        >
          Preview
        </span>
      </div>
      {/* sample card */}
      <div
        className="mx-3 flex items-center gap-2"
        style={{
          padding: pad(8),
          borderRadius: rad(14),
          background: `linear-gradient(135deg, ${theme.surfaceColor}, ${theme.surfaceColor})`,
          border: `1px solid ${theme.glassBorderColor}`,
        }}
      >
        <div
          style={{
            width: 36 * config.spacingScale,
            height: 36 * config.spacingScale,
            borderRadius: "50%",
            background: `conic-gradient(from 0deg, ${theme.orbColors[0]}, ${theme.orbColors[1]}, ${theme.orbColors[2]}, ${theme.orbColors[3]}, ${theme.orbColors[0]})`,
            flexShrink: 0,
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ fontSize: ty(12), color: theme.textColor }}>
            Sample card
          </p>
          <p className="truncate" style={{ fontSize: ty(10), color: theme.textColor, opacity: 0.7 }}>
            Body text preview
          </p>
        </div>
        <span
          style={{
            fontSize: ty(9),
            fontWeight: 600,
            padding: `3px ${8 * config.spacingScale}px`,
            borderRadius: 999,
            color: "#FCF9F3",
            background: theme.primaryColor,
          }}
        >
          Action
        </span>
      </div>
      {/* nav row */}
      <div
        className="flex items-center justify-around mt-2 mx-3"
        style={{
          padding: `${4 * config.spacingScale}px 0`,
          borderRadius: rad(12),
          background: theme.surfaceColor,
        }}
      >
        {["H", "S", "T", "F", "•"].map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span
              style={{
                width: 18 * config.spacingScale,
                height: 18 * config.spacingScale,
                borderRadius: 6 * config.radiusScale,
                background: i === 0 ? theme.primaryColor : `color-mix(in srgb, ${theme.textColor} 18%, transparent)`,
              }}
            />
            {config.navLabelsVisible && (
              <span style={{ fontSize: ty(8), color: theme.textColor, opacity: 0.6, fontWeight: 600 }}>
                {c}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { UiDesignConfig } from "./types";
import { DEFAULT_UI_DESIGN } from "./types";

// Omni-UI engine — ported from UiDesignEngine.kt
// Parses natural-language design requests into UiDesignConfig diffs.

export function parseUiDesignFromPrompt(
  prompt: string,
  base: UiDesignConfig
): UiDesignConfig {
  const next: UiDesignConfig = { ...base };
  const p = prompt.toLowerCase();

  // Spacing
  if (/\b(compact|dense|tight|smaller|condensed|crammed|cozy)\b/.test(p)) {
    next.spacingScale = clamp(base.spacingScale * 0.85, 0.6, 1.6);
  } else if (/\b(spacious|roomy|airy|bigger|loose|breathing room|generous|expanded)\b/.test(p)) {
    next.spacingScale = clamp(base.spacingScale * 1.18, 0.6, 1.6);
  }

  // Radius
  if (/\b(round|rounder|soft|bubbly|pill|curvy|cushioned)\b/.test(p)) {
    next.radiusScale = clamp(base.radiusScale * 1.35, 0.3, 2.0);
  } else if (/\b(sharp|square|boxy|angular|flat corners|less round|hard edges)\b/.test(p)) {
    next.radiusScale = clamp(base.radiusScale * 0.55, 0.3, 2.0);
  }

  // Motion
  if (/\b(reduce motion|less motion|no animation|still|calmer|disable animation|stop moving|no movement)\b/.test(p)) {
    next.reducedMotion = true;
  } else if (/\b(more motion|animate more|enable animation|add motion|livelier)\b/.test(p)) {
    next.reducedMotion = false;
  }

  // Nav labels
  if (/\b(hide labels|icons only|icon-only|minimal nav|no labels)\b/.test(p)) {
    next.navLabelsVisible = false;
  } else if (/\b(show labels|with labels|text labels|labeled nav)\b/.test(p)) {
    next.navLabelsVisible = true;
  }

  // NEW: typography scale
  if (/\b(larger text|bigger text|bigger font|larger font|zoom text|magnify text)\b/.test(p)) {
    next.typeScale = clamp(base.typeScale * 1.12, 0.85, 1.25);
  } else if (/\b(smaller text|tinier text|compact type|smaller font|condensed type)\b/.test(p)) {
    next.typeScale = clamp(base.typeScale * 0.92, 0.85, 1.25);
  }

  // NEW: accent hue shift
  if (/\b(warmer accent|shift accent warmer|more orange|more red accent)\b/.test(p)) {
    next.accentHueShift = clamp(base.accentHueShift + 12, -30, 30);
  } else if (/\b(cooler accent|shift accent cooler|more teal|more blue accent)\b/.test(p)) {
    next.accentHueShift = clamp(base.accentHueShift - 12, -30, 30);
  }

  // NEW: motion speed
  if (/\b(faster animations|speed up|quicker|snappier)\b/.test(p)) {
    next.motionSpeed = clamp(base.motionSpeed * 1.4, 0, 2);
  } else if (/\b(slower animations|slow down|gentler|slower|calm pace)\b/.test(p)) {
    next.motionSpeed = clamp(base.motionSpeed * 0.7, 0, 2);
  }

  return next;
}

export function parseUiDesignFromJson(
  json: string,
  base: UiDesignConfig,
  fallbackPrompt: string
): UiDesignConfig {
  try {
    const cleaned = json.replace(/```json\s*/gi, "").replace(/```\s*$/i, "").trim();
    const obj = JSON.parse(cleaned);
    const next: UiDesignConfig = { ...base };

    if (typeof obj.spacingScale === "number")
      next.spacingScale = clamp(obj.spacingScale, 0.6, 1.6);
    if (typeof obj.radiusScale === "number")
      next.radiusScale = clamp(obj.radiusScale, 0.3, 2.0);
    if (typeof obj.reducedMotion === "boolean")
      next.reducedMotion = obj.reducedMotion;
    if (typeof obj.navLabelsVisible === "boolean")
      next.navLabelsVisible = obj.navLabelsVisible;
    if (typeof obj.typeScale === "number")
      next.typeScale = clamp(obj.typeScale, 0.85, 1.25);
    if (typeof obj.accentHueShift === "number")
      next.accentHueShift = clamp(obj.accentHueShift, -30, 30);
    if (typeof obj.motionSpeed === "number")
      next.motionSpeed = clamp(obj.motionSpeed, 0, 2);

    return next;
  } catch {
    return parseUiDesignFromPrompt(fallbackPrompt, base);
  }
}

export function describeUiDesignChange(
  from: UiDesignConfig,
  to: UiDesignConfig
): string {
  const parts: string[] = [];

  if (Math.abs(from.spacingScale - to.spacingScale) > 0.01) {
    if (to.spacingScale < from.spacingScale)
      parts.push(`More compact spacing (${Math.round(to.spacingScale * 100)}%)`);
    else
      parts.push(`More spacious layout (${Math.round(to.spacingScale * 100)}%)`);
  }
  if (Math.abs(from.radiusScale - to.radiusScale) > 0.01) {
    if (to.radiusScale > from.radiusScale)
      parts.push(`Rounder corners (${Math.round(to.radiusScale * 100)}%)`);
    else parts.push(`Sharper corners (${Math.round(to.radiusScale * 100)}%)`);
  }
  if (from.reducedMotion !== to.reducedMotion) {
    parts.push(to.reducedMotion ? "Reduced motion" : "Motion enabled");
  }
  if (from.navLabelsVisible !== to.navLabelsVisible) {
    parts.push(to.navLabelsVisible ? "Nav labels shown" : "Nav labels hidden");
  }
  if (Math.abs(from.typeScale - to.typeScale) > 0.01) {
    if (to.typeScale > from.typeScale)
      parts.push(`Larger type (${Math.round(to.typeScale * 100)}%)`);
    else parts.push(`Smaller type (${Math.round(to.typeScale * 100)}%)`);
  }
  if (Math.abs(from.accentHueShift - to.accentHueShift) > 0.5) {
    parts.push(
      `Accent shifted ${to.accentHueShift > 0 ? "warmer" : "cooler"} (${Math.round(to.accentHueShift)}°)`
    );
  }
  if (Math.abs(from.motionSpeed - to.motionSpeed) > 0.01) {
    if (to.motionSpeed > from.motionSpeed)
      parts.push(`Faster animations (${to.motionSpeed.toFixed(1)}×)`);
    else parts.push(`Slower animations (${to.motionSpeed.toFixed(1)}×)`);
  }

  return parts.length > 0 ? parts.join(" · ") : "No changes detected.";
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

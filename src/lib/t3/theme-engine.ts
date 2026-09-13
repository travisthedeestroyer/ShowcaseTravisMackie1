import type { GenerativeTheme } from "./types";

// Deterministic hash-based generative theme engine — ported from GenerativeThemeEngine.kt
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

function hslHex(h: number, s: number, l: number): string {
  // Convert HSL to hex for compatibility
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateThemeFromPrompt(prompt: string): GenerativeTheme {
  const hash = hashString(prompt);
  const hue1 = hash % 360;
  const hue2 = (hash + 120) % 360;
  const hue3 = (hash + 240) % 360;

  const isDark = /\b(dark|cyber|night|midnight|noir|obsidian|shadow|dusk)\b/i.test(
    prompt
  );

  const primaryColor = hslHex(hue1, 0.62, isDark ? 0.62 : 0.5);
  const secondaryColor = hslHex(hue2, 0.55, 0.55);
  const tertiaryColor = hslHex(hue3, 0.5, isDark ? 0.5 : 0.42);

  const bgGradientColors = isDark
    ? ["#0D1117", "#161B22", "#21262D", "#1C2128"]
    : [
        hslHex(hue1, 0.18, 0.96),
        hslHex(hue2, 0.16, 0.92),
        hslHex(hue3, 0.16, 0.88),
        hslHex(hue1, 0.2, 0.84),
      ];

  const textColor = isDark ? "#F4EEE4" : "#22201D";
  const surfaceColor = isDark ? "#80161B22" : `#80${hslHex(hue1, 0.14, 0.98).slice(1)}`;
  const glassBorderColor = isDark
    ? "#9930363D"
    : `#99${hslHex(hue1, 0.16, 0.9).slice(1)}`;

  const orbColors = [primaryColor, secondaryColor, tertiaryColor, hslHex(hue1 + 30, 0.6, 0.5)];

  return {
    id: `gen_${hash.toString(36)}`,
    name: prompt.slice(0, 32) || "Custom theme",
    promptDescription: prompt,
    primaryColor,
    secondaryColor,
    tertiaryColor,
    surfaceColor,
    textColor,
    glassBorderColor,
    bgGradientColors,
    orbColors,
    glassAlpha: 0.35,
  };
}

export function parseThemeFromJson(
  json: string,
  fallbackPrompt: string
): GenerativeTheme {
  try {
    // Strip ```json fences if present
    const cleaned = json.replace(/```json\s*/gi, "").replace(/```\s*$/i, "").trim();
    const obj = JSON.parse(cleaned);
    const ensureHex = (v: unknown): string =>
      typeof v === "string" && /^#?[0-9a-fA-F]{6}$/.test(v)
        ? (v.startsWith("#") ? v : `#${v}`)
        : "#888888";

    const bg = Array.isArray(obj.bgGradientColors)
      ? obj.bgGradientColors.map(ensureHex)
      : null;
    const orb = Array.isArray(obj.orbColors)
      ? obj.orbColors.map(ensureHex)
      : null;

    const base = generateThemeFromPrompt(fallbackPrompt);

    return {
      id: `gen_${hashString(fallbackPrompt).toString(36)}`,
      name: typeof obj.name === "string" ? obj.name : fallbackPrompt.slice(0, 32),
      promptDescription: fallbackPrompt,
      primaryColor: ensureHex(obj.primaryColor ?? base.primaryColor),
      secondaryColor: ensureHex(obj.secondaryColor ?? base.secondaryColor),
      tertiaryColor: ensureHex(obj.tertiaryColor ?? base.tertiaryColor),
      surfaceColor: ensureHex(obj.surfaceColor ?? base.surfaceColor),
      textColor: ensureHex(obj.textColor ?? base.textColor),
      glassBorderColor: ensureHex(obj.glassBorderColor ?? base.glassBorderColor),
      bgGradientColors:
        bg && bg.length >= 4
          ? bg.slice(0, 4)
          : [...(bg ?? []), ...base.bgGradientColors].slice(0, 4),
      orbColors:
        orb && orb.length >= 4
          ? orb.slice(0, 4)
          : [...(orb ?? []), ...base.orbColors].slice(0, 4),
      glassAlpha:
        typeof obj.glassAlpha === "number"
          ? Math.min(0.8, Math.max(0.1, obj.glassAlpha))
          : typeof obj.surfaceAlpha === "number"
          ? Math.min(0.8, Math.max(0.1, obj.surfaceAlpha))
          : 0.35,
    };
  } catch {
    return generateThemeFromPrompt(fallbackPrompt);
  }
}

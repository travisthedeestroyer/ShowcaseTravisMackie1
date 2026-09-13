import type { GenerativeTheme } from "./types";

// The 6 canonical theme presets — exact color values from ThemePresets.kt
export const THEME_PRESETS: GenerativeTheme[] = [
  {
    id: "aura_terracotta",
    name: "Terracotta Editorial AI",
    promptDescription: "Warm editorial calm — terracotta, amber, sage over ivory paper.",
    primaryColor: "#D97757",
    secondaryColor: "#D9A05B",
    tertiaryColor: "#708B75",
    surfaceColor: "#80FBF7EE",
    textColor: "#22201D",
    glassBorderColor: "#99EFE8D8",
    bgGradientColors: ["#FBF7EE", "#F2EAD8", "#E9DFCE", "#E5D2C2"],
    orbColors: ["#D97757", "#D9A05B", "#708B75", "#CC6747"],
    glassAlpha: 0.35,
  },
  {
    id: "liquid_earth",
    name: "Liquid Earth Tones",
    promptDescription: "Flowing earth — terracotta, sage, slate over warm sand.",
    primaryColor: "#DC7356",
    secondaryColor: "#7B9E87",
    tertiaryColor: "#4F7086",
    surfaceColor: "#80F5EFEB",
    textColor: "#2A2620",
    glassBorderColor: "#99DFD3C4",
    bgGradientColors: ["#F5EFEB", "#E2BC9B", "#7B9E87", "#4F7086"],
    orbColors: ["#DC7356", "#7B9E87", "#4F7086", "#E2BC9B"],
    glassAlpha: 0.35,
  },
  {
    id: "iridescent_opal",
    name: "Iridescent Opal",
    promptDescription: "Pearly opal — cyan, magenta, gold over frosted light.",
    primaryColor: "#00B4D8",
    secondaryColor: "#E056FD",
    tertiaryColor: "#FFB703",
    surfaceColor: "#80F8FAFC",
    textColor: "#1F2937",
    glassBorderColor: "#99E0F2FE",
    bgGradientColors: ["#F8FAFC", "#E0F2FE", "#F3E8FF", "#FCE7F3"],
    orbColors: ["#00B4D8", "#E056FD", "#FFB703", "#7209B7"],
    glassAlpha: 0.4,
  },
  {
    id: "cyber_sunset",
    name: "Cyber Sunset",
    promptDescription: "Neon dusk — coral, teal, gold over deep violet night.",
    primaryColor: "#FF6B6B",
    secondaryColor: "#4ECDC4",
    tertiaryColor: "#FFD166",
    surfaceColor: "#801F0C20",
    textColor: "#F4EEE4",
    glassBorderColor: "#9943182E",
    bgGradientColors: ["#0F0C20", "#2B1055", "#7597DE", "#FF6B6B"],
    orbColors: ["#FF6B6B", "#4ECDC4", "#FFD166", "#9B51E0"],
    glassAlpha: 0.3,
  },
  {
    id: "frost_quartz",
    name: "Frost Quartz",
    promptDescription: "Cold crystalline — blue, violet, mint over frosted slate.",
    primaryColor: "#3A86FF",
    secondaryColor: "#8338EC",
    tertiaryColor: "#06D6A0",
    surfaceColor: "#80F1F5F9",
    textColor: "#1E293B",
    glassBorderColor: "#99CBD5E1",
    bgGradientColors: ["#F1F5F9", "#E2E8F0", "#CBD5E1", "#94A3B8"],
    orbColors: ["#3A86FF", "#8338EC", "#06D6A0", "#60A5FA"],
    glassAlpha: 0.35,
  },
  {
    id: "emerald_forest",
    name: "Emerald Forest",
    promptDescription: "Deep forest — emerald, gold, sand over leafy green.",
    primaryColor: "#2A9D8F",
    secondaryColor: "#E9C46A",
    tertiaryColor: "#F4A261",
    surfaceColor: "#80E8F5E9",
    textColor: "#1B3A2B",
    glassBorderColor: "#99A5D6A7",
    bgGradientColors: ["#E8F5E9", "#C8E6C9", "#A5D6A7", "#81C784"],
    orbColors: ["#2A9D8F", "#E9C46A", "#F4A261", "#264653"],
    glassAlpha: 0.35,
  },
];

export function findThemePreset(query: string): GenerativeTheme | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    THEME_PRESETS.find(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    ) ?? null
  );
}

export const VIBE_CHIPS = [
  "Cyberpunk neon sunset",
  "Zen garden glass",
  "Retro terminal green",
  "Aurora borealis",
  "Vintage indigo ink",
  "Molten copper",
  "Arctic moss",
  "Midnight orchid",
];

export const SURPRISE_ADJECTIVES = [
  "Iridescent", "Molten", "Frosted", "Neon", "Vintage", "Ethereal",
  "Deep", "Sunlit", "Electric", "Muted", "Velvet", "Smoked",
];

export const SURPRISE_NOUNS = [
  "sunset", "glass", "orchid", "terminal", "aurora", "copper",
  "moss", "coral reef", "obsidian", "citrus grove", "harbor", "volcano",
];

export function randomVibe(): string {
  const a =
    SURPRISE_ADJECTIVES[Math.floor(Math.random() * SURPRISE_ADJECTIVES.length)];
  const n = SURPRISE_NOUNS[Math.floor(Math.random() * SURPRISE_NOUNS.length)];
  return `${a} ${n}`;
}

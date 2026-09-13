import {
  defaultAndroidUixManifest,
  type AndroidUixManifest,
  type AndroidGridStyle,
  type AndroidNavStyle,
  type AndroidStatusStyle,
  type AndroidQuickTile,
  type AndroidNotification,
} from "./types";

// Deterministic fallback generator — used when the Generative UIX Agent
// is unavailable, so Strict Sandbox always gets a usable phone UIX.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function hslHex(h: number, s: number, l: number): string {
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

const TILE_PALETTE: { id: string; label: string; icon: string }[] = [
  { id: "wifi", label: "Wi-Fi", icon: "Wifi" },
  { id: "bt", label: "Bluetooth", icon: "Bluetooth" },
  { id: "dnd", label: "Do Not Disturb", icon: "Moon" },
  { id: "flash", label: "Flashlight", icon: "Flashlight" },
  { id: "airplane", label: "Airplane", icon: "Plane" },
  { id: "rotate", label: "Auto-rotate", icon: "RotateCw" },
  { id: "battery", label: "Battery Saver", icon: "Battery" },
  { id: "data", label: "Cellular Data", icon: "Signal" },
  { id: "theme", label: "Dark Theme", icon: "Moon" },
  { id: "hotspot", label: "Hotspot", icon: "RadioTower" },
  { id: "datasaver", label: "Data Saver", icon: "Gauge" },
];

export function generateAndroidUixFromPrompt(prompt: string): AndroidUixManifest {
  const base = defaultAndroidUixManifest();
  const hash = hashString(prompt || "stock");
  const hue = hash % 360;
  const isDark = /\b(dark|night|noir|midnight|obsidian|black|cyber|neon|sunset|dusk)\b/i.test(prompt);
  const isVibrant = /\b(neon|vibrant|cyber|electric|sunset|aurora|tropic|candy)\b/i.test(prompt);
  const isMinimal = /\b(minimal|zen|calm|stock|clean|plain|quiet|calm)\b/i.test(prompt);

  const accent = hslHex(hue, isVibrant ? 0.78 : 0.58, isDark ? 0.62 : 0.46);
  const accentSecondary = hslHex((hue + 140) % 360, 0.6, isDark ? 0.6 : 0.42);

  // wallpaper
  const wallpaperColors = isDark
    ? [hslHex(hue, 0.4, 0.12), hslHex(hue + 40, 0.4, 0.18), hslHex(hue + 80, 0.4, 0.22), hslHex(hue + 30, 0.5, 0.28)]
    : isVibrant
    ? [hslHex(hue, 0.7, 0.62), hslHex(hue + 50, 0.7, 0.6), hslHex(hue + 100, 0.65, 0.58), hslHex(hue + 30, 0.75, 0.5)]
    : [hslHex(hue, 0.4, 0.92), hslHex(hue + 30, 0.35, 0.86), hslHex(hue + 60, 0.3, 0.82), hslHex(hue + 20, 0.45, 0.78)];

  const statusBarTint = isDark ? "#F4EEE4" : "#0B1F3A";

  // grid style
  let gridStyle: AndroidGridStyle = "GRID_5";
  let columns = 5;
  if (/\b(compact|dense|small)\b/i.test(prompt)) { gridStyle = "COMPACT_6"; columns = 6; }
  else if (/\b(list|simple|tablet)\b/i.test(prompt)) { gridStyle = "LIST"; columns = 4; }
  else if (/\b(big|large|spacious|kids)\b/i.test(prompt)) { gridStyle = "GRID_4"; columns = 4; }

  // icon shape
  const iconShape: AndroidUixManifest["home"]["iconShape"] =
    /\b(squircle|squircled|ios|apple)\b/i.test(prompt) ? "SQUIRCLE" :
    /\b(round|rounded|soft)\b/i.test(prompt) ? "ROUNDED" :
    /\b(pebble|oval|pill|blob)\b/i.test(prompt) ? "PEBBLE" :
    "CIRCLE";

  // nav style
  const navStyle: AndroidNavStyle = /\b(three.?button|classic|legacy|old)\b/i.test(prompt) ? "THREE_BUTTON" : "GESTURE";

  // status bar style
  const statusStyle: AndroidStatusStyle = isDark ? "DARK" : /\b(translucent|glass|frosted|blur)\b/i.test(prompt) ? "TRANSLUCENT" : "LIGHT";

  // quick settings — pick 6 based on hash
  const tileCount = 6;
  const shuffled = [...TILE_PALETTE];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (hash >> (i & 7)) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const tiles: AndroidQuickTile[] = shuffled.slice(0, tileCount).map((t, i) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    active: i < 2 + (hash % 2),
  }));

  // carrier
  const carrierLabel = /\b(verizon|att|t-?mobile|sprint|vodafone|orange)\b/i.test(prompt)
    ? prompt.match(/\b(verizon|att|t-?mobile|sprint|vodafone|orange)\b/i)![0].toUpperCase()
    : "T³ Mobile";

  // notifications — pull from prompt text
  const notifications: AndroidNotification[] = base.notifications.map((n, i) => ({
    ...n,
    timestamp: Date.now() - (i + 1) * 6 * 60 * 1000,
  }));

  // font scale
  let fontScale = 1;
  if (/\b(larger|big text|big font|magnify)\b/i.test(prompt)) fontScale = 1.12;
  else if (/\b(smaller|compact text|tiny)\b/i.test(prompt)) fontScale = 0.92;

  // corner radius
  let cornerRadius = 28;
  if (/\b(sharp|square|boxy|flat)\b/i.test(prompt)) cornerRadius = 14;
  else if (/\b(round|soft|pill|bubbly)\b/i.test(prompt)) cornerRadius = 40;

  return {
    vibe: prompt || "Stock Android 15 calm",
    generatedAt: Date.now(),
    wallpaper: {
      type: isMinimal ? "GRADIENT" : isVibrant ? "MESH" : "GRADIENT",
      colors: wallpaperColors,
      overlayAlpha: isDark ? 0.36 : 0.14,
    },
    accent,
    accentSecondary,
    statusBar: {
      style: statusStyle,
      tint: statusBarTint,
      showCarrier: true,
      carrierLabel,
    },
    home: {
      gridStyle,
      columns,
      iconShape,
      iconSize: columns >= 6 ? 48 : columns <= 4 ? 64 : 56,
      labelColor: statusBarTint,
      showLabels: !/\b(no labels|icons only|minimal labels)\b/i.test(prompt),
      pageIndicators: true,
    },
    dock: {
      enabled: true,
      apps: base.dock.apps,
      background: isDark ? "#55101418" : "#66FFFFFF",
    },
    appDrawer: {
      sort: /\b(recent|latest)\b/i.test(prompt) ? "RECENT" : /\b(most used|frequent|popular)\b/i.test(prompt) ? "MOST_USED" : "ALPHABETICAL",
      searchBar: true,
      background: isDark ? "#E6101418" : "#E6F0FA",
    },
    navBar: { style: navStyle, accent },
    quickSettings: { tiles },
    notifications,
    fontScale,
    cornerRadius,
    weather: {
      tempF: 68 + (hash % 20) - 10,
      condition: isDark ? "Clear" : isVibrant ? "Partly cloudy" : "Sunny",
      location: "San Francisco",
      icon: isDark ? "Sun" : isVibrant ? "CloudSun" : "Sun",
      highF: 70 + (hash % 15),
      lowF: 55 + (hash % 10),
    },
  };
}

export function parseAndroidUixFromJson(
  json: string,
  fallbackPrompt: string
): AndroidUixManifest {
  try {
    const cleaned = json.replace(/```json\s*/gi, "").replace(/```\s*$/i, "").trim();
    const obj = JSON.parse(cleaned);
    const base = generateAndroidUixFromPrompt(fallbackPrompt);
    const ensureHex = (v: unknown): string =>
      typeof v === "string" && /^#?[0-9a-fA-F]{6,8}$/.test(v)
        ? (v.startsWith("#") ? v : `#${v}`)
        : "#888888";
    const ensureHexList = (v: unknown): string[] =>
      Array.isArray(v) ? v.map(ensureHex).filter(Boolean).slice(0, 4) : base.wallpaper.colors;

    const tiles: AndroidQuickTile[] = Array.isArray(obj?.quickSettings?.tiles)
      ? obj.quickSettings.tiles.slice(0, 6).map((t: any, i: number) => ({
          id: typeof t?.id === "string" ? t.id : `tile-${i}`,
          label: typeof t?.label === "string" ? t.label : `Tile ${i + 1}`,
          icon: typeof t?.icon === "string" ? t.icon : "Wifi",
          active: typeof t?.active === "boolean" ? t.active : false,
        }))
      : base.quickSettings.tiles;

    const notifications: AndroidNotification[] = Array.isArray(obj?.notifications)
      ? obj.notifications.slice(0, 3).map((n: any, i: number) => ({
          id: typeof n?.id === "string" ? n.id : `n-${i}`,
          appPackage: typeof n?.appPackage === "string" ? n.appPackage : "com.app",
          appName: typeof n?.appName === "string" ? n.appName : "App",
          title: typeof n?.title === "string" ? n.title : "Notification",
          body: typeof n?.body === "string" ? n.body : "",
          iconGradient: Array.isArray(n?.iconGradient) && n.iconGradient.length >= 2
            ? [ensureHex(n.iconGradient[0]), ensureHex(n.iconGradient[1])]
            : ["#888888", "#555555"],
          timestamp: typeof n?.timestamp === "number" ? n.timestamp : Date.now(),
          priority: ["LOW", "DEFAULT", "HIGH"].includes(n?.priority) ? n.priority : "DEFAULT",
        }))
      : base.notifications;

    return {
      vibe: typeof obj?.vibe === "string" ? obj.vibe : fallbackPrompt,
      generatedAt: Date.now(),
      wallpaper: {
        type: ["GRADIENT", "MESH", "SOLID"].includes(obj?.wallpaper?.type) ? obj.wallpaper.type : base.wallpaper.type,
        colors: ensureHexList(obj?.wallpaper?.colors),
        overlayAlpha: typeof obj?.wallpaper?.overlayAlpha === "number"
          ? Math.min(0.6, Math.max(0, obj.wallpaper.overlayAlpha))
          : base.wallpaper.overlayAlpha,
      },
      accent: ensureHex(obj?.accent ?? base.accent),
      accentSecondary: ensureHex(obj?.accentSecondary ?? base.accentSecondary),
      statusBar: {
        style: ["LIGHT", "DARK", "TRANSLUCENT"].includes(obj?.statusBar?.style) ? obj.statusBar.style : base.statusBar.style,
        tint: ensureHex(obj?.statusBar?.tint ?? base.statusBar.tint),
        showCarrier: typeof obj?.statusBar?.showCarrier === "boolean" ? obj.statusBar.showCarrier : true,
        carrierLabel: typeof obj?.statusBar?.carrierLabel === "string" ? obj.statusBar.carrierLabel : base.statusBar.carrierLabel,
      },
      home: {
        gridStyle: ["GRID_5", "GRID_4", "LIST", "COMPACT_6"].includes(obj?.home?.gridStyle) ? obj.home.gridStyle : base.home.gridStyle,
        columns: typeof obj?.home?.columns === "number" ? Math.min(8, Math.max(3, obj.home.columns)) : base.home.columns,
        iconShape: ["CIRCLE", "SQUIRCLE", "ROUNDED", "PEBBLE"].includes(obj?.home?.iconShape) ? obj.home.iconShape : base.home.iconShape,
        iconSize: typeof obj?.home?.iconSize === "number" ? Math.min(80, Math.max(36, obj.home.iconSize)) : base.home.iconSize,
        labelColor: ensureHex(obj?.home?.labelColor ?? base.home.labelColor),
        showLabels: typeof obj?.home?.showLabels === "boolean" ? obj.home.showLabels : true,
        pageIndicators: typeof obj?.home?.pageIndicators === "boolean" ? obj.home.pageIndicators : true,
      },
      dock: {
        enabled: typeof obj?.dock?.enabled === "boolean" ? obj.dock.enabled : true,
        apps: Array.isArray(obj?.dock?.apps) ? obj.dock.apps.slice(0, 5) : base.dock.apps,
        background: ensureHex(obj?.dock?.background ?? base.dock.background),
      },
      appDrawer: {
        sort: ["ALPHABETICAL", "RECENT", "MOST_USED"].includes(obj?.appDrawer?.sort) ? obj.appDrawer.sort : base.appDrawer.sort,
        searchBar: typeof obj?.appDrawer?.searchBar === "boolean" ? obj.appDrawer.searchBar : true,
        background: ensureHex(obj?.appDrawer?.background ?? base.appDrawer.background),
      },
      navBar: {
        style: ["GESTURE", "THREE_BUTTON"].includes(obj?.navBar?.style) ? obj.navBar.style : base.navBar.style,
        accent: ensureHex(obj?.navBar?.accent ?? base.navBar.accent),
      },
      quickSettings: { tiles },
      notifications,
      fontScale: typeof obj?.fontScale === "number" ? Math.min(1.2, Math.max(0.85, obj.fontScale)) : 1,
      cornerRadius: typeof obj?.cornerRadius === "number" ? Math.min(48, Math.max(8, obj.cornerRadius)) : 28,
      weather: {
        tempF: typeof obj?.weather?.tempF === "number" ? obj.weather.tempF : base.weather.tempF,
        condition: typeof obj?.weather?.condition === "string" ? obj.weather.condition : base.weather.condition,
        location: typeof obj?.weather?.location === "string" ? obj.weather.location : base.weather.location,
        icon: ["Sun", "Cloud", "CloudRain", "CloudSnow", "CloudSun"].includes(obj?.weather?.icon) ? obj.weather.icon : base.weather.icon,
        highF: typeof obj?.weather?.highF === "number" ? obj.weather.highF : base.weather.highF,
        lowF: typeof obj?.weather?.lowF === "number" ? obj.weather.lowF : base.weather.lowF,
      },
    };
  } catch {
    return generateAndroidUixFromPrompt(fallbackPrompt);
  }
}

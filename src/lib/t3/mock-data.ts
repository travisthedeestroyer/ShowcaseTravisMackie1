import type {
  InstalledAppInfo,
  PluginEntity,
  LocalModelOption,
  SystemSnapshot,
} from "./types";

// ---- Local model catalog (expanded beyond Android's 2 options) ----
export const LOCAL_MODEL_CATALOG: LocalModelOption[] = [
  {
    id: "gemma3_270m",
    name: "Gemma 3 · 270M",
    sizeMb: 304,
    fileName: "gemma3-270m-it-q8.task",
    description: "Ultra-light on-device model. Instant cold start, fits any device.",
  },
  {
    id: "gemma3_1b",
    name: "Gemma 3 · 1B",
    sizeMb: 555,
    fileName: "gemma3-1b-it-int4.task",
    description: "Balanced default. Reliable agent formatting, good for navigation & launch.",
  },
  {
    id: "gemma3_4b",
    name: "Gemma 3 · 4B",
    sizeMb: 2410,
    fileName: "gemma3-4b-it-int4.task",
    description: "Sharper reasoning for complex multi-step intents. (NEW)",
  },
  {
    id: "llama32_3b",
    name: "Llama 3.2 · 3B",
    sizeMb: 1900,
    fileName: "llama32-3b-instruct-q4.task",
    description: "Meta's edge model. Strong at shell commands. (NEW)",
  },
  {
    id: "phi4_mini",
    name: "Phi-4 Mini · 3.8B",
    sizeMb: 2280,
    fileName: "phi4-mini-int4.task",
    description: "Microsoft's compact reasoning model. (NEW)",
  },
];

// ---- Mock installed apps ----
const G = (a: string, b: string): [string, string] => [a, b] as [string, string];

export const MOCK_APPS: InstalledAppInfo[] = [
  {
    appName: "T³ Console", packageName: "com.aistudio.sudoos.aiagent",
    versionName: "1.4.0", versionCode: 140, isSystemApp: false, isLaunchable: true,
    apkSize: 28_500_000, targetSdkVersion: 36,
    installTimeMillis: Date.now() - 86400000 * 12,
    updateTimeMillis: Date.now() - 3600000 * 6, isFavorite: false,
    iconGradient: G("#C1613D", "#D9A05B"),
  },
  {
    appName: "Chrome", packageName: "com.android.chrome",
    versionName: "131.0.6778", versionCode: 6778, isSystemApp: false, isLaunchable: true,
    apkSize: 220_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 200,
    updateTimeMillis: Date.now() - 86400000 * 3, isFavorite: true,
    iconGradient: G("#4285F4", "#34A853"),
  },
  {
    appName: "YouTube", packageName: "com.google.android.youtube",
    versionName: "20.09.36", versionCode: 150936, isSystemApp: false, isLaunchable: true,
    apkSize: 175_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 320,
    updateTimeMillis: Date.now() - 86400000 * 1, isFavorite: false,
    iconGradient: G("#FF0000", "#CC0000"),
  },
  {
    appName: "Gmail", packageName: "com.google.android.gm",
    versionName: "2024.10.13", versionCode: 241013, isSystemApp: false, isLaunchable: true,
    apkSize: 98_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 410,
    updateTimeMillis: Date.now() - 86400000 * 5, isFavorite: false,
    iconGradient: G("#EA4335", "#FBBC04"),
  },
  {
    appName: "Maps", packageName: "com.google.android.apps.maps",
    versionName: "11.140.0301", versionCode: 11140030, isSystemApp: false, isLaunchable: true,
    apkSize: 145_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 365,
    updateTimeMillis: Date.now() - 86400000 * 8, isFavorite: true,
    iconGradient: G("#34A853", "#4285F4"),
  },
  {
    appName: "Spotify", packageName: "com.spotify.music",
    versionName: "9.0.4.820", versionCode: 904820, isSystemApp: false, isLaunchable: true,
    apkSize: 78_000_000, targetSdkVersion: 34,
    installTimeMillis: Date.now() - 86400000 * 280,
    updateTimeMillis: Date.now() - 86400000 * 2, isFavorite: false,
    iconGradient: G("#1DB954", "#1ED760"),
  },
  {
    appName: "Camera", packageName: "com.android.camera2",
    versionName: "14.1.0", versionCode: 140100, isSystemApp: true, isLaunchable: true,
    apkSize: 12_000_000, targetSdkVersion: 34,
    installTimeMillis: Date.now() - 86400000 * 500,
    updateTimeMillis: Date.now() - 86400000 * 30, isFavorite: false,
    iconGradient: G("#5E8570", "#708B75"),
  },
  {
    appName: "Photos", packageName: "com.google.android.apps.photos",
    versionName: "7.30.0", versionCode: 7300, isSystemApp: false, isLaunchable: true,
    apkSize: 88_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 250,
    updateTimeMillis: Date.now() - 86400000 * 4, isFavorite: false,
    iconGradient: G("#FBBC04", "#EA4335"),
  },
  {
    appName: "Messages", packageName: "com.google.android.apps.messaging",
    versionName: "2024.10.0", versionCode: 24100, isSystemApp: false, isLaunchable: true,
    apkSize: 65_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 300,
    updateTimeMillis: Date.now() - 86400000 * 6, isFavorite: false,
    iconGradient: G("#4285F4", "#34A853"),
  },
  {
    appName: "Settings", packageName: "com.android.settings",
    versionName: "15.0", versionCode: 1500, isSystemApp: true, isLaunchable: true,
    apkSize: 18_000_000, targetSdkVersion: 36,
    installTimeMillis: Date.now() - 86400000 * 600,
    updateTimeMillis: Date.now() - 86400000 * 60, isFavorite: false,
    iconGradient: G("#456175", "#5E8570"),
  },
  {
    appName: "Phone", packageName: "com.android.dialer",
    versionName: "15.1.0", versionCode: 1510, isSystemApp: true, isLaunchable: true,
    apkSize: 42_000_000, targetSdkVersion: 36,
    installTimeMillis: Date.now() - 86400000 * 600,
    updateTimeMillis: Date.now() - 86400000 * 45, isFavorite: false,
    iconGradient: G("#5E8570", "#456175"),
  },
  {
    appName: "Calendar", packageName: "com.google.android.calendar",
    versionName: "2024.45.0", versionCode: 24450, isSystemApp: false, isLaunchable: true,
    apkSize: 52_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 280,
    updateTimeMillis: Date.now() - 86400000 * 3, isFavorite: false,
    iconGradient: G("#4285F4", "#1A73E8"),
  },
  {
    appName: "Drive", packageName: "com.google.android.apps.docs",
    versionName: "2.24.082", versionCode: 224082, isSystemApp: false, isLaunchable: true,
    apkSize: 110_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 320,
    updateTimeMillis: Date.now() - 86400000 * 7, isFavorite: false,
    iconGradient: G("#0F9D58", "#0B8043"),
  },
  {
    appName: "WhatsApp", packageName: "com.whatsapp",
    versionName: "2.24.20.78", versionCode: 2242078, isSystemApp: false, isLaunchable: true,
    apkSize: 125_000_000, targetSdkVersion: 34,
    installTimeMillis: Date.now() - 86400000 * 290,
    updateTimeMillis: Date.now() - 86400000 * 1, isFavorite: true,
    iconGradient: G("#25D366", "#128C7E"),
  },
  {
    appName: "Instagram", packageName: "com.instagram.android",
    versionName: "355.0.0", versionCode: 35500, isSystemApp: false, isLaunchable: true,
    apkSize: 95_000_000, targetSdkVersion: 35,
    installTimeMillis: Date.now() - 86400000 * 240,
    updateTimeMillis: Date.now() - 86400000 * 2, isFavorite: false,
    iconGradient: G("#E1306C", "#F77737"),
  },
  {
    appName: "System UI", packageName: "com.android.systemui",
    versionName: "15.0", versionCode: 1500, isSystemApp: true, isLaunchable: false,
    apkSize: 28_000_000, targetSdkVersion: 36,
    installTimeMillis: Date.now() - 86400000 * 600,
    updateTimeMillis: Date.now() - 86400000 * 90, isFavorite: false,
    iconGradient: G("#6E6357", "#221E19"),
  },
  {
    appName: "Contacts", packageName: "com.android.contacts",
    versionName: "15.1.0", versionCode: 1510, isSystemApp: true, isLaunchable: true,
    apkSize: 22_000_000, targetSdkVersion: 36,
    installTimeMillis: Date.now() - 86400000 * 600,
    updateTimeMillis: Date.now() - 86400000 * 50, isFavorite: false,
    iconGradient: G("#4285F4", "#34A853"),
  },
  {
    appName: "Calculator", packageName: "com.android.calculator2",
    versionName: "15.0", versionCode: 1500, isSystemApp: true, isLaunchable: true,
    apkSize: 8_000_000, targetSdkVersion: 36,
    installTimeMillis: Date.now() - 86400000 * 600,
    updateTimeMillis: Date.now() - 86400000 * 40, isFavorite: false,
    iconGradient: G("#6E6357", "#8C8577"),
  },
];

// ---- Mock live processes ----
export interface ProcessRow {
  pid: number;
  user: string;
  rssKb: number;
  name: string;
}

export const MOCK_PROCESSES: ProcessRow[] = [
  { pid: 1, user: "root", rssKb: 184_320, name: "init" },
  { pid: 412, user: "system", rssKb: 92_104, name: "system_server" },
  { pid: 689, user: "u0_a14", rssKb: 224_500, name: "com.android.systemui" },
  { pid: 1248, user: "u0_a74", rssKb: 312_900, name: "com.aistudio.sudoos.aiagent" },
  { pid: 1510, user: "u0_a32", rssKb: 168_400, name: "com.google.android.apps.maps" },
  { pid: 1822, user: "u0_a48", rssKb: 142_800, name: "com.spotify.music" },
  { pid: 2104, user: "u0_a12", rssKb: 198_600, name: "com.android.chrome" },
  { pid: 2391, user: "u0_a56", rssKb: 88_200, name: "com.whatsapp" },
  { pid: 2640, user: "u0_a9", rssKb: 64_300, name: "com.google.android.gm" },
  { pid: 2890, user: "u0_a3", rssKb: 52_100, name: "com.google.android.apps.photos" },
  { pid: 3104, user: "u0_a102", rssKb: 41_800, name: "com.instagram.android" },
  { pid: 3340, user: "wifi", rssKb: 38_400, name: "wpa_supplicant" },
  { pid: 3502, user: "radio", rssKb: 32_900, name: "rild" },
  { pid: 3688, user: "bluetooth", rssKb: 28_600, name: "bluetoothd" },
];

// ---- Mock system telemetry (baseline; live updates layered on top) ----
export function baselineTelemetry(): SystemSnapshot {
  return {
    batteryPercent: 78,
    isCharging: true,
    usedMemBytes: 5_800_000_000,
    totalMemBytes: 12_000_000_000,
    availMemBytes: 6_200_000_000,
    lowMemory: false,
    storageUsedBytes: 78_000_000_000,
    storageTotalBytes: 256_000_000_000,
    cpuCores: 8,
    network: "WIFI",
    uptimeMillis: 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
    deviceModel: "Pixel 9 Pro",
    manufacturer: "Google",
    osRelease: "15",
    sdkInt: 36,
    primaryAbi: "arm64-v8a",
  };
}

// ---- Virtual filesystem (mock on-device files) ----
export const QUICK_ROOTS = [
  { label: "App files", path: "/data/data/com.aistudio.sudoos.aiagent/files" },
  { label: "App storage", path: "/storage/emulated/0/Android/data/com.aistudio.sudoos.aiagent" },
  { label: "Shared storage", path: "/storage/emulated/0" },
  { label: "System root", path: "/" },
];

export function buildInitialFs(): Record<string, import("./types").FsNode[]> {
  const now = Date.now();
  return {
    "/": [
      dir("acct", "/acct"), dir("cache", "/cache"), dir("data", "/data"),
      dir("dev", "/dev"), dir("etc", "/etc"), dir("mnt", "/mnt"),
      dir("proc", "/proc"), dir("sdcard", "/sdcard"), dir("storage", "/storage"),
      dir("sys", "/sys"), dir("system", "/system"), dir("vendor", "/vendor"),
      file("default.prop", "/default.prop", 412, "# ro.build.fingerprint=google/raven..."),
      file("init.rc", "/init.rc", 18204, "on init\n    mkdir /system\n    ..."),
    ],
    "/storage/emulated/0": [
      dir("Android", "/storage/emulated/0/Android"),
      dir("DCIM", "/storage/emulated/0/DCIM"),
      dir("Download", "/storage/emulated/0/Download"),
      dir("Documents", "/storage/emulated/0/Documents"),
      dir("Pictures", "/storage/emulated/0/Pictures"),
      dir("Music", "/storage/emulated/0/Music"),
      dir("Movies", "/storage/emulated/0/Movies"),
      file("README.txt", "/storage/emulated/0/README.txt", 842,
        "T³ virtual shared storage.\nFiles here are sandboxed to this browser session.\n\nTry creating a folder or editing a text file — versioning is automatic."),
    ],
    "/storage/emulated/0/Documents": [
      file("notes.md", "/storage/emulated/0/Documents/notes.md", 1280,
        "# T³ Notes\n\n- Shell runs in a sandboxed WebWorker\n- Themes are generated live\n- Omni-UI tokens scale the whole app instantly\n\n## Todo\n- [ ] Try the /UIX command\n- [ ] Generate a theme from a vibe\n- [ ] Browse installed apps"),
      file("config.json", "/storage/emulated/0/Documents/config.json", 312,
        '{\n  "provider": "GEMMA_LOCAL",\n  "sandbox": "STRICT_SANDBOX",\n  "voice": "Journey"\n}'),
      file("boot.log", "/storage/emulated/0/Documents/boot.log", 2404,
        "[ 0.000000] T³ boot\n[ 0.124000] LiquidEarthBackground ready\n[ 0.210000] Gemma engine loaded\n[ 0.318000] Onboarding skipped"),
    ],
    "/storage/emulated/0/Download": [
      file("gemma3-1b-it-int4.task.part", "/storage/emulated/0/Download/gemma3-1b-it-int4.task.part", 0),
      file("manifest.json", "/storage/emulated/0/Download/manifest.json", 612,
        '{"name":"T³","version":"1.4.0","shell":true,"voice":true}'),
    ],
    "/storage/emulated/0/Pictures": [
      dir("Screenshots", "/storage/emulated/0/Pictures/Screenshots"),
      dir("Wallpapers", "/storage/emulated/0/Pictures/Wallpapers"),
      file("orb.png", "/storage/emulated/0/Pictures/orb.png", 240_000),
    ],
    "/data/data/com.aistudio.sudoos.aiagent/files": [
      dir("models", "/data/data/com.aistudio.sudoos.aiagent/files/models"),
      dir("cache", "/data/data/com.aistudio.sudoos.aiagent/files/cache"),
      dir("databases", "/data/data/com.aistudio.sudoos.aiagent/files/databases"),
      file(".env", "/data/data/com.aistudio.sudoos.aiagent/files/.env", 64,
        "GEMINI_API_KEY=YOUR_KEY_HERE"),
    ],
    "/data/data/com.aistudio.sudoos.aiagent/files/models": [
      file("gemma.task", "/data/data/com.aistudio.sudoos.aiagent/files/models/gemma.task", 583_000_000),
    ],
  };
}

function dir(name: string, path: string): import("./types").FsNode {
  return {
    path, name, isDirectory: true, sizeBytes: 0,
    lastModified: Date.now() - Math.random() * 86400000 * 30,
    canRead: true, canWrite: name !== "proc" && name !== "sys" && name !== "dev",
    isHidden: name.startsWith("."), permissions: "drwxrwxr-x",
  };
}
function file(name: string, path: string, size: number, content = ""): import("./types").FsNode {
  return {
    path, name, isDirectory: false, sizeBytes: size,
    lastModified: Date.now() - Math.random() * 86400000 * 10,
    canRead: true, canWrite: true, isHidden: name.startsWith("."),
    permissions: "-rw-rw-r--",
    content: content || undefined,
    versions: content
      ? [{ versionId: "v1", savedAt: Date.now() - 3600000, sizeBytes: size, label: "initial" }]
      : undefined,
  };
}

// ---- Plugin marketplace (NEW — uses PluginEntity concept never wired in Android) ----
export const MOCK_PLUGINS: PluginEntity[] = [
  {
    id: "plugin-shell-pro", name: "Shell Pro", description: "Advanced shell completions, history search, and inline AI command explanation.",
    version: "2.1.0", author: "T³ Labs", category: "UTILITIES", isInstalled: true, isEnabled: true,
    permissions: ["SHELL_EXEC", "READ_HISTORY"], rating: 4.8, downloadsCount: 184_000,
    iconGradient: G("#C1613D", "#D9A05B"),
  },
  {
    id: "plugin-vault-guard", name: "Vault Guard", description: "Encrypts API keys at rest with a passphrase. Zero-knowledge vault.",
    version: "1.0.4", author: "Sudo Security", category: "SECURITY", isInstalled: false, isEnabled: false,
    permissions: ["ENCRYPT_KEYS"], rating: 4.9, downloadsCount: 92_400,
    iconGradient: G("#5E8570", "#456175"),
  },
  {
    id: "plugin-theme-forge", name: "Theme Forge", description: "300+ curated generative theme seeds. Import color palettes from images.",
    version: "3.0.0", author: "Omni Studio", category: "THEMES", isInstalled: true, isEnabled: true,
    permissions: ["GENERATE_THEMES"], rating: 4.7, downloadsCount: 256_000,
    iconGradient: G("#E9C46A", "#F4A261"),
  },
  {
    id: "plugin-voice-personas", name: "Voice Personas", description: "12 new Live voice personas — warm narrator, calm mentor, playful guide.",
    version: "0.9.2", author: "T³ Labs", category: "AI", isInstalled: false, isEnabled: false,
    permissions: ["USE_MIC", "TTS"], rating: 4.6, downloadsCount: 74_800,
    iconGradient: G("#8338EC", "#3A86FF"),
  },
  {
    id: "plugin-sandbox-x", name: "Sandbox X", description: "Per-command sandbox profiles. Block writes to specific paths by default.",
    version: "1.2.0", author: "Sudo Security", category: "SECURITY", isInstalled: false, isEnabled: false,
    permissions: ["RISK_SCORE_OVERRIDE"], rating: 4.5, downloadsCount: 38_900,
    iconGradient: G("#B1472E", "#C1613D"),
  },
  {
    id: "plugin-file-versioning-pro", name: "File Versioning Pro", description: "Unlimited file snapshots with diff viewer and one-click restore.",
    version: "1.4.0", author: "T³ Labs", category: "UTILITIES", isInstalled: false, isEnabled: false,
    permissions: ["VERSION_FILES"], rating: 4.8, downloadsCount: 121_000,
    iconGradient: G("#456175", "#5E8570"),
  },
  {
    id: "plugin-quick-actions", name: "Quick Actions", description: "Adds 20+ home-screen quick commands. Reorder with drag and drop.",
    version: "2.0.0", author: "Omni Studio", category: "UTILITIES", isInstalled: false, isEnabled: false,
    permissions: ["SHELL_EXEC"], rating: 4.4, downloadsCount: 64_200,
    iconGradient: G("#D9A05B", "#E4C6A6"),
  },
  {
    id: "plugin-ai-translator", name: "AI Translator", description: "On-device translation across 40 languages, fully offline with Gemma.",
    version: "1.0.0", author: "T³ Labs", category: "AI", isInstalled: false, isEnabled: false,
    permissions: ["USE_MODEL"], rating: 4.7, downloadsCount: 88_600,
    iconGradient: G("#06D6A0", "#2A9D8F"),
  },
];

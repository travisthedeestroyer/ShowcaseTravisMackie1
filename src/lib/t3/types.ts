// T³ core types — ported from Kotlin data classes

export type OsTab =
  | "DASHBOARD"
  | "TERMINAL"
  | "FILES"
  | "APPS"
  | "THEMES"
  | "SANDBOX"
  | "MODELS"
  | "MARKETPLACE"
  | "PROFILE";

export const OS_TABS: { id: OsTab; title: string }[] = [
  { id: "DASHBOARD", title: "Home" },
  { id: "TERMINAL", title: "Terminal" },
  { id: "FILES", title: "Files" },
  { id: "APPS", title: "System" },
  { id: "THEMES", title: "Appearance" },
  { id: "SANDBOX", title: "Security" },
  { id: "MODELS", title: "AI Model" },
  { id: "MARKETPLACE", title: "Capabilities" },
  { id: "PROFILE", title: "Settings" },
];

export const NAV_TABS: OsTab[] = ["DASHBOARD", "APPS", "TERMINAL", "FILES", "PROFILE"];
export const SETTINGS_CLUSTER: OsTab[] = ["THEMES", "SANDBOX", "MODELS", "MARKETPLACE"];

export type ModelProvider =
  | "GEMMA_LOCAL"
  | "GEMINI_API"
  | "OPENAI_API"
  | "ANTHROPIC_API"
  | "CUSTOM_REST";

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  GEMMA_LOCAL: "Gemma Local (On-Device)",
  GEMINI_API: "Google Gemini API",
  OPENAI_API: "OpenAI API",
  ANTHROPIC_API: "Anthropic Claude API",
  CUSTOM_REST: "Custom REST Endpoint",
};

export type SandboxLevel = "STRICT_SANDBOX" | "ROOT_SUDO";

export const SANDBOX_LEVELS: Record<
  SandboxLevel,
  { label: string; description: string }
> = {
  STRICT_SANDBOX: {
    label: "Strict Sandbox",
    description: "Isolated execution context. Safe read-only commands and virtual files.",
  },
  ROOT_SUDO: {
    label: "Root / Sudo Mode",
    description: "Full system access. Shell commands, file modifications, and app launcher routines.",
  },
};

export type TerminalStatus = "SUCCESS" | "WARNING" | "REJECTED" | "ERROR";

export interface TerminalLog {
  id: string;
  command: string;
  output: string;
  executionTimeMs: number;
  sandboxMode: SandboxLevel;
  status: TerminalStatus;
  timestamp: number;
}

export interface ConfigSettings {
  isSetupCompleted: boolean;
  selectedProvider: ModelProvider;
  apiKey: string;
  openAiApiKey: string;
  anthropicApiKey: string;
  customEndpointUrl: string;
  localModelDownloaded: boolean;
  localModelSizeMb: number;
  localModelUrl: string;
  sandboxLevel: SandboxLevel;
  googleLiveVoiceEnabled: boolean;
  rootPermissionsGranted: boolean;
  username: string;
  userRole: string;
  avatarStyle: string;
  selectedVoice: string;
  customVoicePath: string;
  systemTheme: string;
  enableNotifications: boolean;
  cloudSyncEnabled: boolean;
  darkMode: boolean;
  batterySaver: boolean;
}

export const DEFAULT_CONFIG: ConfigSettings = {
  isSetupCompleted: false,
  selectedProvider: "GEMMA_LOCAL",
  apiKey: "",
  openAiApiKey: "",
  anthropicApiKey: "",
  customEndpointUrl: "",
  localModelDownloaded: false,
  localModelSizeMb: 555,
  localModelUrl:
    "https://huggingface.co/litert-community/Gemma3-1B-IT/resolve/main/gemma3-1b-it-int4.task",
  sandboxLevel: "STRICT_SANDBOX",
  googleLiveVoiceEnabled: true,
  rootPermissionsGranted: true,
  username: "rootadmin",
  userRole: "Root Administrator",
  avatarStyle: "Shield-X",
  selectedVoice: "Journey",
  customVoicePath: "",
  systemTheme: "Bento Dark",
  enableNotifications: true,
  cloudSyncEnabled: false,
  darkMode: false,
  batterySaver: false,
};

// ---- Generative Theme ----
export interface GenerativeTheme {
  id: string;
  name: string;
  promptDescription: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  surfaceColor: string;
  textColor: string;
  glassBorderColor: string;
  bgGradientColors: string[]; // 4 stops
  orbColors: string[]; // 4 stops
  glassAlpha: number;
}

// ---- Omni-UI (UiDesignConfig) ----
export interface UiDesignConfig {
  spacingScale: number;   // 0.6..1.6
  radiusScale: number;     // 0.3..2.0
  reducedMotion: boolean;
  navLabelsVisible: boolean;
  typeScale: number;       // 0.85..1.25 (NEW)
  accentHueShift: number;  // -30..30 deg (NEW)
  motionSpeed: number;     // 0..2 (NEW)
}

export const DEFAULT_UI_DESIGN: UiDesignConfig = {
  spacingScale: 1,
  radiusScale: 1,
  reducedMotion: false,
  navLabelsVisible: true,
  typeScale: 1,
  accentHueShift: 0,
  motionSpeed: 1,
};

// ---- OsAction ----
export type OsAction =
  | { type: "SWITCH_TAB"; tab: OsTab }
  | { type: "LAUNCH_APP"; appQuery: string }
  | { type: "EXEC_CMD"; command: string }
  | { type: "CHANGE_THEME"; themeQuery: string }
  | { type: "SET_SANDBOX"; level: SandboxLevel }
  | { type: "FORCE_STOP_APP"; packageName: string };

export function isSensitiveAction(a: OsAction): boolean {
  if (a.type === "EXEC_CMD") return true;
  if (a.type === "FORCE_STOP_APP") return true;
  if (a.type === "SET_SANDBOX") return a.level === "ROOT_SUDO";
  return false;
}

export function describeAction(a: OsAction): string {
  switch (a.type) {
    case "SWITCH_TAB":
      return `Open ${OS_TABS.find((t) => t.id === a.tab)?.title ?? a.tab}`;
    case "LAUNCH_APP":
      return `Launch “${a.appQuery}”`;
    case "EXEC_CMD":
      return `Run command: ${a.command}`;
    case "CHANGE_THEME":
      return `Change theme to “${a.themeQuery}”`;
    case "SET_SANDBOX":
      return a.level === "ROOT_SUDO"
        ? "Switch to Root / Sudo mode"
        : "Switch to Strict Sandbox";
    case "FORCE_STOP_APP":
      return `Force-stop ${a.packageName}`;
  }
}

// ---- Live voice ----
export interface LiveVoiceState {
  isConnecting: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  amplitudes: number[]; // 24 floats 0..1
  userTranscript: string;
  aiTranscript: string;
  statusText: string;
  errorMessage: string;
  activeVoiceName: string;
}

export const DEFAULT_VOICE_STATE: LiveVoiceState = {
  isConnecting: false,
  isListening: false,
  isSpeaking: false,
  amplitudes: Array.from({ length: 24 }, () => 0.04),
  userTranscript: "",
  aiTranscript: "",
  statusText: "Tap to talk",
  errorMessage: "",
  activeVoiceName: "Gemini Live",
};

export function voiceIsActive(s: LiveVoiceState): boolean {
  return s.isConnecting || s.isListening || s.isSpeaking;
}

// ---- Download ----
export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number;
  isDownloading: boolean;
  statusText: string;
}

// ---- Installed apps ----
export interface InstalledAppInfo {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  isSystemApp: boolean;
  isLaunchable: boolean;
  apkSize: number;
  targetSdkVersion: number;
  installTimeMillis: number;
  updateTimeMillis: number;
  isFavorite: boolean;
  iconGradient: [string, string];
}

export type AppCategoryFilter = "ALL" | "USER" | "SYSTEM" | "LAUNCHABLE" | "FAVORITES";

// ---- File system (virtual) ----
export interface FsNode {
  path: string;
  name: string;
  isDirectory: boolean;
  sizeBytes: number;
  lastModified: number;
  canRead: boolean;
  canWrite: boolean;
  isHidden: boolean;
  permissions: string;
  content?: string; // for text files
  versions?: FileVersion[];
}

export interface FileVersion {
  versionId: string;
  savedAt: number;
  sizeBytes: number;
  label: string;
}

// ---- System telemetry ----
export interface SystemSnapshot {
  batteryPercent: number;
  isCharging: boolean;
  usedMemBytes: number;
  totalMemBytes: number;
  availMemBytes: number;
  lowMemory: boolean;
  storageUsedBytes: number;
  storageTotalBytes: number;
  cpuCores: number;
  network: "WIFI" | "CELLULAR" | "ETHERNET" | "OFFLINE";
  uptimeMillis: number;
  deviceModel: string;
  manufacturer: string;
  osRelease: string;
  sdkInt: number;
  primaryAbi: string;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n < 1024 * 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  return `${(n / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
}

export function formatUptime(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

// ---- Local model catalog ----
export interface LocalModelOption {
  id: string;
  name: string;
  sizeMb: number;
  fileName: string;
  description: string;
}

// ---- Plugins (Marketplace) ----
export type PluginCategory = "AI" | "SECURITY" | "THEMES" | "UTILITIES";

export interface PluginEntity {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: PluginCategory;
  isInstalled: boolean;
  isEnabled: boolean;
  permissions: string[];
  rating: number;
  downloadsCount: number;
  iconGradient: [string, string];
}

// ============================================================
// UIX mode — T3 desktop shell vs Android phone shell
// ============================================================
// In Root / Sudo mode, T³ uses its own "calm operating system" desktop UIX.
// In Strict Sandbox mode, T³ switches to a fully generative Android phone UIX,
// produced on demand by the Generative UIX Agent.

export type UixMode = "T3_DESKTOP" | "ANDROID_PHONE";

// Android UIX manifest — the entire phone home screen generated by the
// Generative UIX Agent. The agent decides wallpaper, accent color, status
// bar style, home grid layout, app drawer sort, navigation style, quick
// settings tiles, and a sample notification.
export type AndroidNavStyle = "GESTURE" | "THREE_BUTTON";
export type AndroidStatusStyle = "LIGHT" | "DARK" | "TRANSLUCENT";
export type AndroidGridStyle = "GRID_5" | "GRID_4" | "LIST" | "COMPACT_6";

export interface AndroidQuickTile {
  id: string;
  label: string;
  icon: string;     // lucide name token (we map to a small whitelist)
  active: boolean;
}

export interface AndroidNotification {
  id: string;
  appPackage: string;
  appName: string;
  title: string;
  body: string;
  iconGradient: [string, string];
  timestamp: number;
  priority: "LOW" | "DEFAULT" | "HIGH";
}

export interface AndroidUixManifest {
  vibe: string;              // the prompt that produced this
  generatedAt: number;
  wallpaper: {
    type: "GRADIENT" | "MESH" | "SOLID";
    colors: string[];        // 2..4 stops
    overlayAlpha: number;    // 0..1 dark scrim behind clock/widgets
  };
  accent: string;            // hex — system accent (icons, switches, active tile)
  accentSecondary: string;  // hex — secondary accent (notification highlights)
  statusBar: {
    style: AndroidStatusStyle;
    tint: string;            // hex — clock + icon color
    showCarrier: boolean;
    carrierLabel: string;
  };
  home: {
    gridStyle: AndroidGridStyle;
    columns: number;
    iconShape: "CIRCLE" | "SQUIRCLE" | "ROUNDED" | "PEBBLE";
    iconSize: number;        // px
    labelColor: string;      // hex
    showLabels: boolean;
    pageIndicators: boolean;
  };
  dock: {
    enabled: boolean;
    apps: string[];          // appNames or package names, max 5
    background: string;      // hex with alpha
  };
  appDrawer: {
    sort: "ALPHABETICAL" | "RECENT" | "MOST_USED";
    searchBar: boolean;
    background: string;      // hex with alpha
  };
  navBar: {
    style: AndroidNavStyle;
    accent: string;          // hex
  };
  quickSettings: {
    tiles: AndroidQuickTile[]; // up to 6
  };
  notifications: AndroidNotification[]; // up to 3 sample
  fontScale: number;          // 0.85..1.2
  cornerRadius: number;      // px — global radius for cards/sheets
  weather: {
    tempF: number;
    condition: string;
    location: string;
    icon: "Sun" | "Cloud" | "CloudRain" | "CloudSnow" | "CloudSun";
    highF: number;
    lowF: number;
  };
}

export function defaultAndroidUixManifest(): AndroidUixManifest {
  return {
    vibe: "Stock Android 15 calm — Material You default",
    generatedAt: Date.now(),
    wallpaper: {
      type: "GRADIENT",
      colors: ["#E7F0FA", "#C7DCF2", "#A8C5E8", "#8FB1DE"],
      overlayAlpha: 0.18,
    },
    accent: "#4285F4",
    accentSecondary: "#34A853",
    statusBar: {
      style: "LIGHT",
      tint: "#0B1F3A",
      showCarrier: true,
      carrierLabel: "T³ Mobile",
    },
    home: {
      gridStyle: "GRID_5",
      columns: 5,
      iconShape: "CIRCLE",
      iconSize: 56,
      labelColor: "#0B1F3A",
      showLabels: true,
      pageIndicators: true,
    },
    dock: {
      enabled: true,
      apps: ["Phone", "Messages", "Chrome", "Camera", "T³ Console"],
      background: "#66FFFFFF",
    },
    appDrawer: {
      sort: "ALPHABETICAL",
      searchBar: true,
      background: "#E6F0FA",
    },
    navBar: {
      style: "GESTURE",
      accent: "#4285F4",
    },
    quickSettings: {
      tiles: [
        { id: "wifi", label: "Wi-Fi", icon: "Wifi", active: true },
        { id: "bt", label: "Bluetooth", icon: "Bluetooth", active: false },
        { id: "dnd", label: "Do Not Disturb", icon: "Moon", active: false },
        { id: "flash", label: "Flashlight", icon: "Flashlight", active: false },
        { id: "airplane", label: "Airplane", icon: "Plane", active: false },
        { id: "datasaver", label: "Data Saver", icon: "Gauge", active: false },
      ],
    },
    notifications: [
      {
        id: "n1",
        appPackage: "com.google.android.gm",
        appName: "Gmail",
        title: "T³ Team",
        body: "Welcome to your generative phone UIX. Tap to open.",
        iconGradient: ["#EA4335", "#FBBC04"],
        timestamp: Date.now() - 5 * 60 * 1000,
        priority: "DEFAULT",
      },
      {
        id: "n2",
        appPackage: "com.android.chrome",
        appName: "Chrome",
        title: "Tab synced",
        body: "Your T³ theme mood board is ready.",
        iconGradient: ["#4285F4", "#34A853"],
        timestamp: Date.now() - 18 * 60 * 1000,
        priority: "LOW",
      },
    ],
    fontScale: 1,
    cornerRadius: 28,
    weather: {
      tempF: 68,
      condition: "Sunny",
      location: "San Francisco",
      icon: "Sun",
      highF: 72,
      lowF: 58,
    },
  };
}

// ============================================================
// Custom Generative Widgets — AI-generated widgets with
// arbitrary functionality and design
// ============================================================

// The widget "kind" determines how the WidgetRenderer renders it.
// The AI agent picks the best kind based on the user's description.
export type WidgetKind =
  | "CHART"        // bar/line/area/donut chart from data points
  | "GAUGE"        // circular gauge (0-100) with label
  | "COUNTER"      // big number with label + optional delta
  | "LIST"         // list of items with icons/values
  | "NOTES"        // editable sticky note
  | "TIMER"        // countdown timer with start/stop
  | "CLOCK"        // analog or digital clock
  | "WEATHER"      // weather card with icon + temp + forecast
  | "MARKDOWN"     // rendered markdown content
  | "METRICS"      // multi-row metric display
  | "PROGRESS"     // progress bars for multiple items
  | "STATUS"       // status indicators (online/offline/warning)
  | "QUOTE"        // inspirational quote that rotates
  | "CALENDAR"     // mini calendar
  | "ACTIVITY"     // activity feed / timeline
  | "CUSTOM";      // fully custom — AI provides HTML-like content

export interface WidgetDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface WidgetListItem {
  label: string;
  value?: string;
  icon?: string;     // lucide icon name
  color?: string;
}

export interface CustomWidget {
  id: string;
  title: string;
  description: string;
  kind: WidgetKind;
  enabled: boolean;
  // Common styling
  accent: string;           // hex
  background: string;       // hex or "glass"
  span: 1 | 2 | 3 | 4;
  icon?: string;            // lucide icon name for the header
  // Kind-specific data
  data?: {
    // CHART
    chartType?: "bar" | "line" | "area" | "donut";
    points?: WidgetDataPoint[];
    // GAUGE
    gaugeValue?: number;       // 0-100
    gaugeLabel?: string;
    gaugeMax?: number;
    // COUNTER
    counterValue?: number | string;
    counterLabel?: string;
    counterDelta?: string;
    // LIST
    items?: WidgetListItem[];
    // NOTES
    noteContent?: string;
    // TIMER
    timerSeconds?: number;
    // CLOCK
    clockTimezone?: string;
    clockFormat?: "12h" | "24h" | "analog";
    // WEATHER
    weatherTemp?: number;
    weatherCondition?: string;
    weatherLocation?: string;
    weatherIcon?: string;
    // MARKDOWN
    markdown?: string;
    // METRICS
    metrics?: { label: string; value: string; icon?: string; color?: string }[];
    // PROGRESS
    progress?: { label: string; value: number; color?: string }[];
    // STATUS
    statuses?: { label: string; status: "online" | "offline" | "warning" | "error"; color?: string }[];
    // QUOTE
    quotes?: string[];
    // CALENDAR
    calendarEvents?: { day: number; title: string; color?: string }[];
    // ACTIVITY
    activities?: { time: string; title: string; icon?: string; color?: string }[];
    // CUSTOM
    customHtml?: string;     // sanitized HTML for fully custom widgets
  };
  // AI generation metadata
  generatedFrom?: string;   // the prompt that generated this widget
  generatedAt?: number;
}

export function defaultCustomWidgets(): CustomWidget[] {
  return [];
}

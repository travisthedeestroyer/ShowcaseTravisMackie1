"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  OsTab,
  SandboxLevel,
  TerminalLog,
  TerminalStatus,
  ConfigSettings,
  GenerativeTheme,
  UiDesignConfig,
  OsAction,
  LiveVoiceState,
  DownloadProgress,
  InstalledAppInfo,
  AppCategoryFilter,
  SystemSnapshot,
  FsNode,
  PluginEntity,
  ModelProvider,
  UixMode,
  AndroidUixManifest,
  DesktopUixManifest,
  CustomWidget,
} from "./types";
import { DEFAULT_CONFIG, DEFAULT_VOICE_STATE, DEFAULT_UI_DESIGN, OS_TABS, describeAction, isSensitiveAction, defaultAndroidUixManifest, defaultDesktopUixManifest } from "./types";
import { THEME_PRESETS } from "./theme-presets";
import { generateThemeFromPrompt, parseThemeFromJson } from "./theme-engine";
import {
  parseUiDesignFromPrompt,
  parseUiDesignFromJson,
} from "./ui-design-engine";
import {
  parseActionTags,
  parseNaturalIntent,
  cleanActionTags,
  resolveTheme,
} from "./os-action-engine";
import {
  generateAndroidUixFromPrompt,
  parseAndroidUixFromJson,
} from "./android-uix-engine";
import {
  MOCK_APPS,
  MOCK_PROCESSES,
  MOCK_PLUGINS,
  LOCAL_MODEL_CATALOG,
  baselineTelemetry,
  buildInitialFs,
} from "./mock-data";
import { formatBytes } from "./types";

// ---- Risk scoring (ported from calculateCommandRisk) ----
export function calculateCommandRisk(cmd: string): number {
  const c = cmd.trim().toLowerCase();
  if (!c) return 0;
  if (/\brm\s+-rf\s+\/($|\s)/.test(c) || /\bmkfs\b/.test(c) || /\bdd\s+if=/.test(c))
    return 10;
  if (/\brm\s+/.test(c) && /\b(-rf|-r|-fr)\b/.test(c)) return 9;
  if (/\brm\s+/.test(c) || /\bchmod\s+777\b/.test(c) || /\bkill\s+-9\s+1\b/.test(c))
    return 8;
  if (/\bchmod\b/.test(c) && /-R/.test(c)) return 7;
  if (/\bsudo\b/.test(c) || /\bsystemctl\s+stop\b/.test(c) || /\breboot\b/.test(c))
    return 6;
  if (/\bkill\b/.test(c) || /\bshutdown\b/.test(c)) return 5;
  if (/\bcp\b/.test(c) || /\bmv\b/.test(c) || /\bchmod\b/.test(c)) return 3;
  if (/\bmkdir\b/.test(c) || /\btouch\b/.test(c) || /\becho\b/.test(c)) return 2;
  return 1;
}

// ---- Mock shell execution ----
function executeShell(
  command: string,
  cwd: string,
  sandbox: SandboxLevel
): { output: string; status: TerminalStatus; nextCwd: string } {
  const trimmed = command.trim();
  if (!trimmed) return { output: "", status: "SUCCESS", nextCwd: cwd };

  // cd handling
  if (/^cd(\s|$)/.test(trimmed)) {
    const target = trimmed.slice(2).trim() || "/";
    const next = resolvePath(cwd, target);
    return {
      output: `cd ${target}\n# now in ${next}`,
      status: "SUCCESS",
      nextCwd: next,
    };
  }
  // ai / gemma routing (handled separately)
  if (/^(ai|gemma)\s+/i.test(trimmed)) {
    return {
      output: "[routing to AI agent — use the Ask panel for live responses]",
      status: "WARNING",
      nextCwd: cwd,
    };
  }

  const risk = calculateCommandRisk(trimmed);
  if (sandbox === "STRICT_SANDBOX" && risk >= 7) {
    return {
      output: `Risk score ${risk}/10. Blocked in Strict Sandbox.\nSwitch to Root / Sudo Mode in Security to allow this.`,
      status: "REJECTED",
      nextCwd: cwd,
    };
  }

  const t0 = performance.now();
  const out = mockCommandOutput(trimmed, cwd);
  const status: TerminalStatus = risk >= 6 ? "WARNING" : "SUCCESS";
  return {
    output: out + `\n# exit 0 · ${Math.round(performance.now() - t0)}ms`,
    status,
    nextCwd: cwd,
  };
}

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith("/")) return target.replace(/\/+$/, "") || "/";
  if (target === "..") {
    const parts = cwd.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/") || "/";
  }
  if (target === "~" || target === "") return "/data/data/com.aistudio.sudoos.aiagent/files";
  return (cwd === "/" ? "" : cwd) + "/" + target;
}

function mockCommandOutput(cmd: string, cwd: string): string {
  const base = cmd.split(/\s+/)[0];
  switch (base) {
    case "ls":
    case "ll":
    case "dir": {
      const fs = useT3Store.getState().fs[cwd] ?? [];
      if (!fs.length) return `# empty directory: ${cwd}`;
      return fs
        .map((f) =>
          `${f.permissions}  root  root  ${String(f.sizeBytes).padStart(10)}  ${new Date(f.lastModified).toDateString().slice(4)}  ${f.name}${f.isDirectory ? "/" : ""}`
        )
        .join("\n");
    }
    case "pwd":
      return cwd;
    case "whoami":
      return "rootadmin";
    case "id":
      return "uid=0(root) gid=0(root) groups=0(root),1001(shell)";
    case "uname":
    case "uname-a":
      return "Linux localhost 6.8.0-t³ #1 SMP aarch64 GNU/Linux";
    case "df":
    case "df-h":
      return (
        "Filesystem      Size  Used Avail Use% Mounted on\n" +
        "/dev/block/dm-7  237G  78G  159G  33% /\n" +
        "tmpfs           5.8G  412M  5.4G   7% /dev\n" +
        "/dev/fuse       237G   78G  159G  33% /storage/emulated/0"
      );
    case "uptime":
      return " 03:42:18 up 3d 04h 12m,  1 user,  load average: 0.42, 0.38, 0.41";
    case "ps":
    case "ps-a":
    case "ps-ef": {
      return (
        "  PID USER       RSS NAME\n" +
        MOCK_PROCESSES.slice(0, 10)
          .map((p) => `${String(p.pid).padStart(5)} ${p.user.padEnd(8)} ${String(p.rssKb).padStart(8)} ${p.name}`)
          .join("\n")
      );
    }
    case "free":
    case "free-h":
      return (
        "               total        used        free      shared  buff/cache\n" +
        "Mem:            12Gi       5.8Gi       3.2Gi       412Mi       3.0Gi\n" +
        "Swap:           2.0Gi       412Mi       1.6Gi"
      );
    case "date":
      return new Date().toString();
    case "echo":
      return cmd.replace(/^echo\s*/, "");
    case "cat":
      return `[${cmd.slice(4)} contents would appear here]`;
    case "getprop":
      if (cmd.includes("ro.build.version.release"))
        return "15";
      if (cmd.includes("ro.product.model"))
        return "Pixel 9 Pro";
      return "[ro.build.fingerprint]: [google/raven/raven:15/...]";
    case "help":
      return (
        "T³ shell — available: ls, cd, pwd, whoami, id, uname -a, df -h, uptime, ps, free -h, date, echo, cat, getprop, ai <q>, clear"
      );
    case "clear":
      return "";
    default:
      return `command not found: ${base}\nType "help" for the list of built-ins.`;
  }
}

// ---- Store ----
interface T3State {
  // config & onboarding
  config: ConfigSettings;
  isSetupCompleted: boolean;
  // navigation
  selectedTab: OsTab;
  // terminal
  terminalLogs: TerminalLog[];
  currentCommandInput: string;
  workingDir: string;
  terminalHistory: string[]; // (NEW) for command recall/search
  // themes
  activeTheme: GenerativeTheme;
  draftTheme: GenerativeTheme | null;
  isGeneratingTheme: boolean;
  themeHistory: GenerativeTheme[];
  // omni-ui
  uiDesignConfig: UiDesignConfig;
  uiDesignDraft: UiDesignConfig | null;
  isGeneratingUiDesign: boolean;
  // voice
  liveVoiceState: LiveVoiceState;
  // download
  downloadProgress: DownloadProgress;
  // apps
  installedApps: InstalledAppInfo[];
  appSearchQuery: string;
  appFilter: AppCategoryFilter;
  favoriteApps: string[];
  // telemetry
  telemetry: SystemSnapshot;
  // files
  fs: Record<string, FsNode[]>;
  // pending action
  pendingAction: (OsAction & { description: string }) | null;
  // plugins (NEW)
  plugins: PluginEntity[];
  // ask recent exchanges (NEW)
  recentExchanges: { id: string; mode: "ask" | "web" | "uix"; prompt: string; response: string; isLoading: boolean; }[];
  // UIX mode (NEW): derived from sandbox level — ROOT=T3 desktop, STRICT=Android phone
  // We persist a snapshot so the Android manifest survives reloads even before the
  // Generative UIX Agent runs. uixMode itself is recomputed from sandbox on hydrate.
  androidUixManifest: AndroidUixManifest;
  androidUixDraft: AndroidUixManifest | null;
  isGeneratingAndroidUix: boolean;
  androidUixError: string;
  // Android home screen layout (NEW — persisted)
  hiddenHomeApps: string[]; // app names/packages removed from home in edit mode
  homeFolders: { id: string; apps: string[]; name: string }[]; // user-created app folders
  // Media mode (NEW — for reactive orb + liquid border)
  mediaMode: boolean;
  // Custom generative widgets (NEW — AI-generated widgets with arbitrary functionality)
  customWidgets: CustomWidget[];
  isGeneratingWidget: boolean;
}

interface T3Actions {
  // onboarding
  submitOnboarding: (name: string, provider: ModelProvider, apiKey: string, sandbox: SandboxLevel) => void;
  // navigation
  selectTab: (tab: OsTab) => void;
  // terminal
  updateCommandInput: (s: string) => void;
  executeTerminalCommand: (command: string) => void;
  clearTerminalLogs: () => void;
  recallCommand: (direction: "up" | "down") => void;
  searchCommandHistory: (q: string) => string[];
  // themes
  selectTheme: (t: GenerativeTheme) => void;
  generateThemeFromAi: (prompt: string) => Promise<void>;
  applyDraftTheme: () => void;
  discardDraftTheme: () => void;
  setSurfaceOpacity: (alpha: number) => void;
  // omni-ui
  requestUiDesignChange: (request: string) => Promise<void>;
  applyUiDesignDraft: () => void;
  discardUiDesignDraft: () => void;
  // voice
  toggleLiveVoice: () => void;
  // models
  saveModelConfig: (provider: ModelProvider, key: string, customUrl?: string) => void;
  setLocalModel: (id: string) => void;
  triggerLocalModelDownload: () => void;
  deleteLocalModel: () => void;
  setSandboxLevel: (level: SandboxLevel) => void;
  // apps
  updateAppSearchQuery: (q: string) => void;
  setAppFilter: (f: AppCategoryFilter) => void;
  toggleFavoriteApp: (pkg: string) => void;
  launchApp: (pkg: string) => void;
  // actions
  dispatchAction: (a: OsAction) => void;
  approvePendingAction: () => void;
  dismissPendingAction: () => void;
  // AI
  askModel: (prompt: string) => Promise<{ text: string; actionNote: string }>;
  refreshTelemetry: () => void;
  // files
  createFolder: (parent: string, name: string) => void;
  deleteNode: (path: string) => void;
  renameNode: (path: string, newName: string) => void;
  saveFileContent: (path: string, content: string) => void;
  // plugins
  installPlugin: (id: string) => void;
  togglePlugin: (id: string) => void;
  // profile
  updateProfile: (name: string, avatar: string, voice: string, notifications: boolean, cloudSync: boolean) => void;
  setSpokenResponses: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setBatterySaver: (enabled: boolean) => void;
  // exchanges
  addExchange: (e: { id: string; mode: "ask" | "web" | "uix"; prompt: string }) => void;
  resolveExchange: (id: string, response: string) => void;
  removeExchange: (id: string) => void;
  // Android UIX (NEW — Generative UIX Agent)
  generateAndroidUix: (vibe: string) => Promise<void>;
  applyAndroidUixDraft: () => void;
  discardAndroidUixDraft: () => void;
  resetAndroidUixToDefault: () => void;
  toggleQuickTile: (tileId: string) => void;
  dismissNotification: (id: string) => void;
  // Android home screen layout
  hideHomeApp: (key: string) => void;
  unhideHomeApp: (key: string) => void;
  resetHomeLayout: () => void;
  createHomeFolder: (app1: string, app2: string) => void;
  removeHomeFolder: (id: string) => void;
  renameHomeFolder: (id: string, name: string) => void;
  addAppToFolder: (folderId: string, appKey: string) => void;
  removeAppFromFolder: (folderId: string, appKey: string) => void;
  toggleMediaMode: () => void;
  // Custom generative widgets
  generateWidget: (description: string) => Promise<void>;
  addCustomWidget: (widget: CustomWidget) => void;
  removeCustomWidget: (id: string) => void;
  toggleCustomWidget: (id: string) => void;
  // UIX mode helper — computed from sandbox level
  getUixMode: () => UixMode;
}

export type T3Store = T3State & T3Actions;

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useT3Store = create<T3Store>()(
  persist(
    (set, get) => ({
      // ---------- state ----------
      config: DEFAULT_CONFIG,
      isSetupCompleted: false,
      selectedTab: "DASHBOARD",
      terminalLogs: [],
      currentCommandInput: "",
      workingDir: "/data/data/com.aistudio.sudoos.aiagent/files",
      terminalHistory: [],
      activeTheme: THEME_PRESETS[0],
      draftTheme: null,
      isGeneratingTheme: false,
      themeHistory: [],
      uiDesignConfig: DEFAULT_UI_DESIGN,
      uiDesignDraft: null,
      isGeneratingUiDesign: false,
      liveVoiceState: DEFAULT_VOICE_STATE,
      downloadProgress: {
        downloadedBytes: 0,
        totalBytes: 0,
        isDownloading: false,
        statusText: "Idle",
      },
      installedApps: MOCK_APPS,
      appSearchQuery: "",
      appFilter: "LAUNCHABLE",
      favoriteApps: ["com.android.chrome", "com.google.android.apps.maps", "com.whatsapp"],
      telemetry: baselineTelemetry(),
      fs: buildInitialFs(),
      pendingAction: null,
      plugins: MOCK_PLUGINS,
      recentExchanges: [],
      androidUixManifest: defaultAndroidUixManifest(),
      androidUixDraft: null,
      isGeneratingAndroidUix: false,
      androidUixError: "",
      hiddenHomeApps: [],
      homeFolders: [],
      mediaMode: false,
      customWidgets: [],
      isGeneratingWidget: false,

      // ---------- onboarding ----------
      submitOnboarding: (name, provider, apiKey, sandbox) => {
        set((s) => ({
          config: {
            ...s.config,
            isSetupCompleted: true,
            username: name || s.config.username,
            selectedProvider: provider,
            apiKey: provider === "GEMINI_API" ? apiKey : s.config.apiKey,
            openAiApiKey: provider === "OPENAI_API" ? apiKey : s.config.openAiApiKey,
            anthropicApiKey: provider === "ANTHROPIC_API" ? apiKey : s.config.anthropicApiKey,
            customEndpointUrl: provider === "CUSTOM_REST" ? apiKey : s.config.customEndpointUrl,
            sandboxLevel: sandbox,
            localModelDownloaded: provider === "GEMMA_LOCAL",
          },
          isSetupCompleted: true,
        }));
      },

      // ---------- navigation ----------
      selectTab: (tab) => set({ selectedTab: tab }),

      // ---------- terminal ----------
      updateCommandInput: (s) => set({ currentCommandInput: s }),

      executeTerminalCommand: (command) => {
        const { workingDir, config, terminalLogs, terminalHistory } = get();
        const cwd = workingDir;
        const sandbox = config.sandboxLevel;

        const t0 = performance.now();
        const result = executeShell(command, cwd, sandbox);
        const execMs = Math.max(1, Math.round(performance.now() - t0));

        const log: TerminalLog = {
          id: uid(),
          command,
          output: result.output,
          executionTimeMs: execMs,
          sandboxMode: sandbox,
          status: result.status,
          timestamp: Date.now(),
        };

        set({
          terminalLogs: [log, ...terminalLogs].slice(0, 100),
          workingDir: result.nextCwd,
          terminalHistory: command.trim()
            ? [command, ...terminalHistory].slice(0, 100)
            : terminalHistory,
          currentCommandInput: "",
        });
      },

      clearTerminalLogs: () => set({ terminalLogs: [] }),

      recallCommand: (direction) => {
        const { terminalHistory, currentCommandInput } = get();
        if (!terminalHistory.length) return;
        const idx = terminalHistory.findIndex((h) => h === currentCommandInput);
        const nextIdx =
          direction === "up"
            ? Math.min(terminalHistory.length - 1, idx + 1)
            : Math.max(-1, idx - 1);
        set({ currentCommandInput: nextIdx < 0 ? "" : terminalHistory[nextIdx] });
      },

      searchCommandHistory: (q) => {
        const { terminalHistory } = get();
        if (!q.trim()) return terminalHistory;
        const lower = q.toLowerCase();
        return terminalHistory.filter((h) => h.toLowerCase().includes(lower));
      },

      // ---------- themes ----------
      selectTheme: (t) =>
        set((s) => ({
          activeTheme: t,
          themeHistory: [t, ...s.themeHistory.filter((x) => x.id !== t.id)].slice(0, 6),
          draftTheme: null,
        })),

      generateThemeFromAi: async (prompt) => {
        if (!prompt.trim()) return;
        set({ isGeneratingTheme: true });
        try {
          const res = await fetch("/api/t3/theme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });
          const data = await res.json();
          const theme = data?.theme
            ? parseThemeFromJson(JSON.stringify(data.theme), prompt)
            : generateThemeFromPrompt(prompt);
          set({ draftTheme: theme, isGeneratingTheme: false });
        } catch {
          set({
            draftTheme: generateThemeFromPrompt(prompt),
            isGeneratingTheme: false,
          });
        }
      },

      applyDraftTheme: () => {
        const { draftTheme } = get();
        if (!draftTheme) return;
        get().selectTheme(draftTheme);
      },

      discardDraftTheme: () => set({ draftTheme: null }),

      setSurfaceOpacity: (alpha) =>
        set((s) => ({
          activeTheme: { ...s.activeTheme, glassAlpha: Math.min(0.8, Math.max(0.1, alpha)) },
        })),

      // ---------- omni-ui ----------
      requestUiDesignChange: async (request) => {
        if (!request.trim()) return;
        set({ isGeneratingUiDesign: true });
        try {
          const base = get().uiDesignConfig;
          const res = await fetch("/api/t3/uix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request, currentConfig: base }),
          });
          const data = await res.json();
          const draft = data?.config
            ? parseUiDesignFromJson(JSON.stringify(data.config), base, request)
            : parseUiDesignFromPrompt(request, base);
          set({ uiDesignDraft: draft, isGeneratingUiDesign: false });
        } catch {
          set({
            uiDesignDraft: parseUiDesignFromPrompt(request, get().uiDesignConfig),
            isGeneratingUiDesign: false,
          });
        }
      },

      applyUiDesignDraft: () => {
        const { uiDesignDraft } = get();
        if (!uiDesignDraft) return;
        set({ uiDesignConfig: uiDesignDraft, uiDesignDraft: null });
      },

      discardUiDesignDraft: () => set({ uiDesignDraft: null }),

      // ---------- voice ----------
      toggleLiveVoice: () =>
        set((s) => {
          const active = voiceIsActive(s.liveVoiceState);
          if (active) {
            return {
              liveVoiceState: {
                ...DEFAULT_VOICE_STATE,
                activeVoiceName: s.liveVoiceState.activeVoiceName,
              },
            };
          }
          return {
            liveVoiceState: {
              ...DEFAULT_VOICE_STATE,
              isConnecting: true,
              statusText: "Connecting…",
              activeVoiceName: s.config.selectedVoice || "Gemini Live",
            },
          };
        }),

      // ---------- models ----------
      saveModelConfig: (provider, key, customUrl) =>
        set((s) => ({
          config: {
            ...s.config,
            selectedProvider: provider,
            apiKey: provider === "GEMINI_API" ? key : s.config.apiKey,
            openAiApiKey: provider === "OPENAI_API" ? key : s.config.openAiApiKey,
            anthropicApiKey: provider === "ANTHROPIC_API" ? key : s.config.anthropicApiKey,
            customEndpointUrl: provider === "CUSTOM_REST" ? (customUrl ?? s.config.customEndpointUrl) : s.config.customEndpointUrl,
          },
        })),

      setLocalModel: (id) =>
        set((s) => {
          const m = LOCAL_MODEL_CATALOG.find((x) => x.id === id);
          return m
            ? {
                config: {
                  ...s.config,
                  localModelSizeMb: m.sizeMb,
                  localModelUrl: `https://huggingface.co/litert-community/${m.fileName}`,
                },
              }
            : {};
        }),

      triggerLocalModelDownload: () => {
        const { downloadProgress, config } = get();
        if (downloadProgress.isDownloading) return;
        const total = config.localModelSizeMb * 1024 * 1024;
        set({
          downloadProgress: {
            downloadedBytes: 0,
            totalBytes: total,
            isDownloading: true,
            statusText: "Starting…",
          },
        });
        // Simulate streamed download
        const interval = setInterval(() => {
          const cur = get().downloadProgress;
          if (!cur.isDownloading) {
            clearInterval(interval);
            return;
          }
          const next = Math.min(total, cur.downloadedBytes + 2 * 1024 * 1024);
          const done = next >= total;
          set({
            downloadProgress: {
              ...cur,
              downloadedBytes: next,
              statusText: done ? "Verifying model…" : `Downloading · ${formatBytes(next)} / ${formatBytes(total)}`,
            },
          });
          if (done) {
            clearInterval(interval);
            set((s) => ({
              downloadProgress: {
                ...cur,
                isDownloading: false,
                statusText: "Ready",
              },
              config: { ...s.config, localModelDownloaded: true },
            }));
          }
        }, 120);
      },

      deleteLocalModel: () =>
        set((s) => ({
          config: { ...s.config, localModelDownloaded: false },
          downloadProgress: { downloadedBytes: 0, totalBytes: 0, isDownloading: false, statusText: "Idle" },
        })),

      setSandboxLevel: (level) => {
        const action: OsAction = { type: "SET_SANDBOX", level };
        get().dispatchAction(action);
      },

      // ---------- apps ----------
      updateAppSearchQuery: (q) => set({ appSearchQuery: q }),
      setAppFilter: (f) => set({ appFilter: f }),
      toggleFavoriteApp: (pkg) =>
        set((s) => ({
          favoriteApps: s.favoriteApps.includes(pkg)
            ? s.favoriteApps.filter((p) => p !== pkg)
            : [...s.favoriteApps, pkg],
          installedApps: s.installedApps.map((a) =>
            a.packageName === pkg ? { ...a, isFavorite: !a.isFavorite } : a
          ),
        })),
      launchApp: (pkg) => {
        const app = get().installedApps.find((a) => a.packageName === pkg);
        if (app) {
          // Simulate launching — log to terminal
          const log: TerminalLog = {
            id: uid(),
            command: `am start -n ${pkg}`,
            output: `Starting: Intent { cmp=${pkg}/.MainActivity }\n# Launched ${app.appName}`,
            executionTimeMs: 80,
            sandboxMode: get().config.sandboxLevel,
            status: "SUCCESS",
            timestamp: Date.now(),
          };
          set((s) => ({ terminalLogs: [log, ...s.terminalLogs].slice(0, 100) }));
        }
      },

      // ---------- actions ----------
      dispatchAction: (a) => {
        if (isSensitiveAction(a)) {
          set({ pendingAction: { ...a, description: describeAction(a) } });
          return;
        }
        runAction(a, set, get);
      },

      approvePendingAction: () => {
        const { pendingAction } = get();
        if (!pendingAction) return;
        const { description, ...action } = pendingAction;
        runAction(action, set, get);
        set({ pendingAction: null });
      },

      dismissPendingAction: () => set({ pendingAction: null }),

      // ---------- AI ----------
      askModel: async (prompt) => {
        // 1. parse intent locally for instant control actions
        const { installedApps } = get();
        const local = parseNaturalIntent(prompt, installedApps);
        if (local) {
          get().dispatchAction(local);
          return {
            text: `Done — ${describeAction(local)}.`,
            actionNote: describeAction(local),
          };
        }
        // 2. otherwise call the AI agent
        try {
          const res = await fetch("/api/t3/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });
          const data = await res.json();
          const raw = data?.response ?? "(no response)";
          const actions = parseActionTags(raw);
          const clean = cleanActionTags(raw);
          // execute safe actions immediately; stage sensitive ones
          for (const a of actions) {
            get().dispatchAction(a);
          }
          const actionNote = actions.length
            ? actions.map(describeAction).join(" · ")
            : "";
          return { text: clean, actionNote };
        } catch {
          return {
            text: "(I couldn't reach the model. Check your provider settings in AI Model.)",
            actionNote: "",
          };
        }
      },

      refreshTelemetry: () =>
        set((s) => {
          // jitter baseline for live feel
          const t = s.telemetry;
          const drift = (v: number, p: number) =>
            Math.max(0, v + Math.round((Math.random() - 0.5) * v * p));
          const newBattery = Math.max(0, Math.min(100, t.batteryPercent + (t.isCharging ? 0.4 : -0.3)));
          // Auto battery saver: enable when battery < 20% and not charging; disable when charging above 30%
          let newConfig = s.config;
          if (newBattery < 20 && !t.isCharging && !s.config.batterySaver) {
            newConfig = { ...s.config, batterySaver: true };
          } else if (t.isCharging && newBattery > 30 && s.config.batterySaver) {
            newConfig = { ...s.config, batterySaver: false };
          }
          return {
            config: newConfig,
            telemetry: {
              ...t,
              batteryPercent: newBattery,
              usedMemBytes: drift(t.usedMemBytes, 0.04),
              availMemBytes: t.totalMemBytes - drift(t.usedMemBytes, 0.04),
              storageUsedBytes: drift(t.storageUsedBytes, 0.001),
              uptimeMillis: t.uptimeMillis + 5000,
            },
          };
        }),

      // ---------- files ----------
      createFolder: (parent, name) =>
        set((s) => {
          const path = parent === "/" ? `/${name}` : `${parent}/${name}`;
          const node: FsNode = {
            path,
            name,
            isDirectory: true,
            sizeBytes: 0,
            lastModified: Date.now(),
            canRead: true,
            canWrite: true,
            isHidden: name.startsWith("."),
            permissions: "drwxrwxr-x",
          };
          return {
            fs: {
              ...s.fs,
              [parent]: [...(s.fs[parent] ?? []), node].sort(sortFs),
            },
          };
        }),

      deleteNode: (path) =>
        set((s) => {
          const parent = path.split("/").slice(0, -1).join("/") || "/";
          const name = path.split("/").pop() ?? path;
          return {
            fs: {
              ...s.fs,
              [parent]: (s.fs[parent] ?? []).filter((n) => n.name !== name),
            },
          };
        }),

      renameNode: (path, newName) =>
        set((s) => {
          const parent = path.split("/").slice(0, -1).join("/") || "/";
          const oldName = path.split("/").pop() ?? path;
          return {
            fs: {
              ...s.fs,
              [parent]: (s.fs[parent] ?? []).map((n) =>
                n.name === oldName
                  ? { ...n, name: newName, path: `${parent === "/" ? "" : parent}/${newName}` }
                  : n
              ),
            },
          };
        }),

      saveFileContent: (path, content) =>
        set((s) => {
          const parent = path.split("/").slice(0, -1).join("/") || "/";
          const name = path.split("/").pop() ?? path;
          const versions: FsNode["versions"] = [];
          return {
            fs: {
              ...s.fs,
              [parent]: (s.fs[parent] ?? []).map((n) =>
                n.name === name
                  ? {
                      ...n,
                      content,
                      sizeBytes: new Blob([content]).size,
                      lastModified: Date.now(),
                      versions: [
                        { versionId: uid(), savedAt: Date.now(), sizeBytes: new Blob([content]).size, label: `v${(n.versions?.length ?? 0) + 1}` },
                        ...(n.versions ?? []).slice(0, 9),
                      ],
                    }
                  : n
              ),
            },
          };
        }),

      // ---------- plugins ----------
      installPlugin: (id) =>
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.id === id ? { ...p, isInstalled: true, isEnabled: true } : p
          ),
        })),

      togglePlugin: (id) =>
        set((s) => ({
          plugins: s.plugins.map((p) =>
            p.id === id ? { ...p, isEnabled: !p.isEnabled } : p
          ),
        })),

      // ---------- profile ----------
      updateProfile: (name, avatar, voice, notifications, cloudSync) =>
        set((s) => ({
          config: {
            ...s.config,
            username: name || s.config.username,
            avatarStyle: avatar,
            selectedVoice: voice,
            enableNotifications: notifications,
            cloudSyncEnabled: cloudSync,
          },
        })),

      setSpokenResponses: (enabled) =>
        set((s) => ({
          config: { ...s.config, googleLiveVoiceEnabled: enabled },
        })),

      setDarkMode: (enabled) =>
        set((s) => ({
          config: { ...s.config, darkMode: enabled },
        })),

      setBatterySaver: (enabled) =>
        set((s) => ({
          config: { ...s.config, batterySaver: enabled },
        })),

      // ---------- exchanges ----------
      addExchange: (e) =>
        set((s) => ({
          recentExchanges: [e, ...s.recentExchanges].slice(0, 4),
        })),

      resolveExchange: (id, response) =>
        set((s) => ({
          recentExchanges: s.recentExchanges.map((e) =>
            e.id === id ? { ...e, response, isLoading: false } : e
          ),
        })),

      removeExchange: (id) =>
        set((s) => ({
          recentExchanges: s.recentExchanges.filter((e) => e.id !== id),
        })),

      // ---------- Android UIX (Generative UIX Agent) ----------
      generateAndroidUix: async (vibe) => {
        const prompt = (vibe || "").trim();
        if (!prompt) return;
        set({ isGeneratingAndroidUix: true, androidUixError: "" });
        try {
          const deviceState = {
            sandbox: get().config.sandboxLevel,
            provider: get().config.selectedProvider,
            username: get().config.username,
            battery: get().telemetry.batteryPercent,
            network: get().telemetry.network,
            model: get().telemetry.deviceModel,
            os: get().telemetry.osRelease,
          };
          const res = await fetch("/api/t3/uix-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vibe: prompt, deviceState }),
          });
          const data = await res.json();
          const draft = data?.manifest
            ? parseAndroidUixFromJson(JSON.stringify(data.manifest), prompt)
            : generateAndroidUixFromPrompt(prompt);
          set({ androidUixDraft: draft, isGeneratingAndroidUix: false });
        } catch (err) {
          set({
            androidUixDraft: generateAndroidUixFromPrompt(prompt),
            isGeneratingAndroidUix: false,
            androidUixError: err instanceof Error ? err.message : "unknown error",
          });
        }
      },

      applyAndroidUixDraft: () => {
        const { androidUixDraft } = get();
        if (!androidUixDraft) return;
        set({ androidUixManifest: androidUixDraft, androidUixDraft: null });
      },

      discardAndroidUixDraft: () => set({ androidUixDraft: null, androidUixError: "" }),

      resetAndroidUixToDefault: () =>
        set({
          androidUixManifest: defaultAndroidUixManifest(),
          androidUixDraft: null,
          androidUixError: "",
        }),

      toggleQuickTile: (tileId) =>
        set((s) => ({
          androidUixManifest: {
            ...s.androidUixManifest,
            quickSettings: {
              tiles: s.androidUixManifest.quickSettings.tiles.map((t) =>
                t.id === tileId ? { ...t, active: !t.active } : t
              ),
            },
          },
        })),

      dismissNotification: (id) =>
        set((s) => ({
          androidUixManifest: {
            ...s.androidUixManifest,
            notifications: s.androidUixManifest.notifications.filter((n) => n.id !== id),
          },
        })),

      hideHomeApp: (key) =>
        set((s) => ({
          hiddenHomeApps: s.hiddenHomeApps.includes(key)
            ? s.hiddenHomeApps
            : [...s.hiddenHomeApps, key],
        })),

      unhideHomeApp: (key) =>
        set((s) => ({
          hiddenHomeApps: s.hiddenHomeApps.filter((k) => k !== key),
        })),

      resetHomeLayout: () => set({ hiddenHomeApps: [], homeFolders: [] }),

      createHomeFolder: (app1, app2) =>
        set((s) => ({
          homeFolders: [...s.homeFolders, { id: `folder_${Date.now()}`, apps: [app1, app2], name: "Folder" }],
        })),

      removeHomeFolder: (id) =>
        set((s) => ({
          homeFolders: s.homeFolders.filter((f) => f.id !== id),
        })),

      renameHomeFolder: (id, name) =>
        set((s) => ({
          homeFolders: s.homeFolders.map((f) => (f.id === id ? { ...f, name: name || "Folder" } : f)),
        })),

      addAppToFolder: (folderId, appKey) =>
        set((s) => ({
          homeFolders: s.homeFolders.map((f) =>
            f.id === folderId && !f.apps.includes(appKey)
              ? { ...f, apps: [...f.apps, appKey] }
              : f
          ),
        })),

      removeAppFromFolder: (folderId, appKey) =>
        set((s) => ({
          homeFolders: s.homeFolders
            .map((f) =>
              f.id === folderId
                ? { ...f, apps: f.apps.filter((a) => a !== appKey) }
                : f
            )
            // Auto-remove folder if it has fewer than 2 apps
            .filter((f) => f.apps.length >= 2),
        })),

      toggleMediaMode: () =>
        set((s) => ({ mediaMode: !s.mediaMode })),

      // ---------- Custom generative widgets ----------
      generateWidget: async (description) => {
        const prompt = (description || "").trim();
        if (!prompt) return;
        set({ isGeneratingWidget: true });
        try {
          const res = await fetch("/api/t3/widget", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: prompt }),
          });
          const data = await res.json();
          if (data?.widget) {
            const widget = data.widget as CustomWidget;
            set((s) => ({ customWidgets: [...s.customWidgets, widget], isGeneratingWidget: false }));
          } else {
            set({ isGeneratingWidget: false });
          }
        } catch {
          set({ isGeneratingWidget: false });
        }
      },

      addCustomWidget: (widget) =>
        set((s) => ({ customWidgets: [...s.customWidgets, widget] })),

      removeCustomWidget: (id) =>
        set((s) => ({ customWidgets: s.customWidgets.filter((w) => w.id !== id) })),

      toggleCustomWidget: (id) =>
        set((s) => ({
          customWidgets: s.customWidgets.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        })),

      getUixMode: () => {
        return get().config.sandboxLevel === "ROOT_SUDO" ? "T3_DESKTOP" : "ANDROID_PHONE";
      },
    }),
    {
      name: "t3-os-state",
      storage: createJSONStorage(() => localStorage),
      // only persist essential state, not derived/runtime stuff
      partialize: (s) => ({
        config: s.config,
        isSetupCompleted: s.isSetupCompleted,
        selectedTab: s.selectedTab,
        activeTheme: s.activeTheme,
        themeHistory: s.themeHistory,
        uiDesignConfig: s.uiDesignConfig,
        terminalHistory: s.terminalHistory,
        favoriteApps: s.favoriteApps,
        workingDir: s.workingDir,
        fs: s.fs,
        plugins: s.plugins,
        androidUixManifest: s.androidUixManifest,
        hiddenHomeApps: s.hiddenHomeApps,
        homeFolders: s.homeFolders,
        customWidgets: s.customWidgets,
      }) as Partial<T3Store>,
    }
  )
);

function sortFs(a: FsNode, b: FsNode): number {
  if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

function runAction(
  a: OsAction,
  set: (fn: Partial<T3State> | ((s: T3State) => Partial<T3State>)) => void,
  get: () => T3Store
) {
  switch (a.type) {
    case "SWITCH_TAB":
      set({ selectedTab: a.tab });
      break;
    case "LAUNCH_APP": {
      const app = get().installedApps.find(
        (x) => x.appName.toLowerCase() === a.appQuery.toLowerCase()
      ) ?? get().installedApps.find((x) =>
        x.appName.toLowerCase().includes(a.appQuery.toLowerCase())
      );
      if (app) get().launchApp(app.packageName);
      break;
    }
    case "EXEC_CMD":
      get().executeTerminalCommand(a.command);
      set({ selectedTab: "TERMINAL" });
      break;
    case "CHANGE_THEME": {
      const theme = resolveTheme(a.themeQuery);
      get().selectTheme(theme);
      break;
    }
    case "SET_SANDBOX":
      set((s) => ({ config: { ...s.config, sandboxLevel: a.level } }));
      break;
    case "FORCE_STOP_APP": {
      const log: TerminalLog = {
        id: uid(),
        command: `am force-stop ${a.packageName}`,
        output: `# force-stopped ${a.packageName}`,
        executionTimeMs: 60,
        sandboxMode: get().config.sandboxLevel,
        status: "SUCCESS",
        timestamp: Date.now(),
      };
      set((s) => ({ terminalLogs: [log, ...s.terminalLogs].slice(0, 100) }));
      break;
    }
  }
}

// helpers used above
function voiceIsActive(s: LiveVoiceState): boolean {
  return s.isConnecting || s.isListening || s.isSpeaking;
}

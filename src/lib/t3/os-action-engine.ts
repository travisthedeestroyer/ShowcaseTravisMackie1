import type { OsAction, OsTab, SandboxLevel } from "./types";
import { OS_TABS } from "./types";
import { THEME_PRESETS } from "./theme-presets";
import { generateThemeFromPrompt } from "./theme-engine";

// OsActionEngine — ported from OsActionEngine.kt
// Parses [ACTION:TYPE:value] tags and natural-language intents.

const ACTION_TAG_RE = /\[ACTION:([A-Z_]+):([^\]]+)\]/gi;

export function parseActionTags(text: string): OsAction[] {
  const actions: OsAction[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(ACTION_TAG_RE.source, "gi");
  while ((m = re.exec(text)) !== null) {
    const type = m[1].toUpperCase();
    const value = m[2].trim();
    const action = buildAction(type, value);
    if (action) actions.push(action);
  }
  return actions;
}

function buildAction(type: string, value: string): OsAction | null {
  switch (type) {
    case "SWITCH_TAB": {
      const tab = matchTab(value);
      return tab ? { type: "SWITCH_TAB", tab } : null;
    }
    case "LAUNCH_APP":
      return value ? { type: "LAUNCH_APP", appQuery: value } : null;
    case "EXEC_CMD":
    case "RUN_CMD":
      return value ? { type: "EXEC_CMD", command: value } : null;
    case "CHANGE_THEME":
    case "SET_THEME":
      return value ? { type: "CHANGE_THEME", themeQuery: value } : null;
    case "SET_SANDBOX": {
      const level = matchSandbox(value);
      return level ? { type: "SET_SANDBOX", level } : null;
    }
    case "FORCE_STOP_APP":
      return value ? { type: "FORCE_STOP_APP", packageName: value } : null;
    default:
      return null;
  }
}

function matchTab(value: string): OsTab | null {
  const v = value.trim().toLowerCase();
  const aliasMap: Record<string, OsTab> = {
    dashboard: "DASHBOARD",
    home: "DASHBOARD",
    desktop: "DASHBOARD",
    terminal: "TERMINAL",
    shell: "TERMINAL",
    files: "FILES",
    file: "FILES",
    filebrowser: "FILES",
    apps: "APPS",
    app: "APPS",
    system: "APPS",
    processes: "APPS",
    themes: "THEMES",
    theme: "THEMES",
    appearance: "THEMES",
    sandbox: "SANDBOX",
    security: "SANDBOX",
    models: "MODELS",
    model: "MODELS",
    ai: "MODELS",
    marketplace: "MARKETPLACE",
    capabilities: "MARKETPLACE",
    plugins: "MARKETPLACE",
    profile: "PROFILE",
    settings: "PROFILE",
  };
  return aliasMap[v] ?? null;
}

function matchSandbox(value: string): SandboxLevel | null {
  const v = value.trim().toLowerCase();
  if (/\b(strict|sandbox|safe|isolated)\b/.test(v)) return "STRICT_SANDBOX";
  if (/\b(root|sudo|admin|elevated|full)\b/.test(v)) return "ROOT_SUDO";
  return null;
}

export function cleanActionTags(text: string): string {
  return text.replace(ACTION_TAG_RE, "").replace(/\s{2,}/g, " ").trim();
}

// Natural-language intent parsing
export function parseNaturalIntent(
  input: string,
  installedApps: { appName: string; packageName: string }[] = []
): OsAction | null {
  const raw = input.trim();
  if (!raw) return null;
  const s = raw.toLowerCase();

  // Theme switching
  const themeMatch = s.match(
    /^(?:change|set|switch|make|apply)\s+(?:the\s+)?(?:theme|appearance|look)\s+(?:to\s+)?(.+)$/i
  );
  if (themeMatch) {
    return { type: "CHANGE_THEME", themeQuery: themeMatch[1].trim() };
  }
  const named = THEME_PRESETS.find((t) =>
    s.includes(t.name.toLowerCase()) ||
    s.includes(t.id.replace(/_/g, " "))
  );
  if (named && /\b(theme|appearance|look)\b/.test(s)) {
    return { type: "CHANGE_THEME", themeQuery: named.name };
  }

  // Sandbox
  if (/\b(enable|switch to|use|activate)\s+(root|sudo|admin)\b/.test(s) || /\broot mode\b/.test(s)) {
    return { type: "SET_SANDBOX", level: "ROOT_SUDO" };
  }
  if (/\b(enable|switch to|use|activate)\s+(strict|sandbox)\b/.test(s) || /\bstrict mode\b/.test(s)) {
    return { type: "SET_SANDBOX", level: "STRICT_SANDBOX" };
  }

  // Tab navigation (check before command/app so "open the terminal" doesn't route to app)
  const tabAliases: { tab: OsTab; words: string[] }[] = [
    { tab: "DASHBOARD", words: ["go home", "dashboard", "desktop", "go to home", "show home"] },
    { tab: "TERMINAL", words: ["switch to terminal", "open terminal", "show terminal", "open the terminal", "go to terminal", "open shell", "open the shell"] },
    { tab: "FILES", words: ["open files", "show files", "open file browser", "browse files", "go to files", "file manager", "open the files"] },
    { tab: "APPS", words: ["show installed apps", "open apps", "show apps", "go to apps", "open system", "go to system", "system monitor", "show processes", "show system"] },
    { tab: "THEMES", words: ["open themes", "open appearance", "go to themes", "go to appearance", "theme studio", "open the themes", "appearance"] },
    { tab: "SANDBOX", words: ["open security", "open sandbox", "go to security", "security settings", "open the security"] },
    { tab: "MODELS", words: ["open models", "open ai model", "go to models", "model settings", "open the models"] },
    { tab: "MARKETPLACE", words: ["open marketplace", "open capabilities", "go to marketplace", "open plugins", "show capabilities"] },
    { tab: "PROFILE", words: ["open settings", "open profile", "go to settings", "show settings", "open the settings", "settings"] },
  ];
  for (const t of tabAliases) {
    if (t.words.some((w) => s === w || s.startsWith(w))) {
      return { type: "SWITCH_TAB", tab: t.tab };
    }
  }

  // Command execution
  const cmdMatch = raw.match(
    /^(?:run|execute|exec|run command|execute command)\s+(.+)$/i
  );
  if (cmdMatch) {
    return { type: "EXEC_CMD", command: cmdMatch[1].trim() };
  }

  // App launching
  const appMatch = raw.match(/^(?:open|launch|start|run|open up)\s+(.+)$/i);
  if (appMatch) {
    const query = appMatch[1].trim();
    // Avoid matching tab aliases
    const lower = query.toLowerCase();
    const isTab = OS_TABS.some(
      (t) =>
        lower === t.title.toLowerCase() ||
        lower === t.id.toLowerCase()
    );
    if (!isTab) {
      // Try exact app match first
      const exact = installedApps.find(
        (a) => a.appName.toLowerCase() === lower
      );
      if (exact) {
        return { type: "LAUNCH_APP", appQuery: exact.appName };
      }
      return { type: "LAUNCH_APP", appQuery: query };
    }
  }

  return null;
}

export function resolveTheme(query: string) {
  const preset = THEME_PRESETS.find(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.id.toLowerCase().includes(query.toLowerCase().replace(/\s+/g, "_"))
  );
  return preset ?? generateThemeFromPrompt(query);
}

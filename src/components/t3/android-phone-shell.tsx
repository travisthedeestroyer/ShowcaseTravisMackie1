"use client";

import * as React from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  Wifi, Bluetooth, Moon, Flashlight, Plane, RotateCw, Battery, Signal,
  ChevronUp, Search, ArrowLeft, Home, Square, Circle as CircleIcon, Grid3x3,
  Phone as PhoneIcon, MessageCircle, Camera, Sparkles, Bell, Settings,
  Sun, Volume2, Sunrise, Star, Clock, BatteryFull, BatteryCharging, WifiOff,
  BluetoothOff, X, RotateCcw, Lock, Mic, MoreVertical, Trash2, ArrowRight, Check,
  Terminal as TerminalIcon, Folder, ShieldCheck, Palette, Cpu, Blocks, ChevronRight,
  Cloud, CloudRain, CloudSnow, CloudSun, RadioTower, Gauge,
} from "lucide-react";
import { AdvancedFuturisticVoiceOrb, type OrbMode } from "./advanced-voice-orb";
import { LiquidScreenBorder } from "./liquid-screen-border";
import { useT3Store } from "@/lib/t3/store";
import type {
  AndroidUixManifest,
  AndroidQuickTile,
  AndroidNotification,
  InstalledAppInfo,
  OsTab,
} from "@/lib/t3/types";
import { OS_TABS } from "@/lib/t3/types";
import { formatBytes, formatUptime } from "@/lib/t3/types";

// Lucide whitelist for quick-settings tiles (manifest stores string names)
const TILE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Wifi, Bluetooth, Moon, Flashlight, Plane, RotateCw, Battery, Signal, RadioTower, Gauge,
};

// The T³ apps that are exposed as "phone apps" inside the Android shell.
// Each maps a phone-app name to an OsTab or to an installed app package.
const PHONE_APP_MAP: { name: string; tab?: OsTab; pkg?: string; icon: React.ComponentType<{ size?: number }>; gradient: [string, string] }[] = [
  { name: "T³ Console", tab: "DASHBOARD", icon: Sparkles, gradient: ["#C1613D", "#D9A05B"] },
  { name: "Terminal", tab: "TERMINAL", icon: TerminalIcon, gradient: ["#2D4A3E", "#1A2E26"] },
  { name: "Files", tab: "FILES", icon: Folder, gradient: ["#456175", "#5E8570"] },
  { name: "System", tab: "APPS", icon: Grid3x3, gradient: ["#5E8570", "#456175"] },
  { name: "Appearance", tab: "THEMES", icon: Palette, gradient: ["#D9A05B", "#E4C6A6"] },
  { name: "Security", tab: "SANDBOX", icon: ShieldCheck, gradient: ["#456175", "#2D4A6B"] },
  { name: "AI Model", tab: "MODELS", icon: Cpu, gradient: ["#C1613D", "#8A4327"] },
  { name: "Capabilities", tab: "MARKETPLACE", icon: Blocks, gradient: ["#5E8570", "#D9A05B"] },
  { name: "Settings", tab: "PROFILE", icon: Settings, gradient: ["#456175", "#6E6357"] },
];

// Darken a hex color by a factor (0 = black, 1 = unchanged)
function darkenHex(hex: string, factor: number): string {
  const m = hex.match(/^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (!m) return hex;
  const r = Math.round(parseInt(m[1].slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(m[1].slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(m[1].slice(4, 6), 16) * factor);
  const alpha = m[2] ?? "";
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${alpha}`;
}

// Icon shape → CSS border-radius style
function iconShapeStyle(shape: AndroidUixManifest["home"]["iconShape"], size: number): React.CSSProperties {
  switch (shape) {
    case "CIRCLE": return { borderRadius: "9999px" };
    case "SQUIRCLE": return { borderRadius: `${size * 0.42}px` };
    case "ROUNDED": return { borderRadius: `${size * 0.28}px` };
    case "PEBBLE": return { borderRadius: `${size * 0.5}px ${size * 0.3}px ${size * 0.5}px ${size * 0.3}px` };
    default: return { borderRadius: "9999px" };
  }
}

// =================================================================
// AndroidPhoneShell — the generative phone UIX that replaces T3's
// desktop shell when sandbox is Strict.
// =================================================================
export function AndroidPhoneShell() {
  const rawManifest = useT3Store((s) => s.androidUixManifest);
  const darkMode = useT3Store((s) => s.config.darkMode);
  const mediaMode = useT3Store((s) => s.mediaMode);
  const activeTheme = useT3Store((s) => s.activeTheme);
  const installedApps = useT3Store((s) => s.installedApps);
  const favoriteApps = useT3Store((s) => s.favoriteApps);
  const telemetry = useT3Store((s) => s.telemetry);
  const selectedTab = useT3Store((s) => s.selectedTab);
  const selectTab = useT3Store((s) => s.selectTab);
  const launchApp = useT3Store((s) => s.launchApp);
  const liveVoiceState = useT3Store((s) => s.liveVoiceState);
  const toggleLiveVoice = useT3Store((s) => s.toggleLiveVoice);

  // When dark mode is on, darken the manifest's wallpaper + status bar tint
  const manifest = React.useMemo(() => {
    if (!darkMode) return rawManifest;
    return {
      ...rawManifest,
      wallpaper: {
        ...rawManifest.wallpaper,
        colors: rawManifest.wallpaper.colors.map((c) => darkenHex(c, 0.55)),
        overlayAlpha: Math.max(0.3, rawManifest.wallpaper.overlayAlpha),
      },
      statusBar: {
        ...rawManifest.statusBar,
        tint: "#F4EEE4",
        style: "DARK" as const,
      },
      home: { ...rawManifest.home, labelColor: "#F4EEE4" },
      dock: { ...rawManifest.dock, background: "rgba(20,20,30,0.55)" },
      appDrawer: { ...rawManifest.appDrawer, background: "rgba(15,15,25,0.85)" },
    };
  }, [rawManifest, darkMode]);

  // Weather fallback for persisted manifests that predate the weather field
  const weather = manifest.weather ?? {
    tempF: 68, condition: "Sunny", location: "San Francisco",
    icon: "Sun" as const, highF: 72, lowF: 58,
  };

  // DND active state — derived from the quick settings "dnd" tile
  const dndActive = manifest.quickSettings.tiles.find((t) => t.id === "dnd")?.active ?? false;

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [activeApp, setActiveApp] = React.useState<OsTab | null>(null);
  const [now, setNow] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [locked, setLocked] = React.useState(true);
  const [recentsOpen, setRecentsOpen] = React.useState(false);
  const [recentApps, setRecentApps] = React.useState<OsTab[]>([]);
  const [weatherExpanded, setWeatherExpanded] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  // Persisted hidden apps from store
  const hiddenHomeApps = useT3Store((s) => s.hiddenHomeApps);
  const hideHomeApp = useT3Store((s) => s.hideHomeApp);
  const unhideHomeApp = useT3Store((s) => s.unhideHomeApp);
  const resetHomeLayout = useT3Store((s) => s.resetHomeLayout);
  const hiddenApps = React.useMemo(() => new Set(hiddenHomeApps), [hiddenHomeApps]);
  // Folder state — persisted in store
  const folders = useT3Store((s) => s.homeFolders);
  const createHomeFolder = useT3Store((s) => s.createHomeFolder);
  const removeHomeFolder = useT3Store((s) => s.removeHomeFolder);
  const renameHomeFolder = useT3Store((s) => s.renameHomeFolder);
  const addAppToFolder = useT3Store((s) => s.addAppToFolder);
  const removeAppFromFolder = useT3Store((s) => s.removeAppFromFolder);
  const [folderCreateTarget, setFolderCreateTarget] = React.useState<string | null>(null);
  const [openFolder, setOpenFolder] = React.useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [folderAddPicker, setFolderAddPicker] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // close drawer/quick when entering an app window; track recents
  React.useEffect(() => {
    if (activeApp) {
      setDrawerOpen(false);
      setQuickOpen(false);
      setNotificationsOpen(false);
      setRecentsOpen(false);
      setRecentApps((prev) => [activeApp, ...prev.filter((a) => a !== activeApp)].slice(0, 6));
    }
  }, [activeApp]);

  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const bigTimeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

  // dock apps — resolve from manifest (by name) into phone-app or installed app
  const dockApps = React.useMemo(() => resolveDock(manifest, installedApps), [manifest, installedApps]);

  // home apps — show T³ apps + favorites (mirroring a real phone's home page)
  // Filter out hidden apps (removed in edit mode) and apps that are in folders
  const appsInFolders = React.useMemo(() => new Set(folders.flatMap((f) => f.apps)), [folders]);
  const homeApps = React.useMemo(() => {
    const favorites = installedApps.filter((a) => favoriteApps.includes(a.packageName));
    const t3 = PHONE_APP_MAP.slice(0, 6).map((p) => ({ kind: "t3" as const, ...p }));
    const fav = favorites.slice(0, 9).map((a) => ({ kind: "installed" as const, app: a }));
    const all = [...t3, ...fav];
    return all
      .filter((a) => {
        const key = a.kind === "t3" ? a.name : a.app.packageName;
        return !hiddenApps.has(key) && !appsInFolders.has(key);
      })
      .slice(0, 15);
  }, [installedApps, favoriteApps, hiddenApps, appsInFolders]);

  // app drawer list — all phone apps + all installed apps
  const drawerApps = React.useMemo(() => {
    const all = [...PHONE_APP_MAP.map((p) => ({ kind: "t3" as const, ...p })), ...installedApps.map((a) => ({ kind: "installed" as const, app: a }))];
    if (manifest.appDrawer.sort === "RECENT") {
      return all; // no real recents; keep order
    }
    return [...all].sort((a, b) => {
      const an = a.kind === "t3" ? a.name : a.app.appName;
      const bn = b.kind === "t3" ? b.name : b.app.appName;
      return an.localeCompare(bn);
    });
  }, [installedApps, manifest.appDrawer.sort]);

  const filteredDrawer = React.useMemo(() => {
    if (!searchQuery.trim()) return drawerApps;
    const q = searchQuery.toLowerCase();
    return drawerApps.filter((a) => {
      const name = a.kind === "t3" ? a.name : a.app.appName;
      return name.toLowerCase().includes(q);
    });
  }, [drawerApps, searchQuery]);

  const openT3App = (tab: OsTab) => {
    selectTab(tab);
    setActiveApp(tab);
  };

  const launchInstalled = (pkg: string) => {
    launchApp(pkg);
  };

  // Background wallpaper
  const wallpaperStyle: React.CSSProperties = {
    background:
      manifest.wallpaper.type === "SOLID"
        ? manifest.wallpaper.colors[0]
        : manifest.wallpaper.type === "MESH"
        ? `radial-gradient(at 20% 20%, ${manifest.wallpaper.colors[0]} 0%, transparent 50%), radial-gradient(at 80% 30%, ${manifest.wallpaper.colors[1]} 0%, transparent 55%), radial-gradient(at 50% 90%, ${manifest.wallpaper.colors[2] ?? manifest.wallpaper.colors[0]} 0%, transparent 60%), radial-gradient(at 90% 80%, ${manifest.wallpaper.colors[3] ?? manifest.wallpaper.colors[1]} 0%, transparent 50%), ${manifest.wallpaper.colors[0]}`
        : `linear-gradient(160deg, ${manifest.wallpaper.colors.join(", ")})`,
  };

  return (
    <div
      className="h-screen flex flex-col relative overflow-hidden"
      style={{
        ...wallpaperStyle,
        fontFamily: "var(--font-geist-sans)",
        fontSize: `${16 * manifest.fontScale}px`,
      }}
    >
      {/* wallpaper scrim — improves contrast on the clock */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(180deg, rgba(0,0,0,${manifest.wallpaper.overlayAlpha}) 0%, transparent 35%, transparent 65%, rgba(0,0,0,${manifest.wallpaper.overlayAlpha * 0.7}) 100%)` }}
      />

      {/* ===== Lock screen (shows on mount; swipe up to unlock) ===== */}
      <AnimatePresence>
        {locked && (
          <LockScreen
            manifest={manifest}
            now={now}
            battery={telemetry.batteryPercent}
            charging={telemetry.isCharging}
            notifications={dndActive ? [] : manifest.notifications}
            onUnlock={() => setLocked(false)}
          />
        )}
      </AnimatePresence>

      {/* Status bars — top */}
      <AndroidStatusBar manifest={manifest} now={now} battery={telemetry.batteryPercent} charging={telemetry.isCharging} network={telemetry.network} onPullDown={() => setQuickOpen(true)} onBellTap={() => setNotificationsOpen(true)} />

      {/* ===== App window (a T³ screen rendered as a phone app) ===== */}
      <AnimatePresence>
        {activeApp && (
          <AppWindow
            tab={activeApp}
            accent={manifest.accent}
            cornerRadius={manifest.cornerRadius}
            onClose={() => setActiveApp(null)}
          />
        )}
      </AnimatePresence>

      {/* ===== Home screen ===== */}
      <AnimatePresence>
        {!activeApp && (
          <motion.main
            key="home"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col relative z-10 overflow-hidden min-h-0"
          >
            {/* Clock + weather widget */}
            <div className="pt-6 px-6 pb-3 text-center relative shrink-0" style={{ color: manifest.statusBar.tint }}>
              <div className="text-6xl font-extralight tabular-nums tracking-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
                {bigTimeStr}
              </div>
              <div className="text-sm font-medium mt-1 opacity-80">{dateStr}</div>
              {/* Weather row — from manifest; tap to expand forecast */}
              <button
                onClick={() => setWeatherExpanded((v) => !v)}
                className="inline-flex items-center gap-2.5 mt-2 px-3.5 py-1.5 rounded-full transition-transform active:scale-95"
                style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}
                aria-label="Toggle weather forecast"
              >
                {(() => {
                  const WIcon = weather.icon === "Sun" ? Sun :
                    weather.icon === "Cloud" ? Cloud :
                    weather.icon === "CloudRain" ? CloudRain :
                    weather.icon === "CloudSnow" ? CloudSnow :
                    weather.icon === "CloudSun" ? CloudSun : Sun;
                  return <WIcon size={15} />;
                })()}
                <span className="text-xs font-semibold tabular-nums">{weather.tempF}°F</span>
                <span aria-hidden style={{ width: 3, height: 3, borderRadius: 999, background: "currentColor", opacity: 0.4 }} />
                <span className="text-xs opacity-85">{weather.condition}</span>
                <span aria-hidden style={{ width: 3, height: 3, borderRadius: 999, background: "currentColor", opacity: 0.4 }} />
                <span className="text-xs opacity-75">{weather.location}</span>
                <ChevronUp size={12} className={weatherExpanded ? "rotate-180 transition-transform" : "transition-transform"} opacity={0.6} />
              </button>
              <div className="text-[11px] mt-1 opacity-85 tabular-nums font-medium">
                H:{weather.highF}°  L:{weather.lowF}°
              </div>
              {/* Expanded weather forecast card */}
              <AnimatePresence>
                {weatherExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden mx-auto max-w-xs"
                  >
                    <div className="rounded-2xl p-3 text-left" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.16)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Hourly forecast</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { hr: "Now", t: weather.tempF, ic: weather.icon },
                          { hr: "1AM", t: weather.tempF - 2, ic: "Cloud" },
                          { hr: "2AM", t: weather.tempF - 3, ic: "Cloud" },
                          { hr: "3AM", t: weather.tempF - 4, ic: "CloudRain" },
                          { hr: "4AM", t: weather.lowF, ic: "CloudRain" },
                        ].map((h, i) => {
                          const HIcon = h.ic === "Sun" ? Sun : h.ic === "Cloud" ? Cloud : h.ic === "CloudRain" ? CloudRain : h.ic === "CloudSnow" ? CloudSnow : h.ic === "CloudSun" ? CloudSun : Sun;
                          return (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <span className="text-[10px] opacity-70">{h.hr}</span>
                              <HIcon size={16} />
                              <span className="text-xs font-semibold tabular-nums">{h.t}°</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">5-day forecast</p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { day: "Mon", hi: weather.highF, lo: weather.lowF, ic: weather.icon },
                            { day: "Tue", hi: weather.highF + 1, lo: weather.lowF + 1, ic: "CloudSun" },
                            { day: "Wed", hi: weather.highF - 1, lo: weather.lowF - 1, ic: "Cloud" },
                            { day: "Thu", hi: weather.highF + 2, lo: weather.lowF, ic: "Sun" },
                            { day: "Fri", hi: weather.highF, lo: weather.lowF - 2, ic: "CloudRain" },
                          ].map((d, i) => {
                            const DIcon = d.ic === "Sun" ? Sun : d.ic === "Cloud" ? Cloud : d.ic === "CloudRain" ? CloudRain : d.ic === "CloudSnow" ? CloudSnow : d.ic === "CloudSun" ? CloudSun : Sun;
                            return (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] opacity-70">{d.day}</span>
                                <DIcon size={16} />
                                <span className="text-xs font-semibold tabular-nums">{d.hi}°</span>
                                <span className="text-[10px] opacity-60 tabular-nums">{d.lo}°</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search pill — opens app drawer */}
            <div className="px-5 mt-2 shrink-0">
              <button
                onClick={() => { setDrawerOpen(true); setSearchQuery(""); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(10px) saturate(140%)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  color: manifest.statusBar.tint,
                }}
              >
                <Search size={18} opacity={0.85} style={{ alignSelf: "center" }} />
                <span className="text-sm font-medium opacity-85" style={{ alignSelf: "center" }}>Search apps</span>
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold opacity-75" style={{ alignSelf: "center" }}>
                  <ChevronUp size={13} /> Drawer
                </span>
              </button>
            </div>

            {/* App grid */}
            <div
              className="flex-1 px-5 pt-5 pb-6 overflow-y-auto t3-scroll"
              style={{ columnGap: "12px" }}
            >
              {/* Edit mode banner */}
              {editMode && (
                <div className="mb-4 flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
                  <span className="text-xs font-semibold" style={{ color: manifest.statusBar.tint }}>
                    {folderCreateTarget ? "Tap another app to create a folder" : "Edit home — tap ✕ to remove, tap 2 apps to folder"}
                  </span>
                  <div className="flex items-center gap-2">
                    {(hiddenHomeApps.length > 0 || folders.length > 0) && (
                      <button
                        onClick={() => { resetHomeLayout(); }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.2)", color: manifest.statusBar.tint }}
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => { setEditMode(false); setFolderCreateTarget(null); }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: manifest.accent, color: "#fff" }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${manifest.home.columns}, minmax(0, 1fr))`, rowGap: "18px", columnGap: "12px" }}
              >
                {homeApps.map((a, i) => {
                  const key = a.kind === "t3" ? a.name : a.app.packageName;
                  const isFolderTarget = folderCreateTarget === key;
                  const handleAppClick = () => {
                    if (!editMode) {
                      if (a.kind === "t3" && a.tab) openT3App(a.tab);
                      else if (a.kind === "installed") launchInstalled(a.app.packageName);
                    } else {
                      // In edit mode: tap to select folder target, tap another to create folder
                      if (!folderCreateTarget) {
                        setFolderCreateTarget(key);
                      } else if (folderCreateTarget === key) {
                        setFolderCreateTarget(null); // deselect
                      } else {
                        // Create folder with target + this app via store
                        createHomeFolder(folderCreateTarget, key);
                        setFolderCreateTarget(null);
                      }
                    }
                  };
                  return (
                    <React.Fragment key={i}>
                      <div style={isFolderTarget ? { outline: `3px solid ${manifest.accent}`, borderRadius: "12px" } : undefined}>
                        {a.kind === "t3" ? (
                          <PhoneAppIcon
                            name={a.name}
                            Icon={a.icon}
                            gradient={a.gradient}
                            size={manifest.home.iconSize}
                            shape={manifest.home.iconShape}
                            labelColor={manifest.home.labelColor}
                            showLabel={manifest.home.showLabels}
                            onClick={handleAppClick}
                            editMode={editMode}
                            onRemove={() => hideHomeApp(a.name)}
                          />
                        ) : (
                          <PhoneAppIcon
                            name={a.app.appName}
                            Icon={null}
                            gradient={a.app.iconGradient}
                            size={manifest.home.iconSize}
                            shape={manifest.home.iconShape}
                            labelColor={manifest.home.labelColor}
                            showLabel={manifest.home.showLabels}
                            letter={a.app.appName.charAt(0)}
                            onClick={handleAppClick}
                            editMode={editMode}
                            onRemove={() => hideHomeApp(a.app.packageName)}
                          />
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                {/* Render folders */}
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setOpenFolder(folder.id)}
                    className="flex flex-col items-center gap-1.5"
                    style={{ width: manifest.home.iconSize + 8 }}
                  >
                    <div
                      className="grid grid-cols-2 gap-0.5"
                      style={{
                        width: manifest.home.iconSize,
                        height: manifest.home.iconSize,
                        borderRadius: "9999px",
                        background: "rgba(255,255,255,0.25)",
                        backdropFilter: "blur(8px)",
                        padding: 4,
                      }}
                    >
                      {folder.apps.slice(0, 4).map((appKey, idx) => {
                        const app = [...PHONE_APP_MAP, ...installedApps.map((a) => ({ name: a.appName, gradient: a.iconGradient, icon: null as any }))]
                          .find((p) => p.name === appKey || (installedApps.find((a) => a.packageName === appKey)?.appName === p.name));
                        const grad = installedApps.find((a) => a.packageName === appKey)?.iconGradient ?? app?.gradient ?? ["#888", "#555"];
                        return (
                          <div
                            key={idx}
                            className="rounded-full"
                            style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
                          />
                        );
                      })}
                    </div>
                    {manifest.home.showLabels && (
                      <span className="text-[11px] font-medium leading-tight truncate w-full text-center" style={{ color: manifest.home.labelColor, textShadow: "0 1px 3px rgba(255,255,255,0.6)" }}>
                        {folder.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dock */}
            {manifest.dock.enabled && (
              <div className="px-4 pb-3 pt-2 shrink-0">
                <div
                  className="rounded-3xl px-3 py-4 grid items-center"
                  style={{ background: manifest.dock.background, backdropFilter: "blur(14px) saturate(160%)", gridTemplateColumns: `repeat(${dockApps.length}, 1fr)`, gap: "8px", minHeight: Math.round(manifest.home.iconSize * 0.85) + 32 }}
                >
                  {dockApps.map((a, i) => (
                    <React.Fragment key={i}>
                      {a.kind === "t3" ? (
                        <PhoneAppIcon
                          name={a.name}
                          Icon={a.icon}
                          gradient={a.gradient}
                          size={Math.round(manifest.home.iconSize * 0.85)}
                          shape={manifest.home.iconShape}
                          showLabel={false}
                          onClick={() => a.tab && openT3App(a.tab)}
                        />
                      ) : (
                        <PhoneAppIcon
                          name={a.app.appName}
                          Icon={null}
                          gradient={a.app.iconGradient}
                          size={Math.round(manifest.home.iconSize * 0.85)}
                          shape={manifest.home.iconShape}
                          showLabel={false}
                          letter={a.app.appName.charAt(0)}
                          onClick={() => launchInstalled(a.app.packageName)}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Page indicators + edit button */}
            {manifest.home.pageIndicators && (
              <div className="flex items-center justify-center gap-2 pb-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: manifest.accent }} />
                <span className="w-1.5 h-1.5 rounded-full opacity-40" style={{ background: manifest.statusBar.tint }} />
                <span className="w-1.5 h-1.5 rounded-full opacity-40" style={{ background: manifest.statusBar.tint }} />
                <button
                  onClick={() => setEditMode((v) => !v)}
                  aria-label="Edit home screen"
                  className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                  style={{
                    background: editMode ? manifest.accent : "rgba(255,255,255,0.2)",
                    color: editMode ? "#fff" : manifest.statusBar.tint,
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* ===== App drawer (slide-up) ===== */}
      <AnimatePresence>
        {drawerOpen && (
          <AppDrawer
            manifest={manifest}
            apps={filteredDrawer}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClose={() => setDrawerOpen(false)}
            onOpenT3={(tab) => openT3App(tab)}
            onLaunchInstalled={(pkg) => launchInstalled(pkg)}
            hiddenApps={hiddenApps}
            onUnhide={(key) => unhideHomeApp(key)}
          />
        )}
      </AnimatePresence>

      {/* ===== Quick settings shade (pull-down) ===== */}
      <AnimatePresence>
        {quickOpen && (
          <QuickSettingsShade
            manifest={manifest}
            now={now}
            battery={telemetry.batteryPercent}
            charging={telemetry.isCharging}
            network={telemetry.network}
            onClose={() => setQuickOpen(false)}
            onToggleTile={(id) => useT3Store.getState().toggleQuickTile(id)}
          />
        )}
      </AnimatePresence>

      {/* ===== Notification cards (bell tap) ===== */}
      <AnimatePresence>
        {notificationsOpen && (
          <NotificationStack
            manifest={manifest}
            now={now}
            onClose={() => setNotificationsOpen(false)}
            onDismiss={(id) => useT3Store.getState().dismissNotification(id)}
            onOpenT3={(tab) => openT3App(tab)}
          />
        )}
      </AnimatePresence>

      {/* ===== Recents view (app switcher cards) ===== */}
      <AnimatePresence>
        {recentsOpen && (
          <RecentsView
            manifest={manifest}
            recentApps={recentApps}
            onOpenApp={(tab) => openT3App(tab)}
            onClose={() => setRecentsOpen(false)}
            onClearAll={() => { setRecentApps([]); setRecentsOpen(false); }}
          />
        )}
      </AnimatePresence>

      {/* ===== Folder open overlay ===== */}
      <AnimatePresence>
        {openFolder && (() => {
          const folder = folders.find((f) => f.id === openFolder);
          if (!folder) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[65] flex items-center justify-center p-6"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
              onClick={() => setOpenFolder(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl p-5"
                style={{ background: "var(--glass-surface-light, rgba(244,238,228,0.95))", backdropFilter: "blur(20px)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  {renamingFolder === folder.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { renameHomeFolder(folder.id, renameValue); setRenamingFolder(null); }
                        else if (e.key === "Escape") { setRenamingFolder(null); }
                      }}
                      onBlur={() => { renameHomeFolder(folder.id, renameValue); setRenamingFolder(null); }}
                      className="font-bold text-base outline-none px-2 py-1 rounded-lg flex-1"
                      style={{ background: "var(--glass-surface-card, rgba(219,251,246,0.93))", color: "var(--earth-deep-espresso, #221E19)", border: "1px solid var(--glass-border, rgba(26,36,29,0.1))" }}
                    />
                  ) : (
                    <button
                      onClick={() => { setRenamingFolder(folder.id); setRenameValue(folder.name); }}
                      className="font-bold text-base hover:opacity-70 transition-opacity"
                      style={{ color: "var(--earth-deep-espresso, #221E19)" }}
                    >
                      {folder.name}
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFolderAddPicker(true)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "color-mix(in srgb, var(--earth-terracotta, #C1613D) 14%, transparent)", color: "var(--earth-terracotta, #C1613D)" }}
                    >
                      + Add apps
                    </button>
                    <button
                      onClick={() => { removeHomeFolder(folder.id); setOpenFolder(null); }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(177,71,46,0.14)", color: "#B1472E" }}
                    >
                      Remove folder
                    </button>
                    <button onClick={() => setOpenFolder(null)} className="p-1 rounded-full" style={{ color: "var(--earth-secondary-text, #6E6357)" }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {folder.apps.map((appKey) => {
                    const t3app = PHONE_APP_MAP.find((p) => p.name === appKey);
                    const instApp = installedApps.find((a) => a.packageName === appKey);
                    const name = t3app?.name ?? instApp?.appName ?? appKey;
                    const grad = t3app?.gradient ?? instApp?.iconGradient ?? (["#888", "#555"] as [string, string]);
                    const Icon = t3app?.icon ?? null;
                    return (
                      <div key={appKey} className="relative">
                        <button
                          onClick={() => {
                            if (t3app?.tab) { openT3App(t3app.tab); setOpenFolder(null); }
                            else if (instApp) { launchInstalled(instApp.packageName); setOpenFolder(null); }
                          }}
                          className="flex flex-col items-center gap-1.5 w-full"
                        >
                          <div
                            className="flex items-center justify-center text-white font-bold"
                            style={{ width: 48, height: 48, borderRadius: "9999px", background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
                          >
                            {Icon ? <Icon size={22} /> : <span>{name.charAt(0)}</span>}
                          </div>
                          <span className="text-[11px] font-medium truncate w-full text-center" style={{ color: "var(--earth-deep-espresso, #221E19)" }}>{name}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeAppFromFolder(folder.id, appKey); if (folder.apps.length <= 2) setOpenFolder(null); }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                          style={{ background: "rgba(177,71,46,0.85)", fontSize: 8, fontWeight: 700, border: "none", padding: 0, cursor: "pointer" }}
                          aria-label={`Remove ${name} from folder`}
                        >
                          <X size={9} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {/* App picker for adding to folder */}
                {folderAddPicker && (
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--glass-border, rgba(26,36,29,0.1))" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--earth-secondary-text, #6E6357)" }}>Tap to add to this folder</p>
                    <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto t3-scroll">
                      {[...PHONE_APP_MAP.map((p) => ({ key: p.name, name: p.name, grad: p.gradient, Icon: p.icon, tab: p.tab, pkg: null })), ...installedApps.map((a) => ({ key: a.packageName, name: a.appName, grad: a.iconGradient, Icon: null, tab: null, pkg: a.packageName }))]
                        .filter((app) => !folder.apps.includes(app.key) && !hiddenApps.has(app.key) && !appsInFolders.has(app.key))
                        .map((app) => {
                          const AppIconCmp = app.Icon;
                          return (
                            <button
                              key={app.key}
                              onClick={() => { addAppToFolder(folder.id, app.key); setFolderAddPicker(false); }}
                              className="flex flex-col items-center gap-1"
                            >
                              <div
                                className="flex items-center justify-center text-white font-bold"
                                style={{ width: 36, height: 36, borderRadius: "9999px", background: `linear-gradient(135deg, ${app.grad[0]}, ${app.grad[1]})` }}
                              >
                                {AppIconCmp ? <AppIconCmp size={16} /> : <span style={{ fontSize: 14 }}>{app.name.charAt(0)}</span>}
                              </div>
                              <span className="text-[9px] font-medium truncate w-full text-center" style={{ color: "var(--earth-deep-espresso, #221E19)" }}>{app.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ===== Navigation bar (gesture or 3-button) ===== */}
      <AndroidNavBar manifest={manifest} onHome={() => { setActiveApp(null); setDrawerOpen(false); setRecentsOpen(false); }} onRecents={() => { setDrawerOpen(false); setRecentsOpen((r) => !r); }} onBack={() => { if (recentsOpen) setRecentsOpen(false); else if (activeApp) setActiveApp(null); else if (drawerOpen) setDrawerOpen(false); else if (quickOpen) setQuickOpen(false); }} />

      {/* Liquid screen-edge border — activates during media mode */}
      <LiquidScreenBorder
        active={mediaMode}
        theme={activeTheme}
        intensity={mediaMode ? 1 : 0}
        mode="media"
      />

      {/* Advanced voice orb — anchored right; sits above dock on home, above nav in apps */}
      <button
        onClick={toggleLiveVoice}
        aria-label="Toggle voice"
        className="fixed right-4 z-40 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95"
        style={{
          bottom: activeApp ? "calc(56px + 12px)" : "calc(96px + 56px + 12px)",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <AdvancedFuturisticVoiceOrb
          theme={activeTheme}
          level={(liveVoiceState.isListening || liveVoiceState.isSpeaking) ? (liveVoiceState.amplitudes[0] ?? 0) : 0}
          mode={(mediaMode ? "media" : (liveVoiceState.isConnecting || liveVoiceState.isListening || liveVoiceState.isSpeaking) ? "active" : "idle") as OrbMode}
          size={56}
        />
      </button>
    </div>
  );
}

// =================================================================
// Sub-components
// =================================================================
function AndroidStatusBar({
  manifest, now, battery, charging, network, onPullDown, onBellTap,
}: {
  manifest: AndroidUixManifest;
  now: Date;
  battery: number;
  charging: boolean;
  network: string;
  onPullDown: () => void;
  onBellTap: () => void;
}) {
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const tint = manifest.statusBar.tint;
  const bg =
    manifest.statusBar.style === "DARK"
      ? "rgba(0,0,0,0.45)"
      : manifest.statusBar.style === "TRANSLUCENT"
      ? "rgba(255,255,255,0.18)"
      : "transparent";
  const NetIcon = network === "WIFI" ? Wifi : network === "CELLULAR" ? Signal : network === "ETHERNET" ? Wifi : WifiOff;
  return (
    <div
      className="relative z-20 px-5 pt-3 pb-2 flex items-center justify-between cursor-pointer select-none"
      style={{ color: tint, background: bg, backdropFilter: manifest.statusBar.style === "TRANSLUCENT" ? "blur(8px)" : undefined }}
      onClick={onPullDown}
      aria-label="Pull down for quick settings"
    >
      <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
        <span>{timeStr}</span>
        {manifest.statusBar.showCarrier && (
          <>
            <span aria-hidden style={{ width: 4, height: 4, borderRadius: 999, background: tint, opacity: 0.4 }} />
            <span className="text-xs font-medium opacity-80">{manifest.statusBar.carrierLabel}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Signal size={14} />
        <NetIcon size={14} />
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums">
          {battery.toFixed(0)}%
          {charging ? <BatteryCharging size={14} /> : <BatteryFull size={14} />}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onBellTap(); }}
          aria-label="Notifications"
          className="p-1 -mr-1 rounded-full"
          style={{ color: tint }}
        >
          <Bell size={15} />
        </button>
      </div>
    </div>
  );
}

function PhoneAppIcon({
  name, Icon, gradient, size, shape, labelColor, showLabel, letter, onClick, editMode, onRemove,
}: {
  name: string;
  Icon: React.ComponentType<{ size?: number }> | null;
  gradient: [string, string];
  size: number;
  shape: AndroidUixManifest["home"]["iconShape"];
  labelColor?: string;
  showLabel?: boolean;
  letter?: string;
  onClick?: () => void;
  editMode?: boolean;
  onRemove?: () => void;
}) {
  const shapeStyle = iconShapeStyle(shape, size);
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-1.5 group relative" style={{ width: size + 8, cursor: onClick ? "pointer" : "default" }}>
      <motion.div
        animate={editMode ? { rotate: [-1.5, 1.5, -1.5] } : {}}
        transition={editMode ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" } : {}}
        whileTap={{ scale: 0.9 }}
        className="flex items-center justify-center text-white font-bold shadow-md relative"
        style={{
          width: size,
          height: size,
          ...shapeStyle,
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          fontSize: size * 0.42,
          boxShadow: "0 6px 14px -4px rgba(0,0,0,0.25)",
        }}
      >
        {Icon ? <Icon size={Math.round(size * 0.5)} /> : <span>{letter}</span>}
        {editMode && onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(); }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer z-10"
            style={{ background: "var(--cyber-alert-red, #B1472E)", fontSize: 10, fontWeight: 700, border: "none", padding: 0 }}
            aria-label={`Remove ${name}`}
            type="button"
          >
            <X size={11} />
          </button>
        )}
      </motion.div>
      {showLabel && (
        <span className="text-[11px] font-medium leading-tight truncate w-full text-center" style={{ color: labelColor, textShadow: "0 1px 3px rgba(255,255,255,0.6)" }}>
          {name}
        </span>
      )}
    </div>
  );
}

type DockApp =
  | { kind: "t3"; name: string; tab: OsTab; icon: React.ComponentType<{ size?: number }>; gradient: [string, string] }
  | { kind: "installed"; app: InstalledAppInfo };

type DrawerApp =
  | { kind: "t3"; name: string; tab?: OsTab; icon: React.ComponentType<{ size?: number }>; gradient: [string, string] }
  | { kind: "installed"; app: InstalledAppInfo };

function resolveDock(manifest: AndroidUixManifest, installedApps: InstalledAppInfo[]): DockApp[] {
  const out: DockApp[] = [];
  for (const name of manifest.dock.apps) {
    const t3 = PHONE_APP_MAP.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (t3 && t3.tab) {
      out.push({ kind: "t3", name: t3.name, tab: t3.tab, icon: t3.icon, gradient: t3.gradient });
      continue;
    }
    const inst = installedApps.find((a) => a.appName.toLowerCase() === name.toLowerCase());
    if (inst) out.push({ kind: "installed", app: inst });
  }
  return out.slice(0, 5);
}

// -------- App window --------
function AppWindow({
  tab, accent, cornerRadius, onClose,
}: {
  tab: OsTab;
  accent: string;
  cornerRadius: number;
  onClose: () => void;
}) {
  const Screen = SCREEN_FOR_TAB[tab];
  const title = OS_TABS.find((t) => t.id === tab)?.title ?? tab;
  return (
    <motion.div
      key={`appwin-${tab}`}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="absolute inset-0 z-30 flex flex-col"
      style={{
        background: "#F4EEE4",
        borderTopLeftRadius: cornerRadius,
        borderTopRightRadius: cornerRadius,
        overflow: "hidden",
      }}
    >
      {/* App top bar */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--glass-surface-light)", borderBottom: "1px solid var(--glass-border)", backdropFilter: "blur(12px) saturate(140%)" }}>
        <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2 className="font-bold text-base" style={{ color: "var(--earth-deep-espresso)" }}>{title}</h2>
        <span className="w-16" />
      </div>
      {/* The actual T3 screen content */}
      <div className="flex-1 overflow-y-auto t3-scroll">
        <div className="max-w-2xl mx-auto px-3 py-4">
          {Screen ? <Screen /> : null}
        </div>
      </div>
    </motion.div>
  );
}

// lazy map of tabs → screen render function
// We import lazily here to keep the Android shell self-contained.
import { DesktopScreen } from "@/components/t3/screens/desktop-screen";
import { TerminalScreen } from "@/components/t3/screens/terminal-screen";
import { FileManagerScreen } from "@/components/t3/screens/file-manager-screen";
import { ProcessManagerScreen } from "@/components/t3/screens/process-manager-screen";
import { GenerativeThemeScreen } from "@/components/t3/screens/generative-theme-screen";
import { SandboxScreen } from "@/components/t3/screens/sandbox-screen";
import { ModelsScreen } from "@/components/t3/screens/models-screen";
import { CapabilitiesScreen } from "@/components/t3/screens/capabilities-screen";
import { ProfileSettingsScreen } from "@/components/t3/screens/profile-settings-screen";

const SCREEN_FOR_TAB: Record<OsTab, React.ComponentType> = {
  DASHBOARD: DesktopScreen,
  TERMINAL: TerminalScreen,
  FILES: FileManagerScreen,
  APPS: ProcessManagerScreen,
  THEMES: GenerativeThemeScreen,
  SANDBOX: SandboxScreen,
  MODELS: ModelsScreen,
  MARKETPLACE: CapabilitiesScreen,
  PROFILE: ProfileSettingsScreen,
};

// -------- App drawer --------
function AppDrawer({
  manifest, apps, searchQuery, onSearchChange, onClose, onOpenT3, onLaunchInstalled, hiddenApps, onUnhide,
}: {
  manifest: AndroidUixManifest;
  apps: DrawerApp[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClose: () => void;
  onOpenT3: (tab: OsTab) => void;
  onLaunchInstalled: (pkg: string) => void;
  hiddenApps: Set<string>;
  onUnhide: (key: string) => void;
}) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="absolute inset-0 z-30 flex flex-col"
      style={{ background: manifest.appDrawer.background, backdropFilter: "blur(20px) saturate(160%)" }}
    >
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        {manifest.appDrawer.searchBar && (
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.6)" }}>
            <Search size={16} opacity={0.6} />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search apps"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        )}
        <button onClick={onClose} aria-label="Close drawer" className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.6)" }}>
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto t3-scroll px-5 pb-28">
        <div className="grid grid-cols-4 gap-x-3 gap-y-5">
          {apps.map((a, i) => {
            const key = a.kind === "t3" ? a.name : a.app.packageName;
            const isHidden = hiddenApps.has(key);
            return (
              <React.Fragment key={i}>
                {a.kind === "t3" ? (
                  <div className="relative">
                    <PhoneAppIcon
                      name={a.name}
                      Icon={a.icon}
                      gradient={a.gradient}
                      size={manifest.home.iconSize}
                      shape={manifest.home.iconShape}
                      labelColor={manifest.home.labelColor}
                      showLabel={manifest.home.showLabels}
                      onClick={() => a.tab && onOpenT3(a.tab)}
                    />
                    {isHidden && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUnhide(key); }}
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold z-10"
                        style={{ background: manifest.accent, color: "#fff", boxShadow: "0 2px 6px -2px rgba(0,0,0,0.3)" }}
                        aria-label={`Add ${a.name} to home`}
                      >
                        +
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <PhoneAppIcon
                      name={a.app.appName}
                      Icon={null}
                      gradient={a.app.iconGradient}
                      size={manifest.home.iconSize}
                      shape={manifest.home.iconShape}
                      labelColor={manifest.home.labelColor}
                      showLabel={manifest.home.showLabels}
                      letter={a.app.appName.charAt(0)}
                      onClick={() => onLaunchInstalled(a.app.packageName)}
                    />
                    {isHidden && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUnhide(key); }}
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold z-10"
                        style={{ background: manifest.accent, color: "#fff", boxShadow: "0 2px 6px -2px rgba(0,0,0,0.3)" }}
                        aria-label={`Add ${a.app.appName} to home`}
                      >
                        +
                      </button>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        {apps.length === 0 && (
          <div className="text-center text-sm opacity-60 py-10" style={{ color: manifest.statusBar.tint }}>
            No apps match “{searchQuery}”.
          </div>
        )}
      </div>
    </motion.div>
  );
}

// -------- Quick settings shade --------
function QuickSettingsShade({
  manifest, now, battery, charging, network, onClose, onToggleTile,
}: {
  manifest: AndroidUixManifest;
  now: Date;
  battery: number;
  charging: boolean;
  network: string;
  onClose: () => void;
  onToggleTile: (id: string) => void;
}) {
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return (
    <motion.div
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="absolute inset-x-0 top-0 z-40 p-4 pt-3"
      style={{ background: "rgba(20,30,50,0.78)", backdropFilter: "blur(24px) saturate(180%)", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: "#fff" }}
    >
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="font-semibold opacity-90">{dateStr}</span>
        <span className="font-semibold tabular-nums opacity-90">{timeStr}</span>
      </div>
      <div className="flex items-center justify-between mb-4 text-xs opacity-80">
        <span>{manifest.statusBar.carrierLabel}</span>
        <span className="inline-flex items-center gap-1.5">
          {network === "WIFI" ? <Wifi size={13} /> : <Signal size={13} />}
          <span className="tabular-nums inline-flex items-center gap-1">
            {battery.toFixed(0)}%
            {charging ? <BatteryCharging size={12} /> : null}
          </span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {manifest.quickSettings.tiles.map((t) => {
          const Icon = TILE_ICONS[t.icon] ?? Wifi;
          return (
            <button
              key={t.id}
              onClick={() => onToggleTile(t.id)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-transform active:scale-95"
              style={{
                background: t.active ? manifest.accent : "rgba(255,255,255,0.14)",
                color: t.active ? "#FFFFFF" : "rgba(255,255,255,0.9)",
              }}
            >
              <Icon size={20} />
              <span className="text-[11px] font-semibold leading-tight text-center px-1">{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4 text-xs">
        <button onClick={onClose} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }}>
          <ChevronUp size={14} /> Collapse
        </button>
        <div className="flex items-center gap-3 opacity-80">
          <Settings size={15} />
          <Sun size={15} />
          <Volume2 size={15} />
        </div>
      </div>
    </motion.div>
  );
}

// -------- Notification stack --------
function NotificationStack({
  manifest, now, onClose, onDismiss, onOpenT3,
}: {
  manifest: AndroidUixManifest;
  now: Date;
  onClose: () => void;
  onDismiss: (id: string) => void;
  onOpenT3: (tab: OsTab) => void;
}) {
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return (
    <motion.div
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="absolute inset-x-0 top-0 z-40 p-4 pt-3"
      style={{ background: "rgba(15,25,40,0.82)", backdropFilter: "blur(24px) saturate(180%)", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: "#fff", maxHeight: "85vh" }}
    >
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="font-semibold opacity-90">{dateStr} · Notifications</span>
        <button onClick={onClose} aria-label="Close" className="p-1 rounded-full opacity-80">
          <X size={16} />
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto t3-scroll pb-3" style={{ maxHeight: "calc(85vh - 60px)" }}>
        {manifest.notifications.length === 0 ? (
          <div className="text-center text-sm opacity-60 py-8">No notifications.</div>
        ) : (
          manifest.notifications.map((n) => (
            <NotificationCard key={n.id} n={n} accent={manifest.accentSecondary} onDismiss={() => onDismiss(n.id)} onOpen={() => {
              const t3 = PHONE_APP_MAP.find((p) => p.name.toLowerCase().includes(n.appName.toLowerCase().split(" ")[0]));
              if (t3?.tab) onOpenT3(t3.tab);
              onClose();
            }} />
          ))
        )}
      </div>
    </motion.div>
  );
}

function NotificationCard({ n, accent, onDismiss, onOpen }: { n: AndroidNotification; accent: string; onDismiss: () => void; onOpen: () => void }) {
  const ago = relativeTime(n.timestamp);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="rounded-2xl p-3 flex items-start gap-3"
      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: `1px solid ${n.priority === "HIGH" ? accent : "rgba(255,255,255,0.16)"}` }}
      onClick={onOpen}
    >
      <div
        className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white font-bold"
        style={{ background: `linear-gradient(135deg, ${n.iconGradient[0]}, ${n.iconGradient[1]})` }}
      >
        {n.appName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold opacity-80">{n.appName}</span>
          <span className="text-[10px] opacity-60">{ago}</span>
        </div>
        <p className="text-sm font-semibold leading-tight mt-0.5">{n.title}</p>
        <p className="text-xs opacity-80 leading-snug mt-0.5 line-clamp-2">{n.body}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDismiss(); }} aria-label="Dismiss" className="p-1 rounded-full opacity-60 hover:opacity-100">
        <X size={13} />
      </button>
    </motion.div>
  );
}

function relativeTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// -------- Lock screen --------
function LockScreen({
  manifest, now, battery, charging, notifications, onUnlock,
}: {
  manifest: AndroidUixManifest;
  now: Date;
  battery: number;
  charging: boolean;
  notifications: AndroidNotification[];
  onUnlock: () => void;
}) {
  const bigTime = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const handleDragEnd = () => {
    setDragging(false);
    if (dragY < -120) {
      onUnlock();
    }
    setDragY(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -200 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-[60] flex flex-col items-center justify-between py-16 px-6 cursor-pointer"
      style={{
        background: `linear-gradient(180deg, ${manifest.wallpaper.colors[0]}cc, ${manifest.wallpaper.colors[manifest.wallpaper.colors.length - 1]}f2)`,
        backdropFilter: "blur(20px)",
        color: manifest.statusBar.tint,
      }}
      onClick={() => onUnlock()}
      drag="y"
      dragConstraints={{ top: -400, bottom: 0 }}
      dragElastic={0.4}
      onDragStart={() => setDragging(true)}
      onDrag={(_, info) => setDragY(info.offset.y)}
      onDragEnd={handleDragEnd}
    >
      {/* Top: lock icon + clock */}
      <div className="flex flex-col items-center gap-2 mt-8" style={{ transform: `translateY(${dragY * 0.5}px)` }}>
        <Lock size={20} opacity={0.6} />
        <div className="text-7xl font-extralight tabular-nums tracking-tight" style={{ textShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          {bigTime}
        </div>
        <div className="text-base font-medium opacity-80">{dateStr}</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs opacity-70">
          {charging ? <BatteryCharging size={13} /> : <BatteryFull size={13} />}
          <span className="tabular-nums">{battery.toFixed(0)}%</span>
        </div>
        {/* Weather on lock screen */}
        {(() => {
          const w = manifest.weather ?? { tempF: 68, condition: "Sunny", icon: "Sun" as const, location: "" };
          const WIcon = w.icon === "Sun" ? Sun : w.icon === "Cloud" ? Cloud : w.icon === "CloudRain" ? CloudRain : w.icon === "CloudSnow" ? CloudSnow : w.icon === "CloudSun" ? CloudSun : Sun;
          return (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}>
              <WIcon size={13} />
              <span className="font-semibold tabular-nums">{w.tempF}°F</span>
              <span className="opacity-80">{w.condition}</span>
            </div>
          );
        })()}
      </div>

      {/* Middle: notification preview (first 2) */}
      <div className="w-full max-w-sm space-y-2" style={{ transform: `translateY(${dragY * 0.3}px)` }}>
        {notifications.length === 0 ? (
          <div className="rounded-2xl p-3 flex items-center justify-center gap-2 text-xs opacity-60" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
            <Moon size={13} />
            <span>Do Not Disturb — notifications silenced</span>
          </div>
        ) : (
          notifications.slice(0, 2).map((n) => (
            <div
              key={n.id}
              className="rounded-2xl p-3 flex items-start gap-2.5"
              style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={(e) => { e.stopPropagation(); onUnlock(); }}
            >
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${n.iconGradient[0]}, ${n.iconGradient[1]})` }}>
                {n.appName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{n.title}</p>
                <p className="text-xs opacity-70 truncate">{n.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom: swipe up handle — prominent pill + animated chevron */}
      <motion.div
        className="flex flex-col items-center gap-2"
        animate={dragging ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="flex items-center justify-center"
          animate={dragging ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronUp size={22} style={{ color: manifest.statusBar.tint, opacity: 0.7 }} />
        </motion.div>
        <div className="w-32 h-1.5 rounded-full" style={{ background: manifest.statusBar.tint, opacity: 0.5 }} />
        <span className="text-xs font-semibold opacity-70">Swipe up to unlock</span>
      </motion.div>
    </motion.div>
  );
}

// -------- Recents view (app switcher) --------
function RecentsView({
  manifest, recentApps, onOpenApp, onClose, onClearAll,
}: {
  manifest: AndroidUixManifest;
  recentApps: OsTab[];
  onOpenApp: (tab: OsTab) => void;
  onClose: () => void;
  onClearAll: () => void;
}) {
  const allApps = recentApps.length > 0 ? recentApps : ["DASHBOARD", "TERMINAL", "FILES", "APPS"] as OsTab[];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-[55] flex flex-col p-5"
      style={{ background: "rgba(15,20,30,0.65)", backdropFilter: "blur(24px) saturate(140%)" }}
    >
      <div className="flex items-center justify-between mb-4 text-white">
        <span className="text-sm font-semibold opacity-90">Recent apps</span>
        <button onClick={onClearAll} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.14)" }}>
          <Trash2 size={12} /> Clear all
        </button>
      </div>
      <div className="flex-1 overflow-x-auto t3-scroll flex items-center gap-3 pb-4">
        {allApps.map((tab, i) => {
          const meta = PHONE_APP_MAP.find((p) => p.tab === tab);
          const Icon = meta?.icon ?? Sparkles;
          const title = OS_TABS.find((t) => t.id === tab)?.title ?? tab;
          return (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onOpenApp(tab)}
              className="shrink-0 w-56 h-72 rounded-3xl overflow-hidden cursor-pointer flex flex-col"
              style={{ background: "#F4EEE4", boxShadow: "0 20px 40px -12px rgba(0,0,0,0.5)" }}
            >
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: "var(--glass-surface-light)", borderBottom: "1px solid var(--glass-border)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${meta?.gradient[0] ?? "#888"}, ${meta?.gradient[1] ?? "#555"})` }}>
                  <Icon size={14} />
                </div>
                <span className="text-xs font-semibold flex-1 truncate" style={{ color: "var(--earth-deep-espresso)" }}>{title}</span>
                <X size={12} style={{ color: "var(--earth-secondary-text)" }} />
              </div>
              <div className="flex-1 p-3 overflow-hidden">
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--earth-deep-espresso)" }}>{title} preview</div>
                <div className="space-y-1.5">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="h-2 rounded-full" style={{ background: "var(--glass-surface-variant)", width: `${85 - j * 15}%` }} />
                  ))}
                </div>
                <div className="mt-3 h-16 rounded-xl" style={{ background: "var(--glass-surface-card)" }} />
              </div>
            </motion.div>
          );
        })}
        {allApps.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-white opacity-60 text-sm">
            No recent apps
          </div>
        )}
      </div>
      <button onClick={onClose} className="mx-auto mt-2 px-5 py-2 rounded-full text-xs font-semibold text-white" style={{ background: "rgba(255,255,255,0.14)" }}>
        Close recents
      </button>
    </motion.div>
  );
}

// -------- Navigation bar --------
function AndroidNavBar({ manifest, onHome, onRecents, onBack }: { manifest: AndroidUixManifest; onHome: () => void; onRecents: () => void; onBack: () => void }) {
  if (manifest.navBar.style === "THREE_BUTTON") {
    return (
      <nav className="relative z-20 flex items-center justify-around px-6 py-3" style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} aria-label="Back" className="p-2" style={{ color: manifest.navBar.accent }}>
          <ArrowLeft size={22} />
        </button>
        <button onClick={onHome} aria-label="Home" className="p-2" style={{ color: manifest.navBar.accent }}>
          <CircleIcon size={18} fill="currentColor" />
        </button>
        <button onClick={onRecents} aria-label="Recents" className="p-2" style={{ color: manifest.navBar.accent }}>
          <Square size={18} />
        </button>
      </nav>
    );
  }
  // GESTURE bar — pill: tap=home; small recents button on the right
  return (
    <nav className="relative z-20 flex items-center justify-center py-2.5 gap-4" style={{ background: "rgba(255,255,255,0.28)", backdropFilter: "blur(10px)" }}>
      <button
        onClick={onHome}
        aria-label="Home"
        className="w-32 h-1.5 rounded-full transition-transform active:scale-95"
        style={{ background: manifest.statusBar.tint, opacity: 0.55 }}
      />
      <button
        onClick={onRecents}
        aria-label="Recents"
        className="w-5 h-5 rounded-md flex items-center justify-center transition-transform active:scale-90"
        style={{ background: manifest.statusBar.tint, opacity: 0.35 }}
      />
    </nav>
  );
}

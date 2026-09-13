"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TriangleAlert, X, Battery } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import { describeAction } from "@/lib/t3/types";
import { describeUiDesignChange } from "@/lib/t3/ui-design-engine";
import { LiquidEarthBackground } from "@/components/t3/liquid-earth-background";
import { FloatingVoiceOrb } from "@/components/t3/floating-voice-orb";
import { OsTopBar } from "@/components/t3/os-top-bar";
import { OsNavBar } from "@/components/t3/os-nav-bar";
import { OnboardingScreen } from "@/components/t3/onboarding-screen";
import { DesignMockup } from "@/components/t3/design-mockup";
import { AndroidPhoneShell } from "@/components/t3/android-phone-shell";
import { CommandPalette } from "@/components/t3/command-palette";
import { DesktopScreen } from "@/components/t3/screens/desktop-screen";
import { TerminalScreen } from "@/components/t3/screens/terminal-screen";
import { FileManagerScreen } from "@/components/t3/screens/file-manager-screen";
import { ProcessManagerScreen } from "@/components/t3/screens/process-manager-screen";
import { GenerativeThemeScreen } from "@/components/t3/screens/generative-theme-screen";
import { SandboxScreen } from "@/components/t3/screens/sandbox-screen";
import { ModelsScreen } from "@/components/t3/screens/models-screen";
import { CapabilitiesScreen } from "@/components/t3/screens/capabilities-screen";
import { ProfileSettingsScreen } from "@/components/t3/screens/profile-settings-screen";

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isSetupCompleted = useT3Store((s) => s.isSetupCompleted);
  const sandboxLevel = useT3Store((s) => s.config.sandboxLevel);
  const darkMode = useT3Store((s) => s.config.darkMode);
  const batterySaver = useT3Store((s) => s.config.batterySaver);
  const mediaMode = useT3Store((s) => s.mediaMode);
  const selectedTab = useT3Store((s) => s.selectedTab);
  const activeTheme = useT3Store((s) => s.activeTheme);
  const uiDesignConfig = useT3Store((s) => s.uiDesignConfig);
  const uiDesignDraft = useT3Store((s) => s.uiDesignDraft);
  const isGeneratingUiDesign = useT3Store((s) => s.isGeneratingUiDesign);
  const isGeneratingAndroidUix = useT3Store((s) => s.isGeneratingAndroidUix);
  const pendingAction = useT3Store((s) => s.pendingAction);
  const approvePendingAction = useT3Store((s) => s.approvePendingAction);
  const dismissPendingAction = useT3Store((s) => s.dismissPendingAction);
  const applyUiDesignDraft = useT3Store((s) => s.applyUiDesignDraft);
  const discardUiDesignDraft = useT3Store((s) => s.discardUiDesignDraft);

  // Command palette (Cmd/Ctrl+K)
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // UIX mode is derived purely from sandbox level:
  //   ROOT_SUDO  → T3_DESKTOP (current T³ calm OS shell, unchanged)
  //   STRICT     → ANDROID_PHONE (fully generative Android phone UIX)
  const uixMode = sandboxLevel === "ROOT_SUDO" ? "T3_DESKTOP" : "ANDROID_PHONE";

  // Live-telemetry refresher (4s) drives system-glance cards
  const refreshTelemetry = useT3Store((s) => s.refreshTelemetry);
  React.useEffect(() => {
    if (!isSetupCompleted) return;
    const id = setInterval(refreshTelemetry, 4000);
    return () => clearInterval(id);
  }, [isSetupCompleted, refreshTelemetry]);

  // Apply Omni-UI live tokens to :root CSS vars
  React.useEffect(() => {
    if (!mounted) return;
    const r = document.documentElement;
    r.style.setProperty("--t3-spacing-scale", String(uiDesignConfig.spacingScale));
    r.style.setProperty("--t3-radius-scale", String(uiDesignConfig.radiusScale));
    r.style.setProperty("--t3-type-scale", String(uiDesignConfig.typeScale));
    r.style.setProperty("--t3-accent-hue", String(uiDesignConfig.accentHueShift));
    r.style.setProperty("--t3-motion-duration", String(uiDesignConfig.motionSpeed));
    if (uiDesignConfig.reducedMotion) {
      r.classList.add("t3-reduced-motion");
    } else {
      r.classList.remove("t3-reduced-motion");
    }
  }, [mounted, uiDesignConfig]);

  // Apply dark mode class to <html> (drives the .dark CSS variant in globals.css)
  React.useEffect(() => {
    if (!mounted) return;
    const r = document.documentElement;
    if (darkMode) {
      r.classList.add("dark");
    } else {
      r.classList.remove("dark");
    }
  }, [mounted, darkMode]);

  // Apply active generative theme to :root CSS vars
  React.useEffect(() => {
    if (!mounted) return;
    const r = document.documentElement;
    r.style.setProperty("--t3-theme-primary", activeTheme.primaryColor);
    r.style.setProperty("--t3-theme-secondary", activeTheme.secondaryColor);
    r.style.setProperty("--t3-theme-tertiary", activeTheme.tertiaryColor);
    r.style.setProperty("--t3-theme-text", activeTheme.textColor);
    r.style.setProperty("--t3-theme-glass-alpha", String(activeTheme.glassAlpha));
    activeTheme.bgGradientColors.forEach((c, i) => {
      r.style.setProperty(`--t3-theme-bg-${i + 1}`, c);
    });
    // map primary onto shadcn token so shadcn components follow the theme
    r.style.setProperty("--primary", activeTheme.primaryColor);
    r.style.setProperty("--primary-foreground", "#FCF9F3");
  }, [mounted, activeTheme]);

  if (!mounted) return null;

  if (!isSetupCompleted) {
    return <OnboardingScreen />;
  }

  // ============ ANDROID PHONE UIX (Strict Sandbox) ============
  if (uixMode === "ANDROID_PHONE") {
    return (
      <>
        <AndroidPhoneShell />
        {/* Shared overlays that work in both shells */}
        <SharedOverlays
          pendingAction={pendingAction}
          approvePendingAction={approvePendingAction}
          dismissPendingAction={dismissPendingAction}
        />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <BatterySaverOverlay active={batterySaver} />
      </>
    );
  }

  // ============ T3 DESKTOP UIX (Root / Sudo mode — unchanged) ============
  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <LiquidEarthBackground theme={activeTheme} reducedMotion={uiDesignConfig.reducedMotion}>
        <div className="flex flex-col h-full relative z-10">
          <OsTopBar />
          <main className="flex-1 overflow-y-auto t3-scroll" style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))" }}>
            <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-4 sm:pt-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {selectedTab === "DASHBOARD" && <DesktopScreen />}
                  {selectedTab === "TERMINAL" && <TerminalScreen />}
                  {selectedTab === "FILES" && <FileManagerScreen />}
                  {selectedTab === "APPS" && <ProcessManagerScreen />}
                  {selectedTab === "THEMES" && <GenerativeThemeScreen />}
                  {selectedTab === "SANDBOX" && <SandboxScreen />}
                  {selectedTab === "MODELS" && <ModelsScreen />}
                  {selectedTab === "MARKETPLACE" && <CapabilitiesScreen />}
                  {selectedTab === "PROFILE" && <ProfileSettingsScreen />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
          <OsNavBar
            accentColor={activeTheme.primaryColor}
            showLabels={uiDesignConfig.navLabelsVisible}
          />
          </div>
        </LiquidEarthBackground>

        <FloatingVoiceOrb retreat={false} mediaMode={mediaMode} />

        {/* Omni-UI preview bottom sheet (desktop shell only) */}
        <AnimatePresence>
          {uiDesignDraft && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50"
              style={{
                background: "var(--glass-surface-light)",
                borderTop: "1px solid var(--glass-border)",
                borderTopLeftRadius: "var(--t3-radius-sheet)",
                borderTopRightRadius: "var(--t3-radius-sheet)",
                backdropFilter: "blur(16px) saturate(160%)",
                boxShadow: "0 -16px 40px -12px rgba(34,30,25,0.25)",
              }}
            >
              <div className="max-w-2xl mx-auto p-5 pb-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: "var(--earth-deep-espresso)" }}>
                      Omni-UI preview
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>
                      {describeUiDesignChange(uiDesignConfig, uiDesignDraft)}
                    </p>
                  </div>
                  <button
                    onClick={discardUiDesignDraft}
                    className="p-2 rounded-full"
                    style={{ color: "var(--earth-secondary-text)" }}
                    aria-label="Discard"
                  >
                    <X size={18} />
                  </button>
                </div>
                <DesignMockup theme={activeTheme} config={uiDesignDraft} />
                <div className="flex gap-2.5 mt-4">
                  <button
                    onClick={applyUiDesignDraft}
                    className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                    style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
                  >
                    Ship it
                  </button>
                  <button
                    onClick={discardUiDesignDraft}
                    className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold"
                    style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Designing UI pill (shared — both Omni-UI desktop tokens and Android UIX agent) */}
        <AnimatePresence>
          {(isGeneratingUiDesign || isGeneratingAndroidUix) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
              >
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span className="text-xs font-semibold">
                  {isGeneratingAndroidUix ? "Designing phone UIX…" : "Designing UI…"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SharedOverlays
          pendingAction={pendingAction}
          approvePendingAction={approvePendingAction}
          dismissPendingAction={dismissPendingAction}
        />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <BatterySaverOverlay active={batterySaver} />
    </div>
  );
}

// Shared pending-action confirmation (used in both shells)
function SharedOverlays({
  pendingAction,
  approvePendingAction,
  dismissPendingAction,
}: {
  pendingAction: (ReturnType<typeof useT3Store.getState>["pendingAction"]);
  approvePendingAction: () => void;
  dismissPendingAction: () => void;
}) {
  return (
    <AnimatePresence>
      {pendingAction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: "rgba(34,30,25,0.4)", backdropFilter: "blur(4px)" }}
          onClick={dismissPendingAction}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--glass-surface-light)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--t3-radius-sheet)",
              backdropFilter: "blur(16px) saturate(160%)",
            }}
            className="w-full max-w-sm p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: "color-mix(in srgb, var(--cyber-alert-red) 14%, transparent)", color: "var(--cyber-alert-red)" }}
              >
                <TriangleAlert size={20} />
              </span>
              <div>
                <h3 className="font-bold text-base" style={{ color: "var(--earth-deep-espresso)" }}>
                  Allow this action?
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--earth-secondary-text)" }}>
                  {pendingAction.description}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={approvePendingAction}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
              >
                Allow
              </button>
              <button
                onClick={dismissPendingAction}
                className="px-4 py-2.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5"
                style={{ border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
              >
                <X size={15} /> Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Battery saver overlay — dims the screen with a warm tint + shows an indicator
function BatterySaverOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{
            background: "rgba(40, 30, 10, 0.22)",
            mixBlendMode: "multiply",
          }}
          aria-hidden
        >
          {/* Battery saver indicator chip */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 320, damping: 28 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(180, 120, 30, 0.85)",
                color: "#FCF9F3",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px -2px rgba(0,0,0,0.3)",
              }}
            >
              <Battery size={13} />
              <span className="text-[11px] font-semibold">Battery saver</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

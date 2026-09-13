"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Folder, Activity, Sparkles, Lock, Shield, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { ModelProvider, SandboxLevel } from "@/lib/t3/types";
import { PROVIDER_LABELS, SANDBOX_LEVELS } from "@/lib/t3/types";
import { SudoCard, SectionHeader } from "./primitives";

export function OnboardingScreen() {
  const submitOnboarding = useT3Store((s) => s.submitOnboarding);
  const downloadProgress = useT3Store((s) => s.downloadProgress);
  const triggerLocalModelDownload = useT3Store((s) => s.triggerLocalModelDownload);
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [provider, setProvider] = React.useState<ModelProvider>("GEMINI_API");
  const [apiKey, setApiKey] = React.useState("");
  const [sandbox, setSandbox] = React.useState<SandboxLevel>("STRICT_SANDBOX");

  const finish = () => submitOnboarding(name, provider, apiKey, sandbox);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(140deg, #FBF7EE 0%, #F2EAD8 50%, #E9DFCE 100%)" }}
    >
      {/* floating ambient orbs */}
      <div aria-hidden style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: "12%", top: "18%", width: "60vmax", height: "60vmax", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, #D97757 0%, transparent 70%)", opacity: 0.35, filter: "blur(8px)" }} />
        <div style={{ position: "absolute", right: "10%", top: "60%", width: "50vmax", height: "50vmax", transform: "translate(50%,-50%)", background: "radial-gradient(circle, #708B75 0%, transparent 70%)", opacity: 0.3, filter: "blur(8px)" }} />
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-2xl font-bold text-lg"
                style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)", fontFamily: "Georgia, serif" }}
              >
                T<sup style={{ fontSize: "0.55em", marginLeft: 1 }}>3</sup>
              </span>
              <span className="text-lg font-bold tracking-tight" style={{ color: "var(--earth-deep-espresso)" }}>
                T³
              </span>
            </div>
            <span className="t3-mono text-xs font-semibold" style={{ color: "var(--earth-secondary-text)" }}>
              Step {step} of 3
            </span>
          </div>

          <SudoCard className="p-5 sm:p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <StepWelcome key="1" name={name} setName={setName} />
              )}
              {step === 2 && (
                <StepProvider key="2" provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey} downloadProgress={downloadProgress} triggerLocalModelDownload={triggerLocalModelDownload} />
              )}
              {step === 3 && (
                <StepSecurity key="3" sandbox={sandbox} setSandbox={setSandbox} />
              )}
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-full disabled:opacity-40"
                style={{ color: "var(--earth-secondary-text)" }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full transition-transform hover:scale-[1.02] active:scale-95"
                  style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full transition-transform hover:scale-[1.02] active:scale-95"
                  style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
                >
                  Enter T³ <ChevronRight size={16} />
                </button>
              )}
            </div>
          </SudoCard>

          <p className="text-center text-xs mt-4" style={{ color: "var(--earth-secondary-text)" }}>
            Real on-device shell · Live device monitor · File browser · Gemini Live voice
          </p>
        </div>
      </div>
    </div>
  );
}

function StepWelcome({ name, setName }: { name: string; setName: (s: string) => void }) {
  const features = [
    { icon: Terminal, title: "Real shell", desc: "Run commands on a sandboxed device" },
    { icon: Folder, title: "File browser", desc: "Browse the real filesystem" },
    { icon: Activity, title: "System monitor", desc: "Battery, memory, processes, network" },
    { icon: Sparkles, title: "AI assistant", desc: "Navigate, launch, and design by voice" },
  ];
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Welcome" subtitle="A calm operating system for your device" />
      <div className="mt-5">
        <label className="text-sm font-medium" style={{ color: "var(--earth-deep-espresso)" }}>
          What's your name?
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="rootadmin"
          className="mt-2 w-full px-4 py-3 rounded-2xl text-base outline-none transition-shadow focus:ring-2"
          style={{
            background: "var(--glass-surface-card)",
            border: "1px solid var(--glass-border)",
            color: "var(--earth-deep-espresso)",
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <SudoCard key={f.title} style={{ background: "var(--glass-surface-card)" }} className="p-3.5">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2"
                style={{ background: "color-mix(in srgb, var(--earth-terracotta) 14%, transparent)", color: "var(--earth-terracotta)" }}
              >
                <Icon size={18} />
              </span>
              <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{f.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>{f.desc}</p>
            </SudoCard>
          );
        })}
      </div>
    </motion.div>
  );
}

function StepProvider({
  provider, setProvider, apiKey, setApiKey, downloadProgress, triggerLocalModelDownload,
}: {
  provider: ModelProvider; setProvider: (p: ModelProvider) => void;
  apiKey: string; setApiKey: (s: string) => void;
  downloadProgress: { downloadedBytes: number; totalBytes: number; isDownloading: boolean; statusText: string };
  triggerLocalModelDownload: () => void;
}) {
  const needsKey = provider !== "GEMMA_LOCAL" && provider !== "GEMMA_LOCAL";
  const [show, setShow] = React.useState(false);
  const options: ModelProvider[] = ["GEMINI_API", "OPENAI_API", "ANTHROPIC_API"];
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Choose your AI" subtitle="Run on-device with Gemma, or connect a cloud provider" />
      <div className="mt-4 space-y-2.5">
        {options.map((p) => (
          <ProviderCard key={p} selected={provider === p} onClick={() => setProvider(p)} label={PROVIDER_LABELS[p]} note={p === "GEMINI_API" ? "Works out of the box with the bundled key." : "Bring your own API key."} />
        ))}
      </div>
      {needsKey && (
        <div className="mt-4">
          <label className="text-sm font-medium" style={{ color: "var(--earth-deep-espresso)" }}>
            {PROVIDER_LABELS[provider]} key
          </label>
          <div className="relative mt-2">
            <input
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="paste your key"
              className="w-full px-4 py-3 pr-16 rounded-2xl text-sm outline-none t3-mono"
              style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
            />
            <button
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-full"
              style={{ background: "var(--glass-surface-variant)", color: "var(--earth-secondary-text)" }}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--earth-secondary-text)" }}>
            Stored locally on your device only.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function ProviderCard({ selected, onClick, label, note }: { selected: boolean; onClick: () => void; label: string; note: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3"
      style={{
        background: selected ? "color-mix(in srgb, var(--earth-terracotta) 10%, transparent)" : "var(--glass-surface-card)",
        border: `1.5px solid ${selected ? "var(--earth-terracotta)" : "var(--glass-border)"}`,
      }}
    >
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0"
        style={{ border: `1.5px solid ${selected ? "var(--earth-terracotta)" : "var(--earth-secondary-text)"}` }}
      >
        {selected && <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--earth-terracotta)" }} />}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>{note}</p>
      </div>
    </button>
  );
}

function StepSecurity({ sandbox, setSandbox }: { sandbox: SandboxLevel; setSandbox: (l: SandboxLevel) => void }) {
  const opts: SandboxLevel[] = ["STRICT_SANDBOX", "ROOT_SUDO"];
  const icons: Record<SandboxLevel, React.ComponentType<{ size?: number }>> = {
    STRICT_SANDBOX: Lock,
    ROOT_SUDO: Shield,
  };
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
      <SectionHeader title="Command safety" subtitle="How commands are screened before they run" />
      <div className="mt-4 space-y-2.5">
        {opts.map((lvl) => {
          const Icon = icons[lvl];
          const selected = sandbox === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setSandbox(lvl)}
              className="w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3"
              style={{
                background: selected ? "color-mix(in srgb, var(--earth-terracotta) 10%, transparent)" : "var(--glass-surface-card)",
                border: `1.5px solid ${selected ? "var(--earth-terracotta)" : "var(--glass-border)"}`,
              }}
            >
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: "color-mix(in srgb, var(--earth-terracotta) 14%, transparent)", color: "var(--earth-terracotta)" }}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{SANDBOX_LEVELS[lvl].label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>{SANDBOX_LEVELS[lvl].description}</p>
              </div>
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5"
                style={{ border: `1.5px solid ${selected ? "var(--earth-terracotta)" : "var(--earth-secondary-text)"}` }}
              >
                {selected && <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--earth-terracotta)" }} />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-4 italic" style={{ color: "var(--earth-secondary-text)" }}>
        On a non-rooted device, elevated commands still fail — this only lifts the app's own guard.
      </p>
    </motion.div>
  );
}

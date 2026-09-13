"use client";

import * as React from "react";
import { Lock, Shield, Terminal } from "lucide-react";
import { useT3Store, calculateCommandRisk } from "@/lib/t3/store";
import type { SandboxLevel } from "@/lib/t3/types";
import { SANDBOX_LEVELS } from "@/lib/t3/types";
import { SudoCard, SectionHeader, StatusPill } from "../primitives";

const ICONS: Record<SandboxLevel, React.ComponentType<{ size?: number }>> = {
  STRICT_SANDBOX: Lock,
  ROOT_SUDO: Shield,
};

function verdict(risk: number, mode: SandboxLevel): { color: string; text: string } {
  if (risk >= 7 && mode === "STRICT_SANDBOX") {
    return {
      color: "var(--cyber-alert-red)",
      text: "Blocked in Strict Sandbox. Switch to Root mode to allow it.",
    };
  }
  if (risk >= 7) {
    return {
      color: "var(--cyber-warning-yellow)",
      text: "High risk, but allowed in Root mode.",
    };
  }
  if (risk >= 4) {
    return {
      color: "var(--cyber-warning-yellow)",
      text: "Moderate risk. Runs in the current mode.",
    };
  }
  return {
    color: "var(--earth-sage-green)",
    text: "Allowed — this runs in the current mode.",
  };
}

export function SandboxScreen() {
  const sandbox = useT3Store((s) => s.config.sandboxLevel);
  const setSandboxLevel = useT3Store((s) => s.setSandboxLevel);
  const [cmd, setCmd] = React.useState("rm -rf /");

  const risk = calculateCommandRisk(cmd);
  const v = verdict(risk, sandbox);
  const pillColor = risk >= 7 ? "var(--cyber-alert-red)" : risk >= 4 ? "var(--cyber-warning-yellow)" : "var(--earth-sage-green)";

  return (
    <div className="space-y-5">
      <SectionHeader title="Security" subtitle="How commands are screened before they run" />

      <SudoCard className="p-4 sm:p-5">
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--earth-deep-espresso)" }}>Execution mode</p>
        <div className="space-y-2.5">
          {(Object.keys(SANDBOX_LEVELS) as SandboxLevel[]).map((lvl) => {
            const Icon = ICONS[lvl];
            const selected = sandbox === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setSandboxLevel(lvl)}
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
                  {lvl === "ROOT_SUDO" && (
                    <p className="text-[11px] mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--earth-terracotta) 10%, transparent)", color: "var(--earth-terracotta)" }}>
                      UIX: T³ desktop shell
                    </p>
                  )}
                  {lvl === "STRICT_SANDBOX" && (
                    <p className="text-[11px] mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--earth-sage-green) 10%, transparent)", color: "var(--earth-sage-green)" }}>
                      UIX: generative Android phone shell
                    </p>
                  )}
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
        <p className="text-xs mt-3 italic" style={{ color: "var(--earth-secondary-text)" }}>
          On a non-rooted device, elevated commands still fail — this only lifts the app's own guard.
        </p>
      </SudoCard>

      {/* UIX mapping banner */}
      <SudoCard className="p-4 flex items-start gap-3" style={{ background: "var(--glass-surface-card)" }}>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "color-mix(in srgb, var(--earth-slate-blue) 14%, transparent)", color: "var(--earth-slate-blue)" }}>
          <Shield size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>
            Sandbox mode also switches the shell
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>
            <strong>Root / Sudo</strong> keeps the T³ calm desktop OS shell. <strong>Strict Sandbox</strong> drops into a fully generative Android phone UIX — the home screen, status bar, app drawer, quick settings, and notifications are all produced by the Generative UIX Agent. Design your phone vibe in Appearance → Phone UIX.
          </p>
        </div>
      </SudoCard>

      <SudoCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: "color-mix(in srgb, var(--earth-slate-blue) 14%, transparent)", color: "var(--earth-slate-blue)" }}>
            <Shield size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>Command risk analyzer</p>
            <p className="text-xs" style={{ color: "var(--earth-secondary-text)" }}>Score a command before it runs.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full flex-1" style={{ background: "var(--terminal-ink)", border: "1px solid var(--terminal-border)" }}>
            <Terminal size={14} style={{ color: "var(--terminal-prompt)" }} />
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              className="flex-1 bg-transparent outline-none t3-mono text-sm"
              style={{ color: "var(--terminal-text)" }}
              placeholder="type a command"
              aria-label="Command to analyze"
            />
          </div>
          <StatusPill text={`${risk} / 10`} color={pillColor} />
        </div>
        <div
          className="mt-3 p-3 rounded-2xl flex items-start gap-2"
          style={{ background: `color-mix(in srgb, ${v.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${v.color} 25%, transparent)` }}
        >
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: v.color, marginTop: 6 }} />
          <p className="text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{v.text}</p>
        </div>
        {/* risk meter */}
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background: i < risk
                  ? i >= 7 ? "var(--cyber-alert-red)" : i >= 4 ? "var(--cyber-warning-yellow)" : "var(--earth-sage-green)"
                  : "color-mix(in srgb, var(--earth-deep-espresso) 8%, transparent)",
              }}
            />
          ))}
        </div>
      </SudoCard>
    </div>
  );
}

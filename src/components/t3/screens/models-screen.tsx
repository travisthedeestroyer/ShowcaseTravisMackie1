"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, MemoryStick, ChevronDown, Download, Trash2, Check, Eye, EyeOff, Loader2,
} from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { ModelProvider } from "@/lib/t3/types";
import { PROVIDER_LABELS } from "@/lib/t3/types";
import { LOCAL_MODEL_CATALOG } from "@/lib/t3/mock-data";
import { SudoCard, SectionHeader, StatusPill } from "../primitives";

const PROVIDER_PILLS: ModelProvider[] = ["GEMINI_API", "OPENAI_API", "ANTHROPIC_API", "CUSTOM_REST", "GEMMA_LOCAL"];

export function ModelsScreen() {
  const config = useT3Store((s) => s.config);
  const downloadProgress = useT3Store((s) => s.downloadProgress);
  const saveModelConfig = useT3Store((s) => s.saveModelConfig);
  const setLocalModel = useT3Store((s) => s.setLocalModel);
  const triggerLocalModelDownload = useT3Store((s) => s.triggerLocalModelDownload);
  const deleteLocalModel = useT3Store((s) => s.deleteLocalModel);

  const [selected, setSelected] = React.useState<ModelProvider>(config.selectedProvider);
  const [keys, setKeys] = React.useState({
    gemini: config.apiKey,
    openai: config.openAiApiKey,
    anthropic: config.anthropicApiKey,
    custom: config.customEndpointUrl,
  });
  const [show, setShow] = React.useState({ gemini: false, openai: false, anthropic: false });
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [customUrl, setCustomUrl] = React.useState(config.customEndpointUrl);
  const [saved, setSaved] = React.useState(false);
  const [localModelId, setLocalModelId] = React.useState("gemma3_1b");
  const [customModelUrl, setCustomModelUrl] = React.useState(config.localModelUrl);

  const isLocal = selected === "GEMMA_LOCAL";
  const pct = downloadProgress.totalBytes > 0 ? (downloadProgress.downloadedBytes / downloadProgress.totalBytes) * 100 : 0;
  const keyFor = (p: ModelProvider) =>
    p === "GEMINI_API" ? keys.gemini :
    p === "OPENAI_API" ? keys.openai :
    p === "ANTHROPIC_API" ? keys.anthropic :
    keys.custom;

  const save = () => {
    if (isLocal) {
      saveModelConfig("GEMMA_LOCAL", "");
    } else {
      const k = keyFor(selected);
      saveModelConfig(selected, k, selected === "CUSTOM_REST" ? customUrl : undefined);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="AI model" subtitle="Run on-device with Gemma, or connect a cloud provider" />

      {/* provider pills */}
      <div className="flex gap-2 overflow-x-auto t3-scroll -mx-1 px-1 pb-1">
        {PROVIDER_PILLS.map((p) => {
          const active = selected === p;
          return (
            <button
              key={p}
              onClick={() => setSelected(p)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform hover:scale-105"
              style={{
                background: active ? "var(--earth-terracotta)" : "var(--glass-surface-card)",
                color: active ? "var(--bento-deep-purple)" : "var(--earth-deep-espresso)",
                border: "1px solid var(--glass-border)",
              }}
            >
              {p === "GEMMA_LOCAL" ? "On-device" : p === "GEMINI_API" ? "Gemini" : p === "OPENAI_API" ? "OpenAI" : p === "ANTHROPIC_API" ? "Claude" : "Custom"}
            </button>
          );
        })}
      </div>

      {/* Cloud provider key card */}
      {!isLocal && (
        <SudoCard className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "color-mix(in srgb, var(--earth-terracotta) 14%, transparent)", color: "var(--earth-terracotta)" }}>
              <KeyRound size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>{PROVIDER_LABELS[selected]}</p>
              <div className="mt-1">
                <StatusPill text={keyFor(selected) ? "Configured" : "Needs key"} color={keyFor(selected) ? "var(--earth-sage-green)" : "var(--cyber-warning-yellow)"} />
              </div>
            </div>
          </div>

          <KeyField
            label="API key"
            value={keyFor(selected)}
            show={selected === "GEMINI_API" ? show.gemini : selected === "OPENAI_API" ? show.openai : show.anthropic}
            onToggleShow={() => setShow((s) => ({ ...s, [selected === "GEMINI_API" ? "gemini" : selected === "OPENAI_API" ? "openai" : "anthropic"]: !s[selected === "GEMINI_API" ? "gemini" : selected === "OPENAI_API" ? "openai" : "anthropic"] }))}
            onChange={(v) => setKeys((k) => ({ ...k, [selected === "GEMINI_API" ? "gemini" : selected === "OPENAI_API" ? "openai" : "anthropic"]: v }))}
          />

          {selected === "CUSTOM_REST" && (
            <div className="mt-3">
              <label className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>Endpoint URL (OpenAI-compatible)</label>
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="mt-1.5 w-full px-3 py-2 rounded-2xl text-sm outline-none t3-mono"
                style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
              />
            </div>
          )}
        </SudoCard>
      )}

      {/* On-device Gemma card */}
      <SudoCard className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "color-mix(in srgb, var(--earth-sage-green) 14%, transparent)", color: "var(--earth-sage-green)" }}>
            <MemoryStick size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold" style={{ color: "var(--earth-deep-espresso)" }}>On-device Gemma</p>
            <div className="mt-1">
              <StatusPill text={config.localModelDownloaded ? "Ready" : "Not installed"} color={config.localModelDownloaded ? "var(--earth-sage-green)" : "var(--earth-secondary-text)"} />
            </div>
          </div>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--earth-secondary-text)" }}>
          Runs fully offline via MediaPipe as the OS control agent — it can navigate, launch apps, and change themes on your command, no network required once downloaded.
        </p>

        {/* model radio options */}
        <div className="space-y-2">
          {LOCAL_MODEL_CATALOG.map((m) => {
            const active = localModelId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { setLocalModelId(m.id); setLocalModel(m.id); }}
                className="w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3"
                style={{
                  background: active ? "color-mix(in srgb, var(--earth-terracotta) 8%, transparent)" : "var(--glass-surface-card)",
                  border: `1.5px solid ${active ? "var(--earth-terracotta)" : "var(--glass-border)"}`,
                }}
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5"
                  style={{ border: `1.5px solid ${active ? "var(--earth-terracotta)" : "var(--earth-secondary-text)"}` }}
                >
                  {active && <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--earth-terracotta)" }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: "var(--earth-deep-espresso)" }}>{m.name}</p>
                    <span className="t3-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--glass-surface-variant)", color: "var(--earth-secondary-text)" }}>{m.sizeMb} MB</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--earth-secondary-text)" }}>{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Advanced custom URL */}
        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="inline-flex items-center gap-1 mt-3 text-xs font-semibold"
          style={{ color: "var(--earth-secondary-text)" }}
        >
          <ChevronDown size={14} className={showAdvanced ? "rotate-180 transition-transform" : "transition-transform"} />
          Advanced: use a different .task URL
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <input
                value={customModelUrl}
                onChange={(e) => setCustomModelUrl(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-2xl text-xs outline-none t3-mono"
                style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download progress */}
        {(downloadProgress.isDownloading || config.localModelDownloaded) && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>{downloadProgress.statusText}</span>
              {!downloadProgress.isDownloading && config.localModelDownloaded && (
                <span className="t3-mono text-xs font-semibold" style={{ color: "var(--earth-sage-green)" }}>{config.localModelSizeMb} MB</span>
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--earth-deep-espresso) 8%, transparent)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${downloadProgress.isDownloading ? pct : 100}%`, background: "var(--earth-terracotta)" }}
              />
            </div>
          </div>
        )}

        {/* actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={triggerLocalModelDownload}
            disabled={downloadProgress.isDownloading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
          >
            {downloadProgress.isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {config.localModelDownloaded ? "Re-download" : "Download"}
          </button>
          {config.localModelDownloaded && (
            <button
              onClick={deleteLocalModel}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold"
              style={{ border: "1px solid color-mix(in srgb, var(--cyber-alert-red) 35%, transparent)", color: "var(--cyber-alert-red)" }}
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </SudoCard>

      {/* Save button */}
      <button
        onClick={save}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-95"
        style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
      >
        {saved ? <><Check size={16} /> Saved</> : isLocal ? "Use on-device Gemma" : "Save provider"}
      </button>
    </div>
  );
}

function KeyField({ label, value, show, onToggleShow, onChange }: {
  label: string; value: string; show: boolean; onToggleShow: () => void; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium" style={{ color: "var(--earth-secondary-text)" }}>{label}</label>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="paste your key"
          className="w-full px-3 py-2 pr-16 rounded-2xl text-sm outline-none t3-mono"
          style={{ background: "var(--glass-surface-card)", border: "1px solid var(--glass-border)", color: "var(--earth-deep-espresso)" }}
        />
        <button
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-full"
          style={{ background: "var(--glass-surface-variant)", color: "var(--earth-secondary-text)" }}
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  );
}

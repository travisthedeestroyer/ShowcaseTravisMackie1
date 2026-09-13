"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, Delete, ArrowUp, History, Search } from "lucide-react";
import { useT3Store } from "@/lib/t3/store";
import type { TerminalLog } from "@/lib/t3/types";
import { EmptyState } from "../primitives";

const QUICK_CMDS = ["ls -la", "pwd", "id", "uname -a", "ps", "getprop ro.build.version.release"];

export function TerminalScreen() {
  const logs = useT3Store((s) => s.terminalLogs);
  const currentInput = useT3Store((s) => s.currentCommandInput);
  const updateCommandInput = useT3Store((s) => s.updateCommandInput);
  const executeTerminalCommand = useT3Store((s) => s.executeTerminalCommand);
  const clearTerminalLogs = useT3Store((s) => s.clearTerminalLogs);
  const workingDir = useT3Store((s) => s.workingDir);
  const sandboxLevel = useT3Store((s) => s.config.sandboxLevel);
  const recallCommand = useT3Store((s) => s.recallCommand);
  const history = useT3Store((s) => s.terminalHistory);
  const [showHistory, setShowHistory] = React.useState(false);
  const [histSearch, setHistSearch] = React.useState("");

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [logs]);

  const shortCwd = workingDir.split("/").pop() || workingDir;

  const filteredHistory = React.useMemo(() => {
    if (!histSearch.trim()) return history;
    const q = histSearch.toLowerCase();
    return history.filter((h) => h.toLowerCase().includes(q));
  }, [history, histSearch]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div
        style={{
          background: "var(--terminal-ink)",
          borderTopLeftRadius: "var(--t3-radius-card)",
          borderTopRightRadius: "var(--t3-radius-card)",
          borderBottom: "1px solid var(--terminal-border)",
        }}
        className="px-4 py-2.5 flex items-center gap-3"
      >
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "#E5534B" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#FFB347" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#8FB79A" }} />
        </div>
        <span className="t3-mono text-xs flex-1 truncate" style={{ color: "var(--terminal-muted)" }}>
          {workingDir}
        </span>
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: "color-mix(in srgb, var(--terminal-text) 10%, transparent)", color: "var(--terminal-muted)" }}
        >
          <History size={12} /> History ({history.length})
        </button>
        <button
          onClick={clearTerminalLogs}
          aria-label="Clear logs"
          className="inline-flex items-center justify-center w-7 h-7 rounded-full"
          style={{ background: "color-mix(in srgb, var(--terminal-text) 10%, transparent)", color: "var(--terminal-muted)" }}
        >
          <Delete size={14} />
        </button>
      </div>

      {/* History search panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "var(--terminal-ink-raised)",
              border: "1px solid var(--terminal-border)",
              borderRadius: "var(--t3-radius-tile)",
              overflow: "hidden",
            }}
          >
            <div className="p-2.5">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full" style={{ background: "var(--terminal-ink)" }}>
                <Search size={13} style={{ color: "var(--terminal-muted)" }} />
                <input
                  autoFocus
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                  placeholder="Search command history…"
                  className="flex-1 bg-transparent outline-none t3-mono text-xs"
                  style={{ color: "var(--terminal-text)" }}
                />
                <span className="t3-mono text-[10px]" style={{ color: "var(--terminal-muted)" }}>
                  {filteredHistory.length} of {history.length}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto t3-scroll t3-scroll-dark mt-2">
                {filteredHistory.length === 0 ? (
                  <p className="text-xs px-3 py-2" style={{ color: "var(--terminal-muted)" }}>
                    No matching commands.
                  </p>
                ) : (
                  filteredHistory.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        updateCommandInput(h);
                        setShowHistory(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg t3-mono text-xs hover:bg-white/5"
                      style={{ color: "var(--terminal-text)" }}
                    >
                      <span style={{ color: "var(--terminal-muted)" }}>{String(filteredHistory.length - i).padStart(2, " ")}</span>{"  "}
                      {h}
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Console output */}
      <div
        ref={scrollRef}
        style={{
          background: "var(--terminal-ink)",
          borderBottomLeftRadius: "var(--t3-radius-card)",
          borderBottomRightRadius: "var(--t3-radius-card)",
          borderTop: showHistory ? "1px solid var(--terminal-border)" : "none",
        }}
        className="p-4 max-h-[52vh] overflow-y-auto t3-scroll t3-scroll-dark min-h-[200px]"
      >
        {logs.length === 0 ? (
          <EmptyState
            icon={<TerminalIcon size={22} />}
            title="Real device shell"
            description={`Commands run on-device as this app. Try a chip below, or type 'ai <question>' to ask the model.`}
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <TerminalLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Quick commands */}
      <div className="flex gap-2 overflow-x-auto t3-scroll -mx-1 px-1 pb-1">
        {QUICK_CMDS.map((c) => (
          <button
            key={c}
            onClick={() => executeTerminalCommand(c)}
            className="shrink-0 px-3 py-1.5 rounded-full t3-mono text-xs font-semibold transition-transform hover:scale-105"
            style={{
              background: "var(--glass-surface-card)",
              border: "1px solid var(--glass-border)",
              color: "var(--earth-deep-espresso)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 pl-4 pr-1.5 py-1 rounded-full"
          style={{
            background: "var(--terminal-ink)",
            border: "1px solid var(--terminal-border)",
          }}
        >
          <span className="t3-mono text-sm font-semibold whitespace-nowrap" style={{ color: "var(--terminal-prompt)" }}>
            {shortCwd} ❯
          </span>
          <input
            value={currentInput}
            onChange={(e) => updateCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && currentInput.trim()) {
                executeTerminalCommand(currentInput);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                recallCommand("up");
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                recallCommand("down");
              }
            }}
            placeholder="type a command"
            className="flex-1 bg-transparent outline-none t3-mono text-sm"
            style={{ color: "var(--terminal-text)" }}
            aria-label="Terminal input"
          />
          <button
            onClick={() => currentInput.trim() && executeTerminalCommand(currentInput)}
            disabled={!currentInput.trim()}
            aria-label="Run command"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: "var(--earth-terracotta)", color: "var(--bento-deep-purple)" }}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-center" style={{ color: "var(--earth-secondary-text)" }}>
        Sandbox: {sandboxLevel === "STRICT_SANDBOX" ? "Strict" : "Root"} · ↑↓ to recall history · Enter to run
      </p>
    </div>
  );
}

function TerminalLogItem({ log }: { log: TerminalLog }) {
  const statusColor =
    log.status === "ERROR" || log.status === "REJECTED"
      ? "var(--terminal-red)"
      : log.status === "WARNING"
      ? "#B07A1E"
      : "var(--terminal-text)";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="flex items-start gap-2 mb-1.5">
        <span className="t3-mono text-sm font-semibold" style={{ color: "var(--terminal-prompt)" }}>
          ❯
        </span>
        <span className="t3-mono text-sm font-semibold flex-1 break-all" style={{ color: "var(--terminal-text)" }}>
          {log.command}
        </span>
        <span className="t3-mono text-[10px] shrink-0" style={{ color: "var(--terminal-muted)" }}>
          {log.executionTimeMs}ms
        </span>
      </div>
      {log.output && (
        <div
          className="rounded-lg px-3 py-2.5 t3-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
          style={{
            background: "var(--terminal-ink-raised)",
            color: statusColor,
            border: "1px solid var(--terminal-border)",
          }}
        >
          {log.output}
        </div>
      )}
    </motion.div>
  );
}

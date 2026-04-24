import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence, useAnimationFrame } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import {
  Send,
  Key,
  X,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Travis Mackie's AI assistant, embedded in his portfolio site. 
Travis is a solo AI developer and independent consultant with 5+ years of experience across major AI platforms (Anthropic, Google Gemini/Vertex AI, OpenAI, Meta, Hugging Face, Cohere).

He's built:
• mycartoon.org — AI cartoon creation studio for kids using Gemini, Veo, and Lyria
• AI Vocal Studio — multi-agent autonomous audio processing pipeline
• Deep Research Agent — modeled on Google AI Studio UI with SSE streaming
• Kronos Trading Crew — AI trading agents with live exchange data

Background: HR leadership + hospitality operations — strong stakeholder communication.
Currently open to: AI Consultant, Solutions Architect, Technical Sales Engineer roles.

Be helpful, concise, and compelling. Help visitors understand Travis's skills, projects, and value. 
Speak with confidence about his work. If asked something you don't know, say so briefly.
Keep responses under 200 words unless a deep technical question warrants more.`;

// ── Fluid orb canvas ──────────────────────────────────────────────────────────
function OrbCanvas({ orbState }: { orbState: OrbState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const targetRef = useRef({ chaos: 0, speed: 0.003, hue: 220 });
  const currentRef = useRef({ chaos: 0, speed: 0.003, hue: 220 });

  // Set targets based on state
  useEffect(() => {
    switch (orbState) {
      case "idle":
        targetRef.current = { chaos: 0.18, speed: 0.0025, hue: 220 };
        break;
      case "listening":
        targetRef.current = { chaos: 0.35, speed: 0.004, hue: 190 };
        break;
      case "thinking":
        targetRef.current = { chaos: 0.55, speed: 0.007, hue: 260 };
        break;
      case "speaking":
        targetRef.current = { chaos: 0.42, speed: 0.005, hue: 200 };
        break;
    }
  }, [orbState]);

  useAnimationFrame((_, delta) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Lerp current toward target
    const t = Math.min(1, (delta / 1000) * 2);
    currentRef.current.chaos += (targetRef.current.chaos - currentRef.current.chaos) * t;
    currentRef.current.speed += (targetRef.current.speed - currentRef.current.speed) * t;
    currentRef.current.hue += (targetRef.current.hue - currentRef.current.hue) * t * 0.5;

    timeRef.current += currentRef.current.speed * (delta / 16.67);
    const time = timeRef.current;
    const { chaos, hue } = currentRef.current;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.33;

    ctx.clearRect(0, 0, w, h);

    // Draw blob
    const points = 64;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;

      // Layered noise
      const n1 = Math.sin(angle * 2 + time * 1.3) * chaos * 0.5;
      const n2 = Math.sin(angle * 3 - time * 0.7) * chaos * 0.35;
      const n3 = Math.sin(angle * 5 + time * 2.1) * chaos * 0.2;
      const n4 = Math.cos(angle * 4 - time * 1.7) * chaos * 0.15;
      const pulse = 1 + Math.sin(time * 1.8) * 0.03;

      const r = baseR * pulse * (1 + n1 + n2 + n3 + n4);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Layered fills
    const grad1 = ctx.createRadialGradient(cx - baseR * 0.2, cy - baseR * 0.2, 0, cx, cy, baseR * 1.4);
    grad1.addColorStop(0, `hsla(${hue - 20}, 80%, 72%, 0.95)`);
    grad1.addColorStop(0.4, `hsla(${hue}, 70%, 60%, 0.85)`);
    grad1.addColorStop(0.75, `hsla(${hue + 40}, 65%, 50%, 0.75)`);
    grad1.addColorStop(1, `hsla(${hue + 60}, 60%, 40%, 0.4)`);
    ctx.fillStyle = grad1;
    ctx.fill();

    // Specular highlight
    ctx.save();
    ctx.clip();
    const spec = ctx.createRadialGradient(cx - baseR * 0.3, cy - baseR * 0.35, 0, cx - baseR * 0.2, cy - baseR * 0.2, baseR * 0.7);
    spec.addColorStop(0, "rgba(255,255,255,0.55)");
    spec.addColorStop(0.5, "rgba(255,255,255,0.08)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Outer glow rings
    for (let ring = 0; ring < 3; ring++) {
      const ringR = baseR * (1.05 + ring * 0.1 + Math.sin(time + ring) * 0.015);
      const alpha = (0.12 - ring * 0.035) * (chaos / 0.5 + 0.5);
      const ringGrad = ctx.createRadialGradient(cx, cy, ringR * 0.85, cx, cy, ringR * 1.15);
      ringGrad.addColorStop(0, `hsla(${hue + ring * 15}, 80%, 65%, ${alpha})`);
      ringGrad.addColorStop(1, `hsla(${hue + ring * 15}, 80%, 65%, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.fillStyle = ringGrad;
      ctx.fill();
    }
  });

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="w-full h-full"
      style={{ filter: "blur(0px)" }}
    />
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

// ── Markdown-ish renderer ─────────────────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  const lines = content.split("\\n");
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 self-start translate-y-[0.4em]" />
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ── API Key modal ─────────────────────────────────────────────────────────────
function ApiKeyModal({
  open,
  onClose,
  onSave,
  current,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  current: string;
}) {
  const [val, setVal] = useState(current);
  const [show, setShow] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="glass-panel w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <Key className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-ink text-sm">Gemini API Key</h3>
                    <p className="text-ink-dim text-xs">Stored locally, never sent anywhere else</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-ink-dim hover:text-ink transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-ink-dim uppercase tracking-wider">Your Key</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-white/70 border border-black/[0.08] text-ink text-sm font-mono placeholder:text-ink-dim/50 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all"
                    onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onSave(val.trim()); onClose(); } }}
                  />
                  <button
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition-colors"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-ink-dim">
                  Get a free key at{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    aistudio.google.com
                  </a>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-2xl border border-black/[0.08] text-ink-dim text-sm font-medium hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (val.trim()) { onSave(val.trim()); onClose(); } }}
                  disabled={!val.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-200 transition-all"
                >
                  Save & Chat
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GeminiChatOrb() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") ?? "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [streaming, setStreaming] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const client = useMemo(
    () => (apiKey ? new GoogleGenAI({ apiKey }) : null),
    [apiKey]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveKey = useCallback((key: string) => {
    localStorage.setItem("gemini_api_key", key);
    setApiKey(key);
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setOrbState("idle");
    setStreaming(false);
    setError(null);
  }, []);

  const copyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    if (!client) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setOrbState("thinking");
    setStreaming(true);

    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", ts: Date.now() };
    setMessages((prev) => [...prev, assistantMsg]);

    abortRef.current = new AbortController();

    try {
      // Build history for multi-turn
      const history = messages.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      }));

      const chat = client.chats.create({
        model: "gemini-2.0-flash",
        config: { systemInstruction: SYSTEM_PROMPT },
        history,
      });

      setOrbState("speaking");

      const stream = await chat.sendMessageStream({ message: text });

      let fullText = "";
      for await (const chunk of stream) {
        if (abortRef.current?.signal.aborted) break;
        const delta = chunk.text ?? "";
        fullText += delta;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (!abortRef.current?.signal.aborted) {
        setError(msg.includes("API key") || msg.includes("401") || msg.includes("403")
          ? "Invalid API key. Please check and try again."
          : msg.includes("429")
          ? "Rate limit hit. Wait a moment and try again."
          : "Request failed. Check your key and network.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setOrbState("idle");
      setStreaming(false);
    }
  }, [input, streaming, apiKey, client, messages]);

  const orbLabel = {
    idle: "Ready",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Responding…",
  }[orbState];

  const hasKey = !!apiKey;

  return (
    <section id="work" className="px-4 sm:px-6 max-w-[1200px] mx-auto w-full">
      {/* ── Section header ── */}
      <motion.div
        className="mb-12 sm:mb-16"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-blue-400 to-transparent" />
          <span className="text-xs font-mono font-medium text-ink-dim uppercase tracking-widest">
            Live Demo
          </span>
        </div>
        <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.1] tracking-tight">
          Chat with my{" "}
          <span className="text-gradient">AI assistant</span>
        </h2>
        <p className="mt-4 text-ink-dim text-base sm:text-lg max-w-xl leading-relaxed">
          A live Gemini-powered chatbot that knows my work, skills, and projects. Bring your own API key — it stays in your browser.
        </p>
      </motion.div>

      {/* ── Main layout ── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-stretch"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        {/* ── Left: Orb panel ── */}
        <div className="glass-panel p-6 flex flex-col items-center justify-between gap-6 min-h-[360px] lg:min-h-[520px]">
          {/* Top row */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{
                  background: orbState === "idle" ? "#22d3ee"
                    : orbState === "thinking" ? "#a78bfa"
                    : orbState === "speaking" ? "#34d399"
                    : "#60a5fa",
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs font-mono text-ink-dim">{orbLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-ink-dim hover:text-ink transition-colors p-1.5 rounded-xl hover:bg-black/5"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setShowKeyModal(true)}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all \${
                  hasKey
                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                }\`}
              >
                <Key className="w-3 h-3" />
                {hasKey ? "Key set" : "Add key"}
              </button>
            </div>
          </div>

          {/* Orb */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            {/* Ambient glow behind orb */}
            <motion.div
              className="absolute w-56 h-56 rounded-full"
              style={{
                background: orbState === "thinking"
                  ? "radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)"
                  : orbState === "speaking"
                  ? "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)",
              }}
              animate={{ scale: orbState === "thinking" ? [1, 1.15, 1] : [1, 1.05, 1] }}
              transition={{ duration: orbState === "thinking" ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className="relative w-52 h-52 cursor-pointer"
              onClick={() => { if (!chatOpen) setChatOpen(true); }}
              title={chatOpen ? undefined : "Click to open chat"}
            >
              <OrbCanvas orbState={orbState} />
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{
                    scale: orbState === "thinking" ? [1, 0.9, 1] : 1,
                    rotate: orbState === "thinking" ? [0, 180, 360] : 0,
                  }}
                  transition={{ duration: orbState === "thinking" ? 2 : 0.3, repeat: orbState === "thinking" ? Infinity : 0, ease: "linear" }}
                >
                  <Sparkles className="w-8 h-8 text-white/90 drop-shadow-lg" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Model badge */}
          <div className="flex items-center gap-2 text-xs text-ink-dim">
            <img
              src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg"
              alt="Gemini"
              className="w-4 h-4 opacity-70"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="font-mono">gemini-2.0-flash</span>
            <span className="text-ink-dim/40">·</span>
            <span>streaming</span>
          </div>
        </div>

        {/* ── Right: Chat panel ── */}
        <div className="glass-panel flex flex-col overflow-hidden min-h-[520px]">
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
            <div>
              <p className="font-display font-semibold text-sm text-ink">Travis's Assistant</p>
              <p className="text-xs text-ink-dim">Ask about projects, skills, or availability</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-ink-dim">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
            {messages.length === 0 && (
              <motion.div
                className="h-full flex flex-col items-center justify-center text-center py-8 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-2">
                  <p className="text-ink font-medium text-sm">What would you like to know?</p>
                  <p className="text-ink-dim text-xs">
                    {hasKey ? "Start typing below ↓" : "Add a Gemini API key to get started"}
                  </p>
                </div>
                {/* Suggested prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                  {[
                    "Tell me about mycartoon.org",
                    "What stack does Travis use?",
                    "Is Travis available for hire?",
                    "What is AI Vocal Studio?",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                      className="text-left text-xs px-3 py-2.5 rounded-2xl border border-black/[0.08] bg-white/50 text-ink-dim hover:text-ink hover:bg-white/80 hover:border-blue-200 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={\`flex \${msg.role === "user" ? "justify-end" : "justify-start"}\`}
                >
                  <div className={\`group relative max-w-[85%] \${msg.role === "user" ? "items-end" : "items-start"}\`}>
                    <div
                      className={\`px-4 py-3 rounded-2xl text-sm leading-relaxed \${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white rounded-br-sm"
                          : "bg-white/70 border border-black/[0.06] text-ink rounded-bl-sm"
                      }\`}
                    >
                      {msg.role === "assistant" && msg.content === "" ? (
                        <TypingDots />
                      ) : (
                        <MessageContent content={msg.content} />
                      )}
                    </div>

                    {/* Copy button */}
                    {msg.content && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-white shadow-sm border border-black/[0.06] text-ink-dim hover:text-ink"
                      >
                        {copied === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs"
                >
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                  {error.includes("key") && (
                    <button
                      onClick={() => setShowKeyModal(true)}
                      className="ml-auto font-semibold underline hover:no-underline shrink-0"
                    >
                      Fix key
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div className="px-4 pb-4 pt-2">
            {!hasKey ? (
              <motion.button
                onClick={() => setShowKeyModal(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-200 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Key className="w-4 h-4" />
                Add Gemini API Key to Start Chatting
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask anything about Travis…"
                  disabled={streaming}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-black/[0.08] text-ink text-sm placeholder:text-ink-dim/50 focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60 transition-all"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-200 transition-all shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {streaming ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── API Key Modal ── */}
      <ApiKeyModal
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSave={saveKey}
        current={apiKey}
      />
    </section>
  );
}

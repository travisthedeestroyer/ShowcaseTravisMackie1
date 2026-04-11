import { useEffect, useState, useRef } from "react";
import { useInView } from "motion/react";
import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";

interface Line {
  type: "prompt" | "output" | "success" | "error" | "dim" | "accent" | "blank";
  text?: string;
  delay?: number;
}

const lines: Line[] = [
  { type: "prompt",  text: "cd ~/projects/ai-record-label && npm run dev" },
  { type: "dim",     text: "  VITE v5.2.0  ready in 312ms",                     delay: 350 },
  { type: "success", text: "  ➜  Local:   http://localhost:3001/",              delay: 120 },
  { type: "dim",     text: "  ➜  Express: /api/mix proxy active",              delay: 80  },
  { type: "blank",   delay: 280 },
  { type: "prompt",  text: 'node -e "require(\'./dist/agents/conductor\').runPipeline()"', delay: 500 },
  { type: "output",  text: "[vocal-analyst]  ✓ tone: warm, energy: 0.72, genre: hip-hop/soul", delay: 580 },
  { type: "output",  text: "[lyric-writer]   ✓ 16 bars generated (Gemini 2.5 Pro)",            delay: 380 },
  { type: "output",  text: "[beat-generator] ✓ Lyria Pro: 8 bar loop, 87bpm, minor pentatonic", delay: 460 },
  { type: "output",  text: "[mix-engineer]   ✓ EQ -3dB @ 200Hz, +2dB @ 8kHz, reverb 18%",     delay: 280 },
  { type: "output",  text: "[mastering-qc]   ✓ LUFS: -14.2, true peak: -1.0 dBTP",            delay: 550 },
  { type: "output",  text: "[ffmpeg]         ✓ render complete → /output/track_001.mp3",        delay: 700 },
  { type: "success", text: "[ar-reviewer]    ✓ async review queued — playback unblocked",      delay: 360 },
  { type: "accent",  text: "  Pipeline complete in 4.2s ✦",                                   delay: 280 },
];

// Dark terminal theme colors
const lineStyle = (type: Line["type"]) => {
  switch (type) {
    case "prompt":  return "text-[#cdd6f4]";          // white-ish
    case "output":  return "text-[#89b4fa]";           // blue
    case "success": return "text-[#a6e3a1]";           // green
    case "error":   return "text-[#f38ba8]";           // red
    case "dim":     return "text-[#6c7086]";           // muted
    case "accent":  return "text-[#cba6f7] font-bold"; // purple bold
    default:        return "";
  }
};

export function Terminal() {
  const [visibleLines, setVisibleLines] = useState<Line[]>([]);
  const [isTyping, setIsTyping]   = useState(false);
  const [done,     setDone]       = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const isInView     = useInView(containerRef, { once: true, amount: 0.25 });
  const abortRef     = useRef(false);

  const startTyping = async () => {
    setVisibleLines([]);
    setDone(false);
    setIsTyping(true);
    abortRef.current = false;

    for (let i = 0; i < lines.length; i++) {
      if (abortRef.current) break;
      const line = lines[i];
      if (line.delay) await new Promise((r) => setTimeout(r, line.delay));
      if (abortRef.current) break;
      setVisibleLines((prev) => [...prev, line]);
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    setIsTyping(false);
    setDone(true);
  };

  useEffect(() => {
    if (isInView && !isTyping && !done) startTyping();
  }, [isInView]);

  const replay = () => {
    abortRef.current = true;
    setTimeout(startTyping, 120);
  };

  return (
    <section id="terminal-section" className="px-6 max-w-[1000px] mx-auto w-full">
      <div ref={containerRef}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink mb-2">Under the Hood</h2>
            <p className="text-ink-dim font-light">Real-time execution logs from the orchestration engine.</p>
          </div>
          {done && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={replay}
              className="font-mono text-xs tracking-wider uppercase text-ink-dim hover:text-ink transition-colors flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full border border-black/5 hover:bg-black/8 hover:border-black/10 active:scale-95"
            >
              <RotateCcw size={12} /> Replay
            </motion.button>
          )}
        </div>

        {/* Terminal window */}
        <div
          className="overflow-hidden rounded-2xl shadow-2xl border border-white/5"
          style={{ background: "#1e1e2e" }}
        >
          {/* Title bar */}
          <div
            className="px-4 py-3 flex items-center gap-2 border-b"
            style={{ background: "#181825", borderColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
            <div className="ml-auto font-mono text-[0.6rem] uppercase tracking-widest" style={{ color: "#6c7086" }}>
              travis@ai-studio — zsh
            </div>
          </div>

          {/* Content */}
          <div
            ref={scrollRef}
            className="p-5 sm:p-6 h-[300px] sm:h-[360px] overflow-y-auto scrollbar-hide space-y-1.5 text-sm sm:text-[0.875rem]"
          >
            {visibleLines.map((line, i) => (
              <div key={i} className={`font-mono leading-relaxed ${lineStyle(line.type)}`}>
                {line.type === "prompt" && (
                  <span style={{ color: "#89dceb" }} className="mr-2 select-none">❯</span>
                )}
                <span className="break-all sm:break-normal">{line.text}</span>
              </div>
            ))}

            {/* Blinking cursor */}
            {isTyping && (
              <div className="font-mono" style={{ color: "#cdd6f4" }}>
                <span style={{ color: "#89dceb" }} className="mr-2 select-none">❯</span>
                <span className="terminal-cursor inline-block w-2 h-[1em] align-bottom" style={{ background: "#cdd6f4" }} />
              </div>
            )}

            {/* Final cursor after done */}
            {done && (
              <div className="font-mono" style={{ color: "#cdd6f4" }}>
                <span style={{ color: "#89dceb" }} className="mr-2 select-none">❯</span>
                <span className="terminal-cursor inline-block w-2 h-[1em] align-bottom" style={{ background: "#cdd6f4" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

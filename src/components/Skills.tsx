import { motion } from "motion/react";
import { Zap, Brain, Server, Lock, Wrench, Layers, type LucideIcon } from "lucide-react";

interface SkillGroup {
  category: string;
  icon: LucideIcon;
  color: string;
  skills: string[];
}

const skillGroups: SkillGroup[] = [
  {
    category: "Frontend",
    icon: Zap,
    color: "#3b82f6",
    skills: ["React 19", "TypeScript", "Vite", "Tailwind CSS 4", "Canvas / WebGL", "Web Audio API", "MediaRecorder"],
  },
  {
    category: "AI / Models",
    icon: Brain,
    color: "#8b5cf6",
    skills: ["Gemini 2.5 Flash / Pro", "Lyria Pro", "Veo 2", "Pollinations.ai", "Multi-agent orchestration", "Prompt engineering"],
  },
  {
    category: "Backend",
    icon: Server,
    color: "#10b981",
    skills: ["Node.js", "Express", "FFmpeg", "Supabase", "PostgreSQL", "Edge Functions", "REST APIs"],
  },
  {
    category: "Payments & Auth",
    icon: Lock,
    color: "#f59e0b",
    skills: ["Stripe", "Token economies", "Webhooks", "Supabase Auth", "RLS policies", "COPPA compliance"],
  },
  {
    category: "Dev Tooling",
    icon: Wrench,
    color: "#ec4899",
    skills: ["GitHub Codespaces", "AI coding agents", "Vercel", "TypeScript strict", "Vite HMR", "ESLint"],
  },
  {
    category: "Architecture",
    icon: Layers,
    color: "#06b6d4",
    skills: ["Promise.all parallel agents", "Exponential backoff", "Error boundaries", "Zustand", "Typed callbacks", "IndexedDB"],
  },
];

export function Skills() {
  return (
    <section id="stack" className="px-6 max-w-[1200px] mx-auto w-full">
      <div className="mb-12 sm:mb-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(2.5rem,6vw,4rem)] font-bold leading-none text-ink mb-4"
        >
          THE <span className="text-gradient">ARSENAL</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-ink-dim text-lg font-light max-w-[600px] mx-auto"
        >
          Every tool required to ship production-grade AI platforms end-to-end.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {skillGroups.map((group, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel p-7 sm:p-8 group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden"
          >
            {/* Subtle accent glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
              style={{ background: `radial-gradient(ellipse at top left, ${group.color}10, transparent 60%)` }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 relative">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${group.color}15` }}
              >
                <group.icon size={18} style={{ color: group.color }} />
              </span>
              <div
                className="font-display text-xl font-bold"
                style={{ color: group.color }}
              >
                {group.category}
              </div>
            </div>

            {/* Skill pills */}
            <div className="flex flex-wrap gap-2 relative">
              {group.skills.map((skill, j) => (
                <span
                  key={j}
                  className="text-xs text-ink-dim bg-black/[0.04] px-3 py-1.5 rounded-lg border border-black/[0.06] hover:text-ink hover:border-black/15 transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

import { motion } from "motion/react";

const skillGroups = [
  {
    category: "Frontend",
    skills: ["React 18", "TypeScript", "Vite", "Tailwind CSS", "Canvas / WebGL", "Web Audio API", "MediaRecorder"],
  },
  {
    category: "AI / Models",
    skills: ["Gemini 2.5 Flash / Pro", "Lyria Pro", "Veo 2", "Pollinations.ai", "Multi-agent orchestration", "Prompt engineering"],
  },
  {
    category: "Backend",
    skills: ["Node.js", "Express", "FFmpeg", "Supabase", "PostgreSQL", "Edge Functions", "REST APIs"],
  },
  {
    category: "Payments & Auth",
    skills: ["Stripe", "Token economies", "Webhooks", "Supabase Auth", "RLS", "COPPA compliance"],
  },
  {
    category: "Dev Tooling",
    skills: ["GitHub Codespaces", "Antigravity IDE", "AI coding agents", "Vercel", "TypeScript strict mode"],
  },
  {
    category: "Architecture",
    skills: ["Promise.all parallel agents", "Exponential backoff", "Error boundaries", "Zustand", "Typed callbacks"],
  },
];

export function Skills() {
  return (
    <section id="stack" className="px-6 max-w-[1200px] mx-auto w-full">
      <div className="mb-12 sm:mb-16 text-center">
        <h2 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-bold leading-none text-ink mb-4">
          THE <span className="text-gradient">ARSENAL</span>
        </h2>
        <p className="text-ink-dim text-lg font-light max-w-[600px] mx-auto">
          Every tool required to ship production-grade AI platforms end-to-end.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {skillGroups.map((group, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-8 hover:bg-black/[0.02] transition-colors"
          >
            <div className="font-display text-2xl font-bold text-ink mb-6">
              {group.category}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill, j) => (
                <span key={j} className="text-sm text-ink-dim bg-black/5 px-3 py-1.5 rounded-lg border border-black/5 hover:text-ink hover:border-black/20 transition-colors cursor-default">
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

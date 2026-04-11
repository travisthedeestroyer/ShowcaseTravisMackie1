import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Mail, Github, Globe, Check, Copy } from "lucide-react";
import { useState } from "react";

const EMAIL = "travisbishopmackie@gmail.com";

function CopyEmailButton() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm text-xs font-mono text-ink-dim hover:text-ink hover:border-black/20 hover:bg-white/70 transition-all active:scale-95"
      title="Copy email"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied
          ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-emerald-500"><Check size={12} /></motion.span>
          : <motion.span key="copy"  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={12} /></motion.span>
        }
      </AnimatePresence>
      <span>{copied ? "Copied!" : EMAIL}</span>
    </button>
  );
}

const socials = [
  {
    href: `mailto:${EMAIL}`,
    label: "Email",
    icon: Mail,
    hoverColor: "#3b82f6",
    hoverBg: "#3b82f610",
  },
  {
    href: "https://github.com/travismackie",
    label: "GitHub",
    icon: Github,
    hoverColor: "#0f172a",
    hoverBg: "#0f172a10",
    external: true,
  },
  {
    href: "https://mycartoon.org",
    label: "Website",
    icon: Globe,
    hoverColor: "#10b981",
    hoverBg: "#10b98110",
    external: true,
  },
];

export function Contact() {
  return (
    <section id="contact" className="px-6 py-20 sm:py-32 max-w-[800px] mx-auto text-center relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[0.65rem] font-mono text-emerald-700 uppercase tracking-widest">Available Now</span>
        </motion.div>

        <h2 className="font-display text-[clamp(3.5rem,10vw,7rem)] font-bold leading-[0.9] mb-6 text-gradient">
          READY TO<br />BUILD?
        </h2>

        <p className="text-lg sm:text-xl text-ink-dim font-light mb-8 leading-relaxed">
          Whether you need a complex multi-agent pipeline or a full-stack AI product from
          scratch, I'm ready to execute. Let's ship something unprecedented.
        </p>

        {/* Copy email */}
        <div className="flex justify-center mb-10">
          <CopyEmailButton />
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <a
            href={`mailto:${EMAIL}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-ink text-white font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_32px_rgba(15,23,42,0.2)]"
          >
            Start a Conversation <ArrowRight size={20} />
          </a>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-4">
          {socials.map(({ href, label, icon: Icon, hoverColor, hoverBg, external }) => (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={label}
              className="group w-12 h-12 rounded-full glass-panel flex items-center justify-center text-ink-dim transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ ["--hover-color" as string]: hoverColor, ["--hover-bg" as string]: hoverBg }}
            >
              <Icon
                size={20}
                className="transition-colors duration-200 group-hover:text-[var(--hover-color)]"
              />
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

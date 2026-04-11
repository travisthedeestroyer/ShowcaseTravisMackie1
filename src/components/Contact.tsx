import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Mail, Github, Globe, Check, Copy, Send, Loader2 } from "lucide-react";
import { useState } from "react";

const EMAIL = "travisbishopmackie@gmail.com";
// Replace with your Formspree form ID: https://formspree.io
const FORMSPREE_ID = "xgvkpjqv";

function CopyEmailButton() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
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

type FormState = "idle" | "submitting" | "success" | "error";

function ContactForm() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [status,  setStatus]  = useState<FormState>("idle");
  const [errMsg,  setErrMsg]  = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrMsg("");

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setStatus("success");
        setName(""); setEmail(""); setMessage("");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrMsg((data as { error?: string }).error ?? "Submission failed. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel px-8 py-10 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check size={26} className="text-emerald-600" />
        </div>
        <p className="font-display font-bold text-xl text-ink mb-2">Message sent!</p>
        <p className="text-ink-dim text-sm">I'll get back to you within 24 hours.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-5 text-xs font-mono text-ink-dim hover:text-ink underline underline-offset-4 transition-colors"
        >
          Send another
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 text-left w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-mono text-ink-dim uppercase tracking-wider mb-1.5">Name</label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Travis Mackie"
            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/60 backdrop-blur-sm text-sm text-ink placeholder-ink-dim/50 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-mono text-ink-dim uppercase tracking-wider mb-1.5">Email</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/60 backdrop-blur-sm text-sm text-ink placeholder-ink-dim/50 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
          />
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="contact-message" className="block text-xs font-mono text-ink-dim uppercase tracking-wider mb-1.5">Message</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Tell me what you're building…"
          className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/60 backdrop-blur-sm text-sm text-ink placeholder-ink-dim/50 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-500 mb-4 font-mono">{errMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-ink text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_24px_rgba(15,23,42,0.2)] hover:shadow-[0_4px_40px_rgba(59,130,246,0.3)] disabled:opacity-60 disabled:cursor-not-allowed group"
      >
        <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="relative z-10 flex items-center gap-2">
          {status === "submitting"
            ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
            : <><Send size={16} /> Send Message</>
          }
        </span>
      </button>
    </form>
  );
}

const socials = [
  { href: `mailto:${EMAIL}`, label: "Email", icon: Mail, hoverColor: "#3b82f6", hoverBg: "#3b82f610" },
  { href: "https://github.com/travismackie", label: "GitHub", icon: Github, hoverColor: "#0f172a", hoverBg: "#0f172a10", external: true },
  { href: "https://mycartoon.org", label: "Website", icon: Globe, hoverColor: "#10b981", hoverBg: "#10b98110", external: true },
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/10 bg-white/70 backdrop-blur-md mb-8 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-[0.65rem] font-mono text-ink-dim uppercase tracking-widest">Available Now</span>
        </motion.div>

        <h2 className="font-display text-[clamp(3.5rem,10vw,7rem)] font-bold leading-[0.9] mb-6 text-gradient">
          READY TO<br />BUILD?
        </h2>

        <p className="text-lg sm:text-xl text-ink-dim font-light mb-8 leading-relaxed">
          Whether you need a complex multi-agent pipeline or a full-stack AI product from
          scratch, I'm ready to execute. Let's ship something unprecedented.
        </p>

        {/* Copy email */}
        <div className="flex justify-center mb-8">
          <CopyEmailButton />
        </div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <ContactForm />
        </motion.div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <a
            href={`mailto:${EMAIL}`}
            className="w-full sm:w-auto relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full bg-ink text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_4px_32px_rgba(15,23,42,0.2)] hover:shadow-[0_4px_48px_rgba(59,130,246,0.35)] group"
          >
            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="relative z-10 flex items-center gap-2.5">Start a Conversation <ArrowRight size={20} /></span>
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

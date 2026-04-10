import { motion } from "motion/react";
import { ArrowRight, Mail, Github, Globe } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="px-6 py-20 sm:py-32 max-w-[800px] mx-auto text-center relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none mix-blend-multiply" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10"
      >
        <h2 className="font-display text-[clamp(3.5rem,10vw,7rem)] font-bold leading-[0.9] mb-8 text-gradient">
          READY TO BUILD?
        </h2>
        <p className="text-lg sm:text-xl text-ink-dim font-light mb-12 leading-relaxed">
          Whether you need a complex multi-agent pipeline or a full-stack AI product from scratch, I'm ready to execute. Let's ship something unprecedented.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a href="mailto:travisbishopmackie@gmail.com" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-ink text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(0,0,0,0.15)]">
            Start a Conversation <ArrowRight size={20} />
          </a>
        </div>

        <div className="flex items-center justify-center gap-6">
          <a href="mailto:travisbishopmackie@gmail.com" className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-ink-dim hover:text-ink hover:bg-black/5 transition-all">
            <Mail size={20} />
          </a>
          <a href="https://github.com/travismackie" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-ink-dim hover:text-ink hover:bg-black/5 transition-all">
            <Github size={20} />
          </a>
          <a href="https://mycartoon.org" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-ink-dim hover:text-ink hover:bg-black/5 transition-all">
            <Globe size={20} />
          </a>
        </div>
      </motion.div>
    </section>
  );
}

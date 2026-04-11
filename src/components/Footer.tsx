import { ArrowUp } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="px-6 py-8 border-t border-black/[0.06] bg-bg relative z-10">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="font-mono text-xs text-ink-dim tracking-wider uppercase text-center sm:text-left">
          © {year} Travis Mackie — AI Engineer
        </div>

        <button
          onClick={scrollToTop}
          className="w-9 h-9 rounded-full border border-black/10 bg-white/60 backdrop-blur-sm flex items-center justify-center text-ink-dim hover:text-ink hover:bg-white/80 hover:border-black/20 transition-all active:scale-90 hover:-translate-y-0.5"
          aria-label="Back to top"
        >
          <ArrowUp size={14} strokeWidth={1.5} />
        </button>

        <div className="font-mono text-xs text-ink-dim tracking-wider uppercase text-center sm:text-right">
          Based in Mt. Vernon, Ohio
        </div>
      </div>
    </footer>
  );
}

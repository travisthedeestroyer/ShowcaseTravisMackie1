import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "About",   id: "about"   },
  { label: "Work",    id: "work"    },
  { label: "Stack",   id: "stack"   },
  { label: "Contact", id: "contact" },
];

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeId,   setActiveId]   = useState<string | null>(null);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: track which section is in the viewport
  useEffect(() => {
    const sections = navItems.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[1000] w-[92%] sm:w-auto"
    >
      <div
        className="glass-panel !rounded-full px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-8 sm:gap-16 transition-shadow duration-300"
        style={{ boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.5) inset" : undefined }}
      >
        <a href="#hero" className="font-display font-bold text-lg tracking-tight text-ink flex items-center gap-2.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          TM
        </a>

        {/* Desktop nav */}
        <ul className="hidden sm:flex items-center gap-8">
          {navItems.map(({ label, id }) => {
            const isActive = activeId === id;
            return (
              <li key={id} className="relative">
                <a
                  href={`#${id}`}
                  className={`text-sm font-medium transition-colors ${isActive ? "text-ink" : "text-ink-dim hover:text-ink"}`}
                >
                  {label}
                </a>
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-blue-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* Hire Me CTA */}
        <a
          href="mailto:travisbishopmackie@gmail.com"
          className="hidden sm:block text-sm font-bold bg-ink text-white px-5 py-2 rounded-full hover:scale-105 active:scale-95 transition-transform relative overflow-hidden"
        >
          <span className="relative z-10">Hire Me</span>
        </a>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-ink p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <AnimatePresence mode="wait" initial={false}>
            {menuOpen
              ? <motion.span key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={20} /></motion.span>
              : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={20} /></motion.span>
            }
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 glass-panel p-4 flex flex-col gap-1 sm:hidden origin-top"
          >
            {navItems.map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setMenuOpen(false)}
                className={`text-lg font-medium px-3 py-3 rounded-2xl transition-colors ${activeId === id ? "text-ink bg-black/5" : "text-ink-dim hover:text-ink hover:bg-black/[0.03]"}`}
              >
                {label}
              </a>
            ))}
            <a
              href="mailto:travisbishopmackie@gmail.com"
              className="text-center text-sm font-bold bg-ink text-white px-5 py-3 rounded-2xl mt-2"
            >
              Hire Me
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = ["About", "Work", "Stack", "Contact"];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-500 w-[92%] sm:w-auto`}
    >
      <div className="glass-panel !rounded-full px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-8 sm:gap-16 shadow-black/5">
        <a href="#hero" className="font-display font-bold text-lg tracking-tight text-ink flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          TM
        </a>
        
        <ul className="hidden sm:flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item}>
              <a href={`#${item.toLowerCase()}`} className="text-sm font-medium text-ink-dim hover:text-ink transition-colors">
                {item}
              </a>
            </li>
          ))}
        </ul>

        <a href="mailto:travisbishopmackie@gmail.com" className="hidden sm:block text-sm font-bold bg-ink text-white px-5 py-2 rounded-full hover:scale-105 transition-transform">
          Hire Me
        </a>

        <button className="sm:hidden text-ink" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 glass-panel p-4 flex flex-col gap-4 sm:hidden"
        >
          {navItems.map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              onClick={() => setMenuOpen(false)}
              className="text-lg font-medium text-ink-dim hover:text-ink transition-colors px-2"
            >
              {item}
            </a>
          ))}
          <a href="mailto:travisbishopmackie@gmail.com" className="text-center text-sm font-bold bg-ink text-white px-5 py-3 rounded-xl mt-2">
            Hire Me
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}

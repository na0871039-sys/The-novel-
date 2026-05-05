import { useLanguage, LANGUAGES, Language } from '../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold transition-all hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Globe className="h-3.5 w-3.5 text-zinc-400 group-hover:text-indigo-600" />
        <span className="uppercase tracking-widest">{language.code}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full z-[60] mt-2 w-48 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="max-h-[320px] overflow-y-auto p-1.5 scrollbar-hide">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors",
                    language.code === lang.code 
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40" 
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="text-sm font-medium">{lang.name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

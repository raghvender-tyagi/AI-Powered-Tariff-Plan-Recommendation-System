import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { Logo } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/store/useAppStore';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#experience', label: 'Telecom Twin' },
  { href: '#recommendations', label: 'AI Recommendations' },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  return (
    <header className="sticky top-0 z-40 border-b border-base-700/60 bg-base-950/80 backdrop-blur-lg">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 ml-6" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-base-300 hover:text-base-50 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full border border-base-700 bg-base-900 text-base-200 hover:bg-base-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Toggle Day or Night Mode"
          >
            {isDarkMode ? (
              <>
                <Moon className="h-4 w-4 text-cyan-300 fill-cyan-300/20" />
                <span className="text-cyan-300">Night</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                <span className="text-amber-400">Day</span>
              </>
            )}
          </button>
          <Button as={Link} to="/app/dashboard" variant="ghost" size="sm">
            Live demo
          </Button>
          <Button as={Link} to="/onboarding" variant="primary" size="sm">
            Get my recommendations
          </Button>
        </div>
        <button
          className="md:hidden ml-auto rounded-lg p-2 text-base-200 hover:bg-base-800"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-base-700/60 px-4 py-4 flex flex-col gap-3">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-base-300">
              {l.label}
            </a>
          ))}
          <Button as={Link} to="/app/dashboard" variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Live demo
          </Button>
          <Button as={Link} to="/onboarding" variant="primary" size="sm" onClick={() => setOpen(false)}>
            Get my recommendations
          </Button>
        </div>
      )}
    </header>
  );
}

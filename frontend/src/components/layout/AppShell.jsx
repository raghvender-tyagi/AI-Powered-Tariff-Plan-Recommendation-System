import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Radar,
  Sparkles,
  Scale,
  SlidersHorizontal,
  MessageCircle,
  History,
  ShieldCheck,
  Menu,
  X,
  Wifi,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { initials } from '@/lib/format';
import { Drawer } from '@/components/ui/Drawer';
import { ChatWindow } from '@/components/advisor/ChatWindow';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/twin', label: 'My Telecom Twin', icon: Radar },
  { to: '/app/recommendations', label: 'Recommendations', icon: Sparkles },
  { to: '/app/compare', label: 'Compare Plans', icon: Scale },
  { to: '/app/simulator', label: 'Simulator', icon: SlidersHorizontal },
  { to: '/app/advisor', label: 'AI Advisor', icon: MessageCircle },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/admin', label: 'Admin', icon: ShieldCheck },
];

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 shrink-0 group ${className}`} aria-label="Tariff Twin home">
      <span className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset]">
        <Wifi className="h-4 w-4 text-base-950" strokeWidth={2.5} />
      </span>
      <span className="font-display font-bold text-base-50 text-lg tracking-tight">
        Tariff<span className="text-cyan-400">Twin</span>
      </span>
    </Link>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const customerName = useAppStore((s) => s.customerName);
  const location = useLocation();
  const onAdvisorPage = location.pathname === '/app/advisor';

  return (
    <div className="min-h-screen flex flex-col bg-base-950">
      <header className="sticky top-0 z-40 border-b border-base-700/70 bg-base-950/85 backdrop-blur-lg">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1 ml-4 overflow-x-auto scrollbar-thin" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'bg-base-800 text-cyan-300' : 'text-base-300 hover:text-base-50 hover:bg-base-800/60'
                  }`
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-base-700 bg-base-900 pl-1 pr-3 py-1">
              <span className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-base-950">
                {initials(customerName) || 'U'}
              </span>
              <span className="text-sm text-base-200">{customerName}</span>
            </div>
            <button
              className="lg:hidden rounded-lg p-2 text-base-200 hover:bg-base-800"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-base-700/70"
              aria-label="Mobile"
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive ? 'bg-base-800 text-cyan-300' : 'text-base-300'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 bg-grid">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8"
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="border-t border-base-700/70 py-6">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-base-400">
          <p>© {new Date().getFullYear()} Tariff Twin. Recommendations are AI-assisted estimates, not financial advice.</p>
          <p>Built on the AI-Powered Tariff Plan Recommendation System.</p>
        </div>
      </footer>

      {!onAdvisorPage && (
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Open AI Advisor chat"
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan-400 to-green-400 text-base-950 pl-4 pr-5 py-3 shadow-[0_10px_30px_-8px_rgba(34,211,238,0.6)] hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-base-950/40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-base-950" />
          </span>
          <span className="text-sm font-semibold">Ask AI Advisor</span>
        </button>
      )}
      <Drawer open={chatOpen} onClose={() => setChatOpen(false)} title="Quick Chat" widthClass="max-w-md">
        <ChatWindow compact className="-m-6 rounded-none border-0 h-[calc(100vh-5.5rem)]" />
      </Drawer>
    </div>
  );
}

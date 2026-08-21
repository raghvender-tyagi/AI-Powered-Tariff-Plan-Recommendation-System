import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Drawer({ open, onClose, title, subtitle, children, widthClass = 'max-w-lg' }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-base-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative h-full w-full ${widthClass} bg-base-900 border-l border-base-700 shadow-2xl flex flex-col scrollbar-thin overflow-y-auto`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-base-700 bg-base-900/95 backdrop-blur px-6 py-5">
              <div>
                {subtitle && <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">{subtitle}</p>}
                <h2 className="text-lg font-bold text-base-50">{title}</h2>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-lg p-2 text-base-400 hover:text-base-100 hover:bg-base-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

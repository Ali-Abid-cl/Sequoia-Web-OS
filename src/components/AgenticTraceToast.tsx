import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Loader2, ShieldAlert, Sparkles, X } from 'lucide-react';
import type { TraceStep } from '../types/os';

interface AgenticTraceToastProps {
  title: string;
  steps: TraceStep[];
  visible: boolean;
  onDismiss: () => void;
}

export const AgenticTraceToast: React.FC<AgenticTraceToastProps> = ({
  title,
  steps,
  visible,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {visible && steps.length > 0 && (
        <motion.aside
          aria-label="Agentic Action Trace"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-10 right-4 z-[9300] w-80 overflow-hidden rounded-2xl border border-black/15 dark:border-white/18 bg-white/88 dark:bg-slate-900/92 p-3.5 shadow-[0_20px_48px_rgba(0,0,0,0.34)] macos-glass-heavy text-slate-900 dark:text-slate-100"
        >
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="truncate text-xs font-bold tracking-tight">{title}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss Agentic Action Trace"
              onClick={onDismiss}
              className="rounded-md p-1 text-slate-400 hover:bg-black/8 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <ul className="space-y-1.5">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex items-center gap-2 rounded-lg bg-black/4 dark:bg-white/5 px-2.5 py-1.5 text-xs"
              >
                {step.status === 'running' && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-500" />
                )}
                {step.status === 'done' && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                )}
                {step.status === 'blocked' && (
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                )}
                {step.status === 'pending' && (
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-400/60" />
                )}
                <span
                  className={`truncate ${
                    step.status === 'pending'
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'font-medium text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

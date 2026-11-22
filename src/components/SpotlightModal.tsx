import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Calculator as CalcIcon,
  FileText,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import { APP_META, APP_ORDER } from '../data/systemData';
import type { AgenticAction, AppId, FSNode } from '../types/os';
import { parseFallbackAgenticIntent } from '../utils/agenticFallback';
import { AppIcon } from './AppIcons';

interface SpotlightModalProps {
  isOpen: boolean;
  fsRoot: FSNode;
  onClose: () => void;
  onOpenApp: (id: AppId) => void;
  onRunAgenticActions: (actions: AgenticAction[], title?: string) => void;
}

const AGENTIC_EXAMPLES = [
  'Write a hackathon pitch in Notes and check system status in Terminal',
  'Open Safari Portfolio and switch to Dark Mode',
];

function evaluateMathExpression(raw: string): number | null {
  const cleaned = raw.trim().replace(/^=\s*/, '');
  if (!cleaned || !/^[0-9+\-*/().^\s]+$/.test(cleaned)) return null;
  if (!/[+\-*/^]/.test(cleaned)) return null;

  let pos = 0;
  const skipWs = () => {
    while (pos < cleaned.length && cleaned[pos] === ' ') pos++;
  };

  const parseExpr = (): number => {
    let val = parseTerm();
    while (true) {
      skipWs();
      if (cleaned[pos] === '+') {
        pos++;
        val += parseTerm();
      } else if (cleaned[pos] === '-') {
        pos++;
        val -= parseTerm();
      } else {
        break;
      }
    }
    return val;
  };

  const parseTerm = (): number => {
    let val = parsePower();
    while (true) {
      skipWs();
      if (cleaned[pos] === '*') {
        pos++;
        val *= parsePower();
      } else if (cleaned[pos] === '/') {
        pos++;
        const divisor = parsePower();
        val = divisor === 0 ? NaN : val / divisor;
      } else {
        break;
      }
    }
    return val;
  };

  const parsePower = (): number => {
    const base = parseFactor();
    skipWs();
    if (cleaned[pos] === '^') {
      pos++;
      return Math.pow(base, parsePower());
    }
    return base;
  };

  const parseFactor = (): number => {
    skipWs();
    if (cleaned[pos] === '+') {
      pos++;
      return parseFactor();
    }
    if (cleaned[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (cleaned[pos] === '(') {
      pos++;
      const inner = parseExpr();
      skipWs();
      if (cleaned[pos] !== ')') return NaN;
      pos++;
      return inner;
    }
    const start = pos;
    while (pos < cleaned.length && /[0-9.]/.test(cleaned[pos])) pos++;
    if (start === pos) return NaN;
    return Number(cleaned.slice(start, pos));
  };

  const result = parseExpr();
  skipWs();
  if (pos !== cleaned.length || !Number.isFinite(result)) return null;
  return Number(result.toPrecision(12));
}

function flattenFiles(node: FSNode): FSNode[] {
  const result: FSNode[] = [];
  for (const child of node.children ?? []) {
    result.push(child);
    if (child.children) result.push(...flattenFiles(child));
  }
  return result;
}

export const SpotlightModal: React.FC<SpotlightModalProps> = ({
  isOpen,
  fsRoot,
  onClose,
  onOpenApp,
  onRunAgenticActions,
}) => {
  const [query, setQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiActions, setAiActions] = useState<AgenticAction[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setAiAnswer(null);
      setAiActions([]);
      window.setTimeout(() => inputRef.current?.focus(), 20);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCloseRef.current();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [isOpen]);

  const mathResult = useMemo(() => evaluateMathExpression(query), [query]);

  const matchedApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APP_ORDER;
    return APP_ORDER.filter(
      (id) =>
        APP_META[id].title.toLowerCase().includes(q) ||
        APP_META[id].subtitle.toLowerCase().includes(q)
    );
  }, [query]);

  const matchedFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flattenFiles(fsRoot)
      .filter((f) => f.type !== 'folder' && f.name.toLowerCase().includes(q))
      .slice(0, 4);
  }, [fsRoot, query]);

  const askGemini = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setAiLoading(true);
    setAiAnswer(null);
    setAiActions([]);

    try {
      const res = await fetch('/api/gemini/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const actions: AgenticAction[] = Array.isArray(data.actions) ? data.actions : [];

      if (actions.length > 0) {
        onClose();
        onRunAgenticActions(actions, 'Agentic Action Trace');
      } else {
        setAiAnswer(data.answer || 'Done.');
      }
    } catch {
      // Graceful deterministic fallback parser when API key is missing, rate-limited, or timed out
      const fallback = parseFallbackAgenticIntent(q);
      if (fallback.actions.length > 0) {
        onClose();
        onRunAgenticActions(fallback.actions, 'Agentic Action Trace');
      } else {
        setAiAnswer(fallback.answer);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      const exactApp = APP_ORDER.find(
        (id) => APP_META[id].title.toLowerCase() === query.trim().toLowerCase()
      );
      if (exactApp) {
        onOpenApp(exactApp);
        onClose();
      } else if (mathResult !== null) {
        return;
      } else {
        void askGemini();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="spotlight-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-[9500] flex items-start justify-center bg-black/20 pt-[13vh] px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-label="Gemini Spotlight Search"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-black/15 dark:border-white/18 bg-white/88 dark:bg-slate-900/90 shadow-[0_28px_70px_rgba(0,0,0,0.42)] macos-glass-heavy text-slate-900 dark:text-slate-100"
          >
            {/* Search Bar */}
            <div className="flex items-center gap-3 border-b border-black/8 dark:border-white/10 px-4 py-3.5">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setAiAnswer(null);
                  setAiActions([]);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Spotlight Agent — orchestrate apps, calculate, or ask Gemini..."
                aria-label="Spotlight search input"
                className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-slate-400"
              />
              {query.trim() && (
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => void askGemini()}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Orchestrate</span>
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="macos-scroll max-h-[56vh] overflow-y-auto p-3 space-y-3">
              {/* Quick Agentic Examples when empty */}
              {!query.trim() && (
                <div>
                  <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Try Agentic OS Orchestration
                  </div>
                  <div className="space-y-1">
                    {AGENTIC_EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          setQuery(example);
                          void askGemini(example);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-black/6 dark:border-white/8 bg-black/3 dark:bg-white/4 px-3 py-2 text-left text-xs transition-colors hover:bg-sky-500/12"
                      >
                        <span className="flex items-center gap-2 truncate font-medium">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                          <span className="truncate">{example}</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Math Result */}
              {mathResult !== null && (
                <div className="flex items-center justify-between rounded-xl border border-black/8 dark:border-white/10 bg-white/70 dark:bg-white/6 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <CalcIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Spotlight Calculation
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums">
                        = {mathResult}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenApp('calculator');
                      onClose();
                    }}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Open Calculator
                  </button>
                </div>
              )}

              {/* Gemini Response */}
              {aiLoading && (
                <div className="flex items-center gap-2.5 rounded-xl border border-sky-500/25 bg-sky-500/8 px-4 py-3 text-xs text-sky-700 dark:text-sky-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Planning OS orchestration with Gemini 4 Hydrogen...</span>
                </div>
              )}

              {aiAnswer && (
                <div className="rounded-xl border border-sky-500/25 bg-sky-500/8 p-4">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Gemini Spotlight</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
                    {aiAnswer}
                  </p>
                  {aiActions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRunAgenticActions(aiActions, 'Agentic Action Trace');
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
                    >
                      <span>Execute {aiActions.length} Actions</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Applications */}
              {matchedApps.length > 0 && (
                <div>
                  <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Applications
                  </div>
                  <div className="space-y-0.5">
                    {matchedApps.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          onOpenApp(id);
                          onClose();
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-sky-500/15"
                      >
                        <div className="flex items-center gap-3">
                          <AppIcon id={id} className="h-8 w-8" />
                          <div>
                            <div className="text-xs font-semibold">{APP_META[id].title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {APP_META[id].subtitle}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">Launch</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Files */}
              {matchedFiles.length > 0 && (
                <div>
                  <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Files &amp; Documents
                  </div>
                  <div className="space-y-0.5">
                    {matchedFiles.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => {
                          onOpenApp('finder');
                          onClose();
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-sky-500/15"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                          <div>
                            <div className="text-xs font-semibold">{file.name}</div>
                            <div className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400">
                              {file.path}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">{file.size}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Hints */}
            <div className="flex items-center justify-between border-t border-black/8 dark:border-white/10 bg-black/3 dark:bg-white/3 px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Press Enter to orchestrate OS actions or calculate</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

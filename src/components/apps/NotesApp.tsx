import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Plus, Search, Sparkles, Trash2, Wand2 } from 'lucide-react';
import type { NoteItem } from '../../types/os';

interface NotesAppProps {
  notes: NoteItem[];
  selectedNoteId: string;
  onSelectNote: (id: string) => void;
  onUpdateNote: (id: string, patch: Partial<Pick<NoteItem, 'title' | 'body'>>) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  summarizeTrigger?: number;
}

export const NotesApp: React.FC<NotesAppProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onUpdateNote,
  onCreateNote,
  onDeleteNote,
  summarizeTrigger = 0,
}) => {
  const [search, setSearch] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'summarize' | 'polish'>('idle');
  const [aiPreview, setAiPreview] = useState<{ mode: 'summarize' | 'polish'; text: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const lastSummarizeRef = useRef(0);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const activeNote = notes.find((n) => n.id === selectedNoteId) ?? notes[0] ?? null;

  const wordCount = activeNote
    ? activeNote.body
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  const handleGeminiAction = async (mode: 'summarize' | 'polish') => {
    if (!activeNote || !activeNote.body.trim()) return;
    setAiStatus(mode);
    setAiError(null);
    setAiPreview(null);

    try {
      const res = await fetch('/api/gemini/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `${activeNote.title}\n\n${activeNote.body}`,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (mode === 'summarize') {
          const lines = activeNote.body
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .slice(0, 4);
          setAiPreview({
            mode,
            text: `Summary of "${activeNote.title}":\n${lines.map((l) => `• ${l.replace(/^[-•]\s*/, '')}`).join('\n')}`,
          });
        } else {
          setAiError(data.error || 'Gemini request failed.');
        }
      } else {
        setAiPreview({ mode, text: data.result || '' });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Network error calling Gemini.');
    } finally {
      setAiStatus('idle');
    }
  };

  useEffect(() => {
    if (summarizeTrigger > 0 && summarizeTrigger !== lastSummarizeRef.current) {
      lastSummarizeRef.current = summarizeTrigger;
      void handleGeminiAction('summarize');
    }
  });

  return (
    <div className="flex h-full w-full text-slate-900 dark:text-slate-100">
      {/* Notes Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-black/8 dark:border-white/10 bg-amber-50/40 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-2 border-b border-black/8 dark:border-white/10 px-3 py-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
              className="w-full rounded-md border border-black/10 dark:border-white/12 bg-white/80 dark:bg-slate-800/75 py-1 pr-2 pl-7 text-xs outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="button"
            aria-label="New Note"
            title="New Note"
            onClick={() => {
              setAiPreview(null);
              setAiError(null);
              onCreateNote();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500 text-white transition-colors hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="macos-scroll flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.map((note) => {
            const active = activeNote?.id === note.id;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  setAiPreview(null);
                  setAiError(null);
                  onSelectNote(note.id);
                }}
                className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active
                    ? 'bg-amber-400/25 dark:bg-amber-500/20 text-slate-950 dark:text-white'
                    : 'hover:bg-black/5 dark:hover:bg-white/6 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="truncate text-xs font-semibold">
                  {note.title || 'Untitled Note'}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="shrink-0 tabular-nums">{note.updatedAt.split(',')[0]}</span>
                  <span>·</span>
                  <span className="truncate">{note.body.trim() || 'No additional text'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Editor */}
      <div className="flex min-w-0 flex-1 flex-col bg-white/70 dark:bg-slate-900/50">
        {activeNote ? (
          <>
            {/* Notes Toolbar */}
            <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-black/8 dark:border-white/10 px-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <span>{activeNote.updatedAt}</span>
                <span>·</span>
                <span>{wordCount} words</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={aiStatus !== 'idle' || !activeNote.body.trim()}
                  onClick={() => void handleGeminiAction('summarize')}
                  className="flex items-center gap-1.5 rounded-md border border-black/10 dark:border-white/15 bg-white/80 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-amber-50 dark:hover:bg-slate-700 disabled:opacity-45 whitespace-nowrap shrink-0"
                >
                  {aiStatus === 'summarize' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span>Summarize</span>
                </button>

                <button
                  type="button"
                  disabled={aiStatus !== 'idle' || !activeNote.body.trim()}
                  onClick={() => void handleGeminiAction('polish')}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-45 whitespace-nowrap shrink-0"
                >
                  {aiStatus === 'polish' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  <span>Polish with Gemini</span>
                </button>

                {notes.length > 1 && (
                  <button
                    type="button"
                    aria-label="Delete Note"
                    onClick={() => onDeleteNote(activeNote.id)}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {aiError && (
              <div className="border-b border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs text-rose-700 dark:text-rose-300">
                {aiError}
              </div>
            )}

            {aiPreview && (
              <div className="border-b border-amber-500/25 bg-amber-50/90 dark:bg-amber-950/35 px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Gemini {aiPreview.mode === 'summarize' ? 'Summary' : 'Polished Draft'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (aiPreview.mode === 'summarize') {
                          onUpdateNote(activeNote.id, {
                            body: `${activeNote.body.trim()}\n\n--- Summary ---\n${aiPreview.text}`,
                          });
                        } else {
                          onUpdateNote(activeNote.id, { body: aiPreview.text });
                        }
                        setAiPreview(null);
                      }}
                      className="flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-500"
                    >
                      <Check className="h-3 w-3" />
                      {aiPreview.mode === 'summarize' ? 'Append to Note' : 'Replace Body'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPreview(null)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <pre className="macos-scroll max-h-32 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  {aiPreview.text}
                </pre>
              </div>
            )}

            {/* Title & Body */}
            <div className="flex flex-1 flex-col p-5 overflow-hidden">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => onUpdateNote(activeNote.id, { title: e.target.value })}
                placeholder="Note Title"
                aria-label="Note title"
                className="mb-3 bg-transparent text-lg font-bold tracking-tight outline-none placeholder:text-slate-400"
              />
              <textarea
                value={activeNote.body}
                onChange={(e) => onUpdateNote(activeNote.id, { body: e.target.value })}
                placeholder="Start typing..."
                aria-label="Note body"
                className="macos-scroll flex-1 resize-none bg-transparent text-[13.5px] leading-relaxed outline-none placeholder:text-slate-400 select-text"
              />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Select or create a note
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Compass, FileText, Folder, HardDrive, Lock, Play, Sparkles, Square } from 'lucide-react';
import {
  APP_META,
  INITIAL_FILESYSTEM,
  INITIAL_NOTES,
  WALLPAPERS,
  createInitialWindows,
} from './data/systemData';
import type {
  AgenticAction,
  AppId,
  FSNode,
  NoteItem,
  ThemeMode,
  TraceStep,
  WallpaperId,
  WindowState,
} from './types/os';
import { MenuBar } from './components/MenuBar';
import { Dock } from './components/Dock';
import { WindowFrame } from './components/WindowFrame';
import { SpotlightModal } from './components/SpotlightModal';
import { AgenticTraceToast } from './components/AgenticTraceToast';
import { VoiceOrbModal, speakConfirmation } from './components/VoiceOrbModal';
import { FinderApp } from './components/apps/FinderApp';
import { SafariPortfolioApp } from './components/apps/SafariPortfolioApp';
import { TerminalApp } from './components/apps/TerminalApp';
import { NotesApp } from './components/apps/NotesApp';
import { CalculatorApp } from './components/apps/CalculatorApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { CreatorLinks } from './components/CreatorLinks';
import { parseFallbackAgenticIntent } from './utils/agenticFallback';

function addFSNode(
  node: FSNode,
  parentPath: string,
  newNode: FSNode
): FSNode {
  if (node.path === parentPath && node.type === 'folder') {
    const exists = (node.children ?? []).some((c) => c.name === newNode.name);
    if (exists) return node;
    return {
      ...node,
      children: [...(node.children ?? []), newNode],
    };
  }
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.map((child) => addFSNode(child, parentPath, newNode)),
  };
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [wallpaper, setWallpaper] = useState<WallpaperId>('sequoia');
  const [brightness, setBrightness] = useState(100);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  const [windows, setWindows] = useState<Record<AppId, WindowState>>(() => createInitialWindows());
  const [topZ, setTopZ] = useState(20);
  const [focusedAppId, setFocusedAppId] = useState<AppId | null>('finder');

  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [voiceOrbOpen, setVoiceOrbOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const [fsRoot, setFsRoot] = useState<FSNode>(() => INITIAL_FILESYSTEM);
  const [finderViewMode, setFinderViewMode] = useState<'grid' | 'list'>('grid');
  const [terminalClearTrigger, setTerminalClearTrigger] = useState(0);
  const [terminalExtCmd, setTerminalExtCmd] = useState<{ id: string; command: string } | null>(null);

  const [notes, setNotes] = useState<NoteItem[]>(() => INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(INITIAL_NOTES[0].id);
  const [notesSummarizeTrigger, setNotesSummarizeTrigger] = useState(0);

  const [traceState, setTraceState] = useState<{
    visible: boolean;
    title: string;
    steps: TraceStep[];
  }>({ visible: false, title: 'Agentic Action Trace', steps: [] });
  const [demoTourRunning, setDemoTourRunning] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const orchestrationTimersRef = useRef<number[]>([]);
  const demoTimersRef = useRef<number[]>([]);

  // Sync .dark class with Tailwind v4 @custom-variant dark
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync High Contrast / Larger UI accessibility class
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('a11y-high-contrast');
    } else {
      root.classList.remove('a11y-high-contrast');
    }
  }, [highContrast]);

  // Clean up any scheduled demo or orchestration timers on unmount
  useEffect(() => {
    return () => {
      orchestrationTimersRef.current.forEach((id) => window.clearTimeout(id));
      demoTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Global keyboard shortcuts (Cmd/Ctrl + K for Spotlight)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      } else if (isLocked && (e.key === 'Enter' || e.key === ' ')) {
        setIsLocked(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLocked]);

  // Close desktop context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [contextMenu]);

  const focusWindow = useCallback((id: AppId) => {
    setTopZ((prevZ) => {
      const nextZ = prevZ + 1;
      setWindows((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          zIndex: nextZ,
        },
      }));
      return nextZ;
    });
    setFocusedAppId(id);
  }, []);

  const openApp = useCallback((id: AppId) => {
    setTopZ((prevZ) => {
      const nextZ = prevZ + 1;
      setWindows((prev) => {
        const current = prev[id];
        // Clamp default position inside viewport in case viewport is compact
        const maxX = Math.max(12, window.innerWidth - current.width - 16);
        const maxY = Math.max(36, window.innerHeight - current.height - 90);
        const clampedX = Math.min(current.x, maxX);
        const clampedY = Math.max(32, Math.min(current.y, maxY));
        return {
          ...prev,
          [id]: {
            ...current,
            isOpen: true,
            isMinimized: false,
            x: current.isOpen ? current.x : clampedX,
            y: current.isOpen ? current.y : clampedY,
            zIndex: nextZ,
          },
        };
      });
      return nextZ;
    });
    setFocusedAppId(id);
  }, []);

  const closeWindow = useCallback((id: AppId) => {
    setWindows((prev) => {
      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
        },
      };
      // Focus next highest open window
      const openList = Object.values(updated)
        .filter((w) => w.isOpen && !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex);
      setFocusedAppId(openList[0]?.id ?? null);
      return updated;
    });
  }, []);

  const minimizeWindow = useCallback((id: AppId) => {
    setWindows((prev) => {
      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          isMinimized: true,
        },
      };
      const openList = Object.values(updated)
        .filter((w) => w.isOpen && !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex);
      setFocusedAppId(openList[0]?.id ?? null);
      return updated;
    });
  }, []);

  const toggleMaximizeWindow = useCallback((id: AppId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMaximized: !prev[id].isMaximized,
      },
    }));
    focusWindow(id);
  }, [focusWindow]);

  const updateWindowBounds = useCallback(
    (id: AppId, patch: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => {
      setWindows((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          ...patch,
        },
      }));
    },
    []
  );

  const resetWindows = useCallback(() => {
    const fresh = createInitialWindows();
    setWindows((prev) => {
      const next = { ...fresh };
      let z = 20;
      (Object.keys(prev) as AppId[]).forEach((id, idx) => {
        if (prev[id].isOpen) {
          z += 1;
          next[id] = {
            ...fresh[id],
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            x: 70 + idx * 38,
            y: 52 + idx * 28,
            zIndex: z,
          };
        }
      });
      setTopZ(z);
      return next;
    });
  }, []);

  const handleCreateFSNode = useCallback(
    (parentPath: string, name: string, type: 'file' | 'folder', content = '') => {
      const newNode: FSNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        type,
        path: parentPath === '~' ? `~/${name}` : `${parentPath}/${name}`,
        kind: type === 'folder' ? 'Folder' : 'Plain Text',
        size: type === 'folder' ? '0 items' : `${content.length} B`,
        modified: 'Just now',
        content: type === 'file' ? content : undefined,
        children: type === 'folder' ? [] : undefined,
      };
      setFsRoot((prev) => addFSNode(prev, parentPath, newNode));
    },
    []
  );

  const handleCreateNote = useCallback((title = 'Untitled Note', body = '') => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title,
      body,
      updatedAt: 'Just now',
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    openApp('notes');
  }, [openApp]);

  const handleUpdateNote = useCallback(
    (id: string, patch: Partial<Pick<NoteItem, 'title' | 'body'>>) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: 'Edited just now' } : n))
      );
    },
    []
  );

  const handleDeleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const filtered = prev.filter((n) => n.id !== id);
        if (selectedNoteId === id && filtered[0]) {
          setSelectedNoteId(filtered[0].id);
        }
        return filtered;
      });
    },
    [selectedNoteId]
  );

  const handleMenuAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'new_note':
          handleCreateNote();
          break;
        case 'close_active':
          if (focusedAppId) closeWindow(focusedAppId);
          break;
        case 'minimize_active':
          if (focusedAppId) minimizeWindow(focusedAppId);
          break;
        case 'zoom_active':
          if (focusedAppId) toggleMaximizeWindow(focusedAppId);
          break;
        case 'clear_terminal':
          setTerminalClearTrigger((c) => c + 1);
          break;
        case 'finder_grid':
          setFinderViewMode('grid');
          openApp('finder');
          break;
        case 'finder_list':
          setFinderViewMode('list');
          openApp('finder');
          break;
      }
    },
    [closeWindow, focusedAppId, handleCreateNote, minimizeWindow, openApp, toggleMaximizeWindow]
  );

  const clearOrchestrationTimers = useCallback(() => {
    orchestrationTimersRef.current.forEach((id) => window.clearTimeout(id));
    orchestrationTimersRef.current = [];
  }, []);

  const clearDemoTimers = useCallback(() => {
    demoTimersRef.current.forEach((id) => window.clearTimeout(id));
    demoTimersRef.current = [];
  }, []);

  const executeAgenticAction = useCallback(
    (action: AgenticAction): 'done' | 'blocked' => {
      switch (action.type) {
        case 'open_app': {
          const validApps: AppId[] = ['finder', 'safari', 'terminal', 'notes', 'calculator', 'settings'];
          if (action.target && validApps.includes(action.target as AppId)) {
            openApp(action.target as AppId);
          }
          return 'done';
        }
        case 'create_note': {
          handleCreateNote(
            action.title?.trim() || 'Spotlight Agentic Note',
            action.body?.trim() || 'Drafted by Sequoia Web OS Agent.'
          );
          return 'done';
        }
        case 'run_terminal_cmd': {
          const cmd = action.command?.trim() || 'neofetch';
          openApp('terminal');
          setTerminalExtCmd({
            id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            command: cmd,
          });
          const destructive =
            /\brm\s+.*(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive|--force)\b|\bsudo\s+rm\b|\bmkfs(\.[a-z0-9]+)?\b|\bdd\s+if=/i.test(
              cmd
            );
          return destructive ? 'blocked' : 'done';
        }
        case 'set_theme': {
          if (action.target === 'light' || action.target === 'dark') {
            setTheme(action.target);
          }
          return 'done';
        }
        case 'set_wallpaper': {
          const validWps: WallpaperId[] = ['sequoia', 'sonoma', 'sierra', 'silk'];
          if (action.target && validWps.includes(action.target as WallpaperId)) {
            setWallpaper(action.target as WallpaperId);
          }
          return 'done';
        }
        default:
          return 'done';
      }
    },
    [handleCreateNote, openApp]
  );

  const runAgenticActions = useCallback(
    (actions: AgenticAction[], title = 'Agentic Action Trace') => {
      if (!actions.length) return;
      clearOrchestrationTimers();

      const initialSteps: TraceStep[] = actions.map((act, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        label: act.label,
        status: idx === 0 ? 'running' : 'pending',
      }));

      setTraceState({ visible: true, title, steps: initialSteps });

      actions.forEach((act, idx) => {
        const startDelay = idx * 480;
        const finishDelay = startDelay + 260;

        const startId = window.setTimeout(() => {
          setTraceState((prev) => ({
            ...prev,
            steps: prev.steps.map((s, sIdx) => (sIdx === idx ? { ...s, status: 'running' } : s)),
          }));
        }, startDelay);

        const finishId = window.setTimeout(() => {
          const outcome = executeAgenticAction(act);
          setTraceState((prev) => ({
            ...prev,
            steps: prev.steps.map((s, sIdx) => (sIdx === idx ? { ...s, status: outcome } : s)),
          }));
        }, finishDelay);

        orchestrationTimersRef.current.push(startId, finishId);
      });
    },
    [clearOrchestrationTimers, executeAgenticAction]
  );

  const handleVoiceCommand = useCallback(
    (transcript: string) => {
      const clean = transcript.trim();
      if (!clean) return;
      const lower = clean.toLowerCase();

      if (/\bsummarize\b.*\bnote/i.test(lower)) {
        openApp('notes');
        setNotesSummarizeTrigger((c) => c + 1);
        setTraceState({
          visible: true,
          title: 'Voice Control Trace',
          steps: [
            { id: `v-1-${Date.now()}`, label: 'Open Notes', status: 'done' },
            { id: `v-2-${Date.now()}`, label: 'Summarize active note', status: 'done' },
          ],
        });
        speakConfirmation('Opening Notes and summarizing your active note.');
        return;
      }

      if (/\bhigh contrast\b|\blarger ui\b/i.test(lower)) {
        setHighContrast((prev) => !prev);
        speakConfirmation('Toggling high contrast accessibility mode.');
        return;
      }

      const parsed = parseFallbackAgenticIntent(clean);
      if (parsed.actions.length > 0) {
        runAgenticActions(parsed.actions, 'Voice Control Trace');
        speakConfirmation(parsed.actions.map((a) => a.label).join('. '));
      } else {
        setTraceState({
          visible: true,
          title: 'Voice Control',
          steps: [{ id: `v-msg-${Date.now()}`, label: `Heard: "${clean}"`, status: 'done' }],
        });
        speakConfirmation(`I heard ${clean}. Try saying Open Terminal or Switch to Dark Mode.`);
      }
    },
    [openApp, runAgenticActions]
  );

  const stopJudgeDemoTour = useCallback(() => {
    clearDemoTimers();
    setDemoTourRunning(false);
    setSpotlightOpen(false);
  }, [clearDemoTimers]);

  const startJudgeDemoTour = useCallback(() => {
    clearDemoTimers();
    clearOrchestrationTimers();
    setDemoTourRunning(true);
    setSpotlightOpen(false);
    setVoiceOrbOpen(false);

    const tourSteps: TraceStep[] = [
      { id: 'tour-1', label: 'Spotlight: Draft DevFest Pitch in Notes', status: 'running' },
      { id: 'tour-2', label: 'Terminal: Run neofetch system diagnostics', status: 'pending' },
      { id: 'tour-3', label: 'Compositor: Light & Dark Glass switch', status: 'pending' },
      { id: 'tour-4', label: 'Safari: Showcase Ali Abid Portfolio', status: 'pending' },
    ];
    setTraceState({ visible: true, title: '15s Judge Demo Tour', steps: tourSteps });

    // Step 1 (0.4s): Spotlight flash -> Draft DevFest pitch in Notes
    const t1 = window.setTimeout(() => {
      setSpotlightOpen(true);
    }, 350);

    const t2 = window.setTimeout(() => {
      setSpotlightOpen(false);
      handleCreateNote(
        'DevFest Pakistan 2026 — Judge Demo Pitch',
        [
          'Sequoia Web OS — Agentic Cloud Run Desktop',
          '',
          'Built by Ali Abid Rasheed for DevFest Pakistan 2026.',
          '- Multi-step Spotlight Agent orchestration across Notes, Terminal & Safari',
          '- Web Speech API Voice Orb & High Contrast Accessibility UI',
          '- Deterministic Agent Sandbox guardrail isolating destructive shell commands',
        ].join('\n')
      );
      setTraceState((prev) => ({
        ...prev,
        steps: prev.steps.map((s, i) =>
          i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'running' } : s
        ),
      }));
    }, 2200);

    // Step 2 (4.8s): Open Terminal and execute neofetch
    const t3 = window.setTimeout(() => {
      openApp('terminal');
      setTerminalExtCmd({
        id: `demo-neo-${Date.now()}`,
        command: 'neofetch',
      });
      setTraceState((prev) => ({
        ...prev,
        steps: prev.steps.map((s, i) =>
          i === 1 ? { ...s, status: 'done' } : i === 2 ? { ...s, status: 'running' } : s
        ),
      }));
    }, 4800);

    // Step 3 (8.0s -> 10.5s): Showcase Light -> Dark glass theme switch
    const t4 = window.setTimeout(() => {
      setTheme('light');
    }, 8000);

    const t5 = window.setTimeout(() => {
      setTheme('dark');
      setTraceState((prev) => ({
        ...prev,
        steps: prev.steps.map((s, i) =>
          i === 2 ? { ...s, status: 'done' } : i === 3 ? { ...s, status: 'running' } : s
        ),
      }));
    }, 10500);

    // Step 4 (12.2s -> 14.5s): Open Safari Portfolio & finish
    const t6 = window.setTimeout(() => {
      openApp('safari');
      setTraceState((prev) => ({
        ...prev,
        steps: prev.steps.map((s) => ({ ...s, status: 'done' })),
      }));
      setDemoTourRunning(false);
    }, 12500);

    demoTimersRef.current.push(t1, t2, t3, t4, t5, t6);
  }, [clearDemoTimers, clearOrchestrationTimers, handleCreateNote, openApp]);

  const activeWallpaper = useMemo(
    () => WALLPAPERS.find((w) => w.id === wallpaper) ?? WALLPAPERS[0],
    [wallpaper]
  );

  const activeAppTitle = focusedAppId ? APP_META[focusedAppId].title : 'Finder';

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest('[data-window-id]')) return;
        e.preventDefault();
        setContextMenu({
          x: Math.min(e.clientX, window.innerWidth - 200),
          y: Math.max(32, Math.min(e.clientY, window.innerHeight - 170)),
        });
      }}
    >
      {/* Dynamic Wallpaper Layer */}
      <div
        className="fixed inset-0 z-0 transition-all duration-500"
        style={{ background: activeWallpaper.fallbackGradient }}
      >
        <img
          src={activeWallpaper.imageUrl}
          alt={activeWallpaper.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-opacity duration-500"
        />
      </div>

      {/* Display Brightness Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[9900] bg-black transition-opacity duration-150"
        style={{ opacity: Math.max(0, (100 - brightness) / 115) }}
        aria-hidden="true"
      />

      {/* Top Menu Bar */}
      <MenuBar
        activeAppTitle={activeAppTitle}
        activeAppId={focusedAppId}
        theme={theme}
        wallpaper={wallpaper}
        brightness={brightness}
        wifiEnabled={wifiEnabled}
        bluetoothEnabled={bluetoothEnabled}
        highContrast={highContrast}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onSelectWallpaper={setWallpaper}
        onChangeBrightness={setBrightness}
        onToggleWifi={() => setWifiEnabled((w) => !w)}
        onToggleBluetooth={() => setBluetoothEnabled((b) => !b)}
        onToggleHighContrast={() => setHighContrast((h) => !h)}
        onOpenSpotlight={() => setSpotlightOpen(true)}
        onOpenVoiceOrb={() => setVoiceOrbOpen(true)}
        onStartDemoTour={startJudgeDemoTour}
        onOpenApp={openApp}
        onOpenAbout={() => setAboutOpen(true)}
        onLockScreen={() => setIsLocked(true)}
        onResetWindows={resetWindows}
        onMenuAction={handleMenuAction}
      />

      {/* Desktop Shortcuts (Top-Right macOS Cluster) */}
      <div className="fixed top-12 right-5 z-[1] flex flex-col items-end gap-4">
        <button
          type="button"
          onDoubleClick={() => openApp('finder')}
          className="group flex w-20 flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <HardDrive className="h-9 w-9 text-slate-100 drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]" />
          <span className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] group-hover:bg-sky-600/80">
            Macintosh HD
          </span>
        </button>

        <button
          type="button"
          onDoubleClick={() => openApp('safari')}
          className="group flex w-20 flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <Compass className="h-9 w-9 text-sky-300 drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]" />
          <span className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] group-hover:bg-sky-600/80">
            Portfolio
          </span>
        </button>

        <button
          type="button"
          onDoubleClick={() => openApp('notes')}
          className="group flex w-20 flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <FileText className="h-9 w-9 text-amber-200 drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]" />
          <span className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] group-hover:bg-sky-600/80">
            Notes
          </span>
        </button>

        <button
          type="button"
          onDoubleClick={() => openApp('terminal')}
          className="group flex w-20 flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <Folder className="h-9 w-9 fill-sky-400 text-sky-200 drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]" />
          <span className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] group-hover:bg-sky-600/80">
            Projects
          </span>
        </button>
      </div>

      {/* Desktop Judge Demo Tour Widget (Bottom-Left) */}
      <aside className="fixed bottom-24 left-5 z-[5] w-64 rounded-2xl border border-white/20 bg-white/75 dark:bg-slate-900/75 p-3.5 shadow-xl macos-glass text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>DevFest Pakistan 2026</span>
          </span>
          <button
            type="button"
            onClick={() => openApp('safari')}
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:underline"
          >
            Portfolio
          </button>
        </div>
        <p className="mt-1 text-xs leading-snug text-slate-700 dark:text-slate-300">
          Preview Agentic Spotlight, Dark/Light glass, Terminal neofetch, and Portfolio in one tour.
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          {!demoTourRunning ? (
            <button
              type="button"
              onClick={startJudgeDemoTour}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-500"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Start 15s Judge Demo Tour</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopJudgeDemoTour}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop Demo Tour</span>
            </button>
          )}
        </div>
      </aside>

      {/* Desktop Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed z-[9200] min-w-[190px] rounded-xl border border-black/12 dark:border-white/15 bg-white/88 dark:bg-slate-900/90 p-1 shadow-xl macos-glass-heavy text-[13px] text-slate-900 dark:text-slate-100"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              handleCreateFSNode('~/Desktop', `Untitled Folder ${Math.floor(Math.random() * 90 + 10)}`, 'folder');
              openApp('finder');
              setContextMenu(null);
            }}
            className="flex w-full rounded-md px-2.5 py-1.5 text-left hover:bg-sky-600 hover:text-white"
          >
            New Folder
          </button>
          <button
            type="button"
            onClick={() => {
              openApp('safari');
              setContextMenu(null);
            }}
            className="flex w-full rounded-md px-2.5 py-1.5 text-left hover:bg-sky-600 hover:text-white"
          >
            Open Safari Portfolio
          </button>
          <button
            type="button"
            onClick={() => {
              openApp('settings');
              setContextMenu(null);
            }}
            className="flex w-full rounded-md px-2.5 py-1.5 text-left hover:bg-sky-600 hover:text-white"
          >
            Change Wallpaper...
          </button>
          <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
          <button
            type="button"
            onClick={() => {
              setSpotlightOpen(true);
              setContextMenu(null);
            }}
            className="flex w-full rounded-md px-2.5 py-1.5 text-left hover:bg-sky-600 hover:text-white"
          >
            Open Gemini Spotlight
          </button>
          <button
            type="button"
            onClick={() => {
              openApp('terminal');
              setContextMenu(null);
            }}
            className="flex w-full rounded-md px-2.5 py-1.5 text-left hover:bg-sky-600 hover:text-white"
          >
            Open Terminal
          </button>
        </div>
      )}

      {/* Window Workspace */}
      <main className="relative h-full w-full">
        <AnimatePresence>
          {windows.finder.isOpen && !windows.finder.isMinimized && (
            <WindowFrame
              key="finder"
              win={windows.finder}
              isFocused={focusedAppId === 'finder'}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onToggleMaximize={toggleMaximizeWindow}
              onUpdateBounds={updateWindowBounds}
            >
              <FinderApp
                fsRoot={fsRoot}
                viewMode={finderViewMode}
                onChangeViewMode={setFinderViewMode}
                onOpenNoteFromFile={(title, content) => handleCreateNote(title, content)}
                onSelectWallpaper={setWallpaper}
              />
            </WindowFrame>
          )}

          {windows.safari.isOpen && !windows.safari.isMinimized && (
            <WindowFrame
              key="safari"
              win={windows.safari}
              isFocused={focusedAppId === 'safari'}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onToggleMaximize={toggleMaximizeWindow}
              onUpdateBounds={updateWindowBounds}
            >
              <SafariPortfolioApp
                onOpenApp={openApp}
                onOpenSpotlight={() => setSpotlightOpen(true)}
                onStartDemoTour={startJudgeDemoTour}
              />
            </WindowFrame>
          )}

          {windows.terminal.isOpen && !windows.terminal.isMinimized && (
            <WindowFrame
              key="terminal"
              win={windows.terminal}
              isFocused={focusedAppId === 'terminal'}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onToggleMaximize={toggleMaximizeWindow}
              onUpdateBounds={updateWindowBounds}
            >
              <TerminalApp
                fsRoot={fsRoot}
                onCreateFileOrFolder={handleCreateFSNode}
                clearTrigger={terminalClearTrigger}
                externalCommand={terminalExtCmd}
              />
            </WindowFrame>
          )}

          {windows.notes.isOpen && !windows.notes.isMinimized && (
            <WindowFrame
              key="notes"
              win={windows.notes}
              isFocused={focusedAppId === 'notes'}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onToggleMaximize={toggleMaximizeWindow}
              onUpdateBounds={updateWindowBounds}
            >
              <NotesApp
                notes={notes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onUpdateNote={handleUpdateNote}
                onCreateNote={() => handleCreateNote()}
                onDeleteNote={handleDeleteNote}
                summarizeTrigger={notesSummarizeTrigger}
              />
            </WindowFrame>
          )}

          {windows.calculator.isOpen && !windows.calculator.isMinimized && (
            <WindowFrame
              key="calculator"
              win={windows.calculator}
              isFocused={focusedAppId === 'calculator'}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onToggleMaximize={toggleMaximizeWindow}
              onUpdateBounds={updateWindowBounds}
            >
              <CalculatorApp isFocused={focusedAppId === 'calculator'} />
            </WindowFrame>
          )}

          {windows.settings.isOpen && !windows.settings.isMinimized && (
            <WindowFrame
              key="settings"
              win={windows.settings}
              isFocused={focusedAppId === 'settings'}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onToggleMaximize={toggleMaximizeWindow}
              onUpdateBounds={updateWindowBounds}
            >
              <SettingsApp
                theme={theme}
                wallpaper={wallpaper}
                brightness={brightness}
                onSetTheme={setTheme}
                onSelectWallpaper={setWallpaper}
                onChangeBrightness={setBrightness}
              />
            </WindowFrame>
          )}
        </AnimatePresence>
      </main>

      {/* Magnification Dock */}
      <Dock
        windows={windows}
        onLaunchApp={openApp}
        onOpenSpotlight={() => setSpotlightOpen(true)}
      />

      {/* Agentic Action Trace HUD */}
      <AgenticTraceToast
        title={traceState.title}
        steps={traceState.steps}
        visible={traceState.visible}
        onDismiss={() => setTraceState((prev) => ({ ...prev, visible: false }))}
      />

      {/* Voice Control Orb */}
      <VoiceOrbModal
        isOpen={voiceOrbOpen}
        onClose={() => setVoiceOrbOpen(false)}
        onExecuteVoiceCommand={handleVoiceCommand}
      />

      {/* Gemini Spotlight Modal */}
      <SpotlightModal
        isOpen={spotlightOpen}
        fsRoot={fsRoot}
        onClose={() => setSpotlightOpen(false)}
        onOpenApp={openApp}
        onRunAgenticActions={runAgenticActions}
      />

      {/* About This Mac Modal */}
      <AnimatePresence>
        {aboutOpen && (
          <div
            className="fixed inset-0 z-[9400] flex items-center justify-center bg-black/25 px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setAboutOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-72 rounded-2xl border border-black/15 dark:border-white/18 bg-white/90 dark:bg-slate-900/92 p-5 text-center shadow-2xl macos-glass-heavy text-slate-900 dark:text-slate-100"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
                <HardDrive className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold">Sequoia Web OS</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                macOS Sequoia 15.2 Experience
              </p>
              <div className="mt-4 space-y-1.5 border-t border-black/8 dark:border-white/10 pt-3 text-left text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Chip</span>
                  <span className="font-medium">Apple M4 Max</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Assistant</span>
                  <span className="font-medium">Gemini 4 Hydrogen</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Runtime</span>
                  <span className="font-mono text-[11px]">Cloud Run · 8080</span>
                </div>
              </div>
              <CreatorLinks compact />
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                className="mt-4 w-full rounded-lg bg-sky-600 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lock Screen Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLocked(false)}
            className="fixed inset-0 z-[9800] flex cursor-pointer flex-col items-center justify-between bg-slate-950/65 py-16 text-white macos-glass-heavy"
          >
            <div className="text-center">
              <div className="text-sm font-medium text-white/80">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="mt-1 text-6xl font-bold tracking-tight tabular-nums">
                {new Date().toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-sky-500 to-indigo-600 text-lg font-bold shadow-lg">
                AA
              </div>
              <div className="text-sm font-semibold">Ali Abid</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                <Lock className="h-3.5 w-3.5" />
                <span>Click anywhere or press Enter to unlock</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import type { AgenticAction, AppId, WallpaperId } from '../types/os';

export interface FallbackResult {
  answer: string;
  actions: AgenticAction[];
  usedFallback: boolean;
}

const APP_KEYWORDS: Array<{ id: AppId; label: string; patterns: RegExp[] }> = [
  { id: 'finder', label: 'Open Finder', patterns: [/\bfinder\b/i, /\bfiles?\b/i] },
  {
    id: 'safari',
    label: 'Open Safari Portfolio',
    patterns: [/\bsafari\b/i, /\bportfolio\b/i, /\bprojects?\b/i, /\bbrowser\b/i],
  },
  { id: 'terminal', label: 'Open Terminal', patterns: [/\bterminal\b/i, /\bshell\b/i, /\bzsh\b/i] },
  { id: 'notes', label: 'Open Notes', patterns: [/\bnotes?\b/i] },
  { id: 'calculator', label: 'Open Calculator', patterns: [/\bcalc(ulator)?\b/i] },
  { id: 'settings', label: 'Open System Settings', patterns: [/\bsettings?\b/i, /\bpreferences?\b/i] },
];

export function parseFallbackAgenticIntent(rawQuery: string): FallbackResult {
  const q = rawQuery.trim();
  const lower = q.toLowerCase();
  const actions: AgenticAction[] = [];

  // 1. Note creation / pitch generation
  if (/\b(write|create|draft|make)\b.*\b(note|pitch|memo|summary|plan)\b/i.test(lower) || /\bin notes\b/i.test(lower)) {
    const isPitch = /\bpitch|hackathon|devfest\b/i.test(lower);
    actions.push({
      type: 'create_note',
      title: isPitch ? 'DevFest Pakistan 2026 — Pitch' : 'Spotlight Agentic Note',
      body: isPitch
        ? [
            'Sequoia Web OS — DevFest Pakistan 2026',
            '',
            'Problem: Static browser demos lack genuine OS orchestration, accessibility, and agent safety.',
            'Solution: An agentic macOS Sequoia desktop powered by Gemini 4 Hydrogen on Google Cloud Run.',
            '',
            'Highlights:',
            '- Multi-step Spotlight orchestration across Notes, Terminal, Finder, and Safari',
            '- Web Speech API Voice Orb & High Contrast accessibility mode',
            '- Deterministic Agent Sandbox guardrail isolating destructive shell commands',
          ].join('\n')
        : `Drafted via Sequoia Agentic Spotlight:\n\nPrompt: "${q}"\n\nNext steps:\n- Review action items\n- Execute supporting commands in Terminal`,
      label: isPitch ? 'Create DevFest Pitch in Notes' : 'Create Note in Notes',
    });
  }

  // 2. Terminal command detection
  if (/\bsystem status\b|\bneofetch\b|\bcheck status\b|\bspecs\b/i.test(lower)) {
    actions.push({
      type: 'open_app',
      target: 'terminal',
      label: 'Open Terminal',
    });
    actions.push({
      type: 'run_terminal_cmd',
      command: 'neofetch',
      label: 'Run neofetch in Terminal',
    });
  } else if (/\brun\s+([a-z0-9._\-\s/]+)$/i.test(lower)) {
    const match = q.match(/\brun\s+(.+)$/i);
    if (match?.[1]) {
      actions.push({
        type: 'open_app',
        target: 'terminal',
        label: 'Open Terminal',
      });
      actions.push({
        type: 'run_terminal_cmd',
        command: match[1].trim(),
        label: `Run "${match[1].trim()}" in Terminal`,
      });
    }
  }

  // 3. Theme switching
  if (/\bdark\s*(mode|theme|glass)?\b/i.test(lower)) {
    actions.push({
      type: 'set_theme',
      target: 'dark',
      label: 'Switch to Dark Mode',
    });
  } else if (/\blight\s*(mode|theme|glass)?\b/i.test(lower)) {
    actions.push({
      type: 'set_theme',
      target: 'light',
      label: 'Switch to Light Mode',
    });
  }

  // 4. Wallpaper switching
  const wpMap: Array<{ id: WallpaperId; name: string }> = [
    { id: 'sequoia', name: 'Sequoia Sunrise' },
    { id: 'sonoma', name: 'Sonoma Horizon' },
    { id: 'sierra', name: 'Sierra Peaks' },
    { id: 'silk', name: 'Abstract Silk' },
  ];
  for (const wp of wpMap) {
    if (lower.includes(wp.id)) {
      actions.push({
        type: 'set_wallpaper',
        target: wp.id,
        label: `Set Wallpaper to ${wp.name}`,
      });
    }
  }

  // 5. App launching (avoid duplicate open_app if already queued)
  for (const app of APP_KEYWORDS) {
    if (app.patterns.some((p) => p.test(lower))) {
      const alreadyHas = actions.some((a) => a.type === 'open_app' && a.target === app.id);
      const alreadyCreatedNote = app.id === 'notes' && actions.some((a) => a.type === 'create_note');
      if (!alreadyHas && !alreadyCreatedNote) {
        actions.push({
          type: 'open_app',
          target: app.id,
          label: app.label,
        });
      }
    }
  }

  if (actions.length > 0) {
    return {
      answer: `Orchestrating ${actions.length} desktop ${actions.length === 1 ? 'action' : 'actions'} for "${q}".`,
      actions,
      usedFallback: true,
    };
  }

  return {
    answer:
      'Spotlight Agentic mode is ready. Try commands like "Write a hackathon pitch in Notes and check system status in Terminal", "Open Safari Portfolio", or "Switch to Dark Mode".',
    actions: [],
    usedFallback: true,
  };
}

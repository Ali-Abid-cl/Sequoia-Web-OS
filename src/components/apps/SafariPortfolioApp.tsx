import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Layers,
  Play,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type { AppId } from '../../types/os';
import { CreatorLinks } from '../CreatorLinks';

interface SafariPortfolioAppProps {
  onOpenApp: (id: AppId) => void;
  onOpenSpotlight: () => void;
  onStartDemoTour: () => void;
}

type CategoryFilter = 'all' | 'agentic' | 'vision' | 'web';

interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<CategoryFilter, 'all'>;
  summary: string;
  highlights: string[];
  stack: string;
  liveUrl?: string;
  appAction?: { label: string; appId: AppId };
}

const PROJECTS: ProjectItem[] = [
  {
    id: 'sequoia-web-os',
    title: 'Sequoia Web OS',
    subtitle: 'Agentic Cloud Run Desktop',
    category: 'agentic',
    summary:
      'Interactive macOS Sonoma/Sequoia desktop workspace powered by Gemini 4 Hydrogen multi-step OS orchestration, Web Speech accessibility, and deterministic Terminal sandbox protection.',
    highlights: [
      'Multi-step Spotlight orchestration across Notes, Terminal, Finder, and Settings',
      'Framer Motion spring magnification dock & 8-way resizable window compositor',
      'Multi-stage Docker container tuned for Google Cloud Run on PORT 8080',
    ],
    stack: 'React 19 · TypeScript · Tailwind v4 · Express · @google/genai',
    appAction: { label: 'Open Terminal Shell', appId: 'terminal' },
  },
  {
    id: 'history-forge',
    title: 'History Forge',
    subtitle: 'Gemini Multimodal Strategy RPG',
    category: 'agentic',
    summary:
      'Dynamic historical strategy RPG leveraging Gemini multimodal reasoning to generate branching diplomatic treaties, illustrated era briefings, and real-time geopolitical consequences.',
    highlights: [
      'Structured JSON state transitions for faction diplomacy & resource ledgers',
      'Procedural narrative synthesis grounded in authentic historical timelines',
      'Turn-by-turn advisor council with adaptive difficulty balancing',
    ],
    stack: 'Gemini API · Structured Outputs · React · State Machines',
    appAction: { label: 'Inspect Notes Drafts', appId: 'notes' },
  },
  {
    id: 'cv-ml-research',
    title: 'Computer Vision & ML Research',
    subtitle: 'YOLOv8 & Data Science',
    category: 'vision',
    summary:
      'Real-time object detection and visual analytics pipelines built with YOLOv8, PyTorch, and automated feature engineering workflows for high-throughput edge inference.',
    highlights: [
      'Custom-trained YOLOv8 detection models with precision/recall telemetry evaluation',
      'Data augmentation & dataset curation pipelines for domain-specific scenes',
      'Optimized inference latency for real-time video stream inspection',
    ],
    stack: 'YOLOv8 · PyTorch · OpenCV · Python · Pandas',
    appAction: { label: 'Browse Files in Finder', appId: 'finder' },
  },
  {
    id: 'zeejays-platform',
    title: "ZeeJay's Web Platform",
    subtitle: 'nvm-broo.github.io/Zeejays/',
    category: 'web',
    summary:
      'Responsive modern storefront and web experience designed with clean visual hierarchy, interactive menu exploration, and fast static edge delivery.',
    highlights: [
      'Streamlined mobile-first browsing and responsive layout geometry',
      'Optimized asset loading and zero-dependency static deployment',
      'Clean brand presentation tailored for quick customer discovery',
    ],
    stack: 'HTML5 · CSS3 · JavaScript · GitHub Pages',
    liveUrl: 'https://nvm-broo.github.io/Zeejays/',
  },
];

export const SafariPortfolioApp: React.FC<SafariPortfolioAppProps> = ({
  onOpenApp,
  onOpenSpotlight,
  onStartDemoTour,
}) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedId, setSelectedId] = useState<string>(PROJECTS[0].id);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'devfest'>('portfolio');

  const visibleProjects = useMemo(() => {
    if (filter === 'all') return PROJECTS;
    return PROJECTS.filter((p) => p.category === filter);
  }, [filter]);

  const selectedProject =
    visibleProjects.find((p) => p.id === selectedId) ?? visibleProjects[0] ?? PROJECTS[0];

  const addressUrl =
    activeTab === 'portfolio'
      ? `https://aliabid.dev/portfolio/${selectedProject.id}`
      : 'https://devfest.pakistan/2026/sequoia-web-os';

  return (
    <div className="flex h-full w-full flex-col bg-white/75 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100">
      {/* Safari Browser Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-black/8 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/80 px-3.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Back to portfolio"
            onClick={() => setActiveTab('portfolio')}
            className="rounded-md p-1.5 text-slate-600 dark:text-slate-300 hover:bg-black/6 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Forward to DevFest briefing"
            onClick={() => setActiveTab('devfest')}
            className="rounded-md p-1.5 text-slate-600 dark:text-slate-300 hover:bg-black/6 dark:hover:bg-white/10"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Reload page"
            onClick={() => setSelectedId(PROJECTS[0].id)}
            className="rounded-md p-1.5 text-slate-600 dark:text-slate-300 hover:bg-black/6 dark:hover:bg-white/10"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Unified Address Bar */}
        <div className="flex max-w-md flex-1 items-center justify-center gap-2 rounded-lg border border-black/10 dark:border-white/12 bg-white/85 dark:bg-slate-800/85 px-3 py-1 text-xs">
          <Globe className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
          <span className="truncate font-mono text-[11px] text-slate-700 dark:text-slate-200">
            {addressUrl}
          </span>
        </div>

        {/* Primary Demo Action */}
        <button
          type="button"
          onClick={onStartDemoTour}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-500 whitespace-nowrap"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>15s Judge Demo</span>
        </button>
      </div>

      {/* Tab Strip */}
      <div className="flex shrink-0 items-center gap-1 border-b border-black/8 dark:border-white/10 bg-slate-200/45 dark:bg-slate-900/50 px-3 py-1">
        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'portfolio'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Ali Abid Rasheed — Portfolio
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('devfest')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'devfest'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          DevFest Pakistan 2026 Architecture
        </button>
      </div>

      {/* Page Body */}
      <div className="macos-scroll flex-1 overflow-y-auto p-5">
        {activeTab === 'portfolio' ? (
          <div className="mx-auto max-w-4xl space-y-5">
            {/* Hero Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-black/8 dark:border-white/10 pb-4 sm:flex-row sm:items-end">
              <div>
                <div className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  Ali Abid Rasheed · DevFest Pakistan 2026 Submission
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Engineering &amp; AI Portfolio
                </h1>
              </div>

              {/* Filter Segmented Control */}
              <div className="flex items-center gap-1 rounded-lg bg-black/5 dark:bg-white/8 p-1">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'agentic', label: 'Agentic AI' },
                    { id: 'vision', label: 'Vision & ML' },
                    { id: 'web', label: 'Web' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === item.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split View: Project List + Active Project Inspector */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="space-y-2 md:col-span-5">
                {visibleProjects.map((proj) => {
                  const active = selectedProject.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setSelectedId(proj.id)}
                      className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                        active
                          ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/15'
                          : 'border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-black/4 dark:hover:bg-white/8'
                      }`}
                    >
                      <div className="text-sm font-bold">{proj.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {proj.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Project Detail Panel */}
              <div className="flex flex-col justify-between rounded-xl border border-black/8 dark:border-white/10 bg-white/65 dark:bg-white/5 p-5 md:col-span-7">
                <div>
                  <div className="text-xs font-medium text-sky-600 dark:text-sky-400">
                    {selectedProject.subtitle}
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    {selectedProject.title}
                  </h2>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedProject.summary}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-black/8 dark:border-white/10 pt-3">
                    {selectedProject.highlights.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedProject.stack}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/8 dark:border-white/10 pt-4">
                  {selectedProject.liveUrl && (
                    <a
                      href={selectedProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-500"
                    >
                      <span>Visit Live Site</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {selectedProject.appAction && (
                    <button
                      type="button"
                      onClick={() => onOpenApp(selectedProject.appAction!.appId)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 transition-opacity hover:opacity-90"
                    >
                      <span>{selectedProject.appAction.label}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenSpotlight}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 dark:border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/8"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                    <span>Ask Agentic Spotlight</span>
                  </button>
                </div>
              </div>
            </div>

            <CreatorLinks />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="text-xl font-bold tracking-tight">
              DevFest Pakistan 2026 — Agentic OS Architecture
            </h1>
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              Sequoia Web OS demonstrates how Gemini 4 Hydrogen can act as an interactive desktop
              orchestrator across independent productivity apps with voice accessibility and
              deterministic execution guardrails.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3.5">
                <Sparkles className="mb-2 h-4 w-4 text-sky-500" />
                <div className="text-xs font-bold">Multi-Step Orchestration</div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Spotlight decomposes compound prompts into Notes, Terminal, and Theme actions.
                </p>
              </div>
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3.5">
                <Layers className="mb-2 h-4 w-4 text-indigo-500" />
                <div className="text-xs font-bold">Voice &amp; High Contrast</div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Web Speech API voice orb with SpeechSynthesis feedback and high-contrast UI scaling.
                </p>
              </div>
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3.5">
                <ShieldCheck className="mb-2 h-4 w-4 text-emerald-500" />
                <div className="text-xs font-bold">Agent Sandbox Guardrail</div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Intercepts destructive shell patterns like <code className="font-mono">rm -rf</code> before execution.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onStartDemoTour}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start 15s Judge Demo Tour</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenApp('terminal')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 dark:border-white/15 px-3.5 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/8"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Test Sandbox in Terminal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

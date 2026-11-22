import React, { useState } from 'react';
import { Check, Info, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { WALLPAPERS } from '../../data/systemData';
import type { ThemeMode, WallpaperId } from '../../types/os';
import { CreatorLinks } from '../CreatorLinks';

interface SettingsAppProps {
  theme: ThemeMode;
  wallpaper: WallpaperId;
  brightness: number;
  onSetTheme: (theme: ThemeMode) => void;
  onSelectWallpaper: (id: WallpaperId) => void;
  onChangeBrightness: (val: number) => void;
}

type SettingsTab = 'wallpaper' | 'appearance' | 'about';

export const SettingsApp: React.FC<SettingsAppProps> = ({
  theme,
  wallpaper,
  brightness,
  onSetTheme,
  onSelectWallpaper,
  onChangeBrightness,
}) => {
  const [tab, setTab] = useState<SettingsTab>('wallpaper');
  const activeWp = WALLPAPERS.find((w) => w.id === wallpaper) ?? WALLPAPERS[0];

  return (
    <div className="flex h-full w-full text-slate-900 dark:text-slate-100">
      {/* Settings Sidebar */}
      <aside className="w-48 shrink-0 border-r border-black/8 dark:border-white/10 bg-slate-100/60 dark:bg-slate-950/40 p-3">
        <div className="mb-3 flex items-center gap-2.5 px-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">
            AA
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">Ali Abid</div>
            <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              Apple Account
            </div>
          </div>
        </div>

        <nav className="space-y-0.5">
          <button
            type="button"
            onClick={() => setTab('wallpaper')}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              tab === 'wallpaper'
                ? 'bg-sky-500 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Wallpaper</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('appearance')}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              tab === 'appearance'
                ? 'bg-sky-500 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('about')}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              tab === 'about'
                ? 'bg-sky-500 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>About</span>
          </button>
        </nav>
      </aside>

      {/* Settings Detail Pane */}
      <div className="macos-scroll flex-1 overflow-y-auto p-5">
        {tab === 'wallpaper' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold tracking-tight">Wallpaper</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Choose a desktop backdrop for your Sequoia Web OS workspace.
              </p>
            </div>

            {/* Active Wallpaper Preview */}
            <div className="flex items-center gap-4 rounded-xl border border-black/8 dark:border-white/10 bg-white/55 dark:bg-white/5 p-3.5">
              <div
                className="aspect-video w-40 shrink-0 overflow-hidden rounded-lg border border-black/15 dark:border-white/15 shadow-sm"
                style={{ background: activeWp.fallbackGradient }}
              >
                <img
                  src={activeWp.imageUrl}
                  alt={activeWp.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm font-semibold">{activeWp.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activeWp.subtitle}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Resolution: 16:9 Dynamic Desktop
                </div>
              </div>
            </div>

            {/* 4-Wallpaper Gallery */}
            <div className="grid grid-cols-2 gap-3">
              {WALLPAPERS.map((wp) => {
                const selected = wp.id === wallpaper;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => onSelectWallpaper(wp.id)}
                    className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-sky-500 ring-2 ring-sky-500/35'
                        : 'border-black/10 dark:border-white/10 hover:border-sky-400/60'
                    }`}
                  >
                    <div
                      className="relative aspect-video w-full overflow-hidden"
                      style={{ background: wp.fallbackGradient }}
                    >
                      <img
                        src={wp.imageUrl}
                        alt={wp.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {selected && (
                        <span className="absolute right-2 bottom-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white shadow">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="bg-white/75 dark:bg-slate-800/75 px-3 py-2">
                      <div className="text-xs font-semibold">{wp.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {wp.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'appearance' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold tracking-tight">Appearance & Display</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Customize Light and Dark frosted glass themes and screen brightness.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-all ${
                  theme === 'light'
                    ? 'border-sky-500 ring-2 ring-sky-500/30 bg-white/80 dark:bg-white/10'
                    : 'border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5'
                }`}
              >
                <div className="flex h-20 w-full items-center justify-center rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-sky-100">
                  <Sun className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Light Frosted Glass</span>
                  {theme === 'light' && <Check className="h-4 w-4 text-sky-500" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-all ${
                  theme === 'dark'
                    ? 'border-sky-500 ring-2 ring-sky-500/30 bg-white/80 dark:bg-white/10'
                    : 'border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5'
                }`}
              >
                <div className="flex h-20 w-full items-center justify-center rounded-lg border border-slate-700 bg-gradient-to-br from-slate-900 to-indigo-950">
                  <Moon className="h-6 w-6 text-indigo-300" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Dark Frosted Glass</span>
                  {theme === 'dark' && <Check className="h-4 w-4 text-sky-500" />}
                </div>
              </button>
            </div>

            <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white/55 dark:bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span>Display Brightness</span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {brightness}%
                </span>
              </div>
              <input
                type="range"
                aria-label="Settings display brightness"
                min={45}
                max={100}
                value={brightness}
                onChange={(e) => onChangeBrightness(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-sky-500"
              />
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-black/8 dark:border-white/10 bg-white/55 dark:bg-white/5 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
                <Monitor className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-base font-bold">MacBook Studio Web</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  macOS Sequoia 15.2 · Quartz Web Compositor
                </p>
              </div>
            </div>

            <div className="divide-y divide-black/6 dark:divide-white/8 rounded-xl border border-black/8 dark:border-white/10 bg-white/55 dark:bg-white/5 px-4 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Processor</span>
                <span className="font-medium">Apple M4 Max (Browser Runtime)</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400">AI Intelligence</span>
                <span className="font-medium">Gemini 4 Hydrogen (@google/genai)</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Deployment Target</span>
                <span className="font-mono text-[11px]">Google Cloud Run · PORT 8080</span>
              </div>
            </div>

            <CreatorLinks />
          </div>
        )}
      </div>
    </div>
  );
};

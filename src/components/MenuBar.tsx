import React, { useEffect, useRef, useState } from 'react';
import {
  Bluetooth,
  Check,
  Eye,
  Mic,
  Monitor,
  Moon,
  Play,
  Search,
  SlidersHorizontal,
  Sun,
  Wifi,
} from 'lucide-react';
import { WALLPAPERS } from '../data/systemData';
import type { AppId, ThemeMode, WallpaperId } from '../types/os';

interface MenuBarProps {
  activeAppTitle: string;
  activeAppId: AppId | null;
  theme: ThemeMode;
  wallpaper: WallpaperId;
  brightness: number;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  highContrast: boolean;
  onToggleTheme: () => void;
  onSelectWallpaper: (id: WallpaperId) => void;
  onChangeBrightness: (val: number) => void;
  onToggleWifi: () => void;
  onToggleBluetooth: () => void;
  onToggleHighContrast: () => void;
  onOpenSpotlight: () => void;
  onOpenVoiceOrb: () => void;
  onStartDemoTour: () => void;
  onOpenApp: (id: AppId) => void;
  onOpenAbout: () => void;
  onLockScreen: () => void;
  onResetWindows: () => void;
  onMenuAction: (action: string) => void;
}

type OpenDropdown = 'apple' | 'file' | 'edit' | 'view' | 'window' | 'control' | null;

export const MenuBar: React.FC<MenuBarProps> = ({
  activeAppTitle,
  activeAppId,
  theme,
  wallpaper,
  brightness,
  wifiEnabled,
  bluetoothEnabled,
  highContrast,
  onToggleTheme,
  onSelectWallpaper,
  onChangeBrightness,
  onToggleWifi,
  onToggleBluetooth,
  onToggleHighContrast,
  onOpenSpotlight,
  onOpenVoiceOrb,
  onStartDemoTour,
  onOpenApp,
  onOpenAbout,
  onLockScreen,
  onResetWindows,
  onMenuAction,
}) => {
  const [openMenu, setOpenMenu] = useState<OpenDropdown>(null);
  const [now, setNow] = useState(() => new Date());
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const formattedClock = now.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const toggleMenu = (name: OpenDropdown) => {
    setOpenMenu((prev) => (prev === name ? null : name));
  };

  const runItem = (fn: () => void) => {
    fn();
    setOpenMenu(null);
  };

  const menuBtnClass = (name: OpenDropdown) =>
    `px-2.5 py-0.5 rounded text-[13px] transition-colors whitespace-nowrap shrink-0 ${
      openMenu === name
        ? 'bg-black/12 dark:bg-white/20 text-slate-950 dark:text-white'
        : 'text-slate-900 dark:text-white/95 hover:bg-black/8 dark:hover:bg-white/12'
    }`;

  const dropdownPanelClass =
    'absolute top-[29px] min-w-[210px] rounded-lg border border-black/12 dark:border-white/15 bg-white/88 dark:bg-slate-900/90 p-1 shadow-[0_14px_34px_rgba(0,0,0,0.28)] macos-glass-heavy text-[13px] text-slate-800 dark:text-slate-100 z-[9100]';

  const dropdownItemClass =
    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-sky-600 hover:text-white';

  return (
    <header
      ref={barRef}
      className="fixed inset-x-0 top-0 z-[9000] flex h-7 items-center justify-between border-b border-black/8 dark:border-white/10 bg-white/55 dark:bg-slate-950/55 px-3 macos-glass select-none"
    >
      {/* Left Cluster: Apple Logo, Active App, File/Edit/View/Window */}
      <div className="flex items-center gap-0.5">
        <div className="relative">
          <button
            type="button"
            aria-label="Apple menu"
            onClick={() => toggleMenu('apple')}
            className={`${menuBtnClass('apple')} flex items-center justify-center px-2`}
          >
            <svg viewBox="0 0 18 22" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M14.7 11.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.1 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3-.8 1.4 0 1.8.8 3 .7 1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.3-.9-2.3-3.4zm-2.3-6.8c.6-.8 1.1-1.9.9-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2.1-.5 2.7-1.3z" />
            </svg>
          </button>
          {openMenu === 'apple' && (
            <div className={`${dropdownPanelClass} left-0`}>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onOpenAbout)}>
                <span>About This Mac</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onStartDemoTour)}>
                <span className="flex items-center gap-1.5 font-medium text-sky-600 dark:text-sky-400">
                  <Play className="h-3 w-3 fill-current" />
                  Start 15s Judge Demo Tour
                </span>
              </button>
              <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onOpenApp('settings'))}>
                <span>System Settings...</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onToggleTheme)}>
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </button>
              <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onLockScreen)}>
                <span>Lock Screen</span>
                <span className="text-[11px] opacity-65">⌃⌘Q</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onResetWindows)}>
                <span>Reset Desktop Windows</span>
              </button>
            </div>
          )}
        </div>

        <span className="px-2.5 text-[13px] font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0">
          {activeAppTitle}
        </span>

        <div className="relative">
          <button type="button" onClick={() => toggleMenu('file')} className={menuBtnClass('file')}>
            File
          </button>
          {openMenu === 'file' && (
            <div className={`${dropdownPanelClass} left-0`}>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onOpenApp('finder'))}>
                <span>New Finder Window</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onOpenApp('safari'))}>
                <span>Open Safari Portfolio</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onMenuAction('new_note'))}>
                <span>New Note</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onOpenApp('terminal'))}>
                <span>New Terminal Shell</span>
              </button>
              <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
              <button
                type="button"
                disabled={!activeAppId}
                className={`${dropdownItemClass} disabled:opacity-40`}
                onClick={() => runItem(() => onMenuAction('close_active'))}
              >
                <span>Close Active Window</span>
                <span className="text-[11px] opacity-65">⌘W</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleMenu('edit')} className={menuBtnClass('edit')}>
            Edit
          </button>
          {openMenu === 'edit' && (
            <div className={`${dropdownPanelClass} left-0`}>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onOpenSpotlight)}>
                <span>Open Spotlight Search</span>
                <span className="text-[11px] opacity-65">⌘K</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onMenuAction('clear_terminal'))}>
                <span>Clear Terminal Buffer</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleMenu('view')} className={menuBtnClass('view')}>
            View
          </button>
          {openMenu === 'view' && (
            <div className={`${dropdownPanelClass} left-0`}>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onMenuAction('finder_grid'))}>
                <span>Finder: As Icons</span>
              </button>
              <button type="button" className={dropdownItemClass} onClick={() => runItem(() => onMenuAction('finder_list'))}>
                <span>Finder: As List</span>
              </button>
              <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onToggleTheme)}>
                <span>Appearance: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative hidden sm:block">
          <button type="button" onClick={() => toggleMenu('window')} className={menuBtnClass('window')}>
            Window
          </button>
          {openMenu === 'window' && (
            <div className={`${dropdownPanelClass} left-0`}>
              <button
                type="button"
                disabled={!activeAppId}
                className={`${dropdownItemClass} disabled:opacity-40`}
                onClick={() => runItem(() => onMenuAction('minimize_active'))}
              >
                <span>Minimize</span>
              </button>
              <button
                type="button"
                disabled={!activeAppId}
                className={`${dropdownItemClass} disabled:opacity-40`}
                onClick={() => runItem(() => onMenuAction('zoom_active'))}
              >
                <span>Zoom / Maximize</span>
              </button>
              <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
              <button type="button" className={dropdownItemClass} onClick={() => runItem(onResetWindows)}>
                <span>Cascade Open Windows</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Cluster: Wi-Fi, Spotlight, Control Center, Clock */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Toggle Wi-Fi status"
          onClick={onToggleWifi}
          title={wifiEnabled ? 'Wi-Fi: Connected' : 'Wi-Fi: Off'}
          className="hidden sm:flex h-5 w-6 items-center justify-center rounded hover:bg-black/8 dark:hover:bg-white/12 text-slate-900 dark:text-white"
        >
          <Wifi className={`h-3.5 w-3.5 ${wifiEnabled ? 'opacity-95' : 'opacity-35'}`} />
        </button>

        <button
          type="button"
          aria-label="Open Voice Control Orb"
          onClick={onOpenVoiceOrb}
          title="Siri / Voice Control"
          className="flex h-5 items-center justify-center rounded px-1.5 hover:bg-black/8 dark:hover:bg-white/12 text-slate-900 dark:text-white"
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-teal-400 text-white">
            <Mic className="h-2.5 w-2.5" />
          </span>
        </button>

        <button
          type="button"
          aria-label="Open Gemini Spotlight"
          onClick={onOpenSpotlight}
          title="Spotlight Search (Cmd/Ctrl + K)"
          className="flex h-5 items-center gap-1 rounded px-1.5 hover:bg-black/8 dark:hover:bg-white/12 text-slate-900 dark:text-white"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Open Control Center"
            onClick={() => toggleMenu('control')}
            className={`flex h-5 w-7 items-center justify-center rounded transition-colors ${
              openMenu === 'control'
                ? 'bg-black/15 dark:bg-white/25'
                : 'hover:bg-black/8 dark:hover:bg-white/12'
            } text-slate-900 dark:text-white`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>

          {openMenu === 'control' && (
            <div className="absolute right-0 top-[29px] w-[308px] rounded-2xl border border-black/12 dark:border-white/15 bg-white/85 dark:bg-slate-900/88 p-3 shadow-[0_22px_50px_rgba(0,0,0,0.34)] macos-glass-heavy text-slate-900 dark:text-slate-100 z-[9100]">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Connectivity Panel */}
                <div className="flex flex-col gap-2 rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/6 p-2.5">
                  <button
                    type="button"
                    onClick={onToggleWifi}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                        wifiEnabled
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Wifi className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-tight">Wi-Fi</div>
                      <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {wifiEnabled ? 'Studio-5G' : 'Off'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleBluetooth}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                        bluetoothEnabled
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Bluetooth className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-tight">Bluetooth</div>
                      <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {bluetoothEnabled ? 'On' : 'Off'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Appearance Switcher */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex flex-col justify-between rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/6 p-2.5 text-left transition-colors hover:bg-white/80 dark:hover:bg-white/10"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      theme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <div className="text-xs font-semibold">Appearance</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {theme === 'dark' ? 'Dark Glass' : 'Light Glass'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Display Brightness Slider */}
              <div className="mt-2.5 rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/6 p-2.5">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    Display Brightness
                  </span>
                  <span className="tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                    {brightness}%
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Display Brightness"
                  min={45}
                  max={100}
                  value={brightness}
                  onChange={(e) => onChangeBrightness(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-sky-500"
                />
              </div>

              {/* Accessibility: High Contrast & Larger UI Toggle */}
              <button
                type="button"
                aria-pressed={highContrast}
                onClick={onToggleHighContrast}
                className="mt-2.5 flex w-full items-center justify-between rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/6 p-2.5 text-left transition-colors hover:bg-white/80 dark:hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      highContrast
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">High Contrast / Larger UI</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {highContrast ? 'Enabled' : 'Standard'}
                    </span>
                  </span>
                </span>
              </button>

              {/* Wallpaper Switcher Strip */}
              <div className="mt-2.5 rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/6 p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold">Wallpaper</span>
                  <button
                    type="button"
                    onClick={() => runItem(() => onOpenApp('settings'))}
                    className="text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    All Settings
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {WALLPAPERS.map((wp) => {
                    const active = wp.id === wallpaper;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        title={wp.name}
                        onClick={() => onSelectWallpaper(wp.id)}
                        className={`relative aspect-video overflow-hidden rounded-md border transition-transform hover:scale-105 ${
                          active
                            ? 'border-sky-500 ring-2 ring-sky-500/40'
                            : 'border-black/15 dark:border-white/15'
                        }`}
                        style={{ background: wp.fallbackGradient }}
                      >
                        <img
                          src={wp.imageUrl}
                          alt={wp.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                        {active && (
                          <span className="absolute right-0.5 bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 text-white">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-2 text-[13px] font-medium tabular-nums text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          {formattedClock}
        </div>
      </div>
    </header>
  );
};

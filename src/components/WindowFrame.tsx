import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { AppId, WindowState } from '../types/os';

interface WindowFrameProps {
  win: WindowState;
  isFocused: boolean;
  onFocus: (id: AppId) => void;
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  onToggleMaximize: (id: AppId) => void;
  onUpdateBounds: (id: AppId, patch: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => void;
  children: React.ReactNode;
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MENU_BAR_HEIGHT = 28;
const DOCK_CLEARANCE = 76;

export const WindowFrame: React.FC<WindowFrameProps> = ({
  win,
  isFocused,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onUpdateBounds,
  children,
}) => {
  const [trafficHover, setTrafficHover] = useState(false);
  const interactionRef = useRef<{
    mode: 'drag' | 'resize';
    dir?: ResizeDir;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  if (!win.isOpen || win.isMinimized) {
    return null;
  }

  const handleTitleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus(win.id);
    if (win.isMaximized) return;

    e.preventDefault();
    interactionRef.current = {
      mode: 'drag',
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
    };

    const onMove = (ev: PointerEvent) => {
      const state = interactionRef.current;
      if (!state) return;
      const dx = ev.clientX - state.startX;
      const dy = ev.clientY - state.startY;
      const maxX = Math.max(0, window.innerWidth - 120);
      const maxY = Math.max(MENU_BAR_HEIGHT, window.innerHeight - 90);
      const nextX = Math.max(-state.origW + 120, Math.min(maxX, state.origX + dx));
      const nextY = Math.max(MENU_BAR_HEIGHT, Math.min(maxY, state.origY + dy));
      onUpdateBounds(win.id, { x: nextX, y: nextY });
    };

    const onUp = () => {
      interactionRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizePointerDown = (dir: ResizeDir) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (win.isMaximized) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus(win.id);

    interactionRef.current = {
      mode: 'resize',
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
    };

    const onMove = (ev: PointerEvent) => {
      const state = interactionRef.current;
      if (!state || !state.dir) return;
      const dx = ev.clientX - state.startX;
      const dy = ev.clientY - state.startY;

      let nextX = state.origX;
      let nextY = state.origY;
      let nextW = state.origW;
      let nextH = state.origH;

      if (state.dir.includes('e')) {
        nextW = Math.max(win.minWidth, Math.min(window.innerWidth - state.origX, state.origW + dx));
      }
      if (state.dir.includes('s')) {
        nextH = Math.max(
          win.minHeight,
          Math.min(window.innerHeight - state.origY - 12, state.origH + dy)
        );
      }
      if (state.dir.includes('w')) {
        const proposedW = state.origW - dx;
        if (proposedW >= win.minWidth) {
          nextW = proposedW;
          nextX = state.origX + dx;
        } else {
          nextW = win.minWidth;
          nextX = state.origX + (state.origW - win.minWidth);
        }
      }
      if (state.dir.includes('n')) {
        const proposedY = Math.max(MENU_BAR_HEIGHT, state.origY + dy);
        const appliedDy = proposedY - state.origY;
        const proposedH = state.origH - appliedDy;
        if (proposedH >= win.minHeight) {
          nextH = proposedH;
          nextY = proposedY;
        } else {
          nextH = win.minHeight;
          nextY = state.origY + (state.origH - win.minHeight);
        }
      }

      onUpdateBounds(win.id, { x: nextX, y: nextY, width: nextW, height: nextH });
    };

    const onUp = () => {
      interactionRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const frameStyle: React.CSSProperties = win.isMaximized
    ? {
        left: 8,
        top: MENU_BAR_HEIGHT + 6,
        width: 'calc(100vw - 16px)',
        height: `calc(100vh - ${MENU_BAR_HEIGHT + DOCK_CLEARANCE + 10}px)`,
        zIndex: win.zIndex,
      }
    : {
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      };

  return (
    <motion.section
      aria-label={`${win.title} window`}
      data-window-id={win.id}
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={frameStyle}
      onPointerDown={() => onFocus(win.id)}
      className={`fixed flex flex-col overflow-hidden rounded-xl border transition-shadow duration-150 ${
        isFocused
          ? 'border-black/15 dark:border-white/18 shadow-[0_24px_60px_rgba(0,0,0,0.34)]'
          : 'border-black/10 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.20)]'
      } bg-white/85 dark:bg-slate-900/86 macos-glass-heavy text-slate-900 dark:text-slate-100`}
    >
      {/* Titlebar */}
      <div
        data-window-titlebar={win.id}
        onPointerDown={handleTitleBarPointerDown}
        onDoubleClick={() => onToggleMaximize(win.id)}
        className={`relative flex h-9 shrink-0 items-center justify-between border-b px-3.5 select-none cursor-grab active:cursor-grabbing ${
          isFocused
            ? 'border-black/8 dark:border-white/10 bg-white/60 dark:bg-slate-800/65'
            : 'border-black/5 dark:border-white/5 bg-slate-100/50 dark:bg-slate-900/50'
        }`}
      >
        {/* Traffic lights */}
        <div
          className="flex items-center gap-2 z-10"
          onMouseEnter={() => setTrafficHover(true)}
          onMouseLeave={() => setTrafficHover(false)}
        >
          <button
            type="button"
            aria-label={`Close ${win.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose(win.id);
            }}
            className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${
              isFocused || trafficHover
                ? 'border-[#e0443e] bg-[#FF5F57] text-[#4d0000]'
                : 'border-black/10 dark:border-white/10 bg-slate-300 dark:bg-slate-600 text-transparent'
            }`}
          >
            {trafficHover && (
              <svg viewBox="0 0 8 8" className="h-2 w-2" aria-hidden="true">
                <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <button
            type="button"
            aria-label={`Minimize ${win.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(win.id);
            }}
            className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${
              isFocused || trafficHover
                ? 'border-[#d89e24] bg-[#FEBC2E] text-[#6b4600]'
                : 'border-black/10 dark:border-white/10 bg-slate-300 dark:bg-slate-600 text-transparent'
            }`}
          >
            {trafficHover && (
              <svg viewBox="0 0 8 8" className="h-2 w-2" aria-hidden="true">
                <path d="M1.5 4H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <button
            type="button"
            aria-label={`Maximize ${win.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize(win.id);
            }}
            className={`flex h-3 w-3 items-center justify-center rounded-full border transition-colors ${
              isFocused || trafficHover
                ? 'border-[#1aab29] bg-[#28C840] text-[#004d0a]'
                : 'border-black/10 dark:border-white/10 bg-slate-300 dark:bg-slate-600 text-transparent'
            }`}
          >
            {trafficHover && (
              <svg viewBox="0 0 8 8" className="h-2 w-2" aria-hidden="true">
                <path d="M1.5 4H6.5M4 1.5V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Centered window title */}
        <span className="pointer-events-none absolute inset-x-0 text-center text-[13px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          {win.title}
        </span>

        <div className="w-12" />
      </div>

      {/* App Content */}
      <div className="relative flex-1 overflow-hidden">{children}</div>

      {/* 8-Direction Resize Handles */}
      {!win.isMaximized && (
        <>
          <div onPointerDown={handleResizePointerDown('n')} className="absolute top-0 left-2 right-2 h-1.5 cursor-ns-resize z-20" />
          <div onPointerDown={handleResizePointerDown('s')} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize z-20" />
          <div onPointerDown={handleResizePointerDown('e')} className="absolute top-2 bottom-2 right-0 w-1.5 cursor-ew-resize z-20" />
          <div onPointerDown={handleResizePointerDown('w')} className="absolute top-2 bottom-2 left-0 w-1.5 cursor-ew-resize z-20" />
          <div onPointerDown={handleResizePointerDown('nw')} className="absolute top-0 left-0 h-3 w-3 cursor-nwse-resize z-30" />
          <div onPointerDown={handleResizePointerDown('ne')} className="absolute top-0 right-0 h-3 w-3 cursor-nesw-resize z-30" />
          <div onPointerDown={handleResizePointerDown('sw')} className="absolute bottom-0 left-0 h-3 w-3 cursor-nesw-resize z-30" />
          <div onPointerDown={handleResizePointerDown('se')} className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize z-30" />
        </>
      )}
    </motion.section>
  );
};

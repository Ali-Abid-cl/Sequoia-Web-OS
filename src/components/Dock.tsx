import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { Search } from 'lucide-react';
import { APP_META, APP_ORDER } from '../data/systemData';
import type { AppId, WindowState } from '../types/os';
import { AppIcon } from './AppIcons';

interface DockProps {
  windows: Record<AppId, WindowState>;
  onLaunchApp: (id: AppId) => void;
  onOpenSpotlight: () => void;
}

interface DockItemProps {
  mouseX: MotionValue<number>;
  label: string;
  isOpen: boolean;
  isBouncing: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const DockItem: React.FC<DockItemProps> = ({
  mouseX,
  label,
  isOpen,
  isBouncing,
  onClick,
  children,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeSync = useTransform(distance, [-140, 0, 140], [46, 70, 46]);
  const size = useSpring(sizeSync, { mass: 0.12, stiffness: 210, damping: 16 });

  return (
    <div className="relative flex flex-col items-center">
      {hovered && (
        <div className="pointer-events-none absolute -top-10 z-50 whitespace-nowrap rounded-md border border-black/10 dark:border-white/15 bg-white/90 dark:bg-slate-800/95 px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-lg macos-glass">
          {label}
        </div>
      )}

      <motion.button
        ref={ref}
        type="button"
        aria-label={`Open ${label}`}
        style={{ width: size, height: size }}
        animate={isBouncing ? { y: [0, -16, 0, -9, 0] } : { y: 0 }}
        transition={isBouncing ? { duration: 0.65, ease: 'easeOut' } : { duration: 0.15 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        className="relative flex items-center justify-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:brightness-90"
      >
        <div className="h-full w-full drop-shadow-[0_6px_12px_rgba(0,0,0,0.28)]">{children}</div>
      </motion.button>

      {/* Running app indicator dot */}
      <span
        className={`mt-1 h-1 w-1 rounded-full transition-opacity duration-150 ${
          isOpen ? 'bg-slate-900 dark:bg-white opacity-90' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
    </div>
  );
};

export const Dock: React.FC<DockProps> = ({ windows, onLaunchApp, onOpenSpotlight }) => {
  const mouseX = useMotionValue(Infinity);
  const [bouncingId, setBouncingId] = useState<AppId | null>(null);

  const handleAppClick = (id: AppId) => {
    if (!windows[id].isOpen) {
      setBouncingId(id);
      window.setTimeout(() => setBouncingId((curr) => (curr === id ? null : curr)), 700);
    }
    onLaunchApp(id);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2.5 z-[8500] flex justify-center px-4">
      <nav
        aria-label="Application Dock"
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto flex h-[64px] items-end gap-2.5 rounded-2xl border border-white/40 dark:border-white/15 bg-white/45 dark:bg-slate-900/55 px-3 pb-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.30)] macos-glass-heavy"
      >
        {APP_ORDER.map((id) => (
          <DockItem
            key={id}
            mouseX={mouseX}
            label={APP_META[id].title}
            isOpen={windows[id].isOpen}
            isBouncing={bouncingId === id}
            onClick={() => handleAppClick(id)}
          >
            <AppIcon id={id} className="h-full w-full" />
          </DockItem>
        ))}

        <div className="mx-1 mb-2.5 h-8 w-px bg-black/15 dark:bg-white/15" aria-hidden="true" />

        <DockItem
          mouseX={mouseX}
          label="Spotlight Search"
          isOpen={false}
          isBouncing={false}
          onClick={onOpenSpotlight}
        >
          <div className="flex h-full w-full items-center justify-center rounded-[22%] bg-gradient-to-b from-slate-100 to-slate-300 dark:from-slate-700 dark:to-slate-900 border border-white/40 dark:border-white/15 text-slate-800 dark:text-slate-100">
            <Search className="h-1/2 w-1/2 stroke-[2.2]" />
          </div>
        </DockItem>
      </nav>
    </div>
  );
};

import React from 'react';

interface CreatorLinksProps {
  compact?: boolean;
}

const LINKS = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ali-bid-uo/',
    accentClass: 'hover:bg-[#0A66C2]/12 hover:text-[#0A66C2] dark:hover:text-[#60A5FA]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/_a.l.i.a.b.i.d.104_/',
    accentClass: 'hover:bg-[#E1306C]/12 hover:text-[#E1306C] dark:hover:text-[#F472B6]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=100065551336858',
    accentClass: 'hover:bg-[#1877F2]/12 hover:text-[#1877F2] dark:hover:text-[#60A5FA]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
      </svg>
    ),
  },
  {
    name: 'Google Developer Profile',
    href: 'https://g.dev/aliabid',
    accentClass: 'hover:bg-[#4285F4]/12 hover:text-[#1A73E8] dark:hover:text-[#60A5FA]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="8 7 3 12 8 17" />
        <polyline points="16 7 21 12 16 17" />
        <line x1="14" y1="5" x2="10" y2="19" />
      </svg>
    ),
  },
];

export const CreatorLinks: React.FC<CreatorLinksProps> = ({ compact = false }) => {
  return (
    <div
      className={`${
        compact
          ? 'mt-3.5 border-t border-black/8 dark:border-white/10 pt-3'
          : 'rounded-xl border border-black/8 dark:border-white/10 bg-white/55 dark:bg-white/5 p-4'
      }`}
    >
      <div className={`flex ${compact ? 'flex-col items-center gap-2' : 'items-center justify-between gap-3'}`}>
        <div className={compact ? 'text-center' : 'text-left'}>
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Created by Ali Abid Rasheed
          </div>
          {!compact && (
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Connect on social &amp; developer profiles
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ali Abid Rasheed on ${link.name}`}
              title={link.name}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-black/8 dark:border-white/12 bg-white/75 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors ${link.accentClass}`}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

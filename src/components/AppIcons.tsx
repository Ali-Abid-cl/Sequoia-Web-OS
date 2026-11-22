import React from 'react';
import type { AppId } from '../types/os';

interface AppIconProps {
  id: AppId;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ id, className = 'w-12 h-12' }) => {
  switch (id) {
    case 'finder':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="finderBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60B9FF" />
              <stop offset="100%" stopColor="#1D6BE5" />
            </linearGradient>
            <linearGradient id="finderLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#DCE8F8" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#finderBg)" />
          <path d="M32 3H47C54.732 3 61 9.26801 61 17V47C61 54.732 54.732 61 47 61H30C27.5 47 26.5 34 32 3Z" fill="url(#finderLight)" />
          <path d="M32 3C26.5 34 27.5 47 30 61" stroke="#1E40AF" strokeWidth="1.5" strokeOpacity="0.22" fill="none" />
          <rect x="20" y="21" width="3.5" height="7" rx="1.75" fill="#1E293B" />
          <rect x="41" y="21" width="3.5" height="7" rx="1.75" fill="#1E293B" />
          <path d="M18 40C22.5 46 41.5 46 46 40" stroke="#1E293B" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'safari':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="safariBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="14" fill="#F8FAFC" />
          <circle cx="32" cy="32" r="24" fill="url(#safariBg)" />
          <circle cx="32" cy="32" r="20.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="2 3" />
          <polygon points="32,32 45,19 36,36" fill="#EF4444" />
          <polygon points="32,32 19,45 28,28" fill="#FFFFFF" />
          <circle cx="32" cy="32" r="2.2" fill="#E2E8F0" />
        </svg>
      );

    case 'terminal':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="termFrame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="termInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#090D16" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#termFrame)" />
          <rect x="6.5" y="6.5" width="51" height="51" rx="11" fill="url(#termInner)" />
          <path d="M16 21L26 28.5L16 36" stroke="#F8FAFC" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <line x1="29" y1="36" x2="41" y2="36" stroke="#38BDF8" strokeWidth="3.6" strokeLinecap="round" />
        </svg>
      );

    case 'notes':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="notesTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="14" fill="#FFFBEB" />
          <path d="M3 17C3 9.26801 9.26801 3 17 3H47C54.732 3 61 9.26801 61 17V20H3V17Z" fill="url(#notesTop)" />
          <line x1="3" y1="22" x2="61" y2="22" stroke="#D97706" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />
          <line x1="10" y1="32" x2="54" y2="32" stroke="#CBD5E1" strokeWidth="1.4" />
          <line x1="10" y1="42" x2="54" y2="42" stroke="#CBD5E1" strokeWidth="1.4" />
          <line x1="10" y1="52" x2="40" y2="52" stroke="#CBD5E1" strokeWidth="1.4" />
        </svg>
      );

    case 'calculator':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="calcBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#calcBg)" />
          <rect x="10" y="10" width="44" height="12" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <circle cx="16" cy="31" r="4.5" fill="#64748B" />
          <circle cx="28" cy="31" r="4.5" fill="#64748B" />
          <circle cx="40" cy="31" r="4.5" fill="#64748B" />
          <circle cx="16" cy="43" r="4.5" fill="#475569" />
          <circle cx="28" cy="43" r="4.5" fill="#475569" />
          <circle cx="40" cy="43" r="4.5" fill="#475569" />
          <rect x="47.5" y="26.5" width="9" height="26" rx="4.5" fill="#F97316" />
          <rect x="11.5" y="50" width="20" height="7" rx="3.5" fill="#475569" />
          <circle cx="40" cy="53.5" r="3.5" fill="#475569" />
        </svg>
      );

    case 'settings':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="settingsBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="58" height="58" rx="14" fill="url(#settingsBg)" />
          <circle cx="32" cy="32" r="19" fill="#334155" />
          <circle cx="32" cy="32" r="14.5" fill="none" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="5 3.6" />
          <circle cx="32" cy="32" r="8" fill="#64748B" />
          <circle cx="32" cy="32" r="4" fill="#0F172A" />
        </svg>
      );
  }
};

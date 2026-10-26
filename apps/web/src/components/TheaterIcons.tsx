import type { QuizMode } from '../core/quiz.ts';

export function StarEmblem({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16 1 18.8 11.4 29 8.5 20.6 16 29 23.5 18.8 20.6 16 31 13.2 20.6 3 23.5 11.4 16 3 8.5 13.2 11.4 16 1Z" />
    </svg>
  );
}

export function CrownEmblem({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className={className}>
      <path d="M3 19h18M4 16l1.8-9.5L12 12l6.2-5.5L20 16H4Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="5.5" r="1.2" fill="currentColor" />
      <circle cx="19.5" cy="5.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function RapierArrow({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 28 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="rapier-arrow">
      <path d="M2 12h22M17 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8v8M9 9.5v5" strokeLinecap="round" strokeOpacity="0.65" />
    </svg>
  );
}

export function GramophoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="2.5" fill="currentColor" />
      <path d="M19 4v8l-4 3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="4" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function TowerEmblem({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 2v20M7 22l5-18 5 18M5 22h14M8.5 14h7M9.8 9h4.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ModeCrest({ mode }: { mode: QuizMode }) {
  if (mode === 'intro') {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <polygon points="20,2 38,20 20,38 2,20" strokeOpacity="0.4" />
        <circle cx="20" cy="20" r="11" strokeOpacity="0.55" strokeDasharray="3 3" />
        <path d="M16 26V13l11-2.5v13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="13.5" cy="26" r="2.8" fill="currentColor" />
        <circle cx="24.5" cy="23.5" r="2.8" fill="currentColor" />
      </svg>
    );
  }
  if (mode === 'lyrics') {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <polygon points="20,2 38,20 20,38 2,20" strokeOpacity="0.4" />
        <path d="M11 10h14a3 3 0 0 1 3 3v16l-4.5-2.5L19 29l-4.5-2.5L10 29V11a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
        <path d="M14 15.5h9M14 20h6.5" strokeLinecap="round" />
        <path d="M27 9l4 4-8 8-4-4 8-8Z" fill="currentColor" fillOpacity="0.25" />
      </svg>
    );
  }
  if (mode === 'reverse') {
    return (
      <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <polygon points="20,2 38,20 20,38 2,20" strokeOpacity="0.4" />
        <path d="M9 20a11 11 0 1 0 3.2-7.8L9 15.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 10v5.5h5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 14v6.5l-4 2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <polygon points="20,2 38,20 20,38 2,20" strokeOpacity="0.4" />
      <circle cx="16" cy="21" r="8" />
      <circle cx="24" cy="21" r="8" />
      <circle cx="16" cy="21" r="2.2" fill="currentColor" />
      <circle cx="24" cy="21" r="2.2" fill="currentColor" />
      <path d="M20 7l1.5 3.8L25.5 12l-4 1.4L20 17l-1.5-3.6L14.5 12l4-1.2L20 7Z" fill="currentColor" />
    </svg>
  );
}

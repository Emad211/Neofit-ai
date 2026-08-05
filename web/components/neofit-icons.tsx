import type { ReactNode } from 'react';

export type NeoFitIconName =
  | 'home'
  | 'food'
  | 'workout'
  | 'chart'
  | 'profile'
  | 'plus'
  | 'search'
  | 'chevron'
  | 'sparkle'
  | 'offline'
  | 'check';

export function NeoFitIcon({ name, size = 22 }: { name: NeoFitIconName; size?: number }) {
  const paths: Record<NeoFitIconName, ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    food: <><path d="M7 3v8" /><path d="M4 3v5c0 2 1 3 3 3s3-1 3-3V3" /><path d="M7 11v10" /><path d="M16 3v18" /><path d="M16 3c3 2 4 5 4 8h-4" /></>,
    workout: <><path d="M6 7v10" /><path d="M18 7v10" /><path d="M3 10v4" /><path d="M21 10v4" /><path d="M6 12h12" /></>,
    chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20V7" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    offline: <><path d="m3 3 18 18" /><path d="M10.6 5.1A7 7 0 0 1 19 12.2 4.5 4.5 0 0 1 18.5 21H8a5 5 0 0 1-3.5-8.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

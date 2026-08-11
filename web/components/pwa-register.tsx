'use client';

import { useEffect } from 'react';
import type { DeploymentEnvironment } from '@/lib/environment';

const CACHE_PREFIX = 'neofit-app-shell-';

async function clearNonProductionPwaState() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const keys = await window.caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX))
        .map((key) => window.caches.delete(key)),
    );
  }
}

export function PwaRegister({ environment }: { environment: DeploymentEnvironment }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return undefined;

    let cancelled = false;

    // Development and protected Preview are QA environments, not stable PWA
    // origins. Dev chunks change continuously and Preview deployments can be
    // protected or replaced. A cache-first worker in either environment can
    // mix stale Next.js chunks with fresh server HTML and cause hydration
    // mismatches. Keep PWA behavior production-only and actively remove any
    // worker/app-shell cache left by an earlier build on these origins.
    if (environment !== 'production') {
      void clearNonProductionPwaState().catch((error) => {
        if (!cancelled) console.warn('NeoFit non-production PWA cleanup failed.', error);
      });
      return () => { cancelled = true; };
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        if (!cancelled) void registration.update();
      })
      .catch((error) => {
        if (!cancelled) console.error('NeoFit service worker registration failed.', error);
      });

    return () => {
      cancelled = true;
    };
  }, [environment]);

  return null;
}

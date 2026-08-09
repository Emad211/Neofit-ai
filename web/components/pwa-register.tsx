'use client';

import { useEffect } from 'react';
import type { DeploymentEnvironment } from '@/lib/environment';

const CACHE_PREFIX = 'neofit-app-shell-';

async function clearPreviewPwaState() {
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

    // Protected Vercel Preview URLs are not a stable PWA origin. A Service
    // Worker update can be intercepted by Deployment Protection and older
    // workers can keep stale app-shell/chunk caches alive. Preview is for live
    // account QA, so actively remove any previous NeoFit worker/cache there.
    if (environment === 'preview') {
      void clearPreviewPwaState().catch((error) => {
        if (!cancelled) console.warn('NeoFit Preview PWA cleanup failed.', error);
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

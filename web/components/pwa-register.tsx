'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return undefined;

    let cancelled = false;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        if (!cancelled) void registration.update();
      })
      .catch((error) => {
        console.error('NeoFit service worker registration failed.', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

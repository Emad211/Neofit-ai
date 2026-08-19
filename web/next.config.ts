import { resolve } from 'node:path';
import type { NextConfig } from 'next';

// Production is the only environment that should pin HSTS: preview domains and
// local http must never receive a long-lived HTTPS commitment. Resolved the same
// way lib/environment.ts does, inlined here so config load needs no local import.
const isProduction = (process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV) === 'production';

// A deliberately narrow, provably-safe CSP subset. It sets NO fetch directive
// (no default policy, no script or style or image or connection source) and no
// fallback, so it cannot silently break React hydration, styling, images, or the
// Supabase/AI connections — a wrong fetch directive would, and would still pass
// the build gate. A nonce-based policy for executable sources is intentionally
// deferred to a hosted run where it can be proven not to break hydration. These
// directives only close framing, base hijacking, plugin embedding and off-origin
// form posts, all verified unused in this app.
const CONTENT_SECURITY_POLICY = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@neofit/nutrition-core', '@neofit/exercise-registry'],
  turbopack: {
    root: resolve(process.cwd(), '..'),
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
          ...(isProduction
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
      {
        source: '/auth/confirm',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        source: '/auth/callback',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;

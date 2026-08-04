# NeoFit Stage 4B — Supabase SSR Foundation Evidence

**Status:** implementation candidate green; documentation/final review checkpoint in progress  
**Date:** 5 Aug 2026  
**Issue:** #25  
**PR:** #30  
**Branch:** `stage4b/supabase-ssr-foundation`  
**Project ref:** `rjwrobltmjodfarnltal`

## ۱. Scope

Stage 4B adds only the local/configuration and session-client foundation:

- local Supabase config;
- fail-closed browser-safe environment parsing;
- Browser client;
- cookie-aware Server client;
- request/response cookie Proxy using verified claims;
- focused tests and secret boundaries.

It does not add remote migrations، Application tables، RLS policies، generated database types، Auth UI، Nutrition persistence or Service Role usage.

## ۲. Test-first red checkpoint

Red-contract commits:

```text
1c7983f61dd88e8e9f9019310901ecc8492f8586  foundation tests
29bdd0eded785ea6cba002f1bb0e470851732484  test command
dc8e718d4a95f0cdf271840578157bf599de3183  focused CI
```

Expected red evidence on `dc8e718…`:

```text
Web CI: 30957552355 — failure
Supabase Foundation CI: 30957552028 — failure
```

The first Web failure was intentional and precise:

```text
TS2307: Cannot find module '../lib/supabase/env.ts'
```

This proves the contract ran before implementation existed.

## ۳. Implementation

Implemented files:

```text
supabase/config.toml
web/lib/supabase/env.ts
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/.env.example
web/tests/supabase-foundation.test.ts
.github/workflows/supabase-foundation-ci.yml
```

Reviewed dependency pins:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Behavioral contracts:

- Browser client uses `createBrowserClient` and only public variables.
- Server client imports `server-only` and uses `await cookies()`.
- Proxy synchronizes request and response cookies.
- Proxy calls `auth.getClaims()` and does not use `getSession()` for authorization.
- Session responses set `Cache-Control: private, no-store`.
- Root Proxy is scoped to future `/auth/*` and `/account/*` paths so the current public fixture/PWA remains operable before environment rollout.
- `.env.example` preserves existing Vercel/app variables and keeps both Supabase values blank.
- no Project ref، key or secret is embedded in local config.
- no migrations directory or Application table is introduced.

## ۴. Corrections during green conversion

### Existing environment contract preservation

The existing `.env.example` already documented `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_VERCEL_ENV`. The initial test incorrectly assumed the file should contain only two Supabase assignments. The test was corrected to require blank Supabase values while preserving the existing Stage 2 contract.

### TypeScript-compatible test import

Foundation tests passed at runtime but TypeScript rejected a dynamic import ending in `.ts`:

```text
TS5097: import path can only end with .ts when allowImportingTsExtensions is enabled
```

The test import was changed to extensionless module resolution. No assertion was removed.

### Secret scanner scope

The initial secret scanner searched security documentation and correctly found forbidden identifiers used as explanatory anti-goals. It was narrowed to runtime/config files only. Browser-reachable files remain protected by a separate case-insensitive test.

## ۵. Green candidate evidence

Candidate head before base synchronization:

```text
d796ff66469be062602cc08c11be4f7da6e9279f
```

### Supabase Foundation CI

```text
Run: 30958021239
Result: success
Artifact: 8911823269
Digest: sha256:72ea57192d121d72474611a65d3a50ea31975336f76f45c6bbdc0f6471d772d5
```

Passed:

- 10/10 Stage 4B contracts;
- Web TypeScript;
- Shared Nutrition Core boundary/typecheck/52 tests;
- runtime/config secret scan;
- evidence metadata.

### Web CI

```text
Run: 30958021241
Result: success
Artifact: 8911836376
Digest: sha256:f9b43059040787f990a601c2be559958adda963660d0d15b2fc5a4611cabbb97
```

Passed:

- TypeScript;
- Web Adapter parity;
- Next production build;
- generated icons;
- visual regression;
- Service Worker and offline/cache PWA gates;
- reproducible Vercel source bundle.

### Vercel Build Contract

```text
Run: 30958021244
Result: success
```

Passed repository-root workspaces، TypeScript and production build.

## ۶. Base synchronization

Integration advanced by one commit while Stage 4B was in progress:

```text
13a9407374d2d84d754dcf5eb7d50b8b4176bb64
fix(vercel): deploy the NeoFit Web/PWA from repository root
```

GitHub generated the conflict-free merge commit:

```text
e36b5310fc443afbc4f69ca6bf73ca921c050a5c
```

The Stage 4B branch was fast-forwarded to that merge commit. It is now ahead of Integration and behind by zero commits.

## ۷. Remote Supabase boundary

The Project was rechecked after Stage 4B implementation:

```text
public schema Application tables: 0
```

No migration or schema mutation was executed. Stage 4B remains client/config-only.

## ۸. Security boundary

- No publishable key value is committed.
- No Service Role key was requested or used.
- No Server-only secret is exposed through `NEXT_PUBLIC_`.
- Browser/server clients are separate.
- Protected identity refresh uses verified claims.
- No user-owned table exists yet, so RLS implementation remains Stage 4C.

## ۹. Exact continuation point

1. Synchronize Master Plan، Progress Log، Stage 4 Plan، README and Development Handoff with this candidate.
2. Run Foundation/Web/Vercel CI on the final documentation head.
3. Inspect PR #30 review threads and changed files.
4. Keep PR Draft until final CI/document evidence is green.
5. Merge Stage 4B only if all gates remain green and no remote schema mutation exists.
6. Start Stage 4C in a new focused branch/PR with versioned migrations and RLS tests.
7. Keep Stage 2B Vercel HTTPS validation independent in Issue #16 / PR #28.

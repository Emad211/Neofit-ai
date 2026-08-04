# NeoFit Stage 4B — Supabase SSR Foundation Evidence

**Status:** complete and merged  
**Date:** 5 Aug 2026  
**Issue:** #25  
**Implementation PR:** #30  
**Implementation merge:** `17d0e8c33ed9ba6329f243dee27b8cf8de53056c`  
**Project ref:** `rjwrobltmjodfarnltal`

## ۱. Scope completed

Stage 4B added only the local/configuration and session-client foundation:

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

It did not add remote migrations، Application tables، RLS policies، generated database types، Auth UI، Nutrition persistence or privileged-key usage.

## ۲. Test-first red checkpoint

```text
1c7983f61dd88e8e9f9019310901ecc8492f8586  foundation tests
29bdd0eded785ea6cba002f1bb0e470851732484  test command
dc8e718d4a95f0cdf271840578157bf599de3183  focused CI
```

Red evidence:

```text
Web CI: 30957552355 — failure
Supabase Foundation CI: 30957552028 — failure
First failure: TS2307 missing web/lib/supabase/env.ts
```

The contract ran before implementation existed.

## ۳. Implementation contracts

Dependency pins:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Implemented behavior:

- Browser client uses `createBrowserClient` and only public variables.
- Server client imports `server-only` and uses `await cookies()`.
- Proxy synchronizes refreshed cookies onto request and response.
- Proxy calls `auth.getClaims()` and does not use `getSession()` for authorization.
- Session responses set `Cache-Control: private, no-store`.
- Root Proxy is scoped to future `/auth/*` and `/account/*` paths.
- Existing Vercel/App environment contract is preserved.
- Supabase values in `.env.example` are blank.
- no Project ref، key or privileged identifier is embedded in runtime/config files.
- no migrations directory or Application table was introduced.

## ۴. Corrections

### Environment example preservation

The initial test assumed `.env.example` should contain only two Supabase assignments. The existing App/Vercel variables were preserved and the test was corrected to require blank Supabase values without deleting prior configuration.

### TypeScript test import

Runtime tests passed, but TypeScript rejected a dynamic import ending in `.ts` with `TS5097`. The import changed to extensionless resolution. No assertion was removed.

### Secret scanner scope

The initial scanner searched explanatory security documentation and found identifiers documented as anti-goals. It was narrowed to runtime/config files. Browser-reachable files remain covered by a separate case-insensitive test.

## ۵. Green implementation candidate

Candidate before final docs:

```text
d796ff66469be062602cc08c11be4f7da6e9279f
```

Foundation:

```text
Run: 30958021239 — success
Artifact: 8911823269
Digest: sha256:72ea57192d121d72474611a65d3a50ea31975336f76f45c6bbdc0f6471d772d5
```

Web:

```text
Run: 30958021241 — success
Artifact: 8911836376
Digest: sha256:f9b43059040787f990a601c2be559958adda963660d0d15b2fc5a4611cabbb97
```

Vercel Build Contract:

```text
Run: 30958021244 — success
```

## ۶. Integration synchronization

Integration advanced during implementation with:

```text
13a9407374d2d84d754dcf5eb7d50b8b4176bb64
fix(vercel): deploy the NeoFit Web/PWA from repository root
```

Stage 4B synchronized conflict-free through:

```text
e36b5310fc443afbc4f69ca6bf73ca921c050a5c
```

The PR base was refreshed to current Integration. Actual diff: 16 Stage 4B/document files.

## ۷. Final branch/documentation evidence

Final implementation/documentation head:

```text
7ed955139d51b3546b489c8f649f144f390cb8f0
```

Supabase Foundation:

```text
Run: 30958530329 — success
Artifact: 8912018526
Digest: sha256:1455fd4ff726ac4ee2a5cbb0a99dd09d3528becb2f86ce9dd858cbdb37e6cba7
```

Nutrition Core:

```text
Run: 30958530294 — success
Artifact: 8912013429
Digest: sha256:649639a40dc0b20594ea48e6534cc6cd215a170fd251699279032a5a4d68b12c
```

Web:

```text
Run: 30958530262 — success
Artifact: 8912039816
Digest: sha256:790d13b030e96038be394ec50108da38c601988f8bb9106b57b8153892a83c6a
```

Vercel Build Contract:

```text
Run: 30958530296 — success
```

Passed:

- Stage 4B contracts `10/10`.
- strict TypeScript.
- Shared Core pure boundary and `52/52` tests.
- runtime/config secret scan.
- Web Adapter parity.
- Next production build.
- generated icons.
- visual regression.
- Service Worker، offline reload and cache boundaries.
- repository-root Vercel workspace/build contract.
- review threads: zero.

## ۸. Merge outcome

PR #30 was marked Ready and merged with expected head:

```text
expected head: 7ed955139d51b3546b489c8f649f144f390cb8f0
merge SHA: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
```

Stage 4B is complete.

## ۹. Remote Supabase boundary

The Project was checked after implementation:

```text
public schema Application tables: 0
```

No migration، table، policy or remote schema mutation was executed.

Security boundary:

- no publishable key value committed.
- no privileged key requested or used.
- no Server-only secret exposed through `NEXT_PUBLIC_`.
- Browser/server clients remain separate.
- verified claims protect future identity paths.
- RLS remains Stage 4C because no user-owned table exists yet.

## ۱۰. Exact continuation point

1. Merge this closure handoff after documentation CI.
2. Update Issue #25 to mark Stage 4B complete and Stage 4C active-next.
3. Create a new focused Stage 4C branch from closure Integration head.
4. Write migration/RLS tests before applying remote DDL.
5. Add `profiles` and `user_settings` through versioned migration only.
6. Generate database types and run security/performance advisors.
7. Prove anon and cross-user denial before Application use.
8. Keep Stage 2B Vercel HTTPS validation independent in Issue #16 / PR #28.

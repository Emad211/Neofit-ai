# NeoFit Stage 4 — Supabase Auth, Postgres and RLS Foundation Plan

**Status:** Stage 4A و Stage 4B کامل؛ Stage 4C exact next  
**Date:** 5 Aug 2026  
**Issue:** #25  
**Integration branch:** `web/pwa-foundation`  
**Stage 4B merge:** `17d0e8c33ed9ba6329f243dee27b8cf8de53056c`  
**Project ref:** `rjwrobltmjodfarnltal`

## ۱. هدف و حدود

Stage 4 کوچک‌ترین Foundation امن، migration-driven و قابل‌ممیزی Supabase را می‌سازد، بدون اینکه:

- Nutrition arithmetic از `packages/nutrition-core` خارج شود؛
- IFKB identity/provenance تضعیف شود؛
- SQL یا UI عدد تغذیه‌ای اختراع کند؛
- Auth، RLS، migration یا secret handling permissive باشد؛
- Scope به Catalog کامل، AI/Vision یا IndexedDB گسترش یابد.

## ۲. Stage 4A — Project provisioning complete

Accepted:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Created:

```text
project id/ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
api url: https://rjwrobltmjodfarnltal.supabase.co
```

Authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`.
- no committed key value.
- no privileged key request/use.
- baseline public Application tables: 0.

## ۳. معماری قفل‌شده

```text
Client Components
  -> createBrowserClient
  -> public URL + publishable key
  -> RLS-protected Data API

Server Components / Actions / Route Handlers
  -> server-only createServerClient
  -> cookie-aware request context
  -> getClaims() for protected identity paths

Next.js Proxy
  -> request/response cookie synchronization
  -> verified-claims refresh
  -> private, no-store session responses

Postgres
  -> supabase/migrations/*.sql as sole schema authority
  -> RLS before user-table use
  -> generated TypeScript database types

Nutrition
  -> packages/nutrition-core only
  -> SQL persists output and never recalculates
```

## ۴. Environment و Secret contract

Browser-safe:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Operations-only، فقط در Batchهای آینده و در صورت نیاز:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
SUPABASE_PROJECT_REF
```

قواعد:

- هیچ Key واقعی در Git، docs، logs یا artifacts ثبت نشود.
- `.env.example` Supabase values را خالی نگه دارد.
- Server-only variable با `NEXT_PUBLIC_` شروع نشود.
- Browser source/bundle privileged identifier/value نداشته باشد.
- امنیت User data به RLS وابسته است، نه مخفی‌بودن Publishable key.

## ۵. Stage 4B — complete and merged

Implemented:

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

Dependencies:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Contracts completed:

1. missing/invalid public env fails closed.
2. remote URL requires HTTPS؛ HTTP فقط برای localhost/127.0.0.1.
3. Browser client uses `createBrowserClient`.
4. Server client is `server-only` and cookie-aware.
5. Proxy synchronizes request/response cookies.
6. Proxy uses `auth.getClaims()` and not `getSession()` for authorization.
7. Session responses are `private, no-store`.
8. Proxy is scoped to future `/auth/*` and `/account/*` routes.
9. App/Vercel env contract preserved؛ Supabase values blank.
10. runtime/config secret scan and Browser-source boundary test pass.
11. no migration or Application table introduced.

Test-first red:

```text
Head: dc8e718d4a95f0cdf271840578157bf599de3183
Web CI 30957552355 — failure
Foundation CI 30957552028 — failure
First error: missing web/lib/supabase/env.ts
```

Final head and evidence:

```text
Head: 7ed955139d51b3546b489c8f649f144f390cb8f0

Supabase Foundation CI 30958530329 — success
Artifact 8912018526
Digest sha256:1455fd4ff726ac4ee2a5cbb0a99dd09d3528becb2f86ce9dd858cbdb37e6cba7

Nutrition Core CI 30958530294 — success
Artifact 8912013429
Digest sha256:649639a40dc0b20594ea48e6534cc6cd215a170fd251699279032a5a4d68b12c

Web CI 30958530262 — success
Artifact 8912039816
Digest sha256:790d13b030e96038be394ec50108da38c601988f8bb9106b57b8153892a83c6a

Vercel Build Contract 30958530296 — success
```

Merge:

```text
PR #30
expected head: 7ed955139d51b3546b489c8f649f144f390cb8f0
merge SHA: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
```

Remote boundary after merge:

```text
public schema Application tables: 0
```

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`.

## ۶. Stage 4C — Identity schema + RLS

Stage 4C must use a new focused Branch/PR and begin with red migration/RLS tests before remote DDL.

### Planned `profiles`

- `id uuid primary key references auth.users(id) on delete cascade`.
- nullable `display_name` with trimmed-length bound.
- `locale` limited to `fa` or `en`.
- bounded timezone.
- created/updated timestamps.
- ownership: `id = auth.uid()`.

### Planned `user_settings`

- `user_id uuid primary key references auth.users(id) on delete cascade`.
- bounded theme and units.
- created/updated timestamps.
- ownership: `user_id = auth.uid()`.

### Required RLS proof

1. anon cannot read User rows.
2. User A reads own row.
3. User A cannot read User B.
4. User A cannot insert owner=B.
5. ownership cannot be changed to B.
6. cross-user update/delete denied.
7. unauthenticated `auth.uid()` null fails closed.

Policy pattern:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

For `profiles`, use `id`.

Required outputs:

- timestamped versioned migration.
- RLS enabled before Application use.
- generated `web/lib/supabase/database.types.ts`.
- security/performance advisor review.
- anon and cross-user denial evidence.
- no Dashboard-only Schema edits.

## ۷. Stage 4D — Nutrition persistence

After Stage 4C:

- `nutrition_goals`.
- `nutrition_entries`.
- versioned Shared Core output persistence.
- no SQL Nutrition recalculation.
- preserve absent nutrients and `grams: null`.
- `client_mutation_id` idempotency foundation.
- read/write round-trip tests.

## ۸. Claim boundaries

Proven:

- Project exists and is healthy.
- Stage 4B client/config foundation is merged.
- Browser/Server/Proxy contracts are tested.
- Core/Web/PWA/Vercel Build regressions are green.
- remote public schema remains empty.

Not proven:

- live Login/Signup/callback flow.
- Vercel Supabase env rollout.
- remote Auth session end-to-end.
- migrations، user tables، RLS or generated types.
- Stage 4C implementation.

## ۹. Exact continuation point

1. Merge the Stage 4B closure handoff.
2. Update Issue #25 with Stage 4B complete / Stage 4C next.
3. Create `stage4c/identity-schema-rls` from closure Integration head.
4. Write migration/RLS policy tests before remote DDL.
5. Add versioned migration for `profiles` and `user_settings`.
6. Apply only after static/local review.
7. Generate types، run advisors and prove denial scenarios.
8. Keep Stage 2B Vercel independent in Issue #16 / PR #28.

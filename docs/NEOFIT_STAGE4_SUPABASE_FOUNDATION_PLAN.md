# NeoFit Stage 4 — Supabase Auth, Postgres and RLS Foundation Plan

**Status:** Stage 4A complete؛ Stage 4B candidate green؛ Stage 4C next after merge  
**Date:** 5 Aug 2026  
**Issue:** #25  
**Integration branch:** `web/pwa-foundation`  
**Stage 4B PR:** #30  
**Project ref:** `rjwrobltmjodfarnltal`

## ۱. هدف

Stage 4 باید کوچک‌ترین Foundation امن، migration-driven و قابل‌ممیزی Supabase را برای NeoFit ایجاد کند، بدون اینکه:

- Nutrition arithmetic از `packages/nutrition-core` خارج شود؛
- IFKB identity/provenance تضعیف شود؛
- SQL یا UI عدد تغذیه‌ای اختراع کند؛
- Auth، RLS، migration یا secret handling permissive باشد؛
- Scope به Catalog کامل، AI/Vision، IndexedDB یا محصول کامل گسترش یابد.

## ۲. Project decision و provisioning

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

Stage 4A authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`.
- no committed key value.
- no privileged key request/use.
- baseline public Application tables: 0.

## ۳. معماری قفل‌شده

```text
Client Components
  -> createBrowserClient
  -> public URL + publishable key
  -> future RLS-protected Data API

Server Components / Actions / Route Handlers
  -> server-only createServerClient
  -> cookie-aware request context
  -> getClaims() for protected identity paths

Next.js Proxy
  -> request/response cookie synchronization
  -> refresh verified claims
  -> private, no-store session responses
  -> no business authorization by itself

Postgres
  -> supabase/migrations/*.sql as sole schema authority
  -> RLS before user-table Application use
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

Operations-only، فقط در Batchهای آینده در صورت نیاز:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
SUPABASE_PROJECT_REF
```

قواعد:

- هیچ Key واقعی در Git، docs، logs یا artifacts ثبت نشود.
- `.env.example` Supabase values را خالی نگه دارد.
- هیچ Server-only variable با `NEXT_PUBLIC_` شروع نشود.
- Browser source/bundle privileged identifier/value نداشته باشد.
- Publishable key امنیت ایجاد نمی‌کند؛ امنیت User data به RLS وابسته است.

## ۵. Stage 4B — implemented candidate

### Files

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

### Dependencies

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

### Contracts implemented

1. Public env missing/invalid values fail clearly.
2. HTTPS remote URL required؛ HTTP only for localhost/127.0.0.1.
3. Browser client uses `createBrowserClient` and public env only.
4. Server client is `server-only`، cookie-aware and uses `createServerClient`.
5. Proxy synchronizes cookies from request to response.
6. Proxy uses `auth.getClaims()` and never `getSession()` for authorization.
7. Session responses are `private, no-store`.
8. Root Proxy is scoped to future `/auth/*` and `/account/*` paths.
9. Existing App/Vercel env contract remains intact؛ Supabase values blank.
10. runtime/config secret scan plus Browser-file secret-boundary test.
11. no migrations or Application tables in Stage 4B.

### Test-first evidence

Red head:

```text
dc8e718d4a95f0cdf271840578157bf599de3183
```

- Web CI `30957552355` failed on missing env implementation.
- Foundation CI `30957552028` failed before implementation.

Green candidate:

```text
d796ff66469be062602cc08c11be4f7da6e9279f
```

Supabase Foundation:

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

Passed:

- Foundation contracts `10/10`.
- strict TypeScript.
- Shared Core boundary/typecheck/`52/52`.
- secret scan.
- Web Adapter parity.
- Next build.
- Visual/PWA/offline/cache gates.
- repository-root Vercel build contract.

### Base synchronization

Integration Vercel commit:

```text
13a9407374d2d84d754dcf5eb7d50b8b4176bb64
```

Conflict-free Stage 4B synchronization:

```text
e36b5310fc443afbc4f69ca6bf73ca921c050a5c
```

Branch is behind Integration by zero commits.

### Corrections

- `.env.example` test corrected to preserve prior App/Vercel assignments.
- TypeScript test import corrected to extensionless resolution؛ Assertions unchanged.
- secret scan narrowed to runtime/config after security docs produced explanatory false positives.

### Remote boundary

Project recheck after implementation:

```text
public schema Application tables: 0
```

No migration، table، policy or remote schema mutation executed.

Evidence authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`.

## ۶. Stage 4C — Identity schema + RLS

Stage 4C starts only after Stage 4B Merge and must use a new focused Branch/PR.

### Planned tables

#### `profiles`

- `id uuid primary key references auth.users(id)`.
- bounded nullable `display_name`.
- locale limited to `fa` or `en`.
- timezone.
- created/updated timestamps.
- ownership: `id = auth.uid()`.

#### `user_settings`

- `user_id uuid primary key references auth.users(id)`.
- bounded theme/units.
- created/updated timestamps.
- ownership: `user_id = auth.uid()`.

### Required RLS scenarios

1. anon cannot read User rows.
2. User A can read own row.
3. User A cannot read User B row.
4. User A cannot insert owner=B.
5. User A cannot change ownership to B.
6. cross-user update/delete denied.
7. unauthenticated `auth.uid()` null fails closed.

Policy pattern:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

For `profiles` use `id`.

### Stage 4C outputs

- timestamped versioned migration.
- RLS enabled before Application use.
- generated `database.types.ts`.
- security/performance advisor review.
- cross-user denial evidence.

## ۷. Stage 4D — Nutrition persistence

Planned:

- `nutrition_goals`.
- `nutrition_entries`.
- versioned Shared Core output persistence.
- no SQL Nutrition recalculation.
- preserve absent nutrients and `grams: null`.
- `client_mutation_id` idempotency foundation.
- read/write round-trip tests.

## ۸. Migration و generated types authority

- only `supabase/migrations/*.sql` is Schema authority.
- migrations are timestamped and single-purpose.
- remote migrations are corrected by forward-fix.
- generated file target:

```text
web/lib/supabase/database.types.ts
```

- CI must reject generated drift after Stage 4C.

## ۹. Claim boundaries

Proven:

- Project exists and is healthy.
- Stage 4B client/config foundation exists.
- Browser/Server/Proxy contracts are tested.
- Core/Web/PWA/Vercel Build regressions are green.
- remote public schema remains empty.

Not proven:

- live Login/Signup/callback flow.
- Vercel Supabase env rollout.
- remote Auth session end-to-end.
- migrations، user tables، RLS or generated types.
- Stage 4B merge.

## ۱۰. Batch plan

- **4A complete:** decision، cost confirmation، Project creation.
- **4B candidate green:** config/env/Browser/Server/Proxy foundation، no tables.
- **4C next after merge:** profiles/user_settings، RLS، generated types، advisors، denial tests.
- **4D:** nutrition_goals/nutrition_entries، round-trip contracts.
- **Closure:** migration/advisor/RLS/Core/Web evidence سپس Issue #25 close.

## ۱۱. Exact continuation point

1. README و Development Handoff با Stage 4B candidate به‌روز شوند.
2. Final Foundation/Web/Vercel CI روی docs head اجرا شود.
3. PR #30 review threads و changed files بررسی شوند.
4. PR پس از Final green Ready شود.
5. PR با expected head Merge شود.
6. post-merge evidence در Master/Progress/Issue #25 ثبت شود.
7. Stage 4C در Branch/PR مستقل و migration/RLS test-first آغاز شود.
8. Stage 2B Vercel مستقل در Issue #16 / PR #28 باز بماند.

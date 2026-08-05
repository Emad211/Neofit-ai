# NeoFit Stage 4 — Supabase Auth, Postgres and RLS Foundation Plan

**Status:** Stage 4A و 4B کامل؛ Stage 4C implementation/remote proof کامل ولی unmerged؛ Stage 4D بعد از Merge  
**Date:** 5 Aug 2026  
**Issue:** #25  
**Integration branch:** `web/pwa-foundation`  
**Stage 4C branch/PR:** `stage4c/identity-schema-rls` / #33  
**Project ref:** `rjwrobltmjodfarnltal`

## ۱. هدف و حدود

Stage 4 کوچک‌ترین Foundation امن، migration-driven و قابل‌ممیزی Supabase را می‌سازد، بدون اینکه:

- Nutrition arithmetic از `packages/nutrition-core` خارج شود؛
- IFKB identity/provenance تضعیف شود؛
- SQL یا UI عدد تغذیه‌ای اختراع کند؛
- Auth، RLS، migration یا secret handling permissive باشد؛
- scope به Catalog کامل، AI/Vision یا IndexedDB گسترش یابد.

## ۲. معماری قفل‌شده

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

## ۳. Environment و Secret contract

Browser-safe:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Operations-only، فقط در صورت نیاز و خارج از Browser:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
SUPABASE_PROJECT_REF
```

قواعد:

- هیچ key واقعی در Git، docs، logs یا artifacts ثبت نشود.
- `.env.example` Supabase values را خالی نگه دارد.
- Server-only variable با `NEXT_PUBLIC_` شروع نشود.
- Browser source/bundle privileged identifier/value نداشته باشد.
- امنیت User data به RLS وابسته است، نه مخفی‌بودن Publishable key.

## ۴. Stage 4A — Project complete

```text
organization: yzymkjsfqoohxbqkhzhs
project: neofit
project ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
postgres: 17.6.1.155
```

Authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`

## ۵. Stage 4B — SSR foundation complete and merged

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

Pinned dependencies:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Contracts:

1. missing/invalid public env fails closed؛
2. remote URL requires HTTPS؛ local HTTP فقط localhost/127.0.0.1؛
3. Browser client uses `createBrowserClient`؛
4. Server client is `server-only` and cookie-aware؛
5. Proxy synchronizes request/response cookies؛
6. Proxy uses `auth.getClaims()` and not `getSession()` for authorization؛
7. Session responses are `private, no-store`؛
8. App/Vercel env contract preserved؛ Supabase values blank؛
9. Stage 4B خودش migration ایجاد نکرد.

```text
PR #30 merge: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
Closure merge: 72202f2f0ff281bf0624b9ebb933ac5afeaad8fc
```

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`

## ۶. Stage 4C — Identity schema + RLS proven

Branch/PR:

```text
stage4c/identity-schema-rls
Draft PR #33
validated implementation head: c5cface86f46134a4a0afcfc3c980f7ce613ee7a
```

### Migration authority

```text
repository migration: 20260804232149_identity_foundation.sql
remote version:       20260804232149
remote name:          identity_foundation
```

یک filename برنامه‌ریزی‌شدهٔ قدیمی (`20260805000100...`) با Remote history drift داشت. نام فایل Git به version واقعی Remote اصلاح شد؛ SQL دوباره اجرا نشد.

### `profiles`

- `id uuid primary key references auth.users(id) on delete cascade`؛
- nullable bounded `display_name`؛
- `locale` محدود به `fa | en`؛
- bounded timezone؛
- created/updated timestamps؛
- ownership: `id = auth.uid()`.

### `user_settings`

- `user_id uuid primary key references auth.users(id) on delete cascade`؛
- `theme`: `system | light | dark`؛
- `units`: `metric | imperial`؛
- created/updated timestamps؛
- ownership: `user_id = auth.uid()`.

### RLS and grants

Remote state:

- RLS روی هر دو table فعال است؛
- هشت own-row policy وجود دارد؛
- INSERT دارای `WITH CHECK`؛
- UPDATE دارای `USING` و `WITH CHECK`؛
- DELETE/SELECT دارای ownership predicate؛
- فقط role `authenticated` grant دارد؛
- `anon` و `PUBLIC` grant ندارند؛
- permissive policy وجود ندارد.

### Trigger security

- `public.set_updated_at()`؛
- `security invoker`؛
- `search_path = ''`؛
- function از `public` revoke شده؛
- BEFORE UPDATE trigger روی هر دو table.

### Generated types

`web/lib/supabase/database.types.ts` مستقیماً از Remote schema تولید شده و فقط identity tables را شامل می‌شود.

### Runtime denial proof

Passed:

```text
anon_read_denied
user_a_reads_own
user_a_cannot_read_b
user_a_cannot_update_b
user_a_cannot_delete_b
user_a_cannot_insert_as_b
ownership_change_denied
```

تست با UUIDهای موقت انجام شد؛ هیچ Auth account دائمی ساخته نشد. Cleanup نهایی:

```text
profiles: 0
user_settings: 0
auth.users: 0
```

### Advisors

```text
Security lints: 0
Performance lints: 0
```

### CI evidence

```text
Identity CI 30996283909 — success
Artifact 8926287946
Digest sha256:192ae440dfb98fb2329249fb3b1f0c881841b5774d2ec642c63efdd6f34fcfe9

Foundation CI 30996283993 — success
Artifact 8926292359
Digest sha256:528deb7235762d631751f5a6d8b469fe6a7291e49900b6e2f30c7c4f0ee9b549

Web CI 30996283899 — success
Artifact 8926312456
Digest sha256:60064bab80150fcb72c0952d29a2466625d4b11d1dcd667ee2d628d617deecc2

Vercel Build Contract 30996283903 — success
```

Authority:

- `docs/NEOFIT_STAGE4C_IDENTITY_RLS_EVIDENCE.md`

Stage 4C تا Merge PR #33 از نظر Integration بسته نیست.

## ۷. Stage 4D — Nutrition persistence after Stage 4C merge

حداقل schema:

- `nutrition_goals`؛
- `nutrition_entries`.

قفل‌ها:

- migration/RLS tests قبل از Remote DDL؛
- own-row ownership؛
- خروجی نسخه‌دار Shared Core persist شود؛
- SQL Nutrition recalculation نداشته باشد؛
- missing nutrient و `grams: null` حفظ شود؛
- `client_mutation_id` برای idempotency؛
- read/write round-trip؛
- anon/cross-user denial؛
- generated types و Advisors.

## ۸. Frontend integration boundary

PR #34 فرانت فارسی کامل و browser-proven را روی `revival/full-ui-front` دارد، اما معماری monorepo و Supabase/Shared Core فعلی روی `web/pwa-foundation` است.

قانون ادغام:

- Merge مستقیم دو شاخه ممنوع؛
- branch ادغام از معماری فعلی ساخته شود؛
- UI به `web/` منتقل شود؛
- Supabase SSR، migration authority و Shared Nutrition Core حفظ شوند؛
- Local adapter به‌عنوان demo fixture باقی بماند؛
- Adapterها مرحله‌ای با persistence واقعی جایگزین شوند.

## ۹. Claim boundaries

Proven:

- Project healthy؛
- Stage 4B merged؛
- Stage 4C migration/schema/RLS/types/runtime denial/advisors؛
- Core/Web/Vercel Build regression green.

Not proven:

- Stage 4C merge؛
- live Auth UI/callback؛
- Vercel Supabase env rollout؛
- Nutrition persistence؛
- اتصال فرانت PR #34 به `web/`؛
- Production data/deployment.

## ۱۰. Exact continuation point

1. اسناد، Issue #25 و PR #33 همگام شوند.
2. CI آخرین docs head بررسی شود.
3. PR #33 تا تأیید صریح کاربر Draft/unmerged بماند.
4. پس از Merge، Closure evidence Stage 4C نوشته شود.
5. Stage 4D با red migration/RLS contracts در branch متمرکز جدید آغاز شود.
6. انتقال فرانت PR #34 در branch ادغام جدا برنامه‌ریزی شود؛ نه Merge مستقیم.
7. Stage 2B Issue #16 / PR #28 مستقل باقی بماند.

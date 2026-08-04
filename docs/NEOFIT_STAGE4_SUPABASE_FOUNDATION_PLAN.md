# NeoFit Stage 4 — Supabase Auth, Postgres and RLS Foundation Plan

**Status:** Stage 4A complete؛ Stage 4B next  
**Date:** 5 Aug 2026  
**Issue:** #25  
**Integration branch:** `web/pwa-foundation`  
**Project ref:** `rjwrobltmjodfarnltal`

## ۱. هدف

Stage 4 باید کوچک‌ترین Foundation امن، migration-driven و قابل‌ممیزی Supabase را برای NeoFit ایجاد کند، بدون اینکه:

- Nutrition arithmetic از `packages/nutrition-core` خارج شود؛
- IFKB identity/provenance تضعیف شود؛
- SQL یا UI عدد تغذیه‌ای اختراع کند؛
- Auth، RLS، migration یا secret handling permissive یا موقت باشد؛
- Scope به Catalog کامل، AI/Vision، IndexedDB یا محصول کامل گسترش یابد.

Stage 4 Foundation است، نه Vertical Slice کامل تغذیه.

## ۲. Decision record نهایی

کاربر صریحاً پذیرفت:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Connector دوباره Cost را خواند:

```text
type: project
recurrence: monthly
amount: 0
```

پس از پذیرش، `confirm_cost` و `create_project` اجرا شدند.

## ۳. Project ایجادشده

```text
name: neofit
project id/ref: rjwrobltmjodfarnltal
organization id: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
created at: 2026-08-04T20:45:48.830422Z
api url: https://rjwrobltmjodfarnltal.supabase.co
```

Baseline:

- modern publishable key enabled؛ value خارج Git نگه داشته می‌شود.
- Service Role درخواست یا افشا نشده است.
- `public` schema هیچ Application table ندارد.
- Auth UI، migration، generated types، RLS و user tables هنوز شروع نشده‌اند.

Evidence:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`

## ۴. معماری قفل‌شده

```text
Next.js Client Components
  -> Supabase browser client
  -> publishable key
  -> RLS-protected Data API

Next.js Server Components / Actions / Route Handlers
  -> cookie-aware Supabase server client
  -> getClaims() for protected identity paths
  -> RLS remains enforced

Next.js Proxy
  -> refresh/synchronize auth cookies
  -> no business authorization by itself

Operational scripts only
  -> service role / DB credentials when later required
  -> never bundled into Web

Postgres
  -> supabase/migrations/*.sql as sole schema authority
  -> RLS on every exposed user-owned table
  -> generated TypeScript database types

Nutrition values
  -> packages/nutrition-core only
  -> SQL persists versioned output and does not recalculate
```

## ۵. Environment و Secret contract

Browser-safe variable names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Server/operations-only variables، فقط در صورت نیاز آینده:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
SUPABASE_PROJECT_REF
```

قواعد:

- هیچ Key واقعی در Git، docs، logs یا artifacts ثبت نشود.
- `.env.example` فقط نام متغیرها و توضیح نگه دارد.
- هیچ Server-only variable با `NEXT_PUBLIC_` شروع نشود.
- Browser source/bundle نباید Service Role identifier یا value داشته باشد.
- Publishable key امنیت ایجاد نمی‌کند؛ امنیت Browser به RLS وابسته است.

## ۶. Stage 4B — Local config + SSR clients

Branch/PR مستقل و test-first.

فایل‌های هدف:

```text
supabase/config.toml
web/lib/supabase/env.ts
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/.env.example
web/tests/supabase-foundation.test.ts
```

Dependencies:

```text
@supabase/supabase-js
@supabase/ssr
supabase CLI as dev dependency only when required by config/type workflow
```

Acceptance criteria:

1. Browser client فقط Browser-safe env می‌خواند.
2. Server client cookie-aware است.
3. Proxy cookies را از request به response همگام می‌کند.
4. protected identity helper از `getClaims()` استفاده می‌کند.
5. missing/invalid env fail-closed و پیام واضح دارد.
6. Session-bearing paths shared/public cache نمی‌شوند.
7. static tests جداسازی Browser/Server و secret boundary را اثبات می‌کنند.
8. هیچ user table یا migration در این Batch اعمال نمی‌شود.
9. Web و Nutrition Core regression سبز می‌ماند.

## ۷. Stage 4C — Identity schema + RLS

Migration اول:

### `profiles`

- `id uuid primary key references auth.users(id)`.
- nullable bounded `display_name`.
- `locale` محدود به `fa` یا `en`.
- timezone text.
- created/updated timestamps.
- ownership: `id = auth.uid()`.

### `user_settings`

- `user_id uuid primary key references auth.users(id)`.
- bounded theme/units.
- created/updated timestamps.
- ownership: `user_id = auth.uid()`.

RLS matrix:

| Table | anon | select | insert | update | delete |
|---|---|---|---|---|---|
| profiles | deny | own | own id | own + check | own/restricted |
| user_settings | deny | own | own user_id | own + check | own |

Policy pattern:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

برای profiles از `id` استفاده می‌شود.

ممنوع:

- `using (true)` برای User data.
- اعتماد به `user_id` ورودی بدون `with check`.
- Disable کردن RLS برای ساده‌سازی توسعه.
- Schema edit صرفاً از Dashboard.

Stage 4C همچنین باید generated types، advisor review و cross-user denial tests داشته باشد.

## ۸. Stage 4D — Nutrition persistence contracts

### `nutrition_goals`

Input هدف را ذخیره می‌کند؛ progress/remaining در Shared Core محاسبه می‌شود.

### `nutrition_entries`

Versioned Shared Core output و source metadata را ذخیره می‌کند.

قواعد:

- SQL estimate را ضرب، جمع یا round نمی‌کند.
- absent nutrient صفر نمی‌شود.
- `grams: null` حفظ می‌شود.
- source identity و `core_schema_version` اجباری‌اند.
- `client_mutation_id` برای idempotency foundation استفاده می‌شود.
- Offline queue/conflict resolution خارج Stage 4 است.

## ۹. Migration و generated types authority

- فقط `supabase/migrations/*.sql` Schema authority است.
- Migrationها timestamped و تک‌هدف‌اند.
- Remote migration با forward-fix اصلاح می‌شود، نه حذف تاریخچه.
- generated file پیشنهادی:

```text
web/lib/supabase/database.types.ts
```

Command authority:

```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" --schema public > web/lib/supabase/database.types.ts
```

CI باید generated drift را رد کند.

## ۱۰. Test strategy

### Stage 4B

- env validation.
- Browser/Server import boundary.
- no service-role identifier in Browser files.
- proxy cookie contract.
- `getClaims()` contract.
- Web TypeScript/build/PWA regression.
- Nutrition Core `52/52` regression.

### Stage 4C/4D

حداقل RLS scenarios:

1. anon هیچ User rowی نمی‌خواند.
2. User A row خودش را می‌خواند.
3. User A row User B را نمی‌خواند.
4. User A نمی‌تواند owner=B insert کند.
5. User A ownership را به B تغییر نمی‌دهد.
6. cross-user update/delete رد می‌شود.
7. unauthenticated `auth.uid()` null fail-closed است.
8. generated types با schema همگام‌اند.
9. Nutrition estimate read/write round-trip مقدار را تغییر نمی‌دهد.

## ۱۱. Batch plan

- **4A complete:** explicit decision، cost confirmation، Project creation، evidence.
- **4B next:** CLI/config، env contract، Browser/Server/Proxy clients، tests، بدون tables.
- **4C:** profiles/user_settings، RLS، generated types، advisors، integration tests.
- **4D:** nutrition_goals/nutrition_entries، versioned JSON contract، round-trip tests.
- **Closure:** migrations/advisors/RLS tests/Core+Web CI/docs، سپس Issue #25 close.

## ۱۲. Claim boundaries

ثابت شده:

- Organization/Region/Cost پذیرفته شدند.
- Cost confirmation اجرا شد.
- Project مستقل ساخته و healthy است.
- Project ref/URL/region/status ثبت شده‌اند.
- public schema baseline خالی است.

ثابت نشده:

- Auth/SSR clients.
- Cookie proxy.
- Migration/RLS/tables.
- generated types.
- Vercel env configuration.
- Stage 4B/4C/4D closure.

## ۱۳. Process correction

Stage 4A Evidence به‌دلیل ایجادنشدن Branch موردنظر، ابتدا مستقیم روی Integration با Placeholder ایجاد شد و بلافاصله اصلاح شد. فایل موقت `docs/.tmp` نیز بلافاصله حذف شد. هیچ code/schema/key/runtime تغییر نکرد.

از Stage 4B به بعد Branch/PR مستقل اجباری است.

## ۱۴. Exact continuation point

1. CI روی Integration HEAD دارای Stage 4A docs بررسی شود.
2. Issue #25 با Project evidence به‌روز شود.
3. Branch `stage4b/supabase-ssr-foundation` از Integration HEAD ساخته شود.
4. Draft PR مستقل باز شود.
5. tests/contracts قبل از implementation نوشته شوند.
6. Dependencies/config/browser/server/proxy clients بدون tables پیاده شوند.
7. Core/Web CI، review threads و secret scan بررسی شوند.
8. Master Plan، Progress Log و این Plan در checkpoint بعدی به‌روز شوند.
9. Stage 2B Vercel مستقل در Issue #16 / PR #28 باز بماند.

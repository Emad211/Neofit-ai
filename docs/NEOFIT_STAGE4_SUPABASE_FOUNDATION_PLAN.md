# NeoFit Stage 4 — Supabase Auth, Postgres and RLS Foundation Plan

**وضعیت:** Planning/Decision checkpoint — زیرساخت هنوز ساخته نشده است  
**تاریخ:** ۴ اوت ۲۰۲۶  
**Issue:** #25  
**Branch:** `stage4/supabase-foundation-plan`  
**Base:** Stage 3 closure merge `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`  
**Integration branch:** `web/pwa-foundation`

---

## ۱. هدف

Stage 4 باید کوچک‌ترین Foundation امن و قابل‌ممیزی Supabase را برای NeoFit ایجاد کند، بدون اینکه:

- Nutrition arithmetic از `packages/nutrition-core` خارج شود؛
- IFKB identity/provenance contracts تضعیف شوند؛
- SQL یا UI عدد تغذیه‌ای جدید اختراع کند؛
- Auth، RLS، migration و secret handling به‌صورت موقت یا permissive پیاده شوند؛
- Scope به AI، Catalog sync یا محصول کامل گسترش پیدا کند.

Stage 4 یک Vertical Slice کامل نیست. Vertical Slice تغذیه در Stage 5 ساخته می‌شود.

---

## ۲. وضعیت واقعی حساب Supabase

بررسی مستقیم از Connector متصل انجام شد.

### Organization

- Name: `Emad's Org`
- Organization ID: `yzymkjsfqoohxbqkhzhs`

### Existing projects

| Name | Project ref | Region | Status |
|---|---|---|---|
| `Emad211's Project` | `albwvkdamcmvukhzafep` | `eu-central-1` | `INACTIVE` |
| `nila-gol` | `msiowolgbuffddhcdmqw` | `eu-central-1` | `INACTIVE` |

### NeoFit project

- Project named NeoFit: **وجود ندارد**
- Project ref: ندارد
- Database: ندارد
- Auth config: ندارد
- Migration history: ندارد
- Tables/RLS: ندارد

### Cost read

Supabase `get_cost` برای Project جدید در Organization بالا:

- type: `project`
- recurrence: `monthly`
- amount: `0`

این مقدار فقط خروجی فعلی Connector در زمان بررسی است. Project creation فقط پس از پذیرش صریح کاربر و اجرای `confirm_cost` مجاز است.

---

## ۳. Decision record پیشنهادی

| Decision | Proposed value | Status |
|---|---|---|
| Organization | `Emad's Org` / `yzymkjsfqoohxbqkhzhs` | verified، منتظر پذیرش |
| Region | `eu-central-1` | proposed، منتظر پذیرش |
| Cost | `0` monthly | connector-verified، منتظر پذیرش |
| Project name | `neofit` | proposed |
| Environment model | یک Project اولیه + migration-driven environments | proposed |

### دلیل Region پیشنهادی

- هر دو Project موجود حساب در `eu-central-1` هستند.
- کاربر و Web geography فعلی در اروپا قرار دارد.
- یک Region واحد در Foundation اولیه از پیچیدگی replication و چندمحیطی جلوگیری می‌کند.

این دلیل، Benchmark latency یا تعهد residency نیست. Region فقط پس از پذیرش صریح قفل می‌شود.

---

## ۴. منابع رسمی معماری

### Auth SSR / Next.js

مرجع رسمی Supabase:

- `https://supabase.com/docs/guides/auth/server-side/nextjs`

قراردادهای لازم:

- استفاده از `@supabase/supabase-js` و `@supabase/ssr`؛
- Browser client و Server client جدا؛
- Session در SSR با Cookie مدیریت شود؛
- Proxy فقط روی Routeهای لازم اجرا شود؛
- برای حفاظت Page/Data از `getClaims()` استفاده شود؛
- `getSession()` به‌تنهایی مبنای Authorization در Server نباشد؛
- Responseهای session-bearing نباید به‌صورت اشتباه برای کاربران دیگر Cache شوند.

### Row Level Security

مرجع رسمی Supabase:

- `https://supabase.com/docs/guides/database/postgres/row-level-security`

قراردادهای لازم:

- RLS روی تمام Tableهای exposed در `public` فعال باشد؛
- Table بدون Policy از Browser با publishable key قابل‌استفاده نباشد؛
- Ownership با `(select auth.uid()) = user_id` یا `id` کنترل شود؛
- `anon` برای User data هیچ دسترسی نداشته باشد؛
- Policyهای Insert علاوه بر `using` به `with check` نیاز دارند؛
- Service Role فقط در محیط Server/Operations و خارج Browser نگه‌داری شود.

### Generated TypeScript types

مرجع رسمی Supabase:

- `https://supabase.com/docs/guides/api/rest/generating-types`

قراردادهای لازم:

- Database types از Schema واقعی تولید شوند؛
- فایل generated دستی ویرایش نشود؛
- تولید با Supabase CLI و `--project-id` یا local database انجام شود؛
- CI drift بین Migration و generated types را رد کند.

### Database migrations

مرجع رسمی Supabase:

- `https://supabase.com/docs/guides/deployment/database-migrations`

قراردادهای لازم:

- DDL فقط در migration versioned؛
- Dashboard click تغییر Schema authority نباشد؛
- هر Migration rollback/forward-fix strategy داشته باشد؛
- Production mutation خارج از PR ممنوع باشد.

---

## ۵. معماری قفل‌شدهٔ Stage 4

```text
Next.js Client Components
  -> Supabase browser client (publishable key)
  -> RLS-protected Data API

Next.js Server Components / Actions / Route Handlers
  -> Supabase server client (cookie-aware)
  -> getClaims() for identity protection
  -> RLS still enforced for user-scoped operations

Operational scripts only
  -> service role / database credentials
  -> never bundled into Web

Postgres
  -> versioned migrations
  -> RLS on every exposed user table
  -> generated TypeScript database types

Nutrition values
  -> produced by packages/nutrition-core
  -> Web adapter maps/persists outputs
  -> SQL does not recalculate nutrition
```

---

## ۶. Package و فایل‌های پیشنهادی

بعد از Project approval:

```text
supabase/
  config.toml
  migrations/
    <timestamp>_stage4_foundation.sql
  tests/
    rls/

web/lib/supabase/
  client.ts
  server.ts
  proxy.ts
  database.types.ts

web/proxy.ts
web/.env.example
```

Dependencyهای پیشنهادی:

```text
@supabase/supabase-js
@supabase/ssr
supabase (devDependency / CLI)
```

هیچ ORM در Batch اول اضافه نمی‌شود. دلیل: Data API + generated types برای Foundation فعلی کافی است و ORM دوم authority جدید ایجاد می‌کند.

---

## ۷. Environment و Secret contract

### Browser-safe

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

این مقادیر Secret محسوب نمی‌شوند، اما Browser فقط با RLS امن است.

### Server-only / Operations

در Batch اولیه Web runtime نیازی به Service Role ندارد.

اگر عملیات مدیریتی بعداً نیاز شد:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
```

قواعد:

- هیچ متغیر Server-only با prefix `NEXT_PUBLIC_` تعریف نشود؛
- Service Role در Client Component، Browser bundle، log یا Artifact قرار نگیرد؛
- `.env*` وارد Git نشود؛
- `.env.example` فقط نام متغیرها و توضیح را نگه دارد؛
- CI باید Browser bundle را برای service-role identifier بررسی کند.

---

## ۸. Auth flow اولیه

Batch اول Auth فقط Foundation است.

### روش اولیه پیشنهادی

- Email + Password یا Email OTP به‌عنوان اولین Provider؛
- Social login، anonymous login، MFA و organization roles خارج از Batch اول؛
- Redirect allowlist فقط local و URLهای تأییدشده؛
- UI Auth کوچک و جدا از Nutrition flow.

### Session validation

- Browser: browser client؛
- Server: cookie-aware server client؛
- Proxy: refresh token/cookie synchronization؛
- Protected route: `getClaims()`؛
- Server authorization: هرگز فقط بر اساس payload فرم یا `getSession().user` تصمیم نگیرد.

### Cache rule

Page یا Response وابسته به Session نباید به‌صورت Public/shared cache شود.

---

## ۹. Schema boundary پیشنهادی

Stage 4 باید User ownership و persistence contract را بسازد، نه Catalog کامل.

### Batch 4A — Identity foundation

#### `profiles`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | PK، FK به `auth.users(id)`، همان owner identity |
| `display_name` | `text` | nullable، trim/bounded |
| `locale` | `text` | `fa` یا `en` |
| `timezone` | `text` | default مناسب، validate در App |
| `created_at` | `timestamptz` | server default |
| `updated_at` | `timestamptz` | server default/trigger |

#### `user_settings`

| Column | Type | Rule |
|---|---|---|
| `user_id` | `uuid` | PK/FK، owner |
| `theme` | `text` | bounded enum-like check |
| `units` | `text` | metric در Foundation |
| `created_at` | `timestamptz` | server default |
| `updated_at` | `timestamptz` | server default/trigger |

### Batch 4B — Nutrition persistence contract

#### `nutrition_goals`

هدف: ذخیرهٔ Input هدف، نه محاسبهٔ Progress.

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | owner |
| `effective_from` | `date` | required |
| `daily` | `jsonb` | NutritionVector-compatible input |
| `core_schema_version` | `smallint` | versioned |
| `created_at` | `timestamptz` | server default |
| `updated_at` | `timestamptz` | server default |

Progress و remaining فقط در Shared Core محاسبه می‌شوند.

#### `nutrition_entries`

هدف: ذخیرهٔ خروجی Versioned Shared Core و metadata ثبت.

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | PK، client-generated مجاز |
| `user_id` | `uuid` | owner |
| `local_date` | `date` | required |
| `meal_type` | `text` | breakfast/lunch/dinner/snack |
| `label` | `text` | bounded |
| `source_type` | `text` | food/recipe/custom |
| `source_id` | `text` | required |
| `estimate` | `jsonb` | serialized NutritionEstimate |
| `core_schema_version` | `smallint` | required |
| `client_mutation_id` | `uuid` | idempotency/sync foundation |
| `created_at` | `timestamptz` | server default |
| `updated_at` | `timestamptz` | server default |

قواعد:

- SQL estimate را ضرب، جمع یا Round نمی‌کند؛
- Missing nutrient در JSON حذف‌شده/absent باقی می‌ماند، نه صفر؛
- `grams: null` حفظ می‌شود؛
- Source identity و Core schema version اجباری‌اند؛
- Full Offline queue و conflict resolution در Stage 7 است.

### خارج از Stage 4

- Full IFKB browser catalog tables؛
- Catalog image metadata؛
- Search index/FTS برای 13,225 records؛
- AI plan tables؛
- Vision cache؛
- encrypted AvalAI keys؛
- workout domain؛
- audit warehouse.

---

## ۱۰. RLS policy matrix

اصل: تمام Tableهای User-owned با `user_id` یا `id = auth.uid()` محافظت می‌شوند.

| Table | anon | authenticated select | insert | update | delete |
|---|---|---|---|---|---|
| `profiles` | deny | own row | own id only | own row | own row یا restricted |
| `user_settings` | deny | own row | own user_id only | own row | own row |
| `nutrition_goals` | deny | own rows | `user_id = auth.uid()` | own rows + with check | own rows |
| `nutrition_entries` | deny | own rows | `user_id = auth.uid()` | own rows + with check | own rows |

### Policy pattern

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

برای `profiles`:

```sql
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id)
```

### ممنوع

- `using (true)` برای User data؛
- اعتماد به `user_id` ارسال‌شده بدون `with check`؛
- Client-visible Service Role؛
- Policy بر اساس Email/display name؛
- Cross-user reads برای debug؛
- Disable کردن RLS برای ساده‌کردن توسعه.

---

## ۱۱. Migration strategy

### Authority

- `supabase/migrations/*.sql` تنها Schema authority؛
- Migration نام‌گذاری زمان‌دار و تک‌هدف؛
- هر PR فقط یک Batch کوچک Schema؛
- SQL format/check و destructive-operation review اجباری.

### First migration proposed contents

1. helper `set_updated_at`؛
2. `profiles`؛
3. `user_settings`؛
4. RLS enable؛
5. Grants محدود؛
6. Policies؛
7. indexes ضروری؛
8. comments برای ownership/security.

`nutrition_goals` و `nutrition_entries` می‌توانند در Migration دوم همان Stage قرار گیرند تا Identity/Auth Foundation مستقل قابل‌اثبات بماند.

### Rollback

- Migration applied به Shared/remote با delete تاریخی بازگردانده نمی‌شود؛
- خطا با forward-fix migration اصلاح می‌شود؛
- قبل از دادهٔ واقعی، destructive reset فقط روی Local/Development مجاز؛
- Production rollback باید migration جدید و plan داده داشته باشد.

---

## ۱۲. Generated types contract

فایل پیشنهادی:

```text
web/lib/supabase/database.types.ts
```

Command authority:

```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" --schema public > web/lib/supabase/database.types.ts
```

Local:

```bash
npx supabase gen types typescript --local > web/lib/supabase/database.types.ts
```

CI:

1. Types تولید شوند؛
2. با فایل Commit‌شده Diff شوند؛
3. Drift باعث Failure شود؛
4. فایل generated دستی اصلاح نشود.

---

## ۱۳. Test strategy

### Static gates

- Service-role string در Browser files وجود نداشته باشد؛
- RLS enable برای هر Table؛
- هر Table حداقل Policy select/insert/update/delete لازم را داشته باشد؛
- Migration و generated types همگام باشند؛
- Web TypeScript/Build/PWA regression سبز بماند؛
- Nutrition Core `52/52` سبز بماند.

### Database/RLS tests

حداقل سناریوها:

1. anon هیچ User rowی نمی‌خواند؛
2. User A row خودش را می‌خواند؛
3. User A row User B را نمی‌خواند؛
4. User A نمی‌تواند `user_id = B` insert کند؛
5. User A نمی‌تواند ownership row موجود را به B تغییر دهد؛
6. Profile ID باید با Auth UID برابر باشد؛
7. Service operation فقط در Test/Operations context؛
8. delete/update cross-user رد شود؛
9. unauthenticated `auth.uid()` null رفتار fail-closed داشته باشد.

### Application tests

- browser/server client separation؛
- protected Server path از `getClaims()` استفاده کند؛
- Session route shared-cache نشود؛
- Nutrition adapter output بدون تغییر persist/read round-trip شود؛
- `grams: null` و absent nutrients حفظ شوند.

---

## ۱۴. Batch plan

### Stage 4A — Decision + Project creation

Gate:

- Organization accepted؛
- Region accepted؛
- Cost accepted؛
- `confirm_cost` اجرا؛
- Project ساخته و Project ID/Ref/Region ثبت شود.

### Stage 4B — Local config + SSR clients

- CLI init/link؛
- dependencies؛
- browser/server/proxy clients؛
- Env example؛
- Auth protection tests؛
- بدون user tables در اولین commit ممکن است.

### Stage 4C — Identity schema + RLS

- profiles؛
- user_settings؛
- RLS matrix؛
- generated types؛
- advisors security/performance؛
- RLS integration tests.

### Stage 4D — Nutrition persistence contracts

- nutrition_goals؛
- nutrition_entries؛
- JSON/core schema contract؛
- idempotency field؛
- round-trip tests؛
- بدون IndexedDB queue.

### Stage 4 Closure

- migrations recorded؛
- advisors reviewed؛
- RLS tests pass؛
- Web + Core CI pass؛
- Master Plan و Progress Log update؛
- Issue #25 close فقط پس از evidence.

---

## ۱۵. Acceptance criteria برای Project creation

قبل از `confirm_cost` و `create_project` هر سه مورد باید در پیام کاربر پذیرفته شوند:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
```

پس از پذیرش:

1. `Supabase.confirm_cost`؛
2. Project creation با نام `neofit`؛
3. ثبت Project ID/ref/region/status؛
4. هیچ Table یا Auth change در همان عملیات بدون Branch/PR evidence انجام نشود؛
5. Master Plan و Progress Log update شوند.

---

## ۱۶. Claim boundaries

این Plan ثابت می‌کند:

- حساب/Organization/Project inventory بررسی شده؛
- هزینهٔ فعلی Project از Connector خوانده شده؛
- معماری و Security gate تعریف شده؛
- Stage 4 به Batchهای کوچک تقسیم شده است.

این Plan ثابت نمی‌کند:

- کاربر Organization/Region/Cost را پذیرفته؛
- Supabase Project ساخته شده؛
- Auth فعال است؛
- Migration اجرا شده؛
- RLS یا Table وجود دارد؛
- Vercel Preview ساخته شده؛
- Stage 4 implementation شروع شده است.

---

## ۱۷. Exact continuation point

1. Issue #25، این سند، Master Plan و Progress Log خوانده شوند.
2. Supabase Organization/Projects/Cost دوباره از ابزار واقعی کنترل شوند.
3. کاربر باید دقیقاً Organization، Region و Cost را بپذیرد.
4. فقط پس از پذیرش، `confirm_cost` و Project creation انجام شود.
5. Project ID/ref/region/status در Issue و هر دو سند ثبت شود.
6. Stage 4B در Branch/PR مستقل و test-first آغاز شود.
7. Issue #16 برای Vercel HTTPS همچنان باز بماند.

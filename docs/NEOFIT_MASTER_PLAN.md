# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۵ اوت ۲۰۲۶ — Stage 4A کامل؛ Project مستقل Supabase ساخته شد  
**Integration branch:** `web/pwa-foundation`  
**Stage 4 Issue:** #25 — open  
**Stage 2B Issue/PR:** #16 / #28 — مستقل و باز  
**مرحلهٔ فعال بعدی:** Stage 4B — Supabase local config و SSR client foundation

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md` خوانده شود.
5. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
6. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- Master Plan و Progress Log با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- README و Development Handoff نباید Stage قدیمی را قدم بعد معرفی کنند.
- هیچ Project، Build، Deployment، Preview، Migration، RLS، Parity یا Accuracy بدون Evidence اعلام نشود.
- حافظهٔ مکالمه جای ریپو، CI یا Connector state را نمی‌گیرد.

## ۲. قراردادهای قفل‌شده

- Web: Next.js App Router + strict TypeScript.
- Shared nutrition authority: `packages/nutrition-core`.
- Data authority: IFKB + USDA SR Legacy + FNDDS.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- SQL و React Nutrition arithmetic را تکرار نمی‌کنند.
- Schema authority فقط `supabase/migrations/*.sql` است.
- هر Table exposed و user-owned پیش از Application use باید RLS داشته باشد.
- Service Role هرگز وارد Browser bundle، Client Component، log یا Artifact نمی‌شود.
- Browser client و Server client جدا هستند.
- Server authorization فقط با `getSession()` انجام نمی‌شود؛ protected identity path از `getClaims()` استفاده می‌کند.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 Persian RTL UX | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A PWA Foundation | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B Vercel HTTPS | active/parallel | Issue #16، Draft PR #28 |
| 3 Nutrition Core/Web parity | complete | PR #18–#24، Issue #17 closed |
| 4A Supabase decision/project | complete | explicit acceptance + project `rjwrobltmjodfarnltal` |
| 4B Supabase client foundation | next | Branch/PR مستقل و test-first |
| 4C Identity schema/RLS | not started | بعد از 4B |
| 4D Nutrition persistence | not started | بعد از 4C |
| 5–9 | not started | طبق Roadmap |

## ۴. Stage 3 final state

- Core `52/52`.
- Web Adapter `9/9`.
- 13 Pure source files.
- Closure merge `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`.
- Shared Core تنها Nutrition calculation authority است.

## ۵. Stage 4 planning evidence

- Planning PR #26 merged: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`.
- Handoff PR #27 merged: `e79df1b20b1769f4c2b4b2084510664d76bd0d72`.
- Plan: `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`.
- Issue #25 باز است تا Auth/Postgres/RLS Foundation کامل شود.

## ۶. Stage 4A — accepted and completed

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

سپس `confirm_cost` و `create_project` اجرا شدند.

### Created project

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

- modern publishable key enabled؛ مقدار آن در Git ثبت نشده است.
- Service Role درخواست یا افشا نشده است.
- `public` schema بلافاصله بعد از Provisioning هیچ Application table نداشت.
- Auth UI، migration، generated types، profiles، settings، nutrition tables و RLS هنوز وجود ندارند.

Authority evidence:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`

### Process correction

فایل Evidence ابتدا به‌اشتباه با Placeholder مستقیم روی Integration ساخته شد و بلافاصله با Evidence کامل جایگزین شد. یک فایل موقت `docs/.tmp` نیز ایجاد و فوراً حذف شد. این Correction هیچ Application code، Schema، Key، Migration یا Runtime behavior را تغییر نداد.

از Stage 4B به بعد Branch/PR مستقل اجباری است.

## ۷. Stage 4B scope

Stage 4B فقط Foundation اتصال و Session است:

```text
supabase/config.toml
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/.env.example
```

Dependencies:

```text
@supabase/supabase-js
@supabase/ssr
supabase CLI as dev dependency when justified
```

Stage 4B باید شامل این Gateها باشد:

- Browser/Server client separation.
- Cookie-aware server client.
- Proxy session synchronization.
- `getClaims()` contract for protected paths.
- Environment validation.
- `.env.example` فقط نام متغیرها؛ بدون Key واقعی.
- Browser source/bundle بدون Service Role identifier.
- Test-first static/unit tests.
- Web و Nutrition Core regression سبز.

در Stage 4B هیچ user table، migration application، Auth UI کامل یا RLS policy ساخته نمی‌شود مگر در PR جدا و بازبینی‌شدهٔ Stage 4C.

## ۸. Stage 4C و 4D

### 4C — Identity schema + RLS

- `profiles`.
- `user_settings`.
- versioned migration.
- RLS ownership matrix.
- generated database types.
- security/performance advisors.
- cross-user denial tests.

### 4D — Nutrition persistence

- `nutrition_goals`.
- `nutrition_entries`.
- persist Shared Core output without SQL recalculation.
- preserve absent nutrients and `grams: null`.
- idempotency foundation with `client_mutation_id`.
- round-trip tests.

## ۹. Claim boundaries

ثابت شده است:

- Stage 3 کامل است.
- Organization/Region/Cost پذیرفته شدند.
- Cost confirmation اجرا شد.
- Project مستقل `neofit` ساخته و `ACTIVE_HEALTHY` شد.
- Project URL و ref ثبت شده‌اند.
- `public` schema در baseline خالی است.

ثابت نشده است:

- Auth flow یا SSR client کار می‌کند.
- Migration یا Application table وجود دارد.
- RLS وجود دارد.
- generated types ساخته شده‌اند.
- Vercel env تنظیم شده است.
- Stage 4B/4C/4D کامل شده‌اند.
- Stage 2B Vercel بسته شده است.

## ۱۰. Anti-goalها

- استفادهٔ مجدد از Project unrelated.
- Commit کردن publishable/service-role key.
- Service Role در Browser.
- Dashboard-only schema edits.
- Table exposed بدون RLS.
- permissive policy مانند `using (true)` برای User data.
- Authorization فقط با `getSession()`.
- Nutrition arithmetic در SQL یا UI.
- Full Catalog/IndexedDB/AI/Vision در Stage 4.
- Production promotion از مسیر Stage 2B.

## ۱۱. Exact continuation point

1. Integration HEAD و CI ناشی از Stage 4A docs بررسی شوند.
2. Issue #25 با Project ref/region/status/URL همگام شود.
3. Branch مستقل `stage4b/supabase-ssr-foundation` از Integration HEAD ساخته شود.
4. PR مستقل Stage 4B باز شود.
5. ابتدا tests/contracts برای env، Browser/Server separation، proxy و secret boundary نوشته شوند.
6. سپس Supabase dependencies/config/clients پیاده شوند.
7. Web و Core CI و Review threadها بررسی شوند.
8. Master Plan، Progress Log و Stage 4 Plan در هر checkpoint به‌روز شوند.
9. Stage 2B Issue #16 / PR #28 مستقل و باز باقی بماند.

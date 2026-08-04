# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 4 planning merged؛ منتظر پذیرش زیرساخت  
**Integration branch:** `web/pwa-foundation`  
**Stage 3 closure merge:** `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`  
**Stage 3 Issue:** #17 — closed/completed  
**Stage 4 planning merge:** `094fc099f624b0349d6ed3bd1485bad6f11fdf14`  
**Stage 4 Issue:** #25 — open  
**Deferred Vercel Issue:** #16  
**مرحلهٔ فعال:** Stage 4A decision gate؛ Supabase Project هنوز ساخته نشده است

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
5. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- هر دو سند اجباری با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای ریپو، CI یا Connector state را نمی‌گیرد.

## ۲. معماری و قراردادهای قفل‌شده

- Web: Next.js App Router + strict TypeScript
- Shared nutrition domain: `packages/nutrition-core`
- Web Nutrition boundary: `web/lib/nutrition-adapter.ts`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- Web و SQL Nutrition arithmetic را تکرار نمی‌کنند.
- Supabase Schema authority فقط migration versioned است.
- RLS روی تمام Tableهای exposed و user-owned پیش از Application use اجباری است.
- Service Role هرگز وارد Browser bundle، Client Component، log یا Artifact نمی‌شود.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 Persian RTL UX | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A PWA Foundation | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B Vercel HTTPS | deferred | Issue #16؛ Preview واقعی ندارد |
| 3 Nutrition Core/Web parity | complete | PR #18–#24؛ Issue #17 closed |
| 4 Supabase foundation | decision gate | PR #26 planning merged؛ Issue #25 open |
| 5–9 | not started | طبق Roadmap |

### Stage 3 final state

Implementation merges:

- Batch 1 `c9599c4905f9fc1d28ba7e9086edf20376991740`
- Batch 2 `917f04e319a924dda7dfb16d079453a5e5686541`
- Batch 3 `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- Batch 4 `d6c0df31999595096224ec1011574245d5dc75ad`
- Batch 5 `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- Batch 6 `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`
- Closure `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

Final suites:

- Core `52/52`
- Web Adapter `9/9`
- 13 Pure source files
- strict TypeScript، Next build، Visual و PWA runtime pass

Final closure head `43102e4925effb4f8c80dfa05b1588c08dd2f263`:

- Nutrition CI `30868884712`، Artifact `8877128689`
- Web CI `30868884702`، Artifact `8877147921`

## ۴. Stage 4 planning checkpoint — merged

### GitHub records

- Issue #25: `Stage 4: Supabase Auth, Postgres and RLS foundation`
- Planning branch: `stage4/supabase-foundation-plan`
- Planning PR #26
- Merge: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`
- Plan: `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`

### Verified Supabase account state

Organization:

```text
Emad's Org
yzymkjsfqoohxbqkhzhs
```

Projects:

| Name | Ref | Region | Status |
|---|---|---|---|
| `Emad211's Project` | `albwvkdamcmvukhzafep` | `eu-central-1` | `INACTIVE` |
| `nila-gol` | `msiowolgbuffddhcdmqw` | `eu-central-1` | `INACTIVE` |

NeoFit Supabase project:

- وجود ندارد
- Project ID/ref ندارد
- Auth/Table/RLS/Migration ندارد

Cost read from Connector:

```text
type: project
recurrence: monthly
amount: 0
```

### Proposed decision — not yet accepted

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Region بر اساس Region فعلی Projectهای حساب و geography اروپایی پیشنهاد شده است؛ Benchmark latency/residency نیست.

### Planning evidence

Candidate head `65868b0ebd50e99781c5d0dee49e598352e10b96`:

- Nutrition CI `30916037781` — success
- Artifact `8895077703`
- Digest `sha256:1772d2b6a66f34bbcb2044d1e28be82e2b3780b78636e687104c6d49add556a1`
- Web CI `30916032109` — success
- Artifact `8895107603`
- Digest `sha256:fd2b5de8c0f55f5d4d93b5b3c0fd34a6723a49e0ee31470d2c2cb620699d610f`

Final planning docs head `e54a2bdf7c40a60e70c6c36737e25ac434ea5b19`:

- Nutrition CI `30916469886` — success
- Artifact `8895252025`
- Digest `sha256:b94888510ea6ed4d6a094fb1667114432aa3678edcd862bf6167ebde47adb6fd`
- Web CI `30916467290` — success
- Artifact `8895277329`
- Digest `sha256:64d11b14be1edf70bd3723cdbeb4d38ff9e8fda708807b9618841e68add77fdb`
- Review threads before merge: 0

### Architecture accepted by planning PR

- `@supabase/supabase-js` + `@supabase/ssr`
- Browser/Server client separation
- cookie-aware Next.js proxy
- `getClaims()` برای protected identity paths
- generated database types
- migrations as Schema authority
- RLS و ownership با `auth.uid()`/`with check`
- anon denied برای User data
- Service Role فقط Server/Operations
- Shared Core تنها Nutrition calculation authority

### Planned Stage 4 batches

- 4A: explicit decision، cost confirmation، Project creation
- 4B: CLI/config + SSR clients
- 4C: profiles/user_settings + RLS + generated types
- 4D: nutrition_goals/nutrition_entries persistence contracts
- Closure: advisors، RLS tests، Core/Web CI و docs

## ۵. Current hard gate

کاربر باید این سه مقدار را صریحاً بپذیرد:

1. Organization `Emad's Org`
2. Region `eu-central-1`
3. Cost `0` monthly

تا قبل از پذیرش:

- `Supabase.confirm_cost` اجرا نمی‌شود؛
- Project ساخته نمی‌شود؛
- Auth/Schema/RLS implementation آغاز نمی‌شود.

## ۶. Claim boundaries

ثابت شده است:

- Stage 3 کامل و بسته است.
- Supabase Organization/Projects/Cost بررسی شده‌اند.
- Stage 4 architecture/security plan Merge شده است.
- Planning checkpoint در Core/Web CI سبز است.

انجام نشده است:

- پذیرش Organization/Region/Cost؛
- NeoFit Supabase Project؛
- Auth/SSR clients؛
- Postgres migrations/RLS؛
- Full Browser Catalog/IndexedDB؛
- AI/Vision Web flow؛
- Vercel HTTPS Preview؛
- Public Final Schema/ID freeze.

## ۷. Anti-goalها

- Project creation بدون explicit acceptance
- reuse کردن Project unrelated
- Dashboard-only Schema edits
- permissive RLS
- Service Role در Browser
- Authorization فقط با `getSession()`
- Nutrition arithmetic در SQL/React
- Provider-created Nutrition
- Full Catalog/IndexedDB در Stage 4
- Vercel claim بدون Deployment واقعی

## ۸. Exact continuation point

1. این فایل، Progress Log و Stage 4 Plan کامل خوانده شوند.
2. Issue #25، Supabase Organization/Projects/Cost و Issue #16 بررسی شوند.
3. کاربر باید صریحاً Organization، Region و Cost را بپذیرد.
4. فقط پس از پذیرش `Supabase.confirm_cost` اجرا شود.
5. Project `neofit` ایجاد و ID/ref/region/status ثبت شود.
6. هر دو سند و Issue #25 با Project evidence به‌روزرسانی شوند.
7. Stage 4B در Branch/PR مستقل و test-first آغاز شود.
8. Issue #16 تا Preview واقعی HTTPS باز بماند.

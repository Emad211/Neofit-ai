# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۵ اوت ۲۰۲۶ — Stage 4B implementation candidate سبز؛ PR #30 Draft  
**Integration branch:** `web/pwa-foundation`  
**Integration HEAD:** `13a9407374d2d84d754dcf5eb7d50b8b4176bb64`  
**Stage 4B branch:** `stage4b/supabase-ssr-foundation`  
**Stage 4B PR:** #30 — Draft/active  
**Stage 4 Issue:** #25 — open  
**Stage 2B Issue/PR:** #16 / #28 — مستقل و باز  
**مرحلهٔ فعال:** Stage 4B final documentation/review gate

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md` خوانده شود.
5. برای Stage 4B، `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md` خوانده شود.
6. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
7. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- Master Plan و Progress Log با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- README و Development Handoff نباید Stage قدیمی را قدم بعد معرفی کنند.
- هیچ Project، Build، Deployment، Preview، Migration، RLS، Parity یا Accuracy بدون Evidence اعلام نشود.
- حافظهٔ مکالمه جای ریپو، CI یا Connector state را نمی‌گیرد.

## ۲. قراردادهای قفل‌شده

- Web: Next.js App Router + strict TypeScript.
- Shared Nutrition authority: `packages/nutrition-core`.
- Data authority: IFKB + USDA SR Legacy + FNDDS.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- SQL و React Nutrition arithmetic را تکرار نمی‌کنند.
- Schema authority فقط `supabase/migrations/*.sql` است.
- هر Table exposed و user-owned پیش از Application use باید RLS داشته باشد.
- Service Role هرگز وارد Browser bundle، Client Component، log یا Artifact نمی‌شود.
- Browser client و Server client جدا هستند.
- Server authorization فقط با `getSession()` انجام نمی‌شود؛ protected identity path از `getClaims()` استفاده می‌کند.
- Session-bearing response باید `private, no-store` باشد.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 Persian RTL UX | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A PWA Foundation | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B Vercel HTTPS | active/parallel | Issue #16، Draft PR #28 |
| 3 Nutrition Core/Web parity | complete | PR #18–#24، Issue #17 closed |
| 4A Supabase decision/project | complete | Project `rjwrobltmjodfarnltal` |
| 4B Supabase client foundation | candidate green | PR #30، Foundation/Web/Vercel CI green |
| 4C Identity schema/RLS | not started | بعد از Merge 4B |
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
- Issue #25 تا پایان Auth/Postgres/RLS Foundation باز می‌ماند.

## ۶. Stage 4A — complete

Accepted and executed:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Created Project:

```text
name: neofit
project id/ref: rjwrobltmjodfarnltal
organization id: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
api url: https://rjwrobltmjodfarnltal.supabase.co
```

Stage 4A evidence:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`
- publishable key value در Git ثبت نشده است.
- Service Role درخواست یا افشا نشده است.
- baseline `public` schema صفر Application table داشت.

## ۷. Stage 4B — implementation candidate

### Scope implemented

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

Dependencies pinned:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Implemented contracts:

- fail-closed public environment parser.
- Browser client with `createBrowserClient`.
- Server-only cookie-aware client with `createServerClient`.
- Proxy request/response cookie synchronization.
- Proxy identity refresh through `auth.getClaims()`.
- no `getSession()` authorization path.
- `Cache-Control: private, no-store` for session paths.
- Root Proxy scoped to future `/auth/*` and `/account/*` routes.
- existing App/Vercel environment example preserved؛ Supabase values blank.
- no Service Role identifier/value in Browser-reachable files.
- no migration or user table in Stage 4B.

### Test-first red evidence

Red head:

```text
dc8e718d4a95f0cdf271840578157bf599de3183
```

- Web CI `30957552355` — failure.
- Supabase Foundation CI `30957552028` — failure.
- exact first failure: missing `web/lib/supabase/env.ts`.

### Green implementation evidence

Candidate head before base sync:

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

- Stage 4B contracts `10/10`.
- strict TypeScript.
- Shared Core pure boundary and `52/52` tests.
- runtime/config secret scan.
- Web Adapter parity.
- Next production build.
- Visual and PWA runtime/offline/cache gates.
- repository-root Vercel workspace/build contract.

### Base synchronization

Integration advanced with:

```text
13a9407374d2d84d754dcf5eb7d50b8b4176bb64
fix(vercel): deploy the NeoFit Web/PWA from repository root
```

Stage 4B was synchronized through conflict-free merge commit:

```text
e36b5310fc443afbc4f69ca6bf73ca921c050a5c
```

Branch is now behind Integration by zero commits.

### Remote boundary

Supabase was rechecked after implementation:

```text
public schema Application tables: 0
```

No remote migration، table، policy or schema mutation was executed.

Authority evidence:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`

## ۸. Stage 4C — next after Stage 4B merge

Stage 4C must be a new focused Branch/PR and introduce versioned migration plus RLS tests for:

- `profiles`.
- `user_settings`.
- generated database types.
- security/performance advisors.
- anon denial and cross-user denial tests.

No Dashboard-only Schema edits are allowed.

## ۹. Stage 4D — after Stage 4C

- `nutrition_goals`.
- `nutrition_entries`.
- persist Shared Core output without SQL recalculation.
- preserve absent nutrients and `grams: null`.
- idempotency foundation with `client_mutation_id`.
- round-trip tests.

## ۱۰. Claim boundaries

ثابت شده است:

- Stage 3 کامل است.
- Project مستقل `neofit` ساخته و healthy است.
- Stage 4B client/config foundation پیاده شده است.
- Stage 4B tests، TypeScript، Core، Web/PWA و Vercel Build Contract سبز شده‌اند.
- Branch روی آخرین Integration sync است.
- Remote `public` schema همچنان صفر Application table دارد.

ثابت نشده است:

- Login/Signup UI یا callback route اجرا شده است.
- Vercel Supabase env values تنظیم شده‌اند.
- Remote Auth session end-to-end آزمایش شده است.
- Migration، Application table یا RLS وجود دارد.
- generated database types ساخته شده‌اند.
- Stage 4B Merge شده است.
- Stage 2B Vercel HTTPS بسته شده است.

## ۱۱. Anti-goalها

- Commit کردن publishable یا privileged key.
- privileged credential در Browser.
- Dashboard-only schema edits.
- Table exposed بدون RLS.
- permissive policy مانند `using (true)` برای User data.
- Authorization فقط با `getSession()`.
- Nutrition arithmetic در SQL یا UI.
- user table یا migration داخل Stage 4B.
- Full Catalog/IndexedDB/AI/Vision در Stage 4.
- Production promotion از مسیر Stage 2B.

## ۱۲. Exact continuation point

1. Progress Log، Stage 4 Plan، README و Development Handoff با Stage 4B candidate همگام شوند.
2. Foundation/Web/Vercel CI روی Final documentation head سبز شوند.
3. PR #30 changed files و review threads بررسی شوند.
4. PR فقط بعد از Final CI از Draft خارج شود.
5. PR #30 با expected head Merge شود.
6. post-merge evidence در Master/Progress/Issue #25 ثبت شود.
7. Stage 4C در Branch/PR مستقل و migration/RLS test-first آغاز شود.
8. Stage 2B Issue #16 / PR #28 مستقل و باز باقی بماند.

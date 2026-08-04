# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۵ اوت ۲۰۲۶ — Stage 4B implementation candidate green

## پروتکل

در شروع هر نوبت:

1. Master Plan کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. Stage 4A/4B Evidenceها خوانده شوند.
5. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
6. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، Failureها، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | complete | PR #12 |
| 1 | complete/accepted | PR #13 |
| 2A | complete | PR #15 |
| 2B | active/parallel | Issue #16، Draft PR #28 |
| 3 | complete | PR #18–#24، Core `52/52`، Web `9/9` |
| 4A | complete | Project `rjwrobltmjodfarnltal` ACTIVE_HEALTHY |
| 4B | candidate green | Draft PR #30، سه CI سبز |
| 4C–4D | not started | Schema/RLS سپس Nutrition persistence |
| 5–9 | not started | مطابق Master Plan |

---

## Stage 3 closure

- Closure merge: `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`.
- Core `52/52`.
- Web Adapter `9/9`.
- 13 Pure source files.
- Issue #17 closed/completed.

---

## Entry 020–024 — Stage 4 planning

- Issue #25 created.
- Planning PR #26 merged: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`.
- Handoff PR #27 merged: `e79df1b20b1769f4c2b4b2084510664d76bd0d72`.
- Browser/Server separation، `getClaims()`، migration authority، RLS fail-closed و Shared Core authority قفل شدند.
- در پایان این بازه Project وجود نداشت و explicit cost/region/org acceptance Gate بود.

---

## Entry 025 — Stage 4A Project provisioning

**Date:** 5 Aug 2026  
**Issue:** #25

Accepted:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Executed:

- `get_cost` → `0 monthly`.
- `confirm_cost`.
- `create_project`.

Result:

```text
project ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
api url: https://rjwrobltmjodfarnltal.supabase.co
public schema tables: 0
```

Evidence:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`.
- publishable key value وارد Git نشد.
- privileged key درخواست یا افشا نشد.

Process correction مربوط به direct Integration writes و حذف فایل‌های موقت در Stage 4A Evidence ثبت شده است؛ هیچ App/Schema/Secret/Runtime impact نداشت.

---

## Entry 026 — Stage 4B Supabase SSR foundation

**Date:** 5 Aug 2026  
**Issue:** #25  
**PR:** #30  
**Branch:** `stage4b/supabase-ssr-foundation`

### 026.1 Test-first red checkpoint

Commits:

```text
1c7983f61dd88e8e9f9019310901ecc8492f8586  contracts
29bdd0eded785ea6cba002f1bb0e470851732484  test command
dc8e718d4a95f0cdf271840578157bf599de3183  focused CI
```

Red runs:

```text
Web CI 30957552355 — failure
Supabase Foundation CI 30957552028 — failure
```

Exact first failure:

```text
TS2307: Cannot find module '../lib/supabase/env.ts'
```

این Failure ثابت کرد تست قبل از implementation فعال بود.

### 026.2 Implementation

Added:

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

Contracts implemented:

- fail-closed public env parser.
- Browser `createBrowserClient`.
- server-only cookie-aware `createServerClient`.
- request/response cookie synchronization.
- `auth.getClaims()` identity refresh.
- no `getSession()` authorization.
- `Cache-Control: private, no-store`.
- scoped `/auth/*` and `/account/*` Proxy.
- blank Supabase values in `.env.example`.
- no remote migration/table/RLS.

### 026.3 Corrections

1. Existing `.env.example` App/Vercel assignments were preserved; test now checks blank Supabase values instead of replacing prior contract.
2. Dynamic test import changed from `.ts` suffix to extensionless resolution after `TS5097`; Assertions unchanged.
3. Secret scanner narrowed from security docs to runtime/config after docs produced explanatory false positives; Browser-file test remains case-insensitive.

### 026.4 Green candidate

Candidate head:

```text
d796ff66469be062602cc08c11be4f7da6e9279f
```

Supabase Foundation CI:

```text
Run: 30958021239 — success
Artifact: 8911823269
Digest: sha256:72ea57192d121d72474611a65d3a50ea31975336f76f45c6bbdc0f6471d772d5
```

Web CI:

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
- Web TypeScript.
- Shared Core boundary/typecheck/`52/52`.
- secret scan.
- Web Adapter parity.
- Next build.
- Visual/PWA/offline/cache gates.
- repository-root Vercel build contract.

### 026.5 Integration synchronization

Integration advanced with:

```text
13a9407374d2d84d754dcf5eb7d50b8b4176bb64
fix(vercel): deploy the NeoFit Web/PWA from repository root
```

Stage 4B synchronized via:

```text
e36b5310fc443afbc4f69ca6bf73ca921c050a5c
```

Branch is behind Integration by zero commits.

### 026.6 Remote boundary recheck

Supabase Project rechecked after implementation:

```text
public schema Application tables: 0
```

No migration، table، RLS policy or remote schema mutation ran.

### 026.7 Evidence authority

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`.
- Master Plan candidate update: `f16d4b53bdc325cf1f75117bdb1fdb84926bf990`.

---

## Stage 2B parallel state

Vercel HTTPS validation remains independent in Issue #16 / Draft PR #28. Stage 4B does not close that gate.

---

## Exact continuation point

1. Stage 4 Plan، README و Development Handoff با Entry 026 همگام شوند.
2. Final Foundation/Web/Vercel CI روی documentation head اجرا شود.
3. PR #30 review threads و changed files بررسی شوند.
4. PR پس از Final green از Draft خارج شود.
5. PR #30 با expected head Merge شود.
6. post-merge state در Master/Progress/Issue #25 ثبت شود.
7. Stage 4C در Branch/PR مستقل با migration/RLS tests آغاز شود.

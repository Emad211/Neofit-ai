# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 2B reactivated؛ real Preview built؛ remote HTTPS browser gate open

## پروتکل

در شروع هر نوبت:

1. Master Plan کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. برای Stage 4، `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
5. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، مشکلات، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | active | Issue #16، PR #28، real Preview READY، remote browser QA open |
| 3 | complete | Batch 1–6 + Closure PR #24؛ Issue #17 closed |
| 4 | decision gate | Planning PR #26 merged؛ Issue #25 open؛ Project ندارد |
| 5–9 | not started | مطابق Master Plan |

---

## Stage 3 closure evidence

Implementation merges:

- Batch 1 `c9599c4905f9fc1d28ba7e9086edf20376991740`
- Batch 2 `917f04e319a924dda7dfb16d079453a5e5686541`
- Batch 3 `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- Batch 4 `d6c0df31999595096224ec1011574245d5dc75ad`
- Batch 5 `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- Batch 6 `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`
- Closure `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

Final:

- Core `52/52`
- Web Adapter `9/9`
- 13 Pure files
- Issue #17 closed/completed
- Final Nutrition CI `30868884712`، Artifact `8877128689`
- Final Web CI `30868884702`، Artifact `8877147921`

---

## Entry 020 — Stage 4 account reconstruction

**تاریخ:** ۴ اوت ۲۰۲۶  
**Base:** `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

Organization:

```text
Emad's Org
yzymkjsfqoohxbqkhzhs
```

Projects:

```text
Emad211's Project
ref albwvkdamcmvukhzafep
region eu-central-1
status INACTIVE

nila-gol
ref msiowolgbuffddhcdmqw
region eu-central-1
status INACTIVE
```

NeoFit project:

- وجود ندارد
- Project ID/ref ندارد
- Auth/Table/RLS/Migration ندارد

Cost:

```text
type project
recurrence monthly
amount 0
```

هیچ `confirm_cost` یا `create_project` اجرا نشد.

---

## Entry 021 — Stage 4 planning records

- Issue #25 ساخته شد.
- Branch `stage4/supabase-foundation-plan` ساخته شد.
- Plan: `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`
- Planning PR #26 باز شد.

Proposed decision:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

این تصمیم پذیرفته نشده بود.

---

## Entry 022 — Stage 4 planning candidate CI

Head `65868b0ebd50e99781c5d0dee49e598352e10b96`:

- Nutrition CI `30916037781` — success
- Nutrition Artifact `8895077703`
- Web CI `30916032109` — success
- Web Artifact `8895107603`
- Review threads: صفر

---

## Entry 023 — Stage 4 planning merge

Final docs head:

```text
e54a2bdf7c40a60e70c6c36737e25ac434ea5b19
```

- Nutrition CI `30916469886` — success
- Nutrition Artifact `8895252025`
- Web CI `30916467290` — success
- Web Artifact `8895277329`
- Review threads: صفر
- PR #26 Merge: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`

Planning merge ثابت نمی‌کند:

- کاربر تصمیم را پذیرفته؛
- Project ساخته شده؛
- Auth/RLS/Migration وجود دارد.

---

## Entry 024 — Post-merge Stage 4 handoff

- PR #27 Merge: `e79df1b20b1769f4c2b4b2084510664d76bd0d72`
- Issue #25 open
- Supabase project: none
- `confirm_cost`: not called
- Auth/Schema/RLS: not started

Hard gate:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
```

---

## Entry 025 — Stage 2B Vercel reactivation

**تاریخ:** ۴ اوت ۲۰۲۶  
**Integration base:** `e79df1b20b1769f4c2b4b2084510664d76bd0d72`  
**Branch:** `stage2b/vercel-https-reactivation`  
**PR:** #28  
**Issue:** #16 — changed from Deferred to Active

### 025.1 State reconstruction

Vercel Project:

```text
name: neofit-ai
project id: prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
team id: team_BsUv0VprkU4YjdFbQi2hZCEm
project framework setting: null
```

Latest Integration deployment before repair:

```text
deployment: dpl_7kJ7LHEM2MBmz6kwj5pWpM8BcbQc
commit: e79df1b20b1769f4c2b4b2084510664d76bd0d72
state: READY
target: Preview
```

Build log:

- clone repo root؛
- `vercel build`؛
- Build completed حدود ۵۰۰ ms؛
- install اجرا نشده؛
- Next.js detection/build اجرا نشده؛
- output واقعی NeoFit اثبات نشده.

نتیجه: READY deployment قبلی no-op/misconfigured بود و Stage 2B را نمی‌بست.

### 025.2 Issue and branch records

- Issue #16 title شد: `Active: Vercel Preview deployment and HTTPS PWA validation`.
- Branch ساخته شد: `stage2b/vercel-https-reactivation`.
- Draft PR #28 ساخته شد.

### 025.3 First correction and first external failure

Commits:

- `a23677613ccf053c36a3d2db35abe096ec1e3271` — Root `vercel.json`
- `c63286d8f3c648631b9789ea080463b482d65586` — CI deployment contract

Vercel برای اولین بار Install را اجرا کرد، اما Deployment `dpl_RBHqQFDfXjNfvn6bpqzGYcQVwjmb` شکست خورد:

```text
Could not identify Next.js version
No Next.js version detected
Root Directory setting does not match package.json
```

این Failure نشان داد nested `web/package.json` برای Framework detection کافی نیست.

### 025.4 Workspace correction

Commits:

- `19208516fc8166b575100a0532c89b04c56b9ffc` — Root npm workspace
- `c0ddc1991caf36db1f4455c0a46f251a07b4f1e1` — Vercel builds via workspace
- `de3670e25e0b1e439ace2b152a9760b2fa58f0eb` — CI validates workspace contract

Result روی `de3670e…`:

- Vercel detected Next.js `16.2.12`؛
- `npm install` اجرا شد؛
- `npm run build:web` اجرا شد؛
- `next build` compile/TypeScript/static routes پاس شد؛
- Deployment `dpl_9nN5VhHB2uk6Duiv5rVcsMU4uL87` READY شد؛
- Web CI `30927182345` success؛
- Artifact `8899633581`؛
- Digest `sha256:2ae16d0046ccb8f3da2200ac448a0bc562f60f232361e4ccac8086b6eb1c7613`.

### 025.5 Runtime alignment and final validated code head

Commits:

- `377c5f0fb54af3cd0154b43b4cb7435315d18b04` — Root Node `22.x`
- `e495698b411d2d3ee8df82159573a2e06d8e2266` — Web Node `22.x`
- `620a73a1534339e616d6575aa2c48ba40a7093ab` — Core Node `22.x`
- `aeec3b0716b6f60dfe61a745ca266f69e1d640e8` — predeclare Next generated dev types

Final validated code head:

```text
aeec3b0716b6f60dfe61a745ca266f69e1d640e8
```

Vercel Preview:

```text
deployment id: dpl_2rn2B51BZJfjDYtPPhb3VXY7swna
state: READY
target: Preview
branch alias: neofit-ai-git-stage2b-vercel-htt-774980-emads-projects-41cb6447.vercel.app
bundler: Turbopack
Next.js: 16.2.12
```

Build evidence:

- Install success
- PWA icons generated: 4
- Next compile success
- TypeScript success
- static route generation success
- routes: `/`, `/_not-found`, `/manifest.webmanifest`, `/offline`
- output deployed from `/vercel/output`

CI:

- Nutrition Core CI `30927566238` — success
- Artifact `8899755836`
- Digest `sha256:3fffa656b714d13e695e0d47818e9ac9f7ce846dec2cc27231a4f4e92cf7adb8`
- Web CI `30927566018` — success
- Artifact `8899785585`
- Digest `sha256:91fc7d0b78e76f988ab12b199b517eed72c48df95c1d2781d9880789d1c3630b`

### 025.6 Remaining external gate

Vercel Deployment Protection فعال است.

- `get_access_to_vercel_url` temporary share URL تولید می‌کند.
- Fetch connector هنگام بازکردن URL به `vercel.com/sso-api` redirect می‌شود.
- ابزار Fetch Cookie session لازم را نگه نمی‌دارد.
- بنابراین Remote browser assertions هنوز اجرا نشده‌اند.

هنوز اثبات نشده:

- Remote HTML `lang=fa` / `dir=rtl`
- Remote manifest/icons
- Remote Service Worker control
- Remote offline reload
- Remote React interaction
- Remote cache observation

Local Chromium Web CI این رفتارها را روی Production build محلی پاس می‌کند؛ Remote HTTPS layer هنوز باز است.

### 025.7 Build notes

- Root `vercel.json` Framework preset را override می‌کند؛ خود Project setting هنوز `framework: null` گزارش می‌شود.
- Node Major روی `22.x` قفل است؛ تفاوت Project setting `24.x` عمداً override می‌شود.
- Next.js هشدار lockfile optional SWC dependencies دارد؛ Build و TypeScript سبز هستند. این هشدار پیش از Merge دوباره بررسی شود.

### 025.8 Supabase recheck

Supabase inventory و cost دوباره بررسی شدند و تغییر نکرده‌اند:

```text
Organization: Emad's Org / yzymkjsfqoohxbqkhzhs
Region proposal: eu-central-1
Cost: 0 monthly
NeoFit project: none
confirm_cost: not called
```

### Exact continuation point

1. آخرین Head PR #28 و CI/Vercel دوباره بررسی شوند.
2. Deployment Protection/share Browser session حل شود.
3. Remote HTTPS PWA suite اجرا و Evidence ثبت شود.
4. فقط پس از پاس کامل، Issue #16 close و PR #28 Ready/Merge شود.
5. Supabase Project فقط پس از پذیرش صریح Organization/Region/Cost ساخته شود.
6. پس از Project creation، ID/ref/region/status در Issue #25 و اسناد ثبت شود.
7. Stage 4B در PR مستقل و test-first آغاز شود.

# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Protected Preview QA آماده؛ exact-head deployment منتظر quota reset

## پروتکل

در شروع هر نوبت:

1. Master Plan کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. برای Stage 2B، `docs/NEOFIT_VERCEL_PREVIEW_QA.md` خوانده شود.
4. برای Stage 4، `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` خوانده شود.
5. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
6. فقط Exact continuation point اجرا شود.

در پایان هر نوبت هدف، شواهد، Commitها، Runها، Artifactها، Failureها، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | active | Issue #16، Draft PR #28، real Preview، protected QA contract، quota gate |
| 3 | complete | Batch 1–6 + Closure PR #24؛ Issue #17 closed |
| 4 | decision gate | Planning PR #26 merged؛ Issue #25 open؛ Project ندارد |
| 5–9 | not started | مطابق Master Plan |

---

## Stage 3 closure ledger

Implementation merges:

- Batch 1 `c9599c4905f9fc1d28ba7e9086edf20376991740`
- Batch 2 `917f04e319a924dda7dfb16d079453a5e5686541`
- Batch 3 `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- Batch 4 `d6c0df31999595096224ec1011574245d5dc75ad`
- Batch 5 `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- Batch 6 `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`
- Closure `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

Final contract:

- Core `52/52`
- Web Adapter `9/9`
- 13 Pure files
- Nutrition CI `30868884712`، Artifact `8877128689`
- Web CI `30868884702`، Artifact `8877147921`

---

## Entry 020 — Stage 4 account reconstruction

**تاریخ:** ۴ اوت ۲۰۲۶

```text
Organization: Emad's Org
Organization ID: yzymkjsfqoohxbqkhzhs
Existing projects: albwvkdamcmvukhzafep, msiowolgbuffddhcdmqw
Existing regions: eu-central-1
Existing status: INACTIVE
NeoFit project: none
Cost: 0 monthly
confirm_cost: not called
```

هیچ Project، Auth، Table، Migration یا RLS ساخته نشد.

---

## Entry 021–024 — Stage 4 planning and handoff

- Issue #25 ساخته شد.
- Plan: `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`
- Planning PR #26 Merge: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`
- Post-merge Handoff PR #27 Merge: `e79df1b20b1769f4c2b4b2084510664d76bd0d72`

Planning validation:

- Nutrition CI `30916469886` — success، Artifact `8895252025`
- Web CI `30916467290` — success، Artifact `8895277329`
- Review threads: zero

Hard gate:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
```

این سه مقدار هنوز صریحاً پذیرفته نشده‌اند.

---

## Entry 025 — Stage 2B Vercel reactivation

**تاریخ:** ۴ اوت ۲۰۲۶  
**Base:** `e79df1b20b1769f4c2b4b2084510664d76bd0d72`  
**Branch:** `stage2b/vercel-https-reactivation`  
**PR:** #28 Draft  
**Issue:** #16 Active

### 025.1 Reconstructed no-op deployment

Old integration deployment:

```text
deployment: dpl_7kJ7LHEM2MBmz6kwj5pWpM8BcbQc
state: READY
build duration: about 500 ms
install: not run
Next.js detection/build: not run
```

Result: READY state was not accepted as NeoFit Preview evidence.

### 025.2 First correction and expected external failure

Commits:

- `a23677613ccf053c36a3d2db35abe096ec1e3271` — Root `vercel.json`
- `c63286d8f3c648631b9789ea080463b482d65586` — CI deployment contract

First corrected deployment:

```text
deployment: dpl_RBHqQFDfXjNfvn6bpqzGYcQVwjmb
result: ERROR
reason: No Next.js version detected from repository-root package contract
```

### 025.3 Workspace correction

Commits:

- `19208516fc8166b575100a0532c89b04c56b9ffc` — Root npm workspace
- `c0ddc1991caf36db1f4455c0a46f251a07b4f1e1` — workspace Vercel build
- `de3670e25e0b1e439ace2b152a9760b2fa58f0eb` — CI workspace contract
- `377c5f0fb54af3cd0154b43b4cb7435315d18b04` — Root Node 22
- `e495698b411d2d3ee8df82159573a2e06d8e2266` — Web Node 22
- `620a73a1534339e616d6575aa2c48ba40a7093ab` — Core Node 22
- `aeec3b0716b6f60dfe61a745ca266f69e1d640e8` — Next generated types contract

Validated Preview:

```text
deployment: dpl_2rn2B51BZJfjDYtPPhb3VXY7swna
state: READY
target: Preview
Next.js: 16.2.12
bundler: Turbopack
routes: /, /_not-found, /manifest.webmanifest, /offline
```

Validated CI on `aeec3b0…`:

- Nutrition Core CI `30927566238` — success
- Artifact `8899755836`
- Digest `sha256:3fffa656b714d13e695e0d47818e9ac9f7ce846dec2cc27231a4f4e92cf7adb8`
- Web CI `30927566018` — success
- Artifact `8899785585`
- Digest `sha256:91fc7d0b78e76f988ab12b199b517eed72c48df95c1d2781d9880789d1c3630b`

### 025.4 Documentation synchronization

Updated:

- `docs/NEOFIT_MASTER_PLAN.md`
- `docs/NEOFIT_PROGRESS_LOG.md`
- `README.md`
- `docs/DEVELOPMENT_HANDOFF.md`

Head `51ed480dfeaa544e65be4fafa1cc237cb39cb7e3`:

- Nutrition CI `30928089527` — success
- Artifact `8899956066`
- Digest `sha256:4901f9b30e0fed4f6de38cfde1d50deb2e3a8222127cfea4893fc0cc77bda310`
- Web CI `30928090097` — success
- Artifact `8899999523`
- Digest `sha256:5f14aa3dc783912423a9c69ea79915b18d5ae2ff4d2c4f4b528c0aef26d5d7be`

---

## Entry 026 — Protected Preview QA authority

**تاریخ:** ۴ اوت ۲۰۲۶

### 026.1 Direct share-session failure

Temporary Share URL روی Alias و Deployment URL هر دو بررسی شدند.

نتیجه:

- response `302`؛
- redirect به `vercel.com/sso-api`؛
- نیاز به Cookie session؛
- Fetch و Container session نتوانستند Cookie را حفظ کنند؛
- هیچ ادعای Remote browser pass ثبت نشد.

### 026.2 Official automation contract

مرجع رسمی Vercel تأیید کرد:

```text
x-vercel-protection-bypass: VERCEL_AUTOMATION_BYPASS_SECRET
x-vercel-set-bypass-cookie: true
```

Added:

- `bfe3e56f18f77c717f0b31c8b36f294e9498add0` — `web/scripts/verify-vercel-preview.mjs`
- `3206b7272e088f24b4a98fccd97893d8f232d736` — `.github/workflows/vercel-preview-qa.yml`
- `773168dd442b5a2e9379e390e1305cca6ebf3443` — `docs/NEOFIT_VERCEL_PREVIEW_QA.md`
- Root/Web `qa:vercel-preview` commands
- Verifier syntax check inside Web CI

Remote suite covers:

- HTTPS/Same-origin/SSO؛
- Persian RTL؛
- manifest/icons؛
- Service Worker؛
- cache exclusions؛
- meal logging؛
- offline reload؛
- secret/token redaction.

### 026.3 Current validated QA head

```text
12b25a8677ab276464428e87b184dff634d4087d
```

Nutrition Core:

- Run `30929824693` — success
- Artifact `8900647856`
- Digest `sha256:37bac1d174d412498eb8517c1d7a779ac77addd8aded24440de2f1ffcffa0ea2`

Web:

- Run `30929821835` — success
- Artifact `8900682338`
- Digest `sha256:a0baeeedd3ebfd508e62574618a3b63ddb47f470f2c534f9817634139439f4fd`

### 026.4 Runtime equivalence

آخرین Deployment موفق پس از اضافه‌شدن Verifier:

```text
commit: bfe3e56f18f77c717f0b31c8b36f294e9498add0
deployment: dpl_7q1AqruWVV6B6qSA1KmByH6UMSxj
state: READY
```

Compare `bfe3e56…` → `12b25a…`:

- ahead by 5؛
- فقط Workflow، QA document و package command exposure؛
- هیچ Runtime app، Service Worker، public asset یا Nutrition Core file تغییر نکرد.

نتیجه: Preview موجود برای اجرای Remote suite از نظر Runtime معادل است؛ exact-head deployment همچنان Merge gate است.

### 026.5 New Vercel quota failure

Vercel پس از Deployment `bfe3e56…` گزارش داد:

```text
Resource is limited - try again in 24 hours
code: api-deployments-free-per-day
more than 100 deployments
```

در نتیجه Head فعلی هنوز exact-head Preview ندارد.

### 026.6 Supabase boundary retained

```text
Organization: Emad's Org / yzymkjsfqoohxbqkhzhs
Region proposal: eu-central-1
Cost: 0 monthly
NeoFit project: none
confirm_cost: not called
```

هیچ Supabase resource ساخته نشد.

### Exact continuation point

1. Vercel quota reset شود.
2. exact-head Preview برای PR #28 ساخته شود.
3. Automation Bypass Secret خارج Git در Vercel ساخته و در GitHub Secret ثبت شود.
4. Workflow `Vercel Preview HTTPS QA` روی Alias عمومی اجرا شود.
5. Run/Artifact/Digest/Deployment/runtime evidence در Issue #16 و اسناد ثبت شود.
6. فقط پس از Remote pass کامل، PR #28 Ready/Merge و Issue #16 Completed شود.
7. Stage 4A فقط پس از پذیرش صریح Organization/Region/Cost اجرا شود.

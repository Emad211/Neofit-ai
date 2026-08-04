# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Protected Preview QA آماده؛ Vercel quota و Stage 4A decision gate باز  
**Integration branch:** `web/pwa-foundation`  
**Integration HEAD پیش از PR فعال:** `e79df1b20b1769f4c2b4b2084510664d76bd0d72`  
**Stage 2B branch:** `stage2b/vercel-https-reactivation`  
**Stage 2B PR:** #28 — Draft/active  
**Stage 2B Issue:** #16 — active  
**Stage 4 planning merge:** `094fc099f624b0349d6ed3bd1485bad6f11fdf14`  
**Stage 4 Issue:** #25 — open  
**مرحله‌های فعال:** Stage 2B protected HTTPS validation و Stage 4A decision gate

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. برای Stage 2B، `docs/NEOFIT_VERCEL_PREVIEW_QA.md` خوانده شود.
4. برای Stage 4، `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` خوانده شود.
5. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
6. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- این فایل و Progress Log با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- `README.md` و `docs/DEVELOPMENT_HANDOFF.md` نباید Stage قدیمی را قدم بعد معرفی کنند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- Token، Share URL و Automation Bypass Secret هرگز وارد Git، Log، Comment یا Artifact نشوند.
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
- Preview با Production promotion یکسان نیست؛ Stage 2B حق Promote به Production ندارد.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 Persian RTL UX | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A PWA Foundation | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B Vercel HTTPS | active | Issue #16، PR #28، real Preview + protected QA contract |
| 3 Nutrition Core/Web parity | complete | PR #18–#24؛ Issue #17 closed |
| 4 Supabase foundation | decision gate | PR #26 planning merged؛ Issue #25 open |
| 5–9 | not started | طبق Roadmap |

## ۴. Stage 3 final state

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
- 13 Pure source files
- strict TypeScript، Next build، Visual و PWA runtime pass

## ۵. Stage 2B — Vercel Preview/HTTPS

### Failure reconstructed

Deployment قدیمی `dpl_7kJ7LHEM2MBmz6kwj5pWpM8BcbQc` با state `READY` در حدود ۵۰۰ ms تمام می‌شد، اما install و Next.js build اجرا نمی‌شد. READY بودن آن Evidence معتبر نبود.

### Build correction در PR #28

- Root `vercel.json`؛
- npm workspace حداقلی برای `web` و `packages/nutrition-core`؛
- Next.js `16.2.12` در Root contract؛
- `npm run build:web`؛
- Node `22.x`؛
- CI validation برای deployment contract؛
- source bundle شامل Root config، Web و Shared Core.

آخرین Runtime واقعی Deployشده:

```text
commit: bfe3e56f18f77c717f0b31c8b36f294e9498add0
deployment: dpl_7q1AqruWVV6B6qSA1KmByH6UMSxj
state: READY
target: Preview
alias: neofit-ai-git-stage2b-vercel-htt-774980-emads-projects-41cb6447.vercel.app
```

این Deployment واقعاً npm install، PWA icon generation، Next.js `16.2.12`، Turbopack compile، TypeScript، route generation و `/vercel/output` را اجرا کرده است.

### Protected Preview QA authority

منبع اجرایی:

- `docs/NEOFIT_VERCEL_PREVIEW_QA.md`
- `web/scripts/verify-vercel-preview.mjs`
- `.github/workflows/vercel-preview-qa.yml`
- `npm run qa:vercel-preview`

Remote assertions:

- HTTPS و Same-origin؛
- عدم SSO challenge؛
- `lang=fa` و `dir=rtl`؛
- Manifest و Iconها؛
- Service Worker registration/control؛
- API/Auth/Authorization/non-GET cache exclusions؛
- Flow واقعی ثبت قورمه‌سبزی؛
- Offline reload.

برای Deployment Protection فقط قرارداد رسمی زیر مجاز است:

```text
x-vercel-protection-bypass: <GitHub Secret>
x-vercel-set-bypass-cookie: true
```

Secret name:

```text
VERCEL_AUTOMATION_BYPASS_SECRET
```

### Current code/CI head

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

Passed:

- Core parity/pure boundary؛
- strict TypeScript؛
- Preview verifier syntax؛
- Web Adapter parity؛
- Next production build؛
- icons، visual regression، local Service Worker، offline و cache gates.

### Runtime-equivalence evidence

Compare از Deployشدهٔ `bfe3e56…` تا Head `12b25a…` فقط این فایل‌ها را تغییر می‌دهد:

- Workflow Remote QA؛
- سند Remote QA؛
- command exposure در Root/Web package.

هیچ `web/app`، Component، Service Worker، Public Asset یا Nutrition Core runtime تغییر نکرده است. Preview موجود برای اجرای Remote QA از نظر Runtime معادل است؛ بااین‌حال پیش از Merge یک Deployment exact-head نیز الزامی است.

### Current external failures

Deployment Protection:

- Share URL به Vercel SSO و Cookie session وابسته است؛
- ابزار Fetch Cookie را حفظ نمی‌کند؛
- Automation Bypass هنوز خارج Git تنظیم نشده است.

Deployment quota:

```text
Resource is limited - try again in 24 hours
code: api-deployments-free-per-day
more than 100 deployments
```

در نتیجه Head فعلی هنوز Deployment exact-head ندارد.

## ۶. Stage 4 planning checkpoint

- Issue #25
- Planning PR #26
- Merge `094fc099f624b0349d6ed3bd1485bad6f11fdf14`
- Plan `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`

Supabase inventory:

```text
Organization: Emad's Org / yzymkjsfqoohxbqkhzhs
Region proposal: eu-central-1
Cost: 0 monthly
Project name: neofit
NeoFit project: none
confirm_cost: not called
Auth/Schema/RLS: not started
```

Stage 4 batches:

- 4A: explicit decision، cost confirmation، Project creation
- 4B: CLI/config + SSR clients
- 4C: profiles/user_settings + RLS + generated types
- 4D: nutrition_goals/nutrition_entries persistence
- Closure: advisors، RLS tests، CI و docs

## ۷. Current hard gates

### Vercel

پیش از Merge PR #28 و بستن Issue #16:

1. quota reset؛
2. exact-head Preview؛
3. Automation Bypass Secret در Vercel و GitHub؛
4. Remote workflow pass؛
5. Run/Artifact/Digest/Deployment/runtime evidence؛
6. documents synchronized؛
7. zero review threads.

### Supabase

کاربر باید صریحاً این سه مقدار را بپذیرد:

1. Organization `Emad's Org`
2. Region `eu-central-1`
3. Cost `0` monthly

تا قبل از پذیرش:

- `Supabase.confirm_cost` اجرا نمی‌شود؛
- Project ساخته نمی‌شود؛
- Auth/Schema/RLS implementation آغاز نمی‌شود.

## ۸. Claim boundaries

ثابت شده است:

- Stage 3 کامل است.
- Vercel Git Integration و Project واقعی‌اند.
- Build واقعی Next.js و Preview واقعی وجود دارد.
- Protected Remote QA contract کامل و Fail-closed است.
- Current Head در Core/Web CI سبز است.
- Runtime diff بعد از آخرین Deployment فقط QA/docs/commands است.
- Supabase account/cost inventory بررسی شده است.

ثابت نشده است:

- Automation Bypass Secret configuration؛
- Remote HTTPS suite pass؛
- exact-head Deployment؛
- Stage 2B closure؛
- پذیرش Organization/Region/Cost؛
- NeoFit Supabase Project؛
- Auth/SSR clients؛
- Postgres migrations/RLS؛
- Stage 5–9.

## ۹. Anti-goalها

- READY بدون Next build را Preview واقعی معرفی‌کردن
- ذخیرهٔ Share/Bypass token در Git یا Artifact
- Promote به Production در Stage 2B
- Project creation بدون explicit acceptance
- reuse کردن Project unrelated
- Dashboard-only Schema edits
- permissive RLS
- Service Role در Browser
- Nutrition arithmetic در SQL/React

## ۱۰. Exact continuation point

1. پس از Reset quota، exact-head Preview برای PR #28 ساخته شود.
2. Automation Bypass Secret خارج Git ساخته و در GitHub Secret ثبت شود.
3. Workflow `Vercel Preview HTTPS QA` روی Alias عمومی اجرا شود.
4. Evidence در Issue #16، PR #28، Master Plan و Progress Log ثبت شود.
5. فقط پس از Remote pass، PR #28 Ready/Merge و Issue #16 Completed شود.
6. Stage 4A فقط پس از پذیرش صریح Organization/Region/Cost اجرا شود.
7. پس از Project creation، ID/ref/region/status ثبت و Stage 4B در PR مستقل آغاز شود.

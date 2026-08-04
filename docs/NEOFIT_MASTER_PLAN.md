# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 2B فعال و Preview واقعی Build شده؛ Stage 4A منتظر پذیرش زیرساخت  
**Integration branch:** `web/pwa-foundation`  
**Integration HEAD پیش از PR فعال:** `e79df1b20b1769f4c2b4b2084510664d76bd0d72`  
**Stage 2B branch:** `stage2b/vercel-https-reactivation`  
**Stage 2B PR:** #28 — Draft/active  
**Stage 2B Issue:** #16 — active  
**Stage 4 planning merge:** `094fc099f624b0349d6ed3bd1485bad6f11fdf14`  
**Stage 4 Issue:** #25 — open  
**مرحله‌های فعال:** Stage 2B HTTPS validation و Stage 4A decision gate

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. برای Stage 4، `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
5. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- این فایل و Progress Log با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- `README.md` و `docs/DEVELOPMENT_HANDOFF.md` نباید Stage قدیمی را به‌عنوان قدم بعد معرفی کنند.
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
- Deployment Preview با Production promotion یکسان نیست؛ Stage 2B حق Promote به Production ندارد.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 Persian RTL UX | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A PWA Foundation | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B Vercel HTTPS | active | Issue #16، PR #28، real Next.js Preview built |
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

## ۴. Stage 2B — Vercel Preview/HTTPS

### Reconstructed failure

Issue #16 قبلاً نوشته بود هیچ Deployment وجود ندارد. بررسی مستقیم نشان داد Vercel Git Integration فعال است، اما Deployment شاخهٔ Integration معتبر نبود:

- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Team ID: `team_BsUv0VprkU4YjdFbQi2hZCEm`
- old deployment: `dpl_7kJ7LHEM2MBmz6kwj5pWpM8BcbQc`
- commit: `e79df1b20b1769f4c2b4b2084510664d76bd0d72`
- state: `READY`
- Project framework: `null`
- Build duration: حدود ۵۰۰ میلی‌ثانیه
- dependency install: اجرا نشده
- Next.js build: اجرا نشده

پس READY بودن آن Deployment به معنی Preview واقعی NeoFit نبود.

### Correction در PR #28

- Root-level `vercel.json` اضافه شد.
- Root `package.json` به npm workspace حداقلی برای `web` و `packages/nutrition-core` تبدیل شد.
- Next.js `16.2.12` در Root contract قابل تشخیص شد.
- Node runtime روی Major `22.x` قفل شد.
- Web CI حضور و محتوای Root deployment contract را کنترل می‌کند.
- Source bundle اکنون `package.json`، `vercel.json`، `web/` و `packages/nutrition-core/` را شامل می‌شود.

### Real Preview evidence

Validated branch head:

```text
aeec3b0716b6f60dfe61a745ca266f69e1d640e8
```

Vercel:

- Deployment ID: `dpl_2rn2B51BZJfjDYtPPhb3VXY7swna`
- State: `READY`
- Target: Preview (`target: null`)
- Branch alias: `neofit-ai-git-stage2b-vercel-htt-774980-emads-projects-41cb6447.vercel.app`
- Detected Next.js: `16.2.12`
- Bundler: Turbopack
- Install: `npm install --no-audit --no-fund`
- Build: `npm run build:web` → `next build`
- Compiled: success
- TypeScript: success
- Static routes: `/`, `/_not-found`, `/manifest.webmanifest`, `/offline`
- Build output: `/vercel/output`

CI همان Head:

- Nutrition Core CI `30927566238` — success
- Nutrition Artifact `8899755836`
- Nutrition digest `sha256:3fffa656b714d13e695e0d47818e9ac9f7ce846dec2cc27231a4f4e92cf7adb8`
- Web CI `30927566018` — success
- Web Artifact `8899785585`
- Web digest `sha256:91fc7d0b78e76f988ab12b199b517eed72c48df95c1d2781d9880789d1c3630b`

### Remaining Stage 2B gate

Deployment Protection روی Preview فعال است. Connector یک temporary share URL تولید می‌کند، اما Fetch آن به SSO redirect برمی‌گردد و Cookie session در ابزار حفظ نمی‌شود. بنابراین هنوز این موارد روی Remote HTTPS browser به‌طور مستقیم اثبات نشده‌اند:

- Root HTML با `lang=fa` و `dir=rtl`
- manifest/icon fetch روی Preview
- Service Worker registration/control روی Preview
- fresh-install offline reload روی Preview
- React navigation و meal-log interaction روی Preview
- Remote cache exclusion observation

Local Chromium CI همهٔ این قراردادها را به‌جز لایهٔ Remote HTTPS/Protection پاس کرده است. Issue #16 تا رفع این Gate باز می‌ماند.

### Non-blocking build notes

- Vercel Project Settings هنوز `framework: null` گزارش می‌دهد، اما Root `vercel.json` Framework preset را برای Build override می‌کند و Build واقعی Next.js اثبات شده است.
- Next.js دربارهٔ lockfile و optional SWC dependency هشدار می‌دهد؛ Build، TypeScript و route generation سبز هستند. این هشدار باید پیش از Merge ارزیابی شود، اما Failure محصولی فعلی نیست.

## ۵. Stage 4 planning checkpoint — merged

- Issue #25: `Stage 4: Supabase Auth, Postgres and RLS foundation`
- Planning PR #26
- Merge: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`
- Plan: `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`

### Supabase inventory rechecked — 4 Aug 2026

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

Cost:

```text
type: project
recurrence: monthly
amount: 0
```

Proposed decision — هنوز صریحاً پذیرفته نشده:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

### Planned Stage 4 batches

- 4A: explicit decision، cost confirmation، Project creation
- 4B: CLI/config + SSR clients
- 4C: profiles/user_settings + RLS + generated types
- 4D: nutrition_goals/nutrition_entries persistence contracts
- Closure: advisors، RLS tests، Core/Web CI و docs

## ۶. Current hard gates

### Vercel

قبل از Merge PR #28 و بستن Issue #16:

1. Preview باید با Browser session قابل دسترسی شود.
2. Remote HTTPS PWA checks اجرا و ثبت شوند.
3. Build warningهای باقی‌مانده بررسی شوند.
4. PR Review thread باز نباشد.

### Supabase

کاربر باید این سه مقدار را صریحاً بپذیرد:

1. Organization `Emad's Org`
2. Region `eu-central-1`
3. Cost `0` monthly

تا قبل از پذیرش:

- `Supabase.confirm_cost` اجرا نمی‌شود؛
- Project ساخته نمی‌شود؛
- Auth/Schema/RLS implementation آغاز نمی‌شود.

## ۷. Claim boundaries

ثابت شده است:

- Stage 3 کامل و بسته است.
- Stage 2B دوباره فعال شده است.
- Vercel Git Integration و Project واقعی وجود دارند.
- یک Preview واقعی Next.js برای Head `aeec3b0…` Build و Deploy شده است.
- Local Web/PWA/Visual و Shared Core CI سبز هستند.
- Supabase Organization/Projects/Cost دوباره بررسی شده‌اند.
- Stage 4 architecture/security plan Merge شده است.

ثابت نشده است:

- Remote HTTPS browser/PWA behavior پشت Deployment Protection؛
- Stage 2B closure؛
- پذیرش Organization/Region/Cost؛
- NeoFit Supabase Project؛
- Auth/SSR clients؛
- Postgres migrations/RLS؛
- Full Browser Catalog/IndexedDB؛
- AI/Vision Web flow؛
- Public Final Schema/ID freeze.

## ۸. Anti-goalها

- READY deployment را بدون Next build به‌عنوان Preview واقعی معرفی‌کردن
- Promote به Production در Stage 2B
- Project creation بدون explicit acceptance
- reuse کردن Project unrelated
- Dashboard-only Schema edits
- permissive RLS
- Service Role در Browser
- Authorization فقط با `getSession()`
- Nutrition arithmetic در SQL/React
- Provider-created Nutrition
- Full Catalog/IndexedDB در Stage 4

## ۹. Exact continuation point

1. PR #28، Issue #16 و آخرین Vercel Deployment دوباره بررسی شوند.
2. دسترسی Browser به Preview با Deployment Protection/share session حل شود.
3. Root، RTL، Manifest، Iconها، Service Worker، Offline reload، React interaction و cache boundary روی HTTPS آزموده شوند.
4. فقط پس از پاس کامل، Issue #16 بسته و PR #28 Ready/Merge شود.
5. در مسیر موازی، برای Stage 4A پذیرش صریح Organization، Region و Cost دریافت شود.
6. فقط بعد از پذیرش `Supabase.confirm_cost` و Project creation اجرا شود.
7. Project ID/ref/region/status در Issue #25 و دو سند اجباری ثبت شود.
8. Stage 4B در Branch/PR مستقل و test-first آغاز شود.

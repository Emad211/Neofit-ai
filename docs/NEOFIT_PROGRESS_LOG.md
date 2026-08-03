# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Batch 3 Merge و Batch 4 Authority/Golden checkpoint

## پروتکل

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، مشکلات، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | انجام‌شده | PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | انجام‌شده | PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | انجام‌شده | PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | تعویق‌شده | Issue #16؛ Vercel daily API limit ثبت شده |
| 3 | فعال | Batch 1–3 merged، Batch 4 Authority/Golden active |
| 4 | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## تاریخچهٔ فشردهٔ اثبات‌شده

### Stage 0–1

- Pivot Merge: `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX Merge: `a458a27a2685bfa7d85ea28686b3182c3167d747`
- Final Stage 1 CI `30829629853`
- Visual Artifact `8862378720`

### Stage 2A/2B

- PWA code Merge: `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Fresh-install Offline P1 رفع شد.
- Vercel Project `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview ندارد؛ Issue #16 باز است.
- `vercel[bot]` محدودیت `api-deployments-free-per-day` را ثبت کرده است.

### Stage 3 Batch 1

- PR #18 Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- types/nutrition/recipe/diary/goals
- AST pure-boundary
- CI `30857715438`
- Artifact `8873108322`
- 10/10 pass
- Web CI `30857715413`

### Stage 3 Batch 2

- PR #19 Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- Persian normalization/modifiers/search
- Alias routing و SR/FNDDS ranking
- CI `30858722741`
- Artifact `8873475224`
- 25/25 pass
- Web CI `30858722681`
- Controlled Alias benchmark از Natural Query claim جدا شد.

### Stage 3 Batch 3

- Authority chain و Golden checkpoint ثبت شد.
- Test-first Red commit `0d0be7ed7afc24404ebae46ea852970928259f87`
- Expected Red CI `30860579622`
- Implementation commits:
  - `fca5113ba9127ec0ceb02d9d95676c366bf60f0e`
  - `f743b7effbb6c20896cf0e755bc9302514dea573`
  - `3ecbaee7a2b56d6cb3246751c8dee0e1cdecea9d`
  - `589a504666a97c174fac3f6481599118c59a80d4`
- First implementation CI `30860691909`: 33/34
- Failure متعلق به Test raw floating-point بود؛ Domain canonical `84` درست بود.
- Test correction `52934ab172beea7d939b3024344de8f20f529b3a`
- Green CI `30860781048`: 34/34
- Final docs-head evidence:
  - Nutrition CI `30861155760`
  - Artifact `8874374046`
  - Digest `sha256:f827e27bb2dee03f16de991c51d723cf7a5a9dd6aa009ed2d7efe45796023425`
  - Web CI `30861155825`
  - Web Artifact `8874391849`
  - Digest `sha256:fa62dbfe383a21becab2856856587412f8218be117e842d43056053e0747c412`
- 34/34 pass، 11 Pure files، Review باز صفر
- PR #20 Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`

---

## Entry 010 — Stage 3 Batch 4: Universal Estimate/SQLite Authority start

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۲:۴۰ ایران  
**Issue:** #17  
**Branch:** `stage3/universal-estimate-sqlite-parity`  
**Base:** Batch 3 Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`

### درخواست مالک

مالک خواست قدم بعدی برداشته شود و تمام تغییرات، شواهد و نقطهٔ ادامه دقیقاً در اسناد دائمی ثبت شوند.

### بازسازی وضعیت پیش از Batch 4

- هر دو سند اجباری روی Branch Batch 3 خوانده شدند.
- PR #20:
  - open و Draft در شروع
  - Head `d8a46185c8e777fccc4526cba16a1f7451c22f41`
  - mergeable
- Final Head CIها:
  - Nutrition Core `30861155760` — success
  - Web `30861155825` — success
- Review threadها: صفر
- PR body از Authority-only به Final implementation evidence اصلاح شد.
- PR Ready for Review شد.
- Review submission/thread جدید: صفر
- PR با expected head Merge شد:
  - Merge commit `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- Issue #17 با Batch 3 completion evidence Comment شد و باز ماند.

### Branch جدید

- `stage3/universal-estimate-sqlite-parity`
- دقیقاً از Merge commit Batch 3 ساخته شد.

### اسناد اجباری روی Branch جدید

پس از ساخت Branch، هر دو سند Merge‌شده دوباره خوانده شدند و فقط سپس Inventory Batch 4 آغاز شد.

### Authority خوانده‌شده

#### Pure estimator

- `mobile/src/nutrition-core/universal-food-estimate.ts`
- Blob `7f54426e0b6838700f09b831c7df5a94afef8361`

رفتار:

- null-aware record→NutritionVector
- FNDDS uncertainty = `0.15`
- SR Legacy uncertainty = `0.08`
- grams factor = `grams / 100`
- grams باید finite، مثبت و `<=100000` باشد

#### Repository mapping Adapter

- `mobile/src/db/universal-catalog-repository.ts`
- Blob `cdfacc1eafba4267cdc793284462bbabd7ca93b5`

رفتار:

- SQLite snake_case→Domain camelCase
- `macro_completeness === 1`
- `portion_count` و BM25 mapping
- Alias/ranker integration
- official portions loading

این Repository وارد Pure Core نمی‌شود.

#### Expo SQLite asset Adapter

- `mobile/src/db/universal-catalog-database.ts`
- Blob `687d7b41dac26e1821a141c181fa13cdd81b2186`

وابستگی‌ها:

- Expo Asset
- Expo FileSystem
- expo-sqlite
- DB byte/version/count validation
- native close workaround

این فایل خارج از Package باقی می‌ماند.

#### UI consumer

- `mobile/app/food-search.tsx`
- Blob `df367a5d598925fa56eb3b2c36e47da8df504415`

مسیر واقعی:

- Repository details
- grams مستقیم یا official `gramWeight × count`
- `calculateUniversalFoodEstimate`
- ذخیرهٔ deterministic estimate در Diary

#### SQLite equivalence

- `mobile/tests/nutrition-sqlite-equivalence.test.ts`
- Blob `80538220517f8b4f0bc80117469b16f6a82c7bdf`

قرارداد:

- direct SQL nutrient arithmetic با TypeScript برابر است.
- tolerance = `max(1e-10, abs(expected) * 1e-12)`
- fractional portions/grams
- ranges
- missing nutrient
- unknown weight

#### SQL/helper

- Nutrition SQL Blob `35ecdbd1f5baec8ee1b5845cfd994f15b5ff769d`
- SQLite helper Blob `d03caf85ccfbb68b245101d0646956fd9c32e045`

`node:sqlite` فقط در Test layer مجاز است.

#### Selectability/Range tests

- Macro guard Blob `3f16b43a37f98b807c3b95577102bf682bff905d`
- Range Blob `2fd1f7f3c601c2ae48931f50a7ca1552ff45a2a2`

Contract:

- macro-incomplete selectable نیست.
- macro-complete بدون Portion با grams قابل استفاده است.
- relative range missing nutrient را حفظ می‌کند.

### Boundary نهایی Batch 4

Pure Core:

- `UniversalNutrientRecord`
- `universalNutritionVector`
- `universalSourceUncertainty`
- `calculateUniversalFoodEstimate`

Test-only:

- `node:sqlite`
- test schema/query
- SQL↔TypeScript comparison

Excluded:

- Expo/SQLite runtime
- DB lifecycle/query/cache
- Repository persistence
- UI/Diary
- Supabase/Auth/AI/Web adapter

### فایل‌های ساخته‌شده

- `docs/NEOFIT_UNIVERSAL_ESTIMATE_SQLITE_AUTHORITY_MAP.md`
  - Commit `200f60e02f8503e418e04ec6d79f4d3e087d2d37`
- `packages/nutrition-core/tests/universal-estimate-golden-v1.ts`
  - Commit `56dd449fb9aa169c00b60057aa26dff594d1e0d0`

Golden coverage:

- FNDDS 150g و uncertainty 15%
- SR Legacy 50g و uncertainty 8%
- missing nutrients
- snake_case Repository row fixture
- grams limits
- fractional SQLite comparison values
- macro guard continuity

### وضعیت واقعی پایان Entry

- estimator هنوز در Package استخراج نشده است.
- parity test Batch 4 هنوز ساخته نشده است.
- Red CI هنوز ثبت نشده است.
- Draft PR Batch 4 هنوز باز نشده است.
- هیچ Batch 4 success ادعا نمی‌شود.
- Supabase/Auth/AI/Repository/Web adapter شروع نشده‌اند.

### Exact continuation point

1. CI Head شامل Authority/Golden/docs بررسی شود.
2. Draft PR Batch 4 باز شود و صریحاً no-parity باشد.
3. parity tests قبل از implementation ساخته شوند.
4. Red CI به علت نبود estimator ثبت شود.
5. estimator بدون تغییر معنایی استخراج شود.
6. direct SQLite equivalence فقط در Test layer اضافه شود.
7. exports، README و CI metadata به‌روزرسانی شوند.
8. Nutrition Core CI و Web CI پاس شوند.
9. Reviewها رفع و دو سند اجباری دوباره Update شوند.

**Issue #16 و #17 باز هستند. Supabase، Auth، AI، Repository runtime و Web adapter خارج از Scope باقی می‌مانند.**

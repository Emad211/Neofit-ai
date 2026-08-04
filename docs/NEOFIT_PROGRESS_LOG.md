# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 6 Web Adapter parity

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
| 2B | تعویق‌شده | Issue #16؛ Vercel Preview واقعی ندارد |
| 3 | فعال | Batch 1–5 merged؛ Batch 6 PR #23 در Gate نهایی |
| 4 | شروع‌نشده | منتظر Stage 3 closure و تأیید Organization/Region/Cost |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## تاریخچهٔ فشردهٔ اثبات‌شده

### Stage 0–2

- Pivot Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- PWA Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Vercel Preview در Issue #16 تعویق شده است.

### Stage 3 Batch 1

- PR #18 Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- `10/10` pass

### Stage 3 Batch 2

- PR #19 Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- `25/25` pass

### Stage 3 Batch 3

- PR #20 Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- `34/34` pass

### Stage 3 Batch 4

- PR #21 Merge `d6c0df31999595096224ec1011574245d5dc75ad`
- `43/43` pass
- 12 Pure source files

### Stage 3 Batch 5

- PR #22 Merge `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- Final head `68a521be59fc48ec15bf24f096f13ea8bb8d7b98`
- Nutrition CI `30866846053`
- Artifact `8876414906`
- Web CI `30866846046`
- Artifact `8876436046`
- `52/52` pass، 13 Pure source files

---

## Entry 015 — Batch 6 Authority و Inventory

**تاریخ:** ۴ اوت ۲۰۲۶  
**Branch:** `stage3/web-adapter-parity`  
**Base:** `d3c0a28ecf2596e94c86ff74e2f00a0523219433`  
**Issue:** #17  
**PR:** #23 — Draft

### شروع اثبات‌شده

- Batch 5 completion در Issue #17 ثبت شد.
- Branch از Merge واقعی Batch 5 ساخته شد.
- دو سند اجباری روی Branch جدید دوباره خوانده شدند.
- Web Fixture، Component، Package/TypeScript/Next config و Mobile/Core adapters خوانده شدند.

### Findings

در `web/components/neofit-prototype.tsx` این منطق تکراری وجود داشت:

- `sumMacros`
- ضرب مستقیم calories/protein/carbs/fat در portion count
- `Math.round` و `toFixed(1)` برای Nutrition
- محاسبهٔ دستی remaining/progress
- Persian normalization ناقص و موازی

در `web/data/fixtures.ts` Initial diary Macroهای ازپیش‌جمع‌شده نگه می‌داشت.

Mobile adapter قدیمی Blob `bbacac7a376ba9edb14b14f673d3d708dfa3319e` نیز scale/round مستقل داشت و فقط به‌عنوان شاهد منطق تکراری ثبت شد؛ برای انتقال Authority نبود.

### Authority files

- Authority Map commit `f8ac06375335dffa1b9acd8d24a303b408518037`
- Golden fixture commit `ac9b9a271c0913b531e24948b23cd3e6d9b445f2`
- Draft PR #23 opened

Checkpoint:

- Web CI `30867460723` — success
- Artifact `8876656669`
- Digest `sha256:857dfa4d188a5f606d357258e1fba77251bb2b9c67aad9ba094f1655406f2b9d`

این Checkpoint فقط سلامت Authority/Golden و نبود Regression را ثابت کرد؛ Adapter هنوز وجود نداشت.

---

## Entry 016 — Batch 6 Test-first Red

Commit:

- `3098ea11528e1cddf1a770f1bac425f3ac5852f5`
- فایل `web/tests/web-nutrition-adapter.test.ts`

Tests قبل از Implementation این موارد را قفل کردند:

- Core portion estimate برای سهم صحیح و کسری
- Initial diary از Source references
- Recipe aggregation برای Lunch
- Day summary و Goal progress از Core
- fractional add flow
- Persian normalization از Core
- Missing Macro fail-closed
- حذف arithmetic مستقیم از Component
- local Package integration

Red run:

- Web CI `30867587259` — expected failure
- Product/PWA contracts: pass
- TypeScript فقط به‌علت نبود `@/lib/nutrition-adapter` شکست خورد.
- Build/Visual/PWA skipped شدند.
- Artifact upload نیز شکست خورد چون Web CI قبل از TypeScript `artifacts/` نمی‌ساخت.
- این CI weakness بعداً با preflight evidence directory رفع شد.

---

## Entry 017 — Batch 6 Implementation

### Package wiring

- Core package export commit `2f0bc14a801f7443779ec2328698dd9f07875744`
- Web local dependency commit `926845f478e76c3f567d12fcc36842bedaf8145c`
- Initial Next transpilation commit `cbca8e2961cf630ab61cceba17979532dcf48c6c`

قرارداد:

- `@neofit/nutrition-core` از `./src/index.ts` export می‌شود.
- Web dependency: `file:../packages/nutrition-core`
- Next: `transpilePackages`
- هیچ Turborepo/Nx/workspace orchestrator اضافه نشد.

### Fixture migration

Commit:

- `11fe4e4262ffbd7e739cfed1deba5809b8749aac`

تغییرات:

- Foodها full `LegacyCatalogFood` شدند.
- Alias، Evidence، Source metadata، variability و portion grams حفظ شدند.
- Initial diary فقط Food ID و portion count نگه می‌دارد.
- Breakfast = دو تخم‌مرغ.
- Lunch = قورمه‌سبزی + چلو.
- precomputed diary macros حذف شدند.
- Goalها به `NutritionGoals` تبدیل شدند.

### Golden/Test corrections

- Golden correction `e08b67f4297df4f3ba77f9fbe9f2d4013984dc01`
- Test correction `a05bf9eed351ae2d10c7346a1bf7bde9f33f47e0`

دلیل:

- `grams` متعلق به `NutritionEstimate` است، نه Macro view.
- Correction قبل از Green و بدون تغییر Domain semantics انجام شد.

### Web Adapter

Commit:

- `b81dd6dab2a7168ba9585307184420a997e0ac29`

File:

- `web/lib/nutrition-adapter.ts`

Core calls:

- `legacyCatalogFoodToDocument`
- `calculateVariantNutrition`
- `calculateRecipe`
- `summarizeDiaryDay`
- `calculateGoalProgress`
- `normalizePersianText`

Adapter APIs:

- `estimateWebFood`
- `createWebDiaryEntry`
- `buildInitialWebDiary`
- `summarizeWebDiary`
- `filterWebFoods`
- `webMacrosFromEstimate`
- `mealTypeLabelFa`

Macro View اگر انرژی، پروتئین، کربوهیدرات یا چربی Missing باشد fail-closed می‌شود.

### Component refactor

Commit:

- `2c611bc54ff594d65d408f376984f6c6c1cf5a2f`

Removed:

- `sumMacros`
- `toFixed`
- direct selected-food multiplication
- duplicate search normalizer
- precomputed Diary state

UI اکنون:

- Initial diary را از Adapter می‌سازد؛
- Summary و Goal را از Adapter می‌گیرد؛
- Meal sheet را از `estimateWebFood` نمایش می‌دهد؛
- Add meal را با `createWebDiaryEntry` انجام می‌دهد؛
- Search را با `filterWebFoods` انجام می‌دهد.

### Web CI hardening

Commit:

- `2ea5bc814964f808dc23f3ca5d49dc7dedb37c26`

Added:

- Preflight evidence directory
- Adapter contracts و unit tests قبل از Build
- Shared Core path triggers
- Web Adapter metadata
- Source bundle شامل `web` و `packages/nutrition-core`

### First implementation run

- Nutrition CI `30868017674` — success
- Web CI `30868017681` — failure
- TypeScript: pass
- Adapter tests: `9/9` pass
- Build failure: Turbopack نتوانست local Package خارج از Web project root را resolve کند.
- Failure Artifact `8876835298`
- Digest `sha256:cb87d29bd5350e28a4b75d5125f21bb21dd8d0924a6f92f32bed788fc30f0b6d`

این Failure نشان داد Adapter logic درست است و مشکل فقط Build/package boundary است.

### Build correction

Commit:

- `d0c1f5641fa1a42659430f773df9edb067d4beae`

Correction:

- Turbopack `root` به ریشهٔ ریپو منتقل شد.
- `transpilePackages` حفظ شد.
- هیچ Nutrition behavior برای عبور Build تغییر نکرد.

### Final implementation validation

Nutrition Core:

- Run `30868108531` — success
- `52/52` pass
- 13 Pure source files
- Artifact `8876863249`
- Digest `sha256:67e3e82e315b79224fdecea776358c267dec91786d8413651f98a4ed3a417b57`

Web:

- Run `30868108528` — success
- Adapter tests `9/9`
- strict TypeScript pass
- Next production build pass
- generated PWA icons pass
- visual regression pass
- PWA runtime/offline pass
- reproducible Web+Core source bundle pass
- Artifact `8876875655`
- Digest `sha256:04a7173e89e8e1d8e3b07c9a74f6977019e74176227c9970f58bea24b03c2d31`

### Proven Fixture outputs

- 1.5 سهم قورمه‌سبزی: 495 kcal، P33، C21، F30، grams `null`
- 2 تخم‌مرغ: 156 kcal، P12، C2، F10، grams 100
- Initial lunch: 710 kcal، P29، C96، F24
- Initial day: 866 kcal، P41، C98، F34، remaining 1334، progress 39%
- 1.5 سهم جوجه: 480 kcal، P60، C6، F22.5
- New day: 1346 kcal، P101، C104، F56.5، remaining 854، progress 61%

### Claim boundary

Proven:

- Web Prototype از Shared Core برای estimate، recipe، day summary، goal و search normalization استفاده می‌کند.
- Component Nutrition math تکراری ندارد.
- Fixture flow با Core رفتار قفل‌شده را تولید می‌کند.

Not proven:

- Full Catalog در Browser
- IndexedDB/Offline Catalog
- Supabase/Auth/Sync
- AI/Vision
- Vercel HTTPS Preview

### Gate پایان Entry

- Master Plan commit `8503613e55c52ddb6ee6f558246a0298a8d5d240`
- Progress Log با این Entry به‌روزرسانی شد.
- PR #23 تا CI اسناد و Review نهایی Draft باقی می‌ماند.

### Exact continuation point

1. Nutrition Core CI و Web CI روی Head اسناد بررسی شوند.
2. PR #23 و Review threadها دوباره خوانده شوند.
3. PR فقط پس از سبز ماندن همهٔ Gateها Ready شود.
4. Findingها رفع شوند.
5. PR #23 با expected head Merge شود.
6. Issue #17 با شواهد Batchهای 1–6 به‌روزرسانی شود.
7. Closure docs روی Integration branch Stage 3 را Completed ثبت کنند.
8. Issue #17 فقط پس از CI سبز Closure docs بسته شود.
9. Stage 4 بدون تأیید صریح Organization، Region و Cost شروع نشود.
10. Issue #16 تا Vercel HTTPS Preview واقعی باز بماند.

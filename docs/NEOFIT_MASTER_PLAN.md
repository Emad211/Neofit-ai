# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 6 Web Nutrition Adapter parity  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/web-adapter-parity`  
**Active PR:** #23 — Draft تا CI اسناد و Review نهایی  
**Stage 3 Issue:** #17  
**Deferred Vercel Issue:** #16  
**Batch 6 base:** Batch 5 merge `d3c0a28ecf2596e94c86ff74e2f00a0523219433`  
**Validated implementation head:** `d0c1f5641fa1a42659430f773df9edb067d4beae`  
**Nutrition Core CI:** `30868108531` — success  
**Nutrition artifact:** `8876863249`  
**Nutrition digest:** `sha256:67e3e82e315b79224fdecea776358c267dec91786d8413651f98a4ed3a417b57`  
**Web CI:** `30868108528` — success  
**Web artifact:** `8876875655`  
**Web digest:** `sha256:04a7173e89e8e1d8e3b07c9a74f6977019e74176227c9970f58bea24b03c2d31`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** CI روی اسناد، Review نهایی و Merge PR #23؛ سپس تصمیم بستن Stage 3/Issue #17

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point این سند اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای وضعیت واقعی ریپو و CI را نمی‌گیرد.

## ۲. معماری و قراردادهای قفل‌شده

- Web: Next.js App Router + strict TypeScript
- Shared nutrition domain: `packages/nutrition-core`
- Web Adapter: `web/lib/nutrition-adapter.ts`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Supabase فقط پس از بسته‌شدن Stage 3 و تأیید Organization/Region/Cost
- AI/Vision بدون اختیار تولید یا اصلاح Nutrition
- Pure Core بدون UI، React، Expo، SQLite runtime، Network، filesystem، environment یا crypto runtime
- `node:crypto`، `node:sqlite`، migrations، Asset loading و full audits فقط در Test/Audit/Adapter layer
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- Canonical IDs، fingerprints و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.
- App-profile ID و IFKB Canonical ID Namespaceهای جدا و متصل با Mapping صریح‌اند.
- Imported/Custom با Seed overwrite یا downgrade نمی‌شوند.
- Web اجازهٔ duplicated calories/macros/range/goal/search arithmetic ندارد.

## ۳. وضعیت مراحل

### Stage 0–2

- Pivot: PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX: PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- PWA Foundation: PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Vercel Preview/HTTPS در Issue #16 تعویق شده و پیش از Web RC اجباری است.

### Stage 3 Batch 1 — Arithmetic/domain

انجام‌شده — PR #18، Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`؛ `10/10` tests.

### Stage 3 Batch 2 — Controlled Persian Search/Ranking

انجام‌شده — PR #19، Merge `917f04e319a924dda7dfb16d079453a5e5686541`؛ `25/25` tests.

مرز ادعا: Benchmark 500تایی Controlled Alias است؛ Independent Natural Query frozen corpus منتشر نشده است.

### Stage 3 Batch 3 — Catalog Release/Provenance/Legacy Adapter

انجام‌شده — PR #20، Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`؛ `34/34` tests.

### Stage 3 Batch 4 — Universal SR/FNDDS Estimate + SQLite Equivalence

انجام‌شده — PR #21، Merge `d6c0df31999595096224ec1011574245d5dc75ad`؛ `43/43` tests، 12 Pure source files.

### Stage 3 Batch 5 — Canonical ID/Fingerprint/Release Parity

انجام‌شده — PR #22، Merge `d3c0a28ecf2596e94c86ff74e2f00a0523219433`.

Final evidence:

- Head `68a521be59fc48ec15bf24f096f13ea8bb8d7b98`
- Nutrition CI `30866846053`
- Artifact `8876414906`
- Web CI `30866846046`
- Web Artifact `8876436046`
- `52/52` Core tests، 13 Pure source files

### Stage 3 Batch 6 — Web Nutrition Adapter

**پیاده‌سازی و Parity سبز؛ PR #23 در Gate نهایی اسناد/Review.**

#### Authority

- `docs/NEOFIT_WEB_NUTRITION_ADAPTER_AUTHORITY_MAP.md`
- Web fixtures Blob `08e623948b84e4e4e261528b1c332ae2e76af4b7`
- Web prototype Blob `add0839d207e5b3b12288657fe53077c9a4fda0a`
- Mobile legacy UI adapter Blob `bbacac7a376ba9edb14b14f673d3d708dfa3319e`
- Core Legacy adapter Blob `eb4be071cfb3ccc6bb03261abf49aa7ae972028d`
- Core Search Blob `3dc081e6f22f9d98518ad7411bcbd5c6394cc983`
- Core Diary Blob `e297eed728a7457b9b46529a761e450bd647e97d`
- Core Types Blob `62fde93f8ce534b199cfe41e28da3b9903741576`

#### Web arithmetic inventory

منطق تکراری کشف‌شده و حذف‌شده:

- `sumMacros` دستی
- ضرب مستقیم `selectedFood.* * portionCount`
- `Math.round` و `toFixed(1)` برای Nutrition
- Initial diary با Macroهای ازپیش‌جمع‌شده
- Persian search normalization ساده و مستقل
- calorie remaining/progress مستقل از Goal Core

#### Package integration

بدون Turborepo/Nx:

- `packages/nutrition-core/package.json` دارای export مستقیم `./src/index.ts`
- `web/package.json` دارای dependency محلی `file:../packages/nutrition-core`
- Next دارای `transpilePackages: ['@neofit/nutrition-core']`
- Turbopack root روی ریشهٔ ریپو تنظیم شده تا Package محلی خارج از `web/` قابل resolve باشد.
- Source bundle استقرار اکنون هر دو مسیر `web` و `packages/nutrition-core` را شامل می‌شود.

#### Fixture migration

`web/data/fixtures.ts` اکنون:

- Foodها را به‌صورت کامل `LegacyCatalogFood` نگه می‌دارد؛
- Alias، Evidence، Source record/version، variability و portion weight را حفظ می‌کند؛
- Initial diary فقط Source reference نگه می‌دارد؛
- Breakfast = تخم‌مرغ × 2؛
- Lunch = قورمه‌سبزی × 1 + چلو × 1؛
- Macro جمع‌شده در Diary seed ندارد؛
- Goalها از نوع `NutritionGoals` هستند.

#### Adapter surface

فایل `web/lib/nutrition-adapter.ts`:

- `estimateWebFood`
- `createWebDiaryEntry`
- `buildInitialWebDiary`
- `summarizeWebDiary`
- `filterWebFoods`
- `webMacrosFromEstimate`
- `mealTypeLabelFa`

Shared Core authority:

- Food → Variant: `legacyCatalogFoodToDocument`
- portion estimate: `calculateVariantNutrition`
- meal composition: `calculateRecipe`
- day totals: `summarizeDiaryDay`
- goal ratio/remaining: `calculateGoalProgress`
- Persian normalization: `normalizePersianText`

Web فقط View model و Presentation clamp تولید می‌کند. اگر یکی از چهار Macro اصلی Missing باشد، View conversion fail-closed است.

#### Proven fixture outputs

- قورمه‌سبزی 1.5 سهم: 495 kcal، P33، C21، F30، grams `null`
- دو تخم‌مرغ: 156 kcal، P12، C2، F10، 100g
- Initial lunch: 710 kcal، P29، C96، F24، grams `null`
- Initial day: 866 kcal، P41، C98، F34، remaining 1334، progress 39%
- افزودن 1.5 سهم جوجه: 480 kcal، P60، C6، F22.5
- New day: 1346 kcal، P101، C104، F56.5، remaining 854، progress 61%

#### Test-first evidence

Authority/Golden checkpoint:

- Authority commit `f8ac06375335dffa1b9acd8d24a303b408518037`
- Golden commit `ac9b9a271c0913b531e24948b23cd3e6d9b445f2`
- Web CI `30867460723` — success
- Artifact `8876656669`
- Digest `sha256:857dfa4d188a5f606d357258e1fba77251bb2b9c67aad9ba094f1655406f2b9d`

Expected Red:

- Test commit `3098ea11528e1cddf1a770f1bac425f3ac5852f5`
- Web CI `30867587259` — expected failure
- PWA/product contracts passed.
- TypeScript failed because `web/lib/nutrition-adapter.ts` did not exist.
- Build/runtime skipped.
- Artifact upload also failed because Web CI هنوز preflight directory نداشت؛ این ضعف در Implementation رفع شد.

Implementation commits:

- Core package export `2f0bc14a801f7443779ec2328698dd9f07875744`
- Web local dependency `926845f478e76c3f567d12fcc36842bedaf8145c`
- Initial Next transpilation `cbca8e2961cf630ab61cceba17979532dcf48c6c`
- Fixture migration `11fe4e4262ffbd7e739cfed1deba5809b8749aac`
- Golden correction `e08b67f4297df4f3ba77f9fbe9f2d4013984dc01`
- Test correction `a05bf9eed351ae2d10c7346a1bf7bde9f33f47e0`
- Web Adapter `b81dd6dab2a7168ba9585307184420a997e0ac29`
- Component refactor `2c611bc54ff594d65d408f376984f6c6c1cf5a2f`
- Web CI hardening `2ea5bc814964f808dc23f3ca5d49dc7dedb37c26`

First implementation run:

- Nutrition CI `30868017674` — success
- Web CI `30868017681` — failure
- TypeScript: pass
- Adapter tests: `9/9` pass
- Next build failed only because Turbopack package resolution root هنوز `web/` بود.
- Failure evidence Artifact `8876835298`
- Digest `sha256:cb87d29bd5350e28a4b75d5125f21bb21dd8d0924a6f92f32bed788fc30f0b6d`

Build correction:

- Commit `d0c1f5641fa1a42659430f773df9edb067d4beae`
- Turbopack root روی repository root تنظیم شد.
- Domain/Adapter behavior برای عبور Build تغییر نکرد.

Final implementation validation:

- Nutrition CI `30868108531` — success
- Core tests `52/52`، 13 Pure source files
- Nutrition Artifact `8876863249`
- Digest `sha256:67e3e82e315b79224fdecea776358c267dec91786d8413651f98a4ed3a417b57`
- Web CI `30868108528` — success
- Adapter tests `9/9`
- strict TypeScript: pass
- Next production build: pass
- Visual regression: pass
- PWA runtime/offline gates: pass
- Shared Web+Core source bundle: pass
- Web Artifact `8876875655`
- Digest `sha256:04a7173e89e8e1d8e3b07c9a74f6977019e74176227c9970f58bea24b03c2d31`

#### Claim boundary

Batch 6 ثابت می‌کند Web Prototype برای Nutrition arithmetic، daily aggregation، goal progress و Persian normalization از Shared Core استفاده می‌کند و Component دیگر Nutrition math تکراری ندارد.

Batch 6 ثابت نمی‌کند:

- Catalog کامل 13,225 رکوردی در Browser بارگذاری شده؛
- IndexedDB/Offline catalog آماده است؛
- Supabase/Auth/Sync ساخته شده؛
- AI/Vision فعال است؛
- Vercel HTTPS Preview تأیید شده است.

### Stage 3 closure status

Batchهای 1 تا 5 Merge شده‌اند. Batch 6 از نظر Code/Tests/Build سبز است ولی تا Merge PR #23، Stage 3 بسته اعلام نمی‌شود.

پس از Merge #23 باید این Closureها کنترل شوند:

- PR #23 merge SHA ثبت شود؛
- Issue #17 با شواهد Batchهای 1–6 بسته شود؛
- هر دو سند روی Integration branch به `Stage 3 complete` منتقل شوند؛
- Stage 4 فقط پس از تأیید Organization/Region/Cost آغاز شود.

## ۴. Stage 4–9

- Stage 4: Supabase project/Auth/Postgres/RLS فقط پس از Stage 3 closure و تأیید هزینه/Region/Organization
- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Offline Catalog/Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC، Vercel HTTPS و بستن Issue #16

## ۵. Anti-goalها

- Supabase پیش از Stage 3 closure و تأیید هزینه
- Nutrition arithmetic داخل React component
- Macroهای precomputed در Web diary seed
- Search normalizer موازی با Core
- Provider-created Nutrition
- واردکردن persistence/network/SQLite به Pure Core
- معرفی Schema/ID candidate به‌عنوان Final
- ادعای Full Catalog browser integration از Fixture adapter
- ادعای Vercel Preview پیش از Deployment واقعی

## ۶. Exact continuation point

1. Nutrition Core CI و Web CI روی Commitهای این دو سند پاس شوند.
2. PR #23 و تمام Review threadها دوباره بررسی شوند.
3. PR #23 فقط پس از سبز ماندن CI از Draft به Ready تبدیل شود.
4. Findingهای جدید رفع شوند.
5. PR #23 با expected head Merge شود.
6. Merge commit و کل Stage 3 evidence در Issue #17 ثبت شود.
7. یک Closure update روی Integration branch هر دو سند را به `Stage 3 complete` منتقل کند.
8. Issue #17 فقط پس از Closure docs و CI سبز بسته شود.
9. Stage 4 بدون تأیید صریح Organization، Region و Cost شروع نشود.
10. Issue #16 باز بماند تا Vercel Preview واقعی روی HTTPS تأیید شود.

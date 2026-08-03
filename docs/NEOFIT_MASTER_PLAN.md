# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 4 Authority/Golden checkpoint  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/universal-estimate-sqlite-parity`  
**Active PR:** هنوز ساخته نشده؛ Draft authority PR قدم بعدی است  
**Stage 3 Issue:** #17  
**Deferred Vercel Issue:** #16  
**Batch 4 base:** Batch 3 merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`  
**آخرین Head قبل از این سند:** `56dd449fb9aa169c00b60057aa26dff594d1e0d0`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** اعتبارسنجی Authority/Golden Batch 4؛ سپس test-first extraction از Universal estimator

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point این سند اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، خطا، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای وضعیت واقعی ریپو و CI را نمی‌گیرد.

## ۲. مأموریت و معماری قفل‌شده

NeoFit محصولی فارسی‌محور و Mobile-first برای ثبت و برنامه‌ریزی تغذیه و تمرین است.

- Web: Next.js App Router + TypeScript strict
- Pure nutrition domain: `packages/nutrition-core`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Hosting نهایی: Vercel
- Supabase فقط پس از پایان Stage 3 و تأیید Organization/Region/Cost
- App-shell Offline: Service Worker
- Catalog snapshot/mutation queue: IndexedDB در Stage 7
- زبان پیش‌فرض: فارسی و RTL
- AI/Vision فقط identity/structure؛ بدون اختیار ساخت Nutrition
- Monorepo tooling سنگین تا نیاز اثبات‌شده ممنوع

قراردادهای غیرقابل نقض:

- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- Nutrition فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- Ingredient حل‌نشده کل برنامهٔ AI را رد می‌کند.
- Imported/Custom با Seed overwrite یا downgrade نمی‌شوند.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.
- Pure Core هیچ UI، React Native، Expo، SQLite driver، Network، filesystem یا environment access ندارد.
- SQLite و `node:sqlite` فقط در Test/Adapter layer مجازند؛ نه در `packages/nutrition-core/src`.
- Catalog Generator/Asset/Manifest Authority اصلی‌اند؛ Runtime projection مستقل و دستی تغییر نمی‌کند.

## ۳. وضعیت مراحل

### Stage 0 — Pivot/Freeze

انجام‌شده — PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`.

### Stage 1 — Persian RTL UX

انجام‌شده و پذیرفته‌شده — PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`.

### Stage 2A — PWA Code Foundation

انجام‌شده — PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`.

### Stage 2B — Vercel Preview/HTTPS

تعویق‌شده در Issue #16.

- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview/Deployment: ندارد
- `vercel[bot]` محدودیت `api-deployments-free-per-day` با «more than 100» ثبت کرده است.

این Gate پیش از Web RC اجباری است، اما Stage 3 را Block نمی‌کند.

## ۴. Stage 3 — Nutrition Core Extraction و Parity

### Batch 1 — Arithmetic/domain

انجام‌شده — PR #18، Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`.

- types، nutrition، recipe، diary، goals
- AST pure-boundary verifier
- CI `30857715438`
- Artifact `8873108322`
- 10/10 pass
- Web CI `30857715413`

### Batch 2 — Controlled Persian Search/Ranking

انجام‌شده — PR #19، Merge `917f04e319a924dda7dfb16d079453a5e5686541`.

- normalization/modifiers/local search
- Alias routing
- Generic target resolution
- SR/FNDDS ranking
- CI `30858722741`
- Artifact `8873475224`
- 25/25 pass
- Web CI `30858722681`

مرز ادعا: Benchmark 500تایی Controlled Alias است؛ Independent Natural Query frozen corpus هنوز منتشر نشده است.

### Batch 3 — Catalog Release/Provenance/Legacy Adapter

انجام‌شده — PR #20، Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`.

Final branch head:

- `d8a46185c8e777fccc4526cba16a1f7451c22f41`

Final evidence:

- Nutrition Core CI `30861155760` — success
- Nutrition Artifact `8874374046`
- Digest `sha256:f827e27bb2dee03f16de991c51d723cf7a5a9dd6aa009ed2d7efe45796023425`
- Web CI `30861155825` — success
- Web Artifact `8874391849`
- Digest `sha256:fa62dbfe383a21becab2856856587412f8218be117e842d43056053e0747c412`
- 34/34 tests pass
- 11 Pure TypeScript files pass AST boundary
- Review thread باز پیش از Merge: صفر

Extracted surface:

- Catalog `1.2.0` consumer projection and invariants
- Schema/ID `candidate-not-final` baseline
- Evidence resolver and Imported allowlist
- Legacy per-serving/null-weight adapter
- bounded uncertainty and source metadata normalization

Authority distinction:

- Nutrition RC/Catalog `1.2.0` frozen است.
- Schema/ID `1.1.0` فقط auditable `candidate-not-final` baseline است.
- Generator/Manifest Source of Truth باقی می‌مانند.

### Batch 4 — Universal SR/FNDDS Estimate + SQLite Equivalence

**فعال؛ Authority و Golden fixture ساخته شده‌اند، implementation هنوز شروع نشده است.**

Branch:

- `stage3/universal-estimate-sqlite-parity`
- Base: `02c1bcf0b301a920b12abcff4f653575cb97bf7f`

Authority document:

- `docs/NEOFIT_UNIVERSAL_ESTIMATE_SQLITE_AUTHORITY_MAP.md`

Golden fixture:

- `packages/nutrition-core/tests/universal-estimate-golden-v1.ts`

Authority Blobها:

- Universal estimator `7f54426e0b6838700f09b831c7df5a94afef8361`
- Universal Repository `cdfacc1eafba4267cdc793284462bbabd7ca93b5`
- Expo Catalog DB adapter `687d7b41dac26e1821a141c181fa13cdd81b2186`
- Food Search consumer `df367a5d598925fa56eb3b2c36e47da8df504415`
- SQLite equivalence test `80538220517f8b4f0bc80117469b16f6a82c7bdf`
- SQLite test helper `d03caf85ccfbb68b245101d0646956fd9c32e045`
- Nutrition SQL contract `35ecdbd1f5baec8ee1b5845cfd994f15b5ff769d`
- Macro guard test `3f16b43a37f98b807c3b95577102bf682bff905d`
- Range test `2fd1f7f3c601c2ae48931f50a7ca1552ff45a2a2`

Pure/Core boundary:

- وارد Core:
  - `UniversalNutrientRecord`
  - `universalNutritionVector`
  - `universalSourceUncertainty`
  - `calculateUniversalFoodEstimate`
- فقط Test layer:
  - `node:sqlite`
  - SQL row/center equivalence
  - portable test schema
- خارج از Core:
  - Expo Asset/FileSystem/SQLite
  - Repository lifecycle/query/cache
  - UI و Diary persistence

Source uncertainty:

- FNDDS: `0.15`
- SR Legacy: `0.08`

Input contract:

- grams finite، `> 0` و `<= 100_000`
- invalid values fail-closed
- `null` nutrient به absent vector field تبدیل می‌شود، نه صفر

Selectability contract:

- `macroComplete=false`: در Ranker غیرقابل انتخاب
- macro-complete بدون Portion: با grams قابل استفاده
- estimator خودش Macro completeness را اختراع یا تکرار نمی‌کند

SQLite equivalence contract:

- SQL center = nutrient × grams / 100
- tolerance = `max(1e-10, abs(expected) * 1e-12)`
- SQL `NULL` با TypeScript absent مقایسه می‌شود
- uncertainty Range در TypeScript Golden می‌شود

Golden scenarios فعلی:

- FNDDS 150g و ±15% range
- SR Legacy 50g و ±8% range
- missing nutrient preservation
- full snake_case row mapping fixture
- grams boundary cases
- fractional SQLite equivalence grams
- macro-incomplete exclusion / grams-only record

**هیچ Batch 4 Parity، CI یا implementation success هنوز ادعا نمی‌شود.**

### Remaining Stage 3

1. تکمیل Batch 4 implementation/parity
2. Batch 5 — Canonical ID/fingerprint/release parity
3. Batch 6 — Web adapter بدون duplicated arithmetic

## ۵. Stage 4–9

- Stage 4: Supabase بعد از Stage 3 و تأیید هزینه
- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Offline Catalog/Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC و بستن Issue #16

## ۶. Anti-goalها

- Supabase پیش از Stage 3 parity
- بازنویسی از روی UI یا حدس
- silent fix به‌جای parity failure
- انتقال Expo/SQLite/filesystem/network به Pure Core
- تبدیل SQL query به API عمومی Domain
- تکرار Macro-completeness gate داخل estimator
- ویرایش Nutrition value یا uncertainty بدون Authority/Golden update
- ادعای کل-Catalog audit از روی چند Golden row
- PRهای چندمرحله‌ای بزرگ

## ۷. Exact continuation point

1. این سند و `docs/NEOFIT_PROGRESS_LOG.md` دوباره خوانده شوند.
2. CI Commitهای Authority/Golden و Branch head بررسی شود.
3. Draft PR Batch 4 از همین Branch باز شود.
4. PR صریحاً Authority/Golden-only و no-parity باشد.
5. parity testها قبل از implementation نوشته شوند:
   - source uncertainty
   - vector mapping/missing fields
   - grams boundaries
   - SQLite center equivalence
   - macro guard continuity
6. Red CI ناشی از نبود estimator ثبت شود.
7. `universal-food-estimate.ts` بدون تغییر معنایی استخراج شود.
8. `node:sqlite` فقط در tests استفاده شود.
9. Package exports، README و CI metadata به‌روزرسانی شوند.
10. Nutrition Core CI و Web CI پاس شوند.
11. Reviewها رفع و هر دو سند اجباری به‌روزرسانی شوند.
12. Supabase، Auth، AI، Repository runtime و Web adapter خارج از Scope بمانند.

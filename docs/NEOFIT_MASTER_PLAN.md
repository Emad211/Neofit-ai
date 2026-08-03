# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 4 Universal Estimate/SQLite parity  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/universal-estimate-sqlite-parity`  
**Active PR:** #21 — Draft تا Gate نهایی اسناد/Review  
**Stage 3 Issue:** #17  
**Deferred Vercel Issue:** #16  
**Batch 4 base:** Batch 3 merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`  
**Validated implementation/metadata head:** `9a405cdb625e2b479f9d4ef0bfe566de9eb57bb4`  
**Nutrition Core CI:** `30862265021` — success  
**Nutrition artifact:** `8874767798`  
**Nutrition digest:** `sha256:cb54c5d2c0968a98949ac834c7c81c575c040a7f814e08a9829c7bdd3b006033`  
**Web CI:** `30862264999` — success  
**Web artifact:** `8874785715`  
**Web digest:** `sha256:7f5eedb931be548cb80bff75a0924061f51503a56ef050e6d10c5116b4087800`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** CI اسناد، Review نهایی، Ready/Merge PR #21؛ سپس Batch 5 ID/Fingerprint/Release parity

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
- `node:sqlite` و SQL execution فقط در Test/Adapter layer مجازند.
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
- CI `30857715438`
- Artifact `8873108322`
- 10/10 pass
- Web CI `30857715413`

### Batch 2 — Controlled Persian Search/Ranking

انجام‌شده — PR #19، Merge `917f04e319a924dda7dfb16d079453a5e5686541`.

- normalization/modifiers/local search
- Alias routing و SR/FNDDS ranking
- CI `30858722741`
- Artifact `8873475224`
- 25/25 pass
- Web CI `30858722681`

مرز ادعا: Benchmark 500تایی Controlled Alias است؛ Independent Natural Query frozen corpus هنوز منتشر نشده است.

### Batch 3 — Catalog Release/Provenance/Legacy Adapter

انجام‌شده — PR #20، Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`.

- Catalog `1.2.0` consumer projection/invariants
- Schema/ID `candidate-not-final` baseline
- Evidence resolver و Imported allowlist
- Legacy per-serving/null-weight adapter
- CI `30861155760`
- Artifact `8874374046`
- 34/34 pass
- Web CI `30861155825`

### Batch 4 — Universal SR/FNDDS Estimate + SQLite Equivalence

**پیاده‌سازی و Parity سبز؛ PR #21 در Gate نهایی.**

#### Authority

- `docs/NEOFIT_UNIVERSAL_ESTIMATE_SQLITE_AUTHORITY_MAP.md`
- Estimator Blob `7f54426e0b6838700f09b831c7df5a94afef8361`
- Repository Blob `cdfacc1eafba4267cdc793284462bbabd7ca93b5`
- Expo DB Adapter Blob `687d7b41dac26e1821a141c181fa13cdd81b2186`
- Consumer Blob `df367a5d598925fa56eb3b2c36e47da8df504415`
- SQLite equivalence Blob `80538220517f8b4f0bc80117469b16f6a82c7bdf`
- SQLite helper Blob `d03caf85ccfbb68b245101d0646956fd9c32e045`
- Nutrition SQL Blob `35ecdbd1f5baec8ee1b5845cfd994f15b5ff769d`
- Macro guard Blob `3f16b43a37f98b807c3b95577102bf682bff905d`
- Range Blob `2fd1f7f3c601c2ae48931f50a7ca1552ff45a2a2`

#### Extracted Pure surface

- `UniversalNutrientRecord`
- `universalNutritionVector`
- `universalSourceUncertainty`
- `calculateUniversalFoodEstimate`

Implementation:

- `packages/nutrition-core/src/universal-food-estimate.ts`
- exact semantic extraction from Mobile RC
- Package export added

#### Boundary

Pure Core contains no SQLite runtime.

Test-only:

- `node:sqlite`
- SQL fixture and direct center arithmetic comparison

Excluded:

- Expo Asset/FileSystem/SQLite
- database lifecycle/query/cache
- Repository runtime/persistence
- UI/Diary
- Supabase/Auth/AI/Vision/Web adapter

#### Source uncertainty

- FNDDS: `0.15`
- SR Legacy: `0.08`

This is App-level uncertainty, not laboratory confidence interval.

#### Input and missing-data behavior

- grams must be finite، `> 0` و `<= 100_000`
- zero/negative/NaN/Infinity/>100000 reject
- SQLite `NULL` becomes absent TypeScript nutrient field, not zero
- nutrient order follows `NUTRIENT_KEYS`
- center and range preserve Batch 1 canonical precision

#### Selectability boundary

- macro-incomplete exclusion remains in Ranker/Repository
- estimator does not duplicate that gate
- macro-complete record without official portions remains grams-usable

#### Test-first evidence

Authority/Golden checkpoint:

- Authority commit `200f60e02f8503e418e04ec6d79f4d3e087d2d37`
- Golden commit `56dd449fb9aa169c00b60057aa26dff594d1e0d0`
- Docs checkpoint head `4d2b8856747a20a98a367fde178ee5508b2594e0`
- Nutrition CI `30861878272` — success
- Artifact `8874629427`
- Digest `sha256:aa75ab81bc0595ee45440af9c01c0dfbe99095b5b09abab5e5559b0786891a3b`
- Web CI `30861878306` — success

Expected Red:

- Test commit `58552cb7c8a586aa064b676096d23cfa77f26137`
- Nutrition CI `30861996867` — expected failure
- Golden provenance: pass
- AST boundary: pass
- TypeScript failed only because four estimator APIs did not exist
- preflight Artifact `8874670235`
- Digest `sha256:45fd21c208b11f1772a2514ba1fcd852cc23c5bf40b538e5f0da35054c31fe50`

Implementation:

- estimator commit `19b0fdc8f47a76996450e5a829113cc001bf036b`
- export head `7128badbda60a581f860067aae28f24fd0d7cfb3`

First Green:

- Nutrition CI `30862069748` — success
- Artifact `8874698782`
- Digest `sha256:0d5e80453e5b52137143464e8c23417701451147da28edeba9b54b338d226899`
- Web CI `30862069747` — success
- Web Artifact `8874722004`
- Web digest `sha256:9963c9454b44212a493ba8b83ba44a5acaa4e0bb9b727f0f1b6f79cbe0a9e206`

Final README/CI metadata:

- README commit `a526e8040b7fe3bd27207ccfce574c993de5f779`
- CI metadata head `9a405cdb625e2b479f9d4ef0bfe566de9eb57bb4`
- Nutrition CI `30862265021` — success
- Artifact `8874767798`
- Digest `sha256:cb54c5d2c0968a98949ac834c7c81c575c040a7f814e08a9829c7bdd3b006033`
- Web CI `30862264999` — success
- Web Artifact `8874785715`
- Web digest `sha256:7f5eedb931be548cb80bff75a0924061f51503a56ef050e6d10c5116b4087800`

#### Proven behavior

- 12 Pure TypeScript source files pass AST boundary
- strict TypeScript pass
- 43/43 tests pass؛ 0 fail، 0 skipped
- FNDDS 150g + ±15% range
- SR Legacy 50g + ±8% range
- all-null/partial nutrients remain missing-aware
- grams boundaries fail closed
- snake_case Repository fixture maps without invented values
- direct SQLite center arithmetic matches TypeScript at 1، 50.5، 83.3، 100، 175.25 و 999.9g
- macro-incomplete record remains excluded
- macro-complete no-portion record remains grams-usable
- Web/PWA regression remains green

#### Claim boundary

Batch 4 proves Pure estimator parity and Golden-row direct SQLite equivalence. It does not claim that the complete 13,225-record Catalog audit was rerun.

### Remaining Stage 3

1. Batch 5 — Canonical ID/fingerprint/release parity
2. Batch 6 — Web adapter بدون duplicated arithmetic

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
- تغییر uncertainty بدون Authority/Golden update
- ادعای کل-Catalog audit از روی Golden rows
- PRهای چندمرحله‌ای بزرگ

## ۷. Exact continuation point

1. Nutrition Core CI و Web CI روی Commitهای این اسناد پاس شوند.
2. PR #21 و تمام Review threadها دوباره بررسی شوند.
3. PR #21 فقط پس از سبز ماندن CI، از Draft به Ready تبدیل شود.
4. Reviewهای جدید رفع شوند.
5. PR #21 با expected head Merge شود.
6. Issue #17 باز بماند و Batch 4 completed ثبت شود.
7. Branch متمرکز Batch 5 از Merge commit ساخته شود.
8. پیش از کد Batch 5 این Authorityها خوانده شوند:
   - `mobile/scripts/audit-schema-freeze-candidate.ts`
   - `docs/releases/NEOFIT_SCHEMA_ID_FREEZE_CANDIDATE_V1.md`
   - `docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md`
   - Catalog release contract tests و ID/mapping fingerprint sources
9. Authority Map و Golden fixture Batch 5 پیش از implementation ساخته شوند.
10. Supabase، Auth، AI، Repository runtime و Web adapter خارج از Scope بمانند.

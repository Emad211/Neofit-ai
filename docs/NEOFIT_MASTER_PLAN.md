# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 Draft/Golden checkpoint نهایی  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/catalog-provenance-parity`  
**Active PR:** #20 — Draft  
**Stage 3 Issue:** #17  
**Deferred Vercel Issue:** #16  
**Batch 3 base:** Batch 2 merge `917f04e319a924dda7dfb16d079453a5e5686541`  
**Final validated handoff head:** `ef8cfbd0ffa72107a261d48d80e1d1dfc9fbe040`  
**Nutrition Core CI:** `30859761558` — success  
**Nutrition artifact:** `8873871345`  
**Nutrition digest:** `sha256:97504ad88572a5f8efafa957b7525e05223a120f3a54f205c7d4c3a8ddb9f645`  
**Web CI:** `30859761557` — success  
**Web artifact:** `8873894595`  
**Web digest:** `sha256:79c86d24321b3e3c5a5c0cb81a638ed7ffb50884cd375ae76d3c39ab9ebe68d9`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** test-first implementation سه ماژول Batch 3؛ PR #20 عمداً Draft است

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point این سند اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، خطا، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای ریپو و CI را نمی‌گیرد.

## ۲. معماری و قراردادهای قفل‌شده

- Web: Next.js App Router + TypeScript strict
- Pure nutrition domain: `packages/nutrition-core`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Hosting نهایی: Vercel
- Supabase فقط بعد از پایان Stage 3 و تأیید Organization/Region/Cost
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
- Runtime Release projection مستقل از Manifest/Generator دستی ویرایش نمی‌شود.

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

### Stage 3 — Nutrition Core Extraction و Parity

#### Batch 1 — Arithmetic/domain

انجام‌شده — PR #18، Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`.

- types، nutrition، recipe، diary، goals
- AST pure-boundary verifier
- CI `30857715438`
- Artifact `8873108322`
- 10/10 pass
- Web CI `30857715413`

#### Batch 2 — Controlled Persian Search/Ranking

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

#### Batch 3 — Catalog Release/Provenance/Legacy Adapter

**فعال — PR #20 Draft؛ Authority و Golden checkpoint سبز، implementation شروع‌نشده.**

Authority documents:

- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`
- `docs/NEOFIT_NUTRITION_CORE_AUTHORITY_MAP.md`

Golden fixture:

- `packages/nutrition-core/tests/catalog-provenance-golden-v1.ts`

Pure modules هدف:

- `catalog-release.ts` Blob `1afb7266b7d456530febb5c1c49c109e3d1f3ef7`
- `catalog-provenance.ts` Blob `1edb7e8eed151305075e634a84596db2211dffaf`
- `legacy-catalog-adapter.ts` Blob `30fcc0d774a43f0f0608bd29c342c3e20d339f58`

Generator/Audit authority:

- Workflow `1012754613cf99bd3c73de49830731e9cc52adcf`
- Builder `597180d6bd540bc9b8bf0fc931c030d534289f5c`
- Concept augmenter `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0`
- Generated Manifest `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Schema audit `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1`

Frozen Catalog 1.2.0:

- DB bytes `13,885,440`
- DB SHA `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- foods `13,225`
- concepts `9,279`
- portions `36,494`
- Canon IDs `261`
- aliases `218`
- mapping coverage `1.0`

Golden contract includes:

- complete Release projection
- Schema/ID candidate hash baseline and `candidate-not-final` status
- Evidence-tier matrix and imported allowlist
- Legacy null-weight/per-serving/uncertainty/source metadata cases

Critical distinction:

- Nutrition RC و Catalog 1.2.0 frozen هستند.
- Schema/ID `1.1.0` صریحاً `candidate-not-final` و فقط auditable baseline است، نه public compatibility promise.

Final Golden checkpoint evidence:

- Head `ef8cfbd0ffa72107a261d48d80e1d1dfc9fbe040`
- Nutrition Core CI `30859761558` success
- Artifact `8873871345`
- Digest `sha256:97504ad88572a5f8efafa957b7525e05223a120f3a54f205c7d4c3a8ddb9f645`
- Web CI `30859761557` success
- Web Artifact `8873894595`
- Web digest `sha256:79c86d24321b3e3c5a5c0cb81a638ed7ffb50884cd375ae76d3c39ab9ebe68d9`
- Review threads: none

**این checkpoint فقط سلامت Authority/Fixture و نبود Regression را ثابت می‌کند. Batch 3 parity هنوز ثابت نشده است.**

سه ماژول هنوز Extract نشده‌اند و `catalog-provenance-parity.test.ts` وجود ندارد.

#### Remaining Stage 3

1. تکمیل Batch 3 tests/implementation
2. Universal SR/FNDDS estimates + SQLite equivalence
3. Canonical ID/fingerprint/release parity
4. Web adapter بدون duplicated arithmetic

### Stage 4–9

- Stage 4: Supabase بعد از Stage 3 و تأیید هزینه
- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Offline Catalog/Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC و بستن Issue #16

## ۴. Anti-goalها

- Supabase پیش از Stage 3 parity
- بازنویسی از روی UI یا حدس
- silent fix به‌جای parity failure
- انتقال Generator/SQLite/filesystem/hash execution به Pure Core
- ویرایش دستی Release snapshot مستقل از Manifest
- معرفی Schema/ID candidate به‌عنوان Final
- Ready/Merge کردن PR #20 قبل از implementation parity

## ۵. Exact continuation point

1. در نوبت بعد دوباره هر دو سند و PR #20/CI/Reviews خوانده شوند.
2. `packages/nutrition-core/tests/catalog-provenance-parity.test.ts` **قبل از implementation** ساخته شود.
3. Tests باید قفل کنند:
   - Release projection = Golden Manifest fields
   - candidate status = `candidate-not-final`
   - Evidence matrix/imported allowlist
   - Legacy per-serving/null weight
   - variability clamp `0..0.8`
   - sourceRecord fallback و blank sourceVersion omission
4. سپس سه ماژول بدون تغییر معنایی Extract شوند.
5. Package index/README و CI metadata به Manifest/Freeze Blobs وصل شوند.
6. Nutrition Core CI و Web CI دوباره اجرا شوند.
7. Reviewها رفع و فقط با شواهد کامل PR #20 Ready for Review شود.
8. هر دو سند با final head/run/artifact به‌روزرسانی شوند.
9. Supabase، Auth، AI، SQLite execution، repositories و Web adapter خارج از Scope بمانند.

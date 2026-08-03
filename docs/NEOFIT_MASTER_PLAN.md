# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 Draft/Golden checkpoint  
**شاخهٔ integration:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage3/catalog-provenance-parity`  
**PR فعال:** #20 — Draft  
**Issue Stage 3:** #17  
**Issue Vercel تعویق‌شده:** #16  
**مبنای Batch 3:** Batch 2 merge `917f04e319a924dda7dfb16d079453a5e5686541`  
**Head Golden checkpoint:** `22b7034843a97fa9ded83b10db495dc9bc50a340`  
**Nutrition Core CI:** `30859529407` — success  
**Artifact:** `8873784525`  
**Artifact digest:** `sha256:1a85f9f6574ae5563e29fb40f25fb7cc1bcee605be478caec6b9fd4f00fa0bb3`  
**Web CI:** `30859529411` — success  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** test-first implementation سه ماژول Batch 3؛ PR هنوز Draft است

## پروتکل اجباری

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، خطا، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- گزارش مکالمه جای ریپو و CI را نمی‌گیرد.

## ۱. مأموریت و معماری

NeoFit محصول فارسی‌محور، Mobile-first و قابل نصب برای ثبت و برنامه‌ریزی تغذیه و تمرین است.

- Web: Next.js App Router + TypeScript strict
- Pure nutrition domain: `packages/nutrition-core`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Hosting نهایی: Vercel
- Supabase فقط پس از پایان Stage 3 و تأیید Organization/Region/Cost
- App-shell Offline: Service Worker
- Catalog snapshot/mutation queue: IndexedDB در Stage 7
- AI/Vision فقط هویت و ساختار؛ بدون اختیار تولید Nutrition
- Monorepo tooling سنگین تا اثبات نیاز ممنوع

## ۲. قراردادهای غیرقابل نقض

- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- Nutrition نهایی فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Missing nutrient صفر نیست و وزن نامعلوم `null` است.
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

- Project `neofit-ai`
- ID `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview ندارد
- `vercel[bot]` محدودیت `api-deployments-free-per-day` با «more than 100» ثبت کرده است.

این Gate قبل از Web RC اجباری است، اما Stage 3 را Block نمی‌کند.

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

مرز ادعا: Benchmark 500تایی Controlled Alias است؛ Natural Query frozen corpus هنوز وجود ندارد.

#### Batch 3 — Catalog Release/Provenance/Legacy Adapter

**فعال؛ PR #20 Draft و فقط Golden checkpoint سبز است.**

Authority:

- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`
- Catalog workflow Blob `1012754613cf99bd3c73de49830731e9cc52adcf`
- Builder Blob `597180d6bd540bc9b8bf0fc931c030d534289f5c`
- Concept augmenter Blob `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0`
- Manifest Blob `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Runtime release Blob `1afb7266b7d456530febb5c1c49c109e3d1f3ef7`
- Provenance Blob `1edb7e8eed151305075e634a84596db2211dffaf`
- Legacy adapter Blob `30fcc0d774a43f0f0608bd29c342c3e20d339f58`
- Schema audit Blob `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1`

Golden fixture:

- `packages/nutrition-core/tests/catalog-provenance-golden-v1.ts`
- complete Catalog 1.2.0 projection
- Schema/ID candidate hash baseline and `candidate-not-final` status
- Evidence-tier matrix/imported allowlist
- Legacy null-weight/per-serving/uncertainty/source metadata cases

Checkpoint evidence:

- Head `22b7034843a97fa9ded83b10db495dc9bc50a340`
- Nutrition Core CI `30859529407` success
- Artifact `8873784525`
- Digest `sha256:1a85f9f6574ae5563e29fb40f25fb7cc1bcee605be478caec6b9fd4f00fa0bb3`
- Web CI `30859529411` success
- Review threads: none

**این checkpoint فقط سلامت Authority/Fixture را ثابت می‌کند. Batch 3 parity هنوز ثابت نشده است.**

Modules هنوز Extract نشده‌اند:

- `catalog-release.ts`
- `catalog-provenance.ts`
- `legacy-catalog-adapter.ts`

Critical distinction:

- Nutrition RC و Catalog 1.2.0 frozen هستند.
- Schema/ID version 1.1.0 صریحاً `candidate-not-final` و فقط auditable baseline است، نه public compatibility promise.

#### Batchهای باقی‌مانده Stage 3

1. تکمیل Batch 3 implementation/tests
2. Universal SR/FNDDS estimates + SQLite equivalence
3. Canonical ID/fingerprint/release parity
4. Web adapter بدون duplicated arithmetic

### Stage 4

Supabase فقط پس از پایان Stage 3 و تأیید هزینه.

### Stage 5–9

Nutrition vertical slice، AI/Vision، Offline sync، Recovery و Web RC مطابق Roadmap؛ Issue #16 قبل از RC بسته شود.

## ۴. Anti-goalها

- Supabase پیش از Stage 3 parity
- بازنویسی از روی UI یا حدس
- silent fix به‌جای parity failure
- انتقال Generator/SQLite/filesystem/hash execution به Pure Core
- ویرایش دستی Release snapshot مستقل از Manifest
- معرفی Schema/ID candidate به‌عنوان Final
- PR بزرگ چندمرحله‌ای

## ۵. Exact continuation point

1. دوباره هر دو سند و PR #20/CI/Reviews خوانده شوند.
2. `packages/nutrition-core/tests/catalog-provenance-parity.test.ts` **قبل از implementation** ساخته شود.
3. Tests باید قفل کنند:
   - Release projection = Golden Manifest fields
   - Schema/ID status = `candidate-not-final`
   - Evidence matrix
   - Imported tier allowlist
   - Legacy per-serving/null weight
   - variability clamp `0..0.8`
   - sourceRecord fallback و blank sourceVersion omission
4. سپس سه ماژول بدون تغییر معنایی Extract شوند.
5. Package index/README و CI metadata به Manifest/Freeze Blobs وصل شوند.
6. Nutrition Core CI و Web CI دوباره اجرا شوند.
7. Reviewها رفع و فقط پس از شواهد کامل PR #20 Ready for Review شود.
8. هر دو سند با final head/run/artifact به‌روزرسانی شوند.
9. Supabase، Auth، AI، SQLite execution، repositories و Web adapter خارج از Scope بمانند.

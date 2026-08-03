# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 Authority/Golden-first  
**شاخهٔ integration:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage3/catalog-provenance-parity`  
**PR فعال:** ندارد؛ Batch 3 هنوز پیش از extraction است  
**Issue Stage 3:** #17  
**Issue Vercel تعویق‌شده:** #16  
**مبنای Batch 3:** Batch 2 merge `917f04e319a924dda7dfb16d079453a5e5686541`  
**آخرین Commit Golden/Authority:** `8952aee52affa0112988de5cd92d68b2d74fc01d`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** CI Fixtureها، سپس test-first extraction برای Release/Provenance/Legacy adapter

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point همین سند اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، خطا، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- گزارش مکالمه جای ریپو و CI را نمی‌گیرد.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور، Mobile-first و قابل نصب برای ثبت و برنامه‌ریزی تغذیه و تمرین است.

> کاربر فارسی‌زبان باید بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و دادهٔ خود را امن و قابل بازیابی نگه دارد.

## ۲. معماری قفل‌شده

- Web: Next.js App Router + TypeScript strict
- Nutrition domain: `packages/nutrition-core`، Pure و deterministic
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Hosting نهایی: Vercel
- Auth/Postgres/RLS/Sync: Supabase فقط پس از پایان Stage 3
- App-shell Offline: Service Worker
- Catalog snapshot/mutation queue: IndexedDB در Stage 7
- زبان پیش‌فرض: فارسی و RTL
- AI/Vision: فقط هویت/ساختار؛ بدون اختیار تولید Nutrition
- Turborepo/Nx تا نیاز اثبات‌شده ممنوع است.

## ۳. قراردادهای غیرقابل نقض

- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- Nutrition نهایی فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Ingredient حل‌نشده کل برنامهٔ AI را رد می‌کند.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- Provider nutrition نادیده گرفته می‌شود.
- Imported/Custom user data با Seed overwrite یا downgrade نمی‌شود.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کند.
- Secretهای سروری وارد Browser bundle نمی‌شوند.
- Pure Core هیچ UI، React Native، Expo، SQLite driver، Network، filesystem یا environment access ندارد.
- Runtime Release projection نباید مستقل از Manifest/Generator دستی ویرایش شود.

## ۴. دارایی‌های علمی غیرقابل حذف

- ۱۳٬۲۲۵ Generic food records
- ۹٬۲۷۹ Generic concepts
- ۳۶٬۴۹۴ official portions
- ۲۶۱ Iranian canonical identities
- Canonical IDs، mappings، fingerprints و provenance
- deterministic arithmetic/portion/recipe/diary/goals/search/ranking
- Schema/ID/arithmetic/migration/catalog audits

`mobile/` و شاخهٔ `agent/iranian-food-kb-foundation` تا پایان Stage 3، Frozen parity oracle هستند.

## ۵. وضعیت مراحل

### Stage 0 — Pivot و Freeze

**انجام‌شده** — PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`.

### Stage 1 — Persian RTL UX

**انجام‌شده و پذیرفته‌شده** — PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`.

### Stage 2A — PWA Code Foundation

**انجام‌شده** — PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`.

### Stage 2B — Vercel Preview/HTTPS

**تعویق‌شده در Issue #16**.

- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Deployment/Preview: ندارد
- `vercel[bot]` خطای `api-deployments-free-per-day` با پیام «more than 100» ثبت کرده است.

این Gate پیش از Web RC اجباری است، اما Stage 3 را Block نمی‌کند.

### Stage 3 — Nutrition Core Extraction و Parity

**فعال**

#### Batch 1 — Pure arithmetic/domain

**انجام‌شده** — PR #18، Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`.

- types، nutrition، recipe، diary، goals
- schema version 1
- provenance-backed Mobile Golden fixtures
- TypeScript AST pure-boundary verifier
- final CI `30857715438`
- Artifact `8873108322`
- Digest `sha256:de0197b9ae9762a921a32c13071701064863aef8e77e612fb2e35bd49893d25f`
- 10/10 pass
- Web CI `30857715413` pass

#### Batch 2 — Controlled Persian Search/Universal Ranking

**انجام‌شده** — PR #19، Merge `917f04e319a924dda7dfb16d079453a5e5686541`.

Extracted:

- Persian normalization و modifier parsing
- deterministic local search
- Alias exact/longest/compact routing
- Generic target resolution
- SR Legacy/FNDDS ranking و stable tie policy

Authority:

- `docs/NEOFIT_SEARCH_RANKING_AUTHORITY_MAP.md`
- Search Blob `bb99c934beeed5094da7e0a29a8f53635ace48b3`
- Ranking Blob `9b23b1ef7d6817ff2b946e1fdedcad76608279e1`
- Alias registry Blob `94429b1937edc6234b23fc8398531b531a891cc2`
- Benchmark manifest Blob `24a1d20effe679b23e4ee4966d0bdb01f2b06ec0`

Final evidence:

- final head `34e576a5704d8f5ba4407bd0f063cca246849e4d`
- Nutrition Core CI `30858722741`
- Artifact `8873475224`
- Digest `sha256:28b428876f4c8295ddf359e89d7ba72b06d0dbc4928929c8ec0d17d5a7ca045b`
- Web CI `30858722681`
- 25/25 pass
- all Review threads resolved

Claim boundary:

- Official 500-case result یک Controlled Alias benchmark است.
- Independent Natural Query frozen corpus هنوز منتشر نشده است.
- typo/colloquial/regional/ambiguity/abstention accuracy اثبات نشده است.

#### Batch 3 — Catalog Release/Provenance/Legacy Adapter

**فعال؛ Authority و Golden fixture آماده، extraction شروع‌نشده**

Authority map:

- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`

Golden fixture:

- `packages/nutrition-core/tests/catalog-provenance-golden-v1.ts`
- Commit `8952aee52affa0112988de5cd92d68b2d74fc01d`

Pure modules هدف:

- `catalog-release.ts` Blob `1afb7266b7d456530febb5c1c49c109e3d1f3ef7`
- `catalog-provenance.ts` Blob `1edb7e8eed151305075e634a84596db2211dffaf`
- `legacy-catalog-adapter.ts` Blob `30fcc0d774a43f0f0608bd29c342c3e20d339f58`

Generator/Audit authority:

- Catalog workflow Blob `1012754613cf99bd3c73de49830731e9cc52adcf`
- Catalog builder Blob `597180d6bd540bc9b8bf0fc931c030d534289f5c`
- Concept augmenter Blob `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0`
- Generated Manifest Blob `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Schema/ID audit Blob `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c`

Frozen Catalog contract:

- version `1.2.0`
- DB bytes `13,885,440`
- DB SHA `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- foods `13,225`
- concepts `9,279`
- portions `36,494`
- Canon IDs `261`
- aliases `218`
- variant mapping coverage `1.0`

Critical distinction:

- Nutrition RC and Catalog 1.2.0 are frozen.
- Schema/ID document version `1.1.0` is explicitly `candidate-not-final` and only an auditable baseline، نه public compatibility promise.

Golden contract currently contains:

- complete Release projection values
- Schema/ID hash baseline and candidate status
- Evidence-tier matrix
- imported-tier allowlist
- Legacy null-weight/serving/uncertainty/source metadata cases

**No Batch 3 parity result is claimed yet.** Fixture compilation alone is not extraction or parity.

#### Remaining Stage 3 batches

1. Batch 3 implementation/tests for Release/Provenance/Legacy adapter
2. Universal SR/FNDDS estimates + SQLite equivalence
3. Canonical ID/fingerprint/release parity and Web adapter

Stage 3 ends only when Pure Core and required adapters pass Golden/SQLite parity and Web has no duplicated arithmetic.

### Stage 4 — Supabase Foundation

Starts only after Stage 3 completion and explicit Organization/Region/Cost approval.

### Stage 5–9

- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Offline Catalog/Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC and closing Issue #16

## ۶. Anti-goals

- Supabase before Stage 3 parity
- rewriting from UI or assumptions
- silent behavior fixes instead of parity failures
- moving SQLite/filesystem/hash generators into Pure Core
- manually editing Release snapshot independent of Manifest
- treating Schema/ID candidate as final public freeze
- changing IFKB/Canonical IDs without Migration and Freeze
- large multi-stage PRs

## ۷. Exact continuation point

1. Confirm CI on Commit `8952aee52affa0112988de5cd92d68b2d74fc01d` / final docs head.
2. Add `catalog-provenance-parity.test.ts` before implementation.
3. Tests must cover:
   - Release projection equals Golden Manifest fields
   - Candidate status remains `candidate-not-final`
   - Evidence matrix and imported allowlist
   - Legacy null weight/per-serving behavior
   - variability clamp at 0 and 0.8
   - sourceRecord/sourceVersion normalization
4. Extract the three Pure modules without semantic changes.
5. Export APIs from Package index.
6. Update Nutrition Core CI provenance metadata with Catalog/Freeze Blobs.
7. Run Nutrition Core CI and Web CI.
8. Open a focused Batch 3 PR only after the tests are green.
9. Update both mandatory documents with final PR/CI/Artifact evidence.
10. Supabase، Auth، AI، SQLite execution، repositories و Web adapter remain out of scope.

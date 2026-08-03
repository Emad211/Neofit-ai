# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 implementation parity  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/catalog-provenance-parity`  
**Active PR:** #20  
**Stage 3 Issue:** #17  
**Deferred Vercel Issue:** #16  
**Batch 3 base:** Batch 2 merge `917f04e319a924dda7dfb16d079453a5e5686541`  
**Validated implementation head:** `03eb666cc7a864598b8ceb416df9bb35cd53896c`  
**Nutrition Core CI:** `30860892868` — success  
**Nutrition artifact:** `8874284638`  
**Nutrition digest:** `sha256:1f25275a79fe6d4766b1839512f9159875b8dfc07b18eefacadc2460b50b8908`  
**Web CI:** `30860892878` — success  
**Web artifact:** `8874311104`  
**Web digest:** `sha256:6b1f59acc0800f0ebd2805173c3b08b4d0afd2cd41a98214644a87aecf209cfa`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** CI اسناد، Review نهایی، Ready/Merge PR #20؛ سپس Batch 4 Universal estimates + SQLite equivalence

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point این سند اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، خطا، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای ریپو و CI را نمی‌گیرد.

## ۲. مأموریت و معماری قفل‌شده

NeoFit یک محصول فارسی‌محور و Mobile-first برای ثبت و برنامه‌ریزی تغذیه و تمرین است.

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

**پیاده‌سازی و Parity سبز؛ PR #20 در Gate نهایی.**

Authority:

- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`
- Catalog workflow Blob `1012754613cf99bd3c73de49830731e9cc52adcf`
- Catalog builder Blob `597180d6bd540bc9b8bf0fc931c030d534289f5c`
- Concept augmenter Blob `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0`
- Generated Manifest Blob `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Mobile Release projection Blob `1afb7266b7d456530febb5c1c49c109e3d1f3ef7`
- Provenance Blob `1edb7e8eed151305075e634a84596db2211dffaf`
- Legacy adapter Blob `30fcc0d774a43f0f0608bd29c342c3e20d339f58`
- Schema audit Blob `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c`

Extracted/implemented:

- `src/catalog-release.ts`
  - typed `CatalogReleaseContract`
  - full frozen Manifest projection for Catalog `1.2.0`
  - release invariant validation
  - typed Schema/ID candidate comparison baseline
  - explicit `candidate-not-final` validation
- `src/catalog-provenance.ts`
  - conservative Evidence-tier resolver
  - Imported evidence allowlist
- `src/legacy-catalog-adapter.ts`
  - Legacy food → Concept/Variant conversion
  - per-serving basis
  - unknown weight preservation
  - uncertainty clamp `0..0.8`
  - source metadata normalization
- Package exports and README
- CI provenance metadata and always-retained preflight evidence

Intentional projection decision:

Mobile `catalog-release.ts` یک Projection کوتاه بود. Package جدید، بدون تغییر Nutrition behavior، تمام فیلدهای ثابت Manifest موردنیاز مصرف‌کننده را شامل می‌شود؛ Generator/Manifest همچنان Authority اصلی‌اند. این توسعهٔ Metadata در Golden tests و Authority map صریح ثبت شده و silent change نیست.

Frozen Catalog `1.2.0`:

- DB bytes `13,885,440`
- DB SHA `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- foods `13,225`
- concepts `9,279`
- portions `36,494`
- Canon IDs `261`
- aliases `218`
- mappings `13,225`
- coverage `1.0`

Freeze distinction:

- Nutrition RC/Catalog `1.2.0` frozen است.
- Schema/ID `1.1.0` فقط `candidate-not-final` و auditable baseline است، نه public stable compatibility.

Test-first evidence:

1. Test commit `0d0be7ed7afc24404ebae46ea852970928259f87`
   - Run `30860579622` — expected failure
   - TypeScript فقط به‌علت نبود APIهای Batch 3 شکست خورد.
2. Implementation/export head `589a504666a97c174fac3f6481599118c59a80d4`
   - Run `30860691909` — 33/34
   - تنها Failure متعلق به انتظار خام floating-point در تست بود؛ Domain مقدار canonical `84` را درست تولید کرد.
3. Test correction `52934ab172beea7d939b3024344de8f20f529b3a`
   - Run `30860781048` — success
   - 34/34 pass
   - Artifact `8874244557`
   - Digest `sha256:a39d6f61096b4e7f535d9cba20beda184dbebcd902ad031b4d538d674d444580`
4. Final README/CI metadata head `03eb666cc7a864598b8ceb416df9bb35cd53896c`
   - Nutrition CI `30860892868` — success
   - Artifact `8874284638`
   - Digest `sha256:1f25275a79fe6d4766b1839512f9159875b8dfc07b18eefacadc2460b50b8908`
   - Web CI `30860892878` — success
   - Web Artifact `8874311104`
   - Web digest `sha256:6b1f59acc0800f0ebd2805173c3b08b4d0afd2cd41a98214644a87aecf209cfa`

Final proven behavior:

- 11 Pure TypeScript source files pass AST boundary.
- TypeScript strict passes.
- 34/34 tests pass؛ 0 fail، 0 skipped.
- Runtime Release projection exactly equals Golden Manifest fields.
- Invalid SHA، mapping coverage و mapping policy totals fail closed.
- Candidate cannot be promoted silently to Final.
- Custom → `user_entered`.
- DS0/broad fallback → `broad_fallback`.
- Imported allowlist فقط verified/digital-consensus/legacy است.
- Legacy unknown grams remains `null`.
- variability clamps to `0..0.8`.
- blank source record falls back to Food ID.
- blank source version is omitted.
- Web/PWA regression remains green.

Batch 3 exclusions remain:

- SQLite execution/build/audit
- filesystem hashing
- migrations/repositories/persistence precedence
- Supabase/Auth/AI/Vision
- Web adapter

### Remaining Stage 3

1. Batch 4 — Universal SR/FNDDS estimates + SQLite↔TypeScript equivalence
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
- انتقال Generator/SQLite/filesystem/hash execution به Pure Core
- ویرایش دستی Release snapshot مستقل از Manifest
- معرفی Schema/ID candidate به‌عنوان Final
- ادعای Natural Query accuracy از Controlled Alias benchmark
- PRهای چندمرحله‌ای بزرگ

## ۷. Exact continuation point

1. Nutrition Core CI و Web CI روی Commitهای اسناد پاس شوند.
2. PR #20 و تمام Review threadها دوباره بررسی شوند.
3. PR #20 فقط پس از شواهد کامل Ready for Review شود.
4. در صورت سبز ماندن CI و نبود Review باز، PR #20 با expected head Merge شود.
5. Issue #17 باز بماند و Batch 3 completed ثبت شود.
6. Branch متمرکز Batch 4 از Merge commit ساخته شود.
7. پیش از کد Batch 4 این Authorityها خوانده شوند:
   - `mobile/src/nutrition-core/universal-food-estimate.ts`
   - Universal SR/FNDDS repository mappings
   - SQLite↔TypeScript equivalence tests
   - source uncertainty policy
8. Golden fixtures Batch 4 پیش از implementation ساخته شوند.
9. Supabase، Auth، AI، repositories و Web adapter خارج از Scope بمانند.

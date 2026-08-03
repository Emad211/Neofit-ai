# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 2 Search/Ranking  
**شاخهٔ integration:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage3/search-ranking-parity`  
**PR فعال:** #19  
**Issue Stage 3:** #17  
**Issue Vercel تعویق‌شده:** #16  
**مبنای Batch 2:** Batch 1 merge `c9599c4905f9fc1d28ba7e9086edf20376991740`  
**Head اولیهٔ سبز Batch 2:** `a7807a212315feca656c4ed88dd746cb6be752ce`  
**CI اولیهٔ معتبر:** Nutrition Core CI `30858434028` — success  
**Artifact:** `8873368541`  
**Artifact digest:** `sha256:3fed8d5c491184280437d34f135fdc1323f3c68998a0cebeccebf911ac28ad9c`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** CI نهایی اسناد/Review و Merge PR #19؛ سپس Batch 3 Catalog Release/Provenance

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر کد، داده یا زیرساخت:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزارهای واقعی بررسی شوند.
4. فقط Exact continuation point ثبت‌شده اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commitها، Runها، Artifactها، خطاها، تصمیم‌ها و قدم بعدی به‌روزرسانی شوند.
- هیچ Build، Deployment، Preview، Parity، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- گزارش مکالمه یا حافظه جای وضعیت واقعی ریپو را نمی‌گیرد.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور، Mobile-first و قابل نصب برای ثبت و برنامه‌ریزی تغذیه و تمرین است.

> کاربر فارسی‌زبان باید بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و دادهٔ خود را امن و قابل بازیابی نگه دارد.

## ۲. معماری قفل‌شده

- Web و Server routes: Next.js App Router + TypeScript strict
- Nutrition domain: `packages/nutrition-core`، خالص و deterministic
- Hosting نهایی: Vercel
- Auth/Postgres/RLS/Sync: Supabase پس از Stage 3
- App-shell Offline: Service Worker
- Catalog snapshot/mutation queue: IndexedDB در Stage 7
- زبان پیش‌فرض: فارسی و RTL
- دادهٔ تغذیه: IFKB + USDA SR Legacy + FNDDS
- AI/Vision: فقط Server-side و بدون اختیار تولید Nutrition
- Monorepo tooling سنگین تا اثبات نیاز ممنوع است.

## ۳. قراردادهای غیرقابل نقض

- AI/Vision کالری، مواد مغذی، وزن یا Portion تولید یا اصلاح نمی‌کند.
- Nutrition نهایی فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Ingredient حل‌نشده کل برنامهٔ AI را رد می‌کند.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- Provider nutrition نادیده گرفته می‌شود.
- Imported/Custom user data با Seed overwrite یا downgrade نمی‌شود.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کند.
- Secretهای سروری وارد Browser bundle نمی‌شوند.
- Core هیچ UI، React Native، Expo، SQLite driver، Network، filesystem یا environment access ندارد.

## ۴. دارایی‌های علمی غیرقابل حذف

- ۱۳٬۲۲۵ رکورد عمومی SR/FNDDS
- ۹٬۲۷۹ Concept عمومی
- ۳۶٬۴۹۴ Portion رسمی
- ۲۶۱ هویت Canonical ایرانی
- Canonical IDs، mappings، fingerprints و provenance
- arithmetic، portion، recipe، diary، goals، search و ranking behavior
- Schema/ID/arithmetic/migration/catalog audits

`mobile/` تا پایان Stage 3 Frozen parity oracle می‌ماند.

## ۵. وضعیت مراحل

### Stage 0 — Pivot و Freeze

**انجام‌شده** — PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`.

### Stage 1 — UX فارسی/RTL

**انجام‌شده و پذیرفته‌شده** — PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`.

### Stage 2A — PWA Code Foundation

**انجام‌شده** — PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`.

### Stage 2B — Vercel Preview/HTTPS

**تعویق‌شده در Issue #16**.

- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Deployment/Preview: ندارد
- `vercel[bot]` محدودیت `api-deployments-free-per-day` را با پیام «more than 100» مستقیماً ثبت کرده است.

این Gate پیش از Web RC اجباری است، اما Stage 3 را متوقف نمی‌کند.

### Stage 3 — Nutrition Core Extraction و Parity

**فعال**

#### Batch 1 — Pure arithmetic/domain

**انجام‌شده** — PR #18، Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`.

استخراج‌شده:

- types
- nutrition arithmetic
- recipes
- diary
- goals
- AST pure-boundary verifier
- Mobile RC Golden fixtures

شواهد نهایی:

- Head `7861c4f56f0474b61d8dd9b3a7101e6b616b524d`
- Nutrition Core CI `30857715438`
- Artifact `8873108322`
- Digest `sha256:de0197b9ae9762a921a32c13071701064863aef8e77e612fb2e35bd49893d25f`
- 10/10 pass
- Web CI `30857715413` pass

#### Batch 2 — Controlled Persian Search و Universal Ranking

**فعال؛ پیاده‌سازی اولیه سبز در PR #19**

Authority:

- `docs/NEOFIT_SEARCH_RANKING_AUTHORITY_MAP.md`
- Search Blob `bb99c934beeed5094da7e0a29a8f53635ace48b3`
- Ranking Blob `9b23b1ef7d6817ff2b946e1fdedcad76608279e1`
- Alias registry Blob `94429b1937edc6234b23fc8398531b531a891cc2`
- Benchmark manifest Blob `24a1d20effe679b23e4ee4966d0bdb01f2b06ec0`

Extracted:

- Persian Unicode/digit/half-space normalization
- modifier parsing
- local deterministic food search
- Alias index، exact/longest/compact matching
- Iranian-vs-Generic evaluator precedence
- Generic target resolution
- SR/FNDDS ranking and tie policy

Official controlled benchmark:

- Release `1.1.0`
- Catalog `1.2.0`
- 218 aliases
- 500 deterministic cases
- Route/Top-1/Top-5 = 1.0
- failures = 0
- Artifact digest `sha256:d43931525ade2f1b685b18647d1554cc317f14bd8874ed66fe5c85370454fbde`

Claim boundary:

- این Benchmark از Alias registry تولید شده و Natural-language benchmark نیست.
- Independent Natural Query validator آماده است، اما Frozen corpus منتشر نشده است.
- typo/colloquial/regional/ambiguity/abstention accuracy هنوز اثبات نشده است.

Initial Batch 2 validation:

- Head `a7807a212315feca656c4ed88dd746cb6be752ce`
- CI `30858434028` — success
- Artifact `8873368541`
- Digest `sha256:3fed8d5c491184280437d34f135fdc1323f3c68998a0cebeccebf911ac28ad9c`
- AST boundary: 8 source files pass
- TypeScript: pass
- tests: 25/25 pass
- all 9 official controlled-query variation types represented

#### Batchهای باقی‌ماندهٔ Stage 3

1. Catalog release/provenance و legacy adapter
2. Universal SR/FNDDS estimates و SQLite equivalence
3. Canonical ID/fingerprint/release parity
4. Web adapter بدون تکرار arithmetic

Stage 3 زمانی کامل است که Pure Core و Adapterهای ضروری، Golden/SQLite parity را پاس کنند و Web هیچ محاسبهٔ موازی نداشته باشد.

### Stage 4 — Supabase Foundation

شروع فقط پس از پایان Stage 3 و تأیید Organization/Region/Cost.

### Stage 5 تا 9

- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Offline catalog/sync
- Stage 8: Migration/recovery
- Stage 9: Web RC و بستن Issue #16

## ۶. Anti-goalها

- شروع Supabase پیش از Stage 3 parity
- بازنویسی از روی حدس یا UI وب
- silent fix به‌جای Parity failure
- واردکردن SQLite/Expo/Network به Pure Core
- معرفی Alias benchmark به‌عنوان Natural Query evidence
- تغییر IFKB/Canonical ID بدون Migration و Freeze
- PRهای بزرگ چندمرحله‌ای

## ۷. ترتیب فعلی

1. CI نهایی و Merge PR #19
2. Batch 3: Catalog release/provenance/legacy adapter
3. Batch 4: Universal estimates و SQLite equivalence
4. Batch 5: ID/fingerprint و Web adapter
5. Stage 4 Supabase
6. Issue #16 پیش از Web RC

## ۸. Exact continuation point

1. `docs/NEOFIT_PROGRESS_LOG.md` با Entry Batch 2 همگام شود.
2. Nutrition Core CI و Web CI روی Head اسناد پاس شوند.
3. Reviewهای PR #19 بررسی و رفع شوند.
4. PR #19 با `expected_head` Merge شود.
5. Issue #17 باز بماند و Batch 2 completed ثبت شود.
6. Branch Batch 3 از Merge commit ساخته شود.
7. پیش از استخراج، `catalog-release.ts`, `catalog-provenance.ts`, `legacy-catalog-adapter.ts` و تست‌های manifest/fingerprint/migration Inventory شوند.
8. Golden fixtures و Authority map Batch 3 قبل از کد ساخته شوند.
9. Supabase، Auth، AI واقعی و Web adapter هنوز شروع نشوند.

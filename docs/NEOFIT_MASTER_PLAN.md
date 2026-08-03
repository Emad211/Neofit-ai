# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 1 پس از بستن Reviewها  
**شاخهٔ integration:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage3/nutrition-core-parity`  
**PR فعال:** #18  
**Issue Stage 3:** #17  
**Issue Vercel تعویق‌شده:** #16  
**مبنای Stage 3:** Stage 2A merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`  
**Head نهایی کد/Review Batch 1:** `af55b7de4382a9a00814628a744393471817bb61`  
**CI معتبر:** Nutrition Core CI `30857414434` — success  
**Artifact:** `8872996869`  
**Artifact digest:** `sha256:3e0705c69767bf2cd69e71c113c8407bf1fccf5ccb35cb130f4a1f3aa3d6f95e`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** CI اسناد و Merge PR #18؛ سپس Batch 2 Search/Ranking

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر کد، داده یا زیرساخت:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزارهای واقعی بررسی شوند.
4. فقط Exact continuation point ثبت‌شده اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commitها، Runها، Artifactها، خطاها، تصمیم‌ها و قدم بعدی به‌روزرسانی شوند.
- هیچ Build، Deployment، Preview، Parity، Migration یا Coverage بدون شواهد «تمام‌شده» اعلام نشود.
- گزارش مکالمه یا حافظه جای وضعیت واقعی ریپو را نمی‌گیرد.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور، Mobile-first و قابل نصب برای ثبت و برنامه‌ریزی تغذیه و تمرین است.

هدف RC وب:

> کاربر فارسی‌زبان بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و داده‌اش بین دستگاه‌ها امن و قابل بازیابی باشد.

## ۲. معماری قفل‌شده

- Web و Server routes: Next.js App Router + TypeScript strict
- Nutrition domain: Package خالص و deterministic TypeScript
- Hosting نهایی: Vercel
- Auth، PostgreSQL، RLS و Sync: Supabase از Stage 4
- App-shell Offline: Service Worker
- Catalog snapshot و mutation queue: IndexedDB از Stage 7
- زبان پیش‌فرض: فارسی و RTL از Root HTML
- دادهٔ تغذیه: IFKB + USDA SR Legacy + FNDDS
- AvalAI/Vision: فقط Server-side و بدون اجازهٔ ساخت Nutrition

Turborepo، Nx یا ابزار Monorepo سنگین تا وجود نیاز واقعی ممنوع است.

## ۳. دارایی‌های علمی غیرقابل حذف

- ۱۳٬۲۲۵ رکورد عمومی USDA/FNDDS/SR
- ۹٬۲۷۹ Concept عمومی
- ۳۶٬۴۹۴ Portion رسمی
- ۲۶۱ هویت Canonical غذای ایرانی
- Canonical IDها، mappingها و fingerprintها
- provenance و evidence tierها
- منطق calorie/macros/portion/recipe/diary/goals
- Resolve کامل Ingredientهای برنامهٔ AI
- تست‌های Schema، ID، arithmetic، migration و catalog audit

`mobile/` تا پایان Stage 3، Frozen reference و Parity oracle باقی می‌ماند.

## ۴. قراردادهای غیرقابل نقض

- AI/Vision اجازهٔ ساخت یا اصلاح کالری، مواد مغذی، وزن یا Portion ندارد.
- Nutrition نهایی فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Ingredient حل‌نشده باعث رد کامل برنامهٔ AI می‌شود.
- Missing nutrient با صفر برابر نیست.
- وزن نامعلوم `null` باقی می‌ماند.
- Imported و Custom user data با Seed overwrite یا downgrade نمی‌شوند.
- Canonical ID و Schema فقط با Migration نسخه‌دار تغییر می‌کنند.
- Secretهای سروری و Supabase service role وارد Browser bundle نمی‌شوند.
- Raw AvalAI key در Local Storage یا DB plaintext ذخیره نمی‌شود.
- Service Worker دادهٔ کاربر، API/Auth، Authorization، Mutation یا Cross-origin را Cache نمی‌کند.

## ۵. معماری ریپو

```text
Neofit-ai/
├── web/                         # Next.js/PWA
├── packages/
│   └── nutrition-core/          # Pure deterministic TypeScript
├── ifkb/                        # داده، QA و Release governance
├── mobile/                      # Frozen reference و parity oracle
├── supabase/                    # از Stage 4
└── docs/
```

## ۶. وضعیت مراحل

### Stage 0 — Pivot و Freeze

**انجام‌شده** — PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`.

### Stage 1 — Product/UX Foundation فارسی

**انجام‌شده و پذیرفته‌شده** — PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`.

### Stage 2A — PWA Code Foundation

**انجام‌شده** — PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`.

اثبات‌شده:

- Manifest فارسی/RTL و standalone
- Iconهای deterministic
- Service Worker privacy-safe
- Precache JS/CSS/Font در Fresh install
- Offline React interaction با HTTP cache خالی
- Web CI و Visual regression

### Stage 2B — Vercel Preview و HTTPS Validation

**تعویق‌شده و باز در Issue #16**.

- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Deployment count: صفر
- Preview URL: ندارد
- `vercel[bot]` روی PR #18 مستقیماً خطای `api-deployments-free-per-day` با پیام «more than 100» ثبت کرد.

بنابراین محدودیت روزانه اکنون با شواهد مستقیم Vercel اثبات شده است. هیچ Deployment موفقی ادعا نمی‌شود. این Gate باید پیش از Web RC بسته شود، اما Stage 3 را Block نمی‌کند.

### Stage 3 — Nutrition Core Extraction و Parity

**فعال — Batch 1 سبز، Reviewها بسته و آمادهٔ Merge در PR #18**

#### Authority

- Native/IFKB branch: `agent/iranian-food-kb-foundation`
- Frozen reference head: `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`
- Authority map: `docs/NEOFIT_NUTRITION_CORE_AUTHORITY_MAP.md`
- Mobile golden test Blob: `2291e1958efe5e17010230c5864c9fadc9bc47ba`

#### Batch 1 استخراج‌شده

- `types.ts`
- `nutrition.ts`
- `recipe.ts`
- `diary.ts`
- `goals.ts`
- Package مستقل `@neofit/nutrition-core` schema version 1
- Golden fixtures با Source branch/head/blob provenance
- Dedicated Nutrition Core CI

#### Numeric و Missing policy قفل‌شده

- canonicalization داخلی: ۱۵ رقم معنادار
- display rounding جداگانه و صریح
- per-100g basis باید دقیقاً 100g باشد
- Gram calculation با وزن basis نامعلوم fail-closed است
- Strict aggregate در صورت غیبت nutrient، آن nutrient را حذف می‌کند
- Recipe/Diary وزن نامعلوم را `null` propagate می‌کنند
- Goal progress برای consumed نامعلوم، ratio/remaining را `null` نگه می‌دارد

#### Boundary gate

Review P2 نشان داد Regex اولیه side-effect/dynamic import را نمی‌گرفت. Fix نهایی:

- `packages/nutrition-core/scripts/verify-pure-boundary.mjs`
- TypeScript AST parser برای static import، side-effect import، dynamic `import()`، `require()`, import-equals و re-export
- ممنوعیت React/React Native/Expo/SQLite/Next/Supabase/Node I/O و Environment access

Review threadهای PR #18 هر دو resolved هستند.

#### شواهد نهایی Batch 1

- Head: `af55b7de4382a9a00814628a744393471817bb61`
- Nutrition Core CI: `30857414434` — success
- Artifact: `8872996869`
- Digest: `sha256:3e0705c69767bf2cd69e71c113c8407bf1fccf5ccb35cb130f4a1f3aa3d6f95e`
- Web CI پیشین روی اسناد/Package: `30857204944` — success
- Pure-boundary AST gate: pass
- TypeScript strict: pass
- Golden parity: 10 tests، 10 pass، 0 fail، 0 skipped

#### Batchهای باقی‌مانده Stage 3

1. Persian search، query parsing و universal ranking
2. Catalog release/provenance و legacy adapter
3. SR Legacy/FNDDS universal estimates و SQLite↔TypeScript fixtures
4. Canonical ID، fingerprint و release parity
5. Web adapter بدون duplication arithmetic

Definition of Done Stage 3:

- Core هیچ React Native، Expo، SQLite، UI، Network یا Environment dependency نداشته باشد.
- همهٔ قراردادهای عمومی Type-safe و versioned باشند.
- Golden/SQLite parity برای arithmetic، portions، recipes، diary، goals، search و universal records پاس شود.
- Canonical IDs و fingerprints ثابت بمانند.
- Web مصرف‌کنندهٔ Core باشد و محاسبه را تکرار نکند.

### Stage 4 — Supabase Foundation

شروع فقط پس از پایان Stage 3 و تأیید Organization/Region/Cost.

### Stage 5 — Nutrition Vertical Slice

Onboarding، Today، Search/Log، Diary، Favorites، Goals، Recipes، History، Export و Settings.

### Stage 6 — AvalAI/Vision

BYOK رمزنگاری‌شده، Route Handler امن، resolver و all-or-nothing plan generation.

### Stage 7 — Offline Catalog/Sync

IndexedDB، Catalog snapshot، Local Persian search، Draft و mutation queue.

### Stage 8 — Migration/Recovery

Export/import نسخه‌دار، rollback و تست دادهٔ حجیم.

### Stage 9 — Web RC

Device QA، Accessibility، Performance، Security، Privacy، Production و بستن Issue #16.

## ۷. Anti-goalها

- شروع Supabase پیش از Core parity
- بازنویسی Core از روی حدس یا UI وب
- silent fix رفتار Mobile به‌جای ثبت اختلاف Parity
- انتقال SQLite/Expo/React Native به Package خالص
- انتقال تمام ماژول‌ها در یک PR
- تغییر IFKB/Canonical ID/Schema بدون Migration و Freeze
- Generic SaaS template و Monorepo tooling بدون نیاز

## ۸. ترتیب فعلی

1. CI اسناد و Merge PR #18
2. Batch 2: Search/Ranking authority و Golden corpus
3. Batch 3: Catalog provenance/release/adapters
4. Batch 4: Universal SR/FNDDS و SQLite equivalence
5. Batch 5: ID/fingerprint parity و Web adapter
6. Stage 4 Supabase پس از پایان Stage 3
7. Issue #16 پیش از Web RC

## ۹. قدم بعدی دقیق

1. Nutrition Core CI و Web CI روی Head اسناد پاس شوند.
2. PR #18 با expected head Merge شود.
3. Issue #17 باز بماند؛ Batch 1 completed ثبت شود.
4. Branch Batch 2 از Merge commit ساخته شود.
5. قبل از استخراج Search، این منابع خوانده و Freeze شوند:
   - `mobile/src/nutrition-core/search.ts`
   - `mobile/src/nutrition-core/universal-catalog-ranking.ts`
   - Persian search benchmark manifests/corpus
   - تست‌های ranking/search و exact alias behavior
6. Golden corpus کوچک و provenance-backed برای normalization، modifiers، Persian aliases و SR/FNDDS ranking ساخته شود.
7. فقط پس از سبزشدن Golden search parity، ماژول‌های Search/Ranking منتقل شوند.
8. هر دو سند در پایان Batch 2 دوباره Update شوند.

Supabase، Auth، AI واقعی و Web arithmetic migration هنوز شروع نمی‌شوند.
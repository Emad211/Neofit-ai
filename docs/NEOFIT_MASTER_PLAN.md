# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — تفکیک Stage 2A از Vercel Stage 2B  
**شاخهٔ integration وب:** `web/pwa-foundation`  
**شاخهٔ فعال هنگام ثبت این تصمیم:** `stage2/pwa-vercel-foundation`  
**PR فعال:** #15  
**Issue پیاده‌سازی PWA:** #14  
**Issue استقرار تعویق‌شده:** #16  
**آخرین Head شاخه پیش از این سند:** `351ee467c8dac026b3166f05b0996ec4bfe3aa39`  
**آخرین CI معتبر شاخه:** Web CI `30853827867` — success  
**مرحلهٔ اجرایی بعد از Merge:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate خارجی تعویق‌شده:** Vercel Preview/HTTPS validation در Issue #16

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر کد، داده یا زیرساخت:

1. `docs/NEOFIT_MASTER_PLAN.md` کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PRها، Issueها، CI، Review threadها، Vercel و Supabase از ابزارهای واقعی بررسی شوند.
4. فقط قدم بعدی ثبت‌شده و اثبات‌پذیر اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commitها، Runها، Artifactها، خطاها، تصمیم‌ها و Exact continuation point به‌روزرسانی شوند.
- هیچ Build، Deployment، Preview، سهمیه، Parity یا Migration بدون شواهد «تمام‌شده» اعلام نشود.
- گزارش مکالمه جای وضعیت واقعی ریپو را نمی‌گیرد.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور، Mobile-first و قابل نصب برای ثبت و برنامه‌ریزی تغذیه و تمرین است.

هدف RC وب:

> کاربر فارسی‌زبان بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و داده‌اش بین دستگاه‌ها امن و قابل بازیابی باشد.

## ۲. معماری قفل‌شده

- Web و Server routes: Next.js App Router + TypeScript strict
- Hosting نهایی: Vercel
- Auth، PostgreSQL، RLS و Sync: Supabase از Stage 4
- App-shell Offline: Service Worker
- Catalog snapshot و mutation queue: IndexedDB از Stage 7
- زبان پیش‌فرض: فارسی
- جهت پیش‌فرض: RTL از Root HTML
- دادهٔ تغذیه: IFKB + USDA SR Legacy + FNDDS
- محاسبات تغذیه: deterministic TypeScript
- AvalAI/Vision: فقط Server-side و بدون اجازهٔ ساخت Nutrition

تا وجود نیاز اثبات‌شده، Turborepo، Nx یا ابزار Monorepo سنگین اضافه نمی‌شود.

## ۳. دارایی‌های علمی و داده‌ای غیرقابل حذف

- ۱۳٬۲۲۵ رکورد عمومی USDA/FNDDS/SR
- ۹٬۲۷۹ Concept عمومی
- ۳۶٬۴۹۴ Portion رسمی
- ۲۶۱ هویت Canonical غذای ایرانی
- Canonical IDها، mappingها و fingerprintها
- provenance و evidence tierها
- منطق کالری، ماکرو، Portion، Recipe، Diary و Goal
- Resolve کامل Ingredientهای برنامهٔ AI در IFKB/FNDDS/SR
- تصاویر دارای Attribution و مجوز
- تست‌های Schema، ID، arithmetic، migration و catalog audit

`mobile/` تا اثبات Parity وب، Frozen reference و Oracle مقایسه باقی می‌ماند.

## ۴. قراردادهای غیرقابل نقض

- مدل زبانی یا Vision اجازهٔ ساخت کالری، ماکرو، وزن یا Portion ندارد.
- Nutrition نهایی فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Ingredient حل‌نشده باعث رد کامل برنامهٔ AI می‌شود.
- Imported و Custom user data با Seed overwrite یا downgrade نمی‌شوند.
- Canonical ID و Schema فقط با Migration نسخه‌دار تغییر می‌کنند.
- Secretهای سروری و Supabase service role وارد Browser bundle نمی‌شوند.
- Raw AvalAI key در Local Storage یا DB plaintext ذخیره نمی‌شود.
- Service Worker دادهٔ کاربر، `/api`، `/auth`، Authorization، Mutation یا Cross-origin را Cache نمی‌کند.
- Fresh-install Offline باید بدون Browser HTTP cache پوستهٔ کامل و تعاملی را اجرا کند.

## ۵. معماری ریپو

```text
Neofit-ai/
├── web/                         # محصول فعال Next.js/PWA
├── packages/
│   └── nutrition-core/          # منطق خالص TypeScript؛ Stage 3
├── ifkb/                        # منبع داده، QA و Release
├── mobile/                      # Frozen reference و parity oracle
├── supabase/                    # از Stage 4
└── docs/
```

## ۶. قواعد UI/UX فارسی

- `html lang="fa" dir="rtl"`
- CSS logical properties
- Vazirmatn variable به‌صورت Self-hosted
- متن پایه حداقل ۱۶px
- Touch target حداقل ۴۴px
- Label مستقل از Placeholder
- یک CTA اصلی در هر صفحه
- Loading، Empty، Error و Offline state
- Scroll reset در Bottom Navigation
- Visual QA اجباری در ۳۶۰، ۳۹۰ و ۴۱۲px

Navigation موبایل حداکثر پنج مقصد دارد: امروز، تغذیه، تمرین، پیشرفت و تنظیمات.

## ۷. تصمیم جدید دربارهٔ Stage 2

Stage 2 به دو بخش مستقل تقسیم شد تا یک اتصال خارجی، توسعهٔ Core را متوقف نکند.

### Stage 2A — PWA Code Foundation

**وضعیت: پیاده‌سازی و CI کامل؛ آمادهٔ Merge در PR #15**

شواهد اصلی:

- Manifest فارسی/RTL و `standalone`
- Iconهای 192، 512، Maskable و Apple touch
- Icon generator deterministic
- Service Worker app-shell نسخهٔ `v2`
- Precache گراف JS/CSS/Font در Install اولیه
- API/Auth/Authorization/Mutation/Cross-origin exclusion
- Fresh-install Offline با HTTP cache خالی
- Offline React navigation
- Loading/Error/Global error/404/Offline boundaries
- Environment contract و `web/vercel.json`
- Web CI دائمی و Visual regression
- P1 Review thread بسته‌شده

کد اثبات‌شده:

- Code head: `0bb0278f50312819029445c20dd5823ee8c719ed`
- CI کد: `30853438059` — success
- Artifact: `8871529505`
- Digest: `sha256:7f50f89a15c37871bbafda95d3cea6e105ab5c0a344f9f408b5f5fe787823c77`
- Final branch CI پیش از تصمیم: `30853827867` — success

### Stage 2B — Vercel Preview و HTTPS Validation

**وضعیت: تعویق‌شده، باز و مستقل در Issue #16**

وضعیت واقعی ثبت‌شده:

- Team: `Emad's projects`
- Team ID: `team_BsUv0VprkU4YjdFbQi2hZCEm`
- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Deployment count: `0`
- `latestDeployment`: `null`
- Preview URL و Domain: نداریم

هیچ Deployment یا Preview موفقی ادعا نمی‌شود. Issue #16 باید پیش از Web RC بسته شود، اما دیگر Stage 3 را Block نمی‌کند.

## ۸. مراحل اجرایی

### Stage 0 — Pivot و Freeze

**انجام‌شده** — PR #12 و Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`.

### Stage 1 — Product/UX Foundation فارسی

**انجام‌شده و پذیرفته‌شده** — PR #13 و Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`.

### Stage 2A — PWA Code Foundation

**آمادهٔ Merge** — PR #15. پس از Merge، Issue #14 بسته می‌شود.

### Stage 2B — Vercel Preview Validation

**تعویق‌شده** — Issue #16. پیش‌شرط Web RC است، نه Stage 3.

### Stage 3 — Nutrition Core Extraction و Parity

**قدم بعدی فعال**

هدف‌ها:

- بازسازی Inventory واقعی منطق Nutrition از `mobile/` و IFKB
- تعیین Pure-domain boundary
- ایجاد `packages/nutrition-core` بدون Monorepo tooling سنگین
- انتقال مرحله‌ای types، arithmetic، portion و recipe logic
- ساخت Golden fixtures از Mobile RC
- اجرای parity test برای calorie/macros/portion/recipe/goal
- حفظ Canonical ID، fingerprint و provenance
- Adapter وب فقط پس از Pure core

Definition of Done:

- هیچ وابستگی React Native، Expo، SQLite یا UI در Core وجود نداشته باشد.
- ورودی/خروجی Core کاملاً Type-safe و versioned باشد.
- نتایج Golden fixtures با Mobile RC برابر باشند.
- Round/precision policy صریح و تست‌شده باشد.
- هیچ AI یا Provider nutrition وارد محاسبات نشود.

### Stage 4 — Supabase Foundation

پیش‌شرط: پایان Stage 3 و تأیید Organization/Region/Cost.

### Stage 5 — Nutrition Vertical Slice

Onboarding، Today، Search/Log، Diary، Favorites، Goals، Recipes، History، Export و Settings.

### Stage 6 — AvalAI/Vision

BYOK رمزنگاری‌شده، Route Handler امن، resolver و all-or-nothing plan generation.

### Stage 7 — Offline Catalog/Sync

IndexedDB، Catalog snapshot، Local Persian search، Draft و mutation queue.

### Stage 8 — Migration/Recovery

Export/import نسخه‌دار، rollback و تست دادهٔ حجیم.

### Stage 9 — Web RC

Device QA، Accessibility، Performance، Security، Privacy، Vercel Production و بستن Issue #16.

## ۹. Anti-goalها

- متوقف‌کردن Nutrition Core به‌دلیل اتصال خارجی تعویق‌شده
- بستن Issue #16 بدون Preview واقعی
- ساخت Supabase پیش از Core parity
- انتقال خط‌به‌خط UI Native
- Generic SaaS template
- ابزار Monorepo سنگین بدون نیاز
- تغییر IFKB/ID/Schema بدون Migration و Freeze
- Cacheکردن دادهٔ کاربر در App-shell Service Worker

## ۱۰. ترتیب فعلی

1. Merge PR #15 و بستن Issue #14
2. Stage 3 — Nutrition Core و parity
3. Stage 4 — Supabase
4. Stage 5 — Nutrition vertical slice
5. Stage 6 — AI/Vision
6. Stage 7 — Offline data/sync
7. Stage 8 — Recovery
8. بستن Stage 2B / Issue #16 پیش از Web RC
9. Stage 9 — Web RC

## ۱۱. قدم بعدی دقیق

1. `docs/NEOFIT_PROGRESS_LOG.md` با تصمیم تفکیک Stage 2 ثبت شود.
2. PR #15 با آخرین Head و CI دوباره بررسی شود.
3. PR #15 به `web/pwa-foundation` Merge شود.
4. Issue #14 با شواهد Stage 2A بسته شود؛ Issue #16 باز بماند.
5. یک Issue و Branch متمرکز برای Stage 3 ساخته شود.
6. پیش از نوشتن Core، Inventory واقعی فایل‌ها، توابع، تست‌ها و قراردادهای Mobile/IFKB ثبت شود.
7. اولین Batch فقط Boundary، types، Golden fixtures و parity harness باشد؛ نه بازنویسی کامل.
8. در پایان نوبت هر دو سند دوباره با Merge SHA، Stage 3 branch و Exact continuation point به‌روزرسانی شوند.

Supabase، Auth و AI واقعی هنوز ممنوع‌اند.
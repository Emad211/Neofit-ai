# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — اصلاح وضعیت Vercel و بستن P1 مربوط به Fresh-install Offline  
**شاخهٔ integration وب:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage2/pwa-vercel-foundation`  
**PR فعال:** #15  
**Issue فعال:** #14  
**آخرین Head کد تأییدشده:** `0bb0278f50312819029445c20dd5823ee8c719ed`  
**آخرین CI معتبر:** Web CI run `30853438059` — success  
**مرحلهٔ فعال:** Stage 2 — PWA و Vercel Foundation  
**Gate فعلی:** ساخت Preview واقعی از مسیر Deploy با Schema صحیح؛ ادعای سهمیه بازپس گرفته شده است

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر کد، داده یا زیرساخت، این دو فایل باید کامل خوانده شوند:

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`

سپس وضعیت واقعی branch، HEAD، PR، CI، Vercel و Supabase از ابزارهای متصل بازسازی می‌شود. گزارش مکالمه، حافظه یا توضیح قبلی جای پاسخ خام ابزار و شواهد ریپو را نمی‌گیرد.

در پایان هر نوبت:

- دفتر پیشرفت با Commitها، Runها، Artifactها، خطاها، Correctionها و قدم بعدی به‌روزرسانی می‌شود.
- همین پلن با مرحله، Gate، تصمیم‌ها و Exact continuation point همگام می‌شود.
- هیچ مرحله‌ای بدون Definition of Done کامل «تمام‌شده» اعلام نمی‌شود.
- هیچ Deployment، Preview، سهمیه یا اتصال خارجی بدون پاسخ قابل‌بازتولید ابزار ادعا نمی‌شود.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور برای برنامه‌ریزی و ثبت تغذیه و تمرین است که باید روی موبایل سریع، ساده، نصب‌شونده و قابل اعتماد باشد.

هدف RC وب:

> کاربر فارسی‌زبان بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و داده‌اش بین دستگاه‌ها امن و قابل بازیابی باشد.

## ۲. تصمیم معماری قفل‌شده

- Frontend و Server routes: Next.js App Router + TypeScript strict
- Hosting و Preview: Vercel
- Auth، PostgreSQL، RLS و Sync: Supabase
- PWA App shell: Service Worker
- Offline catalog و mutation queue در Stage 7: IndexedDB
- زبان پیش‌فرض: فارسی
- جهت پیش‌فرض: RTL واقعی از Root HTML
- زبان دوم: انگلیسی
- دادهٔ تغذیه: IFKB + USDA SR Legacy + FNDDS
- محاسبات: deterministic TypeScript
- AvalAI و Vision: فقط Server-side و بدون تولید Nutrition

## ۳. دارایی‌های حفظ‌شونده

- ۱۳٬۲۲۵ رکورد عمومی USDA/FNDDS/SR
- ۹٬۲۷۹ Concept عمومی
- ۳۶٬۴۹۴ Portion رسمی
- ۲۶۱ هویت Canonical غذای ایرانی
- Canonical IDها، mappingها و fingerprintها
- provenance و evidence tierها
- موتور کالری، ماکرو، Portion، Recipe، Diary و Goal
- Resolve کامل Ingredientهای برنامهٔ AI در IFKB/FNDDS/SR
- تصاویر دارای Attribution و مجوز
- تست‌های Schema، ID، arithmetic، migration و catalog audit

پوشهٔ `mobile/` تا اثبات مهاجرت وب، Frozen reference و منبع مقایسه باقی می‌ماند.

## ۴. قراردادهای غیرقابل نقض

- مدل زبانی یا Vision اجازهٔ ساخت کالری، ماکرو، وزن یا Portion ندارد.
- Nutrition نهایی فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Ingredient حل‌نشده باعث رد کامل برنامهٔ AI می‌شود.
- Imported و Custom user data با Seed overwrite یا downgrade نمی‌شوند.
- تغییر Canonical ID یا Schema فقط با Migration نسخه‌دار مجاز است.
- Supabase service role و Secretهای سروری وارد Browser bundle نمی‌شوند.
- Raw AvalAI key در Local Storage یا DB plaintext ذخیره نمی‌شود.
- تصویر خام Vision بدون رضایت و نیاز روشن ذخیره نمی‌شود.
- Service Worker اجازهٔ Cacheکردن `/api`، `/auth`، درخواست دارای Authorization، Mutation یا Cross-origin را ندارد.
- App-shell cache جای Offline catalog/sync در Stage 7 را نمی‌گیرد.
- Fresh-install Offline باید بدون Browser HTTP cache نیز پوستهٔ کامل و تعاملی را بالا بیاورد.

## ۵. معماری ریپو

```text
Neofit-ai/
├── web/                         # محصول فعال Next.js/PWA
├── packages/
│   └── nutrition-core/          # منطق خالص TypeScript؛ از Stage 3
├── ifkb/                        # منبع داده، QA و Release
├── mobile/                      # مرجع Native فریز‌شده
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── tests/
└── docs/
```

تا وجود نیاز واقعی، Turborepo، Nx یا ابزار Monorepo سنگین اضافه نمی‌شود.

## ۶. قواعد UI/UX فارسی

- `html lang="fa" dir="rtl"`
- CSS logical properties
- Vazirmatn variable به‌صورت Self-hosted
- متن پایه حداقل ۱۶px
- Touch target حداقل ۴۴px
- Label جای Placeholder را نمی‌گیرد
- یک CTA اصلی در هر صفحه
- Loading، Empty، Error و Offline state
- اعداد و واحدهای تغذیه خوانا و tabular
- Scroll reset هنگام تغییر Bottom Navigation
- Visual QA اجباری: ۳۶۰، ۳۹۰ و ۴۱۲px

Navigation موبایل حداکثر پنج مقصد دارد:

1. امروز
2. تغذیه
3. تمرین
4. پیشرفت
5. تنظیمات

## ۷. نقش Supabase

Supabase لازم است، اما جایگزین Nutrition Core نیست.

### Catalog عمومی Versioned

- catalog_releases
- food_concepts
- food_variants
- food_aliases
- food_portions
- food_assets

### داده‌های خصوصی کاربر

- profiles
- user_settings
- diary_entries
- recipes
- recipe_ingredients
- nutrition_goals
- favorites
- weight_logs
- activity_logs
- workout_plans
- workout_sessions
- workout_sets
- ai_request_audit
- encrypted_provider_credentials

تمام جدول‌های خصوصی `user_id` و RLS کامل دارند. Stage 4 پیش از تأیید Organization/Region/Cost آغاز نمی‌شود.

## ۸. امنیت کلید AvalAI

1. ورود کلید در Settings
2. ارسال به Route Handler احراز هویت‌شده
3. رمزنگاری AES-GCM با Secret نسخه‌دار
4. ذخیرهٔ ciphertext، iv، key_version و metadata
5. decrypt فقط در حافظهٔ سرور
6. عدم بازگشت Secret به Browser، Log یا Analytics
7. Test/Replace/Delete توسط کاربر

## ۹. PWA و Offline

- Stage 2: Manifest، Iconها، App shell، Service Worker، Installability و Fresh-install Offline
- Stage 7: Catalog snapshot، Local search، Draft و Mutation queue

Service Worker Stage 2 فقط پوسته و Assetهای عمومی Build را Cache می‌کند.

## ۱۰. مراحل اجرایی

### Stage 0 — Pivot و Freeze

**وضعیت: انجام‌شده**

- PR #12 Merge شد.
- معماری وب ثبت شد.
- Mobile به‌عنوان Frozen reference حفظ شد.
- Roadmap، Handoff و `web/pwa-foundation` ساخته شدند.

### Stage 1 — Product/UX Foundation فارسی

**وضعیت: انجام‌شده و پذیرفته‌شده**

شواهد:

- PR #13 Merge: `a458a27a2685bfa7d85ea28686b3182c3167d747`
- Issue #11: completed
- Today، Food Search، Meal Logging، Weekly Plan و Settings
- Persian RTL و Vazirmatn Self-hosted
- Visual QA در عرض‌های هدف
- بدون Horizontal overflow
- تأیید صریح مالک محصول

### Stage 2 — PWA و Vercel Foundation

**وضعیت: فعال؛ PWA/CI سبز، Preview واقعی باقی‌مانده**

#### ساخته‌شده و اثبات‌شده

- Manifest فارسی/RTL و `standalone`
- Iconهای 192، 512، Maskable و Apple touch
- Icon generator deterministic
- Service Worker App shell نسخهٔ `v2`
- Precache گراف Assetهای Next.js شامل JS، CSS و Font هنگام Install
- Exclusion صریح API/Auth/Authorization/Mutation/Cross-origin
- Service Worker registration و `clients.claim()`
- Offline fallback
- Loading، Error، Global error و Not-found boundaries
- Environment contract برای Development/Preview/Production
- Deployment-aware metadata URL
- `web/vercel.json`
- Web CI دائمی
- Source bundle تمیز و Hash‌شده
- Visual regression
- Fresh-install Offline با پاک‌کردن HTTP cache و تست تعامل React

#### شواهد معتبر فعلی

- Branch: `stage2/pwa-vercel-foundation`
- PR: #15
- Head کد: `0bb0278f50312819029445c20dd5823ee8c719ed`
- Web CI: `30853438059` — success
- Artifact: `8871529505`
- Artifact digest: `sha256:7f50f89a15c37871bbafda95d3cea6e105ab5c0a344f9f408b5f5fe787823c77`
- TypeScript: pass
- Production build: pass
- Manifest و Icon dimensions: pass
- JS/CSS/Font precache: pass
- Service Worker activated و controlling پیش از Reload: pass
- Browser HTTP cache cleared: pass
- Fresh-install Offline reload: pass
- Offline React navigation Today → Nutrition → Today: pass
- Cached `/api` requests: zero
- Review P1 thread: resolved

#### وضعیت واقعی Vercel

اتصال به Vercel برقرار است:

- Team: `Emad's projects`
- Team ID: `team_BsUv0VprkU4YjdFbQi2hZCEm`
- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Framework: هنوز configure نشده
- `latestDeployment`: `null`
- Deployment count: `0`
- Domain: ندارد

ادعای قبلی دربارهٔ `api-deployments-free-per-day` قابل‌بازتولید نبود و بازپس گرفته شده است. زمان‌بندی مبتنی بر آن غیرفعال شد.

#### مانع قابل‌بازتولید فعلی

Action متصل `deploy_to_vercel` در Schema عمومی بدون Argument تعریف شده، اما Runtime سه ورودی زیر را اجباری می‌داند:

- `target`: preview یا production
- `name`
- `files`

بنابراین مانع فعلی **ناسازگاری Schema Connector** است، نه عدم اتصال و نه سهمیهٔ اثبات‌شده.

#### Gate باقیمانده

- اجرای Deploy با Action دارای Schema صحیح یا مسیر رسمی دیگری که در ابزار متصل واقعاً پشتیبانی شود
- ثبت Deployment ID و Preview URL
- بررسی Build logs و Runtime errors
- بررسی HTTPS Manifest، Iconها، Service Worker و Fresh-install Offline
- Merge PR #15 فقط پس از شواهد Deployment واقعی

### Stage 3 — Nutrition Core Extraction و Parity

- انتقال منطق خالص به `packages/nutrition-core`
- Adapter وب
- parity با Mobile RC
- حفظ ID و fingerprint
- Snapshot نسخه‌دار Catalog

### Stage 4 — Supabase Foundation

پیش‌شرط: پایان Stage 3 و تأیید Organization/Region/Cost.

- پروژهٔ جدید NeoFit
- Auth
- SQL migrations
- RLS
- Catalog seed
- Type generation
- Security/Performance advisors

### Stage 5 — Nutrition Vertical Slice

- Onboarding/Profile
- Today
- Search/Log
- Diary
- Favorites/Recents
- Goals
- Recipes
- History
- Export
- Settings

### Stage 6 — AvalAI، Vision و Plan Generation

- BYOK رمزنگاری‌شده
- Route Handler امن
- Identity resolver
- Weekly plan
- all-or-nothing catalog resolution
- bounded retry و audit امن

### Stage 7 — Offline Catalog و Sync

- IndexedDB schema
- Catalog snapshot
- Local Persian search
- Draft persistence
- Diary mutation queue
- Retry/conflict policy
- release-aware cache invalidation

### Stage 8 — Migration، Backup و Recovery

- Export/import نسخه‌دار
- Merge/Replace
- Transactional rollback
- تبدیل Backup قدیمی در صورت نیاز
- تست دادهٔ حجیم

### Stage 9 — Web Release Candidate

- دو Android و یک iPhone/Safari
- RTL/LTR visual regression
- Accessibility
- Performance
- Security/RLS review
- Data deletion و Privacy
- Production deployment
- PWA install QA
- README/Handoff/Branch governance

## ۱۱. معیارهای RC

- LCP کمتر از ۲.۵s
- INP کمتر از ۲۰۰ms
- CLS کمتر از ۰.۱
- Accessibility حداقل ۹۵
- بدون RLS finding بحرانی
- Startup، Search، Log، AI، Backup و Offline روی دستگاه واقعی پاس شوند

## ۱۲. Anti-goalها

- شروع Stage 3 پیش از بستن Vercel Gate
- ساخت Supabase پیش از Core parity
- ادعای سهمیه یا Deployment بدون پاسخ خام قابل‌بازتولید
- انتقال خط‌به‌خط UI Native
- Generic SaaS template
- ابزار Monorepo سنگین بدون نیاز
- Billing، Social، Coach، Marketplace و Admin در RC اول
- Cacheکردن دادهٔ کاربر در App-shell Service Worker

## ۱۳. ترتیب ثابت

1. Stage 0 — انجام‌شده
2. Stage 1 — انجام‌شده
3. Stage 2 — فعال؛ Deploy connector/Preview gate
4. Stage 3 — شروع‌نشده
5. Stage 4 — شروع‌نشده
6. Stage 5 — شروع‌نشده
7. Stage 6 — شروع‌نشده
8. Stage 7 — شروع‌نشده
9. Stage 8 — شروع‌نشده
10. Stage 9 — شروع‌نشده

## ۱۴. قدم بعدی دقیق

1. این فایل و `docs/NEOFIT_PROGRESS_LOG.md` دوباره خوانده شوند.
2. PR #15 و Latest green Head بررسی شوند.
3. Vercel Project `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG` و Deployment count دوباره خوانده شوند.
4. Schema صحیح Deploy action یا مسیر رسمی دیگری از Connector Vercel کشف شود که فایل Source را واقعاً بپذیرد.
5. از آخرین Source bundle سبز یک Preview ساخته شود.
6. Deployment ID، URL، Build log و Runtime logs ثبت شوند.
7. روی HTTPS Preview، Manifest، Iconها، Service Worker، Fresh-install Offline و Cache boundary تست شوند.
8. در صورت موفقیت، دو سند Update، PR #15 Merge و Issue #14 بسته شود.
9. در صورت شکست، فقط خطای واقعی و قابل‌بازتولید ثبت شود.

تا تکمیل این Gate:

- PR #15 باز می‌ماند.
- Issue #14 باز می‌ماند.
- Stage 3 آغاز نمی‌شود.
- Supabase ساخته نمی‌شود.

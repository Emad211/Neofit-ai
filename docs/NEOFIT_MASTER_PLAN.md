# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 2، پس از تکمیل PWA/CI و پیش از Vercel Preview  
**شاخهٔ integration وب:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage2/pwa-vercel-foundation`  
**PR فعال:** #15  
**Issue فعال:** #14  
**آخرین Head کد تأییدشده:** `d2330392e9bf8326c55a3ba94cde0a468d124efa`  
**آخرین CI معتبر:** Web CI run `30851823020` — success  
**مرحلهٔ فعال:** Stage 2 — PWA و Vercel Foundation  
**Gate فعلی:** ساخت و اعتبارسنجی Vercel Preview پس از Reset سهمیهٔ API

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر کد، داده یا زیرساخت، این دو فایل باید کامل خوانده شوند:

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`

سپس وضعیت واقعی branch، HEAD، PR، CI، Vercel و Supabase بررسی می‌شود. گزارش مکالمه یا حافظهٔ قبلی جای شواهد ریپو را نمی‌گیرد.

در پایان هر نوبت:

- دفتر پیشرفت با Commitها، Runها، Artifactها، خطاها، محدودیت‌های خارجی و قدم بعدی به‌روزرسانی می‌شود.
- همین پلن با مرحله، Gate، تصمیم‌ها و Exact continuation point همگام می‌شود.
- هیچ مرحله‌ای بدون برآورده‌شدن Definition of Done «تمام‌شده» اعلام نمی‌شود.
- هیچ Deployment، Preview یا اتصال خارجی بدون شناسه و URL واقعی موفق اعلام نمی‌شود.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور برای برنامه‌ریزی و ثبت تغذیه و تمرین است که باید روی موبایل سریع، ساده، نصب‌شونده و قابل اعتماد باشد.

هدف RC وب:

> کاربر فارسی‌زبان بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و داده‌اش بین دستگاه‌ها امن و قابل بازیابی باشد.

## ۲. تصمیم معماری قفل‌شده

NeoFit از UI اصلی Expo/React Native به یک وب‌اپلیکیشن Mobile-first و PWA مهاجرت می‌کند.

- Frontend و Server routes: Next.js App Router + TypeScript strict
- Hosting و Preview: Vercel
- Auth، PostgreSQL، RLS و Sync: Supabase
- PWA و Offline: Service Worker + IndexedDB
- زبان پیش‌فرض: فارسی
- جهت پیش‌فرض: RTL واقعی از ریشهٔ HTML
- زبان دوم: انگلیسی
- دادهٔ تغذیه: IFKB + USDA SR Legacy + FNDDS
- محاسبات: deterministic TypeScript
- AvalAI و Vision: فقط از مسیر Server-side امن و فقط برای هویت، زبان و ساختار برنامه

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

پوشهٔ `mobile/` تا اثبات مهاجرت وب، مرجع فریز‌شده و منبع مقایسه و انتقال داده باقی می‌ماند.

## ۴. قراردادهای غیرقابل نقض

- مدل زبانی یا Vision اجازهٔ ساخت کالری، ماکرو، وزن یا Portion ندارد.
- Nutrition نهایی فقط از رکوردهای نسخه‌دار محاسبه می‌شود.
- Ingredient حل‌نشده باعث رد کامل برنامهٔ AI می‌شود.
- Imported و Custom user data با Seed overwrite یا downgrade نمی‌شوند.
- تغییر Canonical ID یا Schema فقط با Migration نسخه‌دار و Freeze جدید مجاز است.
- Supabase service role و Secretهای سروری وارد Browser bundle نمی‌شوند.
- Raw AvalAI key در Local Storage یا DB plaintext ذخیره نمی‌شود.
- تصویر خام Vision بدون رضایت و نیاز روشن ذخیره نمی‌شود.
- Service Worker اجازهٔ Cacheکردن `/api`، `/auth`، درخواست دارای Authorization، Mutation یا Cross-origin را ندارد.
- App-shell cache جای Offline data/sync Stage 7 را نمی‌گیرد.

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

تا وجود نیاز واقعی، Turborepo، Nx و ابزار Monorepo سنگین اضافه نمی‌شود.

## ۶. قواعد UI/UX فارسی

- `html lang="fa" dir="rtl"` از Root Layout
- CSS logical properties به‌جای left/right
- Vazirmatn variable به‌صورت Self-hosted
- متن پایه حداقل ۱۶px
- Touch target حداقل ۴۴px
- Label بالای Input؛ Placeholder جای Label نیست
- هر صفحه فقط یک CTA اصلی
- Cardهای تودرتو محدود
- Loading، Empty، Error و Offline برای Flowهای اصلی
- اعداد و واحدهای تغذیه خوانا و tabular
- ترتیب Icon، متن، Navigation و Gesture برای RTL
- تغییر صفحه از Bottom Navigation باید Scroll را به ابتدای صفحه بازگرداند
- عرض‌های اجباری Visual QA: ۳۶۰، ۳۹۰ و ۴۱۲ پیکسل

### Navigation موبایل

حداکثر پنج مقصد:

1. امروز
2. تغذیه
3. تمرین
4. پیشرفت
5. تنظیمات

ثبت سریع غذا از «امروز» و «تغذیه» در دسترس است.

## ۷. نقش Supabase

Supabase لازم است، اما جایگزین Nutrition Core نیست.

### داده‌های عمومی Versioned

- catalog_releases
- food_concepts
- food_variants
- food_aliases
- food_portions
- food_assets

کاربر عادی فقط Read دارد. Write فقط از Migration/Release pipeline انجام می‌شود.

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

تمام جدول‌های خصوصی `user_id` و RLS کامل دارند.

### Auth اولیه

RC با Email OTP/Magic Link آغاز می‌شود. Catalog عمومی بدون ورود قابل مشاهده است؛ ذخیره و Sync دادهٔ شخصی نیازمند حساب است.

## ۸. امنیت کلید AvalAI

1. کاربر کلید را در Settings وارد می‌کند.
2. کلید به Route Handler احراز هویت‌شدهٔ Vercel ارسال می‌شود.
3. سرور با AES-GCM و Secret نسخه‌دار آن را رمز می‌کند.
4. فقط ciphertext، iv، key_version و metadata در Supabase ذخیره می‌شود.
5. کلید فقط هنگام Request در حافظهٔ سرور decrypt می‌شود.
6. Secret به Browser، Log، Analytics یا Backup برنمی‌گردد.
7. کاربر می‌تواند کلید را تست، جایگزین و حذف کند.

## ۹. PWA و Offline

Offline مرحله‌ای ساخته می‌شود:

- Stage 2: Manifest، Iconها، App shell، Service Worker، Offline reload و Installability
- Stage 7: Catalog snapshot، Draft و Mutation queue

به Background Sync به‌تنهایی اتکا نمی‌شود. Queue در Focus، Online و Reload نیز تخلیه می‌شود.

## ۱۰. مراحل اجرایی

### Stage 0 — Pivot و Freeze

**وضعیت: انجام‌شده**

- PR #12 Merge شد.
- معماری جدید ثبت شد.
- Mobile به‌عنوان Frozen reference حفظ شد.
- Handoff، Roadmap و شاخهٔ `web/pwa-foundation` ساخته شدند.

### Stage 1 — Product/UX Foundation فارسی

**وضعیت: انجام‌شده و پذیرفته‌شده**

#### شواهد

- PR #13 Merge commit: `a458a27a2685bfa7d85ea28686b3182c3167d747`
- Issue #11: completed
- Persian root و RTL واقعی
- Design tokens و Vazirmatn Self-hosted
- Bottom Navigation پنج‌مقصدی
- Today، Food Search، Meal Logging، Weekly Plan و Settings
- Loading/Empty/Error/Offline states
- Visual QA در ۳۶۰، ۳۹۰ و ۴۱۲px
- بدون Horizontal overflow
- Scroll reset regression coverage
- تأیید صریح مالک محصول

### Stage 2 — PWA و Vercel Foundation

**وضعیت: فعال؛ تمام Gateهای کد/Runtime پاس، Vercel Preview باقی‌مانده**

#### ساخته‌شده

- `web/app/manifest.ts` با `fa`، `rtl` و `standalone`
- Iconهای 192، 512، Maskable و Apple touch
- Icon generator deterministic
- Service Worker نسخه‌دار App shell
- Exclusion صریح API/Auth/Authorization/Mutation/Cross-origin از Cache
- Service Worker registration
- Offline fallback
- Loading، Route error، Global error و Not-found boundaries
- Development/Preview/Production environment contract
- Deployment-aware URL از `VERCEL_URL` و `VERCEL_PROJECT_PRODUCTION_URL`
- `web/vercel.json`
- Web CI دائمی
- Runtime PWA verification با Playwright
- Source bundle تمیز و Hash‌شده برای Deployment

#### شواهد معتبر فعلی

- Branch: `stage2/pwa-vercel-foundation`
- PR: #15
- Head کد: `d2330392e9bf8326c55a3ba94cde0a468d124efa`
- Web CI: `30851823020` — success
- Artifact: `8870912815`
- Artifact digest: `sha256:52b24dbfe0e08faf6871595139d2908762fc010b0abd527f78cb9c79db212380`
- TypeScript: pass
- Production build: pass
- Manifest: pass
- Icon dimensions: pass
- Service Worker: activated و controlling
- Offline reload: pass
- API cache exclusion: pass
- Visual regression: pass
- Reproducible Vercel source bundle: pass

#### Gate باقیمانده

- ایجاد Project/Preview واقعی Vercel
- ثبت Project ID، Deployment ID و Preview URL
- بررسی Build log
- بررسی `/manifest.webmanifest`، `/sw.js` و Iconها روی HTTPS Preview
- بررسی Service Worker control و Offline reload روی Preview
- بررسی Runtime error/log
- Merge PR #15 فقط پس از شواهد فوق

#### مانع خارجی فعلی

Vercel API در زمان تلاش، سهمیهٔ روزانهٔ Deploy رایگان تیم را تمام‌شده اعلام کرد:

- code: `api-deployments-free-per-day`
- total: `100`
- remaining: `0`
- reset اعلام‌شده: `2026-08-05 00:08:27 +03:30`

این مانع کد یا Build نیست. Stage 2 تا ایجاد Preview واقعی باز می‌ماند.

### Stage 3 — Nutrition Core Extraction و Parity

- انتقال منطق خالص به `packages/nutrition-core`
- Adapter وب
- parity با Mobile RC
- حفظ ID و fingerprint
- Snapshot نسخه‌دار Catalog

### Stage 4 — Supabase Foundation

پیش‌شرط: پایان Stage 3 و تأیید Organization/Region/Cost.

- ساخت پروژهٔ جدید NeoFit
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
- Test/Replace/Delete
- Route Handler امن
- Consent و image preparation
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
- ابزار تبدیل Backup قدیمی در صورت نیاز
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

- LCP هدف کمتر از ۲.۵s
- INP هدف کمتر از ۲۰۰ms
- CLS هدف کمتر از ۰.۱
- Accessibility score هدف حداقل ۹۵
- بدون RLS finding بحرانی
- Startup، Search، Log، AI، Backup و Offline روی دستگاه واقعی پاس شوند

## ۱۲. Anti-goalها

- شروع Stage 3 پیش از بستن Vercel Gate
- ساخت Supabase پیش از Core parity
- انتقال خط‌به‌خط UI Native
- Generic SaaS template
- Dashboard پیچیده قبل از Daily flow
- Edge Function وقتی Route Handler کافی است
- ابزار Monorepo سنگین بدون نیاز واقعی
- Billing، Social، Coach، Marketplace و Admin در RC اول
- تغییر IFKB/ID/Schema بدون Migration و Freeze
- Cacheکردن دادهٔ کاربر در App-shell Service Worker

## ۱۳. ترتیب ثابت

1. Stage 0 — انجام‌شده
2. Stage 1 — انجام‌شده
3. Stage 2 — فعال؛ Vercel Preview gate
4. Stage 3 — شروع‌نشده
5. Stage 4 — شروع‌نشده
6. Stage 5 — شروع‌نشده
7. Stage 6 — شروع‌نشده
8. Stage 7 — شروع‌نشده
9. Stage 8 — شروع‌نشده
10. Stage 9 — شروع‌نشده

## ۱۴. قدم بعدی دقیق

پس از Reset سهمیهٔ Vercel در `2026-08-05 00:08:27 +03:30`:

1. این پلن و `docs/NEOFIT_PROGRESS_LOG.md` دوباره خوانده شوند.
2. PR #15 و Head آن با `d2330392e9bf8326c55a3ba94cde0a468d124efa` یا Head جدیدتر سبز تطبیق داده شوند.
3. آخرین Web CI و Artifact بررسی شوند.
4. Source bundle دقیق CI برای Preview پروژهٔ `neofit-ai` Deploy شود.
5. Project ID، Deployment ID و URL ثبت شوند.
6. Build log و وضعیت Deployment بررسی شوند.
7. روی HTTPS Preview، Manifest، Iconها، Service Worker، Offline reload، RTL و Cache boundary بررسی شوند.
8. در صورت موفقیت، دو سند به‌روزرسانی و PR #15 Merge شود.
9. در صورت شکست، خطای دقیق ثبت و بدون ادعای موفقیت Fix شود.

تا تکمیل این Gate:

- PR #15 باز می‌ماند.
- Issue #14 باز می‌ماند.
- Stage 3 آغاز نمی‌شود.
- Supabase ساخته نمی‌شود.

# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۳ اوت ۲۰۲۶ — پایان Visual QA و Refinement شمارهٔ ۱ از Stage 1  
**شاخهٔ integration وب:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage1/persian-rtl-ux`  
**PR فعال:** #13  
**آخرین Head کد تأییدشده:** `489394eceea5b1f6cd9adec5dc8487cc250f1061`  
**آخرین CI معتبر:** Web Stage 1 CI run `30829629853` — success  
**مرحلهٔ فعال:** Stage 1 — پایهٔ محصول و UX فارسی/RTL  
**Gate فعلی:** بازبینی بصری مالک محصول و تصمیم دربارهٔ Merge یا Refinement دوم

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر کد، داده یا زیرساخت، این دو فایل باید کامل خوانده شوند:

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`

سپس وضعیت واقعی branch، HEAD، PR، CI، Vercel و Supabase بررسی می‌شود. گزارش مکالمه یا حافظهٔ قبلی جای شواهد ریپو را نمی‌گیرد.

در پایان هر نوبت:

- دفتر پیشرفت با شواهد واقعی، Commitها، Runها، Artifactها، خطاها و قدم بعدی به‌روزرسانی می‌شود.
- همین پلن با مرحله، Gate، تصمیم‌ها و قدم بعدی همگام می‌شود.
- هیچ مرحله‌ای بدون برآورده‌شدن Definition of Done «تمام‌شده» اعلام نمی‌شود.

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

- `html lang="fa" dir="rtl"` از اولین Layout
- CSS logical properties به‌جای left/right
- فونت فارسی Self-hosted؛ در Stage 1 از `@fontsource-variable/vazirmatn` استفاده می‌شود
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

ثبت سریع غذا از «امروز» و «تغذیه» در دسترس خواهد بود.

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

- Stage 2: App shell و Installability
- Stage 7: Catalog snapshot، Draft و Mutation queue

به Background Sync به‌تنهایی اتکا نمی‌شود. Queue در Focus، Online و Reload نیز تخلیه می‌شود.

## ۱۰. مراحل اجرایی

### Stage 0 — Pivot و Freeze

**وضعیت: انجام‌شده**

- ثبت معماری جدید
- Freeze نسخهٔ Mobile به‌عنوان Reference
- ساخت Handoff
- ساخت Issue مادر و Issue Stage 1
- ایجاد شاخهٔ `web/pwa-foundation`

### Stage 1 — Product/UX Foundation فارسی

**وضعیت: فعال؛ Batch 1 و Refinement 1 آمادهٔ بازبینی مالک محصول**

#### ساخته‌شده و اثبات‌شده

- `web/` با Next.js App Router
- TypeScript strict و Production build
- Persian root و RTL واقعی
- Design tokenهای اولیه
- Vazirmatn variable به‌صورت Self-hosted از Package
- Bottom Navigation پنج‌مقصدی
- Today dashboard
- Food search و Food picker
- Meal logging sheet با Portion و Meal type
- Weekly plan سه‌روزه با IFKB provenance label
- Settings mock برای Language، Theme و AvalAI key
- Loading/Empty/Error/Offline states
- IFKB-shaped fixture data؛ بدون Backend
- Visual QA خودکار در ۳۶۰، ۳۹۰ و ۴۱۲px
- Screenshot Artifact برای Flowهای Today، Nutrition، Search، Meal sheet، Weekly plan و Settings
- Zero horizontal overflow در تمام مسیرهای ثبت‌شده
- Scroll reset هنگام تغییر صفحه از Bottom Navigation

#### Visual QA معتبر

- CI run: `30829629853`
- Artifact: `8862378720`
- Artifact digest: `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`
- Head: `489394eceea5b1f6cd9adec5dc8487cc250f1061`

#### Gate باقی‌مانده

- بازبینی بصری و تعامل توسط مالک محصول
- تصمیم صریح: Accept یا Refinement دوم
- PR #13 تا آن تصمیم Merge نمی‌شود

#### Definition of Done کامل Stage 1

- Persian default و RTL واقعی
- بدون horizontal overflow
- ثبت غذای معمولی از Today حداکثر با دو انتقال
- یک Design System یکپارچه
- تمام Flowهای بحرانی قابل استفاده
- Screenshot evidence در عرض‌های هدف
- تأیید صریح مالک محصول

**ممنوع در این Stage:** Supabase schema، Auth واقعی، AI واقعی، Sync کامل، Billing، Social و کپی UI Native.

### Stage 2 — PWA و Vercel Foundation

شروع فقط پس از تأیید و Merge Stage 1:

- Manifest و Iconها
- Service worker برای App shell
- Installability Android/iOS
- Error و Loading boundary
- Web CI دائمی
- ایجاد Vercel Project و Preview برای PRها
- Environment separation

### Stage 3 — Nutrition Core Extraction و Parity

- انتقال منطق خالص به `packages/nutrition-core`
- Adapter وب
- parity با Mobile RC
- حفظ ID و fingerprint
- Snapshot نسخه‌دار Catalog

### Stage 4 — Supabase Foundation

پیش‌شرط: تأیید UX Stage 1 و تأیید Organization/Region/Cost.

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

- ساخت Backend پیش از تأیید UX
- انتقال خط‌به‌خط UI Native
- Generic SaaS template
- Dashboard پیچیده قبل از Daily flow
- Edge Function وقتی Route Handler کافی است
- ابزار Monorepo سنگین بدون نیاز واقعی
- Billing، Social، Coach، Marketplace و Admin در RC اول
- تغییر IFKB/ID/Schema بدون Migration و Freeze

## ۱۳. ترتیب ثابت

1. Stage 0 — انجام‌شده
2. Stage 1 — فعال؛ Gate مالک محصول
3. Stage 2 — PWA/Vercel
4. Stage 3 — Core parity
5. Stage 4 — Supabase
6. Stage 5 — Vertical slice
7. Stage 6 — AI/Vision
8. Stage 7 — Offline
9. Stage 8 — Recovery
10. Stage 9 — RC

## ۱۴. قدم بعدی دقیق

### ورودی لازم

مالک محصول Screenshotهای نهایی Stage 1 را بررسی می‌کند و یکی از دو تصمیم زیر را اعلام می‌کند:

1. **Accept:** PR #13 Merge شود و Stage 2 با PWA manifest، Service Worker و Vercel Preview آغاز شود.
2. **Refine:** ایرادهای UI/UX به‌صورت صفحه و جزء مشخص ثبت شوند و Refinement دوم فقط در همین PR انجام شود.

تا اعلام این تصمیم:

- PR #13 باز می‌ماند.
- Supabase و Vercel Project ساخته نمی‌شوند.
- Stage 2 آغازشده اعلام نمی‌شود.

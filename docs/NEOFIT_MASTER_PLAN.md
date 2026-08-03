# پلن مادر NeoFit

**وضعیت سند:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۳ اوت ۲۰۲۶ — پایان Batch 1 از Stage 1  
**شاخهٔ integration وب:** `web/pwa-foundation`  
**شاخهٔ فعال:** `stage1/persian-rtl-ux`  
**Head محصول تأییدشده توسط CI:** `ad9620419b79eecf08068400a6df8f90b902d5c4`  
**PR فعال:** #13  
**مرحلهٔ فعال:** Stage 1 — پایهٔ محصول و UX فارسی/RTL  
**Gate فعلی:** بازبینی و تأیید UX توسط مالک محصول

## پروتکل اجباری ادامهٔ پروژه

پیش از هر تغییر کد، داده یا زیرساخت، این دو فایل باید کامل خوانده شوند:

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`

در پایان هر نوبت:

- دفتر پیشرفت با شواهد واقعی، Commitها، PR، CI، مشکلات و قدم بعدی به‌روزرسانی می‌شود.
- همین پلن با Head، مرحله، Gate، تصمیم‌ها و قدم بعدی همگام می‌شود.
- گزارش مکالمه جای این دو فایل را نمی‌گیرد.
- هیچ مرحله‌ای بدون شواهد «تمام‌شده» اعلام نمی‌شود.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور برای برنامه‌ریزی و ثبت تغذیه و تمرین است که باید روی موبایل سریع، ساده، نصب‌شونده و قابل اعتماد باشد.

هدف RC وب:

> کاربر فارسی‌زبان بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و داده‌اش بین دستگاه‌ها امن و قابل بازیابی باشد.

## ۲. تصمیم معماری قفل‌شده

NeoFit از UI اصلی Expo/React Native به یک **وب‌اپلیکیشن Mobile-first و PWA** مهاجرت می‌کند.

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
- فونت هدف: Vazirmatn
- متن پایه حداقل ۱۶px
- Touch target حداقل ۴۴px
- Label بالای Input
- یک CTA اصلی در هر صفحه
- Cardهای تودرتو محدود
- Loading، Empty، Error و Offline برای Flowهای بحرانی
- اعداد تغذیه خوانا و tabular
- Navigation، Icon/Text order و Gestureها RTL-first

### Navigation موبایل

1. امروز
2. تغذیه
3. تمرین
4. پیشرفت
5. تنظیمات

ثبت سریع غذا از «امروز» و «تغذیه» در دسترس است.

## ۷. نقش Supabase

Supabase Backend محصول است، نه موتور تغذیه.

### عمومی و Versioned

- catalog_releases
- food_concepts
- food_variants
- food_aliases
- food_portions
- food_assets

کاربر عادی فقط Read دارد. Write فقط از Migration/Release pipeline انجام می‌شود.

### خصوصی کاربر

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

## ۸. امنیت AvalAI BYOK

1. کلید در Settings وارد می‌شود.
2. فقط به Route Handler احراز هویت‌شدهٔ Vercel می‌رود.
3. سرور با AES-GCM و Secret نسخه‌دار رمز می‌کند.
4. فقط ciphertext، iv، key_version و metadata در Supabase ذخیره می‌شود.
5. کلید فقط هنگام Request در حافظهٔ سرور decrypt می‌شود.
6. Secret به Browser، Log، Analytics یا Backup برنمی‌گردد.
7. کاربر می‌تواند Test، Replace و Delete انجام دهد.

## ۹. مراحل اجرایی

### Stage 0 — Pivot و Freeze

**وضعیت: انجام‌شده**

- معماری جدید ثبت شد.
- Mobile به Frozen reference تبدیل شد.
- Handoff، Issue مادر و شاخهٔ `web/pwa-foundation` ساخته شد.

### Stage 1 — Product/UX Foundation فارسی

**وضعیت: فعال — Batch 1 پیاده‌سازی و Build شده، تأیید UX باقی است**

#### انجام‌شده در Batch 1

- `web/` با Next.js App Router
- TypeScript strict
- Root فارسی و RTL
- Design tokenها و CSS Mobile-first
- Bottom navigation پنج‌مقصدی
- صفحهٔ Today با کالری، ماکرو و Timeline
- Persian food search با Fixtureهای IFKB
- Meal logging sheet با Portion count و Meal type
- Weekly plan با IFKB provenance label
- Settings mock برای Language، Theme و AvalAI state
- Loading، Empty، Error و Offline visual states
- قواعد Responsive برای ۳۶۰، ۳۹۰ و ۴۱۲px
- Web Stage 1 CI

#### شواهد

- PR: #13
- Head: `ad9620419b79eecf08068400a6df8f90b902d5c4`
- CI run: `30826619384`
- Persian RTL contract: پاس
- TypeScript strict: پاس
- Next.js production build: پاس

#### باقی‌مانده برای پایان Stage 1

- بازبینی بصری توسط مالک محصول
- اصلاح بازخوردهای UI/UX
- Screenshot/visual evidence در سه عرض هدف
- بسته‌بندی واقعی فونت Vazirmatn
- تکمیل جزئیات Flow تمرین و پیشرفت یا ثبت Scope دقیق Batch بعدی
- Merge به `web/pwa-foundation` فقط بعد از تأیید UX

#### Definition of Done

- Persian default و RTL واقعی
- بدون horizontal overflow در عرض‌های هدف
- ثبت غذای معمولی از Today حداکثر با دو انتقال
- Design System یکپارچه
- پنج Flow بحرانی قابل استفاده
- تأیید صریح مالک محصول

**ممنوع:** Supabase schema، Auth واقعی، AI واقعی، Sync کامل، Billing، Social و کپی UI Native.

### Stage 2 — PWA و Vercel Foundation

- Manifest و Iconها
- Service worker برای App shell
- Installability Android/iOS
- Error و Loading boundary
- Vercel project و Preview برای هر PR
- Environment separation

### Stage 3 — Nutrition Core Extraction و Parity

- انتقال منطق خالص به `packages/nutrition-core`
- Adapter وب
- parity با Mobile RC
- حفظ ID و fingerprint
- Snapshot نسخه‌دار Catalog

### Stage 4 — Supabase Foundation

پیش‌شرط: تأیید UX Stage 1 و تأیید Organization/Region/Cost.

- پروژهٔ جدید NeoFit
- Auth
- SQL migrations
- RLS
- Catalog seed
- Type generation
- Security/Performance advisors

### Stage 5 — Nutrition Vertical Slice

- Onboarding/Profile
- Today، Search، Log و Diary
- Favorites/Recents
- Goals، Recipes، History و Export
- Settings

### Stage 6 — AvalAI، Vision و Plan Generation

- BYOK رمزنگاری‌شده
- Test/Replace/Delete
- Route Handler امن
- Consent و image preparation
- Identity resolver
- Weekly plan و all-or-nothing catalog resolution
- bounded retry و audit امن

### Stage 7 — Offline Catalog و Sync

- IndexedDB
- Catalog snapshot
- Local Persian search
- Draft و Diary mutation queue
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
- Accessibility و Performance
- Security/RLS review
- Data deletion و Privacy
- Production deployment و PWA install QA
- README/Handoff/Branch governance

## ۱۰. معیارهای RC

- LCP هدف کمتر از ۲.۵s
- INP هدف کمتر از ۲۰۰ms
- CLS هدف کمتر از ۰.۱
- Accessibility score هدف حداقل ۹۵
- بدون RLS finding بحرانی
- Startup، Search، Log، AI، Backup و Offline روی دستگاه واقعی پاس شوند

## ۱۱. Anti-goalهای RC اول

- پنل مربی
- شبکهٔ اجتماعی
- Marketplace
- Billing/Subscription
- Admin platform گسترده
- Full native parity پیش از اثبات نیاز
- Edge Function غیرضروری
- Generic SaaS dashboard template

## ۱۲. استراتژی Branch و PR

- `web/pwa-foundation`: integration وب
- هر Stage/Batch: شاخه و PR جدا
- PR #3: تاریخچهٔ Mobile/IFKB، نه توسعهٔ وب
- هر PR: Scope محدود، DoD، Evidence و قدم بعدی
- PR چندصد Commit جدید ممنوع

## ۱۳. قدم بعدی دقیق

1. مالک محصول PR #13 را از نظر ظاهر و Flow بررسی می‌کند.
2. بازخوردها در همان PR به اصلاحات کوچک و قابل‌مرور تبدیل می‌شوند.
3. Screenshotهای ۳۶۰، ۳۹۰ و ۴۱۲px ثبت می‌شوند.
4. Vazirmatn به‌صورت self-hosted اضافه می‌شود.
5. پس از تأیید UX، PR #13 به `web/pwa-foundation` Merge می‌شود.
6. سپس Stage 2 با PWA manifest، service worker و Vercel Preview آغاز می‌شود.

تا پایان Gate شمارهٔ ۵، Supabase ساخته یا متصل نمی‌شود.

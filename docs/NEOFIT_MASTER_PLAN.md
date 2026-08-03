# پلن مادر NeoFit

**وضعیت سند:** مرجع الزامی و واحد تصمیم‌های پروژه  
**آخرین بازبینی:** ۳ اوت ۲۰۲۶  
**شاخهٔ فعال:** `web/pwa-foundation`  
**Head مبنای این نسخه:** `151de2c0d5c9b02602c2f89eb4df808653cdd74e`  
**مرحلهٔ فعال:** Stage 1 — پایهٔ محصول و UX فارسی/RTL

## پروتکل اجباری ادامهٔ پروژه

در ابتدای هر نوبت توسعه، پیش از هر تغییر کد یا زیرساخت، این دو فایل باید کامل خوانده شوند:

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`

در پایان همان نوبت:

- دفتر پیشرفت باید با شواهد واقعی، Commitها، تست‌ها، مشکلات و قدم بعدی به‌روزرسانی شود.
- پلن مادر نیز باید بازبینی و با Head، مرحلهٔ فعال، تصمیم‌های جدید و قدم بعدی همگام شود؛ حتی اگر تصمیم معماری عوض نشده باشد.
- هیچ گزارش مکالمه‌ای جای این دو فایل را نمی‌گیرد.
- وضعیت ادعاشده باید از ریپو، PR، CI، Vercel و Supabase قابل اثبات باشد.

## ۱. مأموریت محصول

NeoFit یک محصول فارسی‌محور برای برنامه‌ریزی و ثبت تغذیه و تمرین است که باید روی موبایل ساده، سریع، قابل نصب و قابل اعتماد باشد.

هدف اصلی RC وب:

> کاربر فارسی‌زبان بتواند وضعیت امروز را ببیند، غذا یا تمرین را سریع ثبت کند، برنامه را دنبال کند و داده‌اش بین دستگاه‌ها امن و قابل بازیابی باشد.

## ۲. تصمیم معماری قفل‌شده

NeoFit از UI اصلی Expo/React Native به یک **وب‌اپلیکیشن Mobile-first و PWA** مهاجرت می‌کند.

معماری هدف:

- Frontend و Server routes: Next.js App Router + TypeScript strict
- Hosting و Preview: Vercel
- Auth، PostgreSQL، RLS و Sync دادهٔ کاربر: Supabase
- PWA و Offline: Service Worker + IndexedDB
- زبان پیش‌فرض: فارسی
- جهت پیش‌فرض: RTL واقعی از ریشهٔ HTML
- زبان دوم: انگلیسی
- دادهٔ تغذیه: IFKB + USDA SR Legacy + FNDDS
- محاسبات: deterministic TypeScript
- AvalAI و Vision: فقط از مسیر Server-side امن و فقط برای هویت، زبان و ساختار برنامه

## ۳. دارایی‌های حفظ‌شونده

نسخهٔ وب نباید دستاوردهای علمی و داده‌ای فعلی را دور بریزد یا از صفر بسازد:

- ۱۳٬۲۲۵ رکورد عمومی USDA/FNDDS/SR
- ۹٬۲۷۹ Concept عمومی
- ۳۶٬۴۹۴ Portion رسمی
- ۲۶۱ هویت Canonical غذای ایرانی
- Canonical IDها، mappingها و fingerprintها
- provenance و evidence tierها
- موتور محاسبهٔ کالری، ماکرو، Portion، Recipe، Diary و Goal
- قرارداد Resolveشدن همهٔ Ingredientهای برنامهٔ AI در IFKB/FNDDS/SR
- تصاویر دارای Attribution و مجوز
- تست‌های Schema، ID، arithmetic، migration و catalog audit

پوشهٔ `mobile/` تا اثبات کامل مهاجرت وب، مرجع فریز‌شده و منبع مقایسه و مهاجرت باقی می‌ماند.

## ۴. قراردادهای غیرقابل نقض

- مدل زبانی یا Vision اجازهٔ ساخت یا اصلاح کالری، ماکرو، وزن و Portion ندارد.
- Nutrition نهایی فقط از رکوردهای محلی/نسخه‌دار محاسبه می‌شود.
- اگر حتی یک Ingredient برنامهٔ AI Resolve نشود، کل برنامه ذخیره نمی‌شود.
- Imported و Custom user data با Seed جدید overwrite یا downgrade نمی‌شوند.
- تغییر Canonical ID یا Schema فقط با Migration نسخه‌دار و Freeze جدید مجاز است.
- Secretهای سروری و Supabase service role هرگز وارد Browser bundle نمی‌شوند.
- Raw AvalAI key در Local Storage یا DB plaintext ذخیره نمی‌شود.
- تصویر خام Vision بدون رضایت صریح و نیاز محصول ذخیره نمی‌شود.

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

## ۶. معماری UX فارسی

### قواعد پایه

- `html lang="fa" dir="rtl"` از اولین Layout
- استفاده از CSS logical properties به‌جای left/right
- فونت فارسی مناسب؛ هدف Vazirmatn
- متن پایه حداقل ۱۶px
- Touch target حداقل ۴۴px
- Label بالای Input؛ Placeholder جای Label نیست
- هر صفحه فقط یک CTA اصلی
- Cardهای تودرتو محدود
- Loading، Empty، Error و Offline برای هر Flow
- اعداد و واحدهای تغذیه خوانا و tabular
- ترتیب Icon، متن، Navigation و Gesture برای RTL طراحی می‌شود

### Navigation موبایل

حداکثر پنج مقصد:

1. امروز
2. تغذیه
3. تمرین
4. پیشرفت
5. تنظیمات

ثبت سریع غذا باید از امروز و تغذیه در دسترس باشد.

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

**وضعیت: فعال**

دامنه:

- ایجاد `web/`
- Next.js shell با TypeScript strict
- Design tokens
- RTL root
- Bottom navigation
- صفحهٔ امروز
- Food search و picker
- Meal logging با grams/portion
- Weekly plan
- Settings شامل language/theme/AvalAI state
- Loading/Empty/Error/Offline states
- IFKB-shaped fixture data؛ بدون Backend
- Visual QA در ۳۶۰، ۳۹۰ و ۴۱۲px

Definition of Done:

- Persian default و RTL واقعی
- بدون horizontal overflow
- ثبت غذای معمولی از Today حداکثر با دو انتقال
- یک Design System یکپارچه
- تمام Flowهای بحرانی قابل استفاده
- تأیید صریح مالک محصول

**ممنوع در این Stage:** Supabase schema، Auth واقعی، AI واقعی، Sync کامل، Billing، Social و کپی UI Native.

### Stage 2 — PWA و Vercel Foundation

- Manifest و Iconها
- Service worker برای App shell
- Installability Android/iOS
- Error و Loading boundary
- Web CI
- Vercel Project و Preview برای هر PR
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

## ۱۲. Anti-goalهای RC اول

- پنل مربی
- شبکهٔ اجتماعی
- Marketplace
- Billing/Subscription
- Admin platform گسترده
- Full native parity قبل از اثبات نیاز
- Edge Function غیرضروری
- Generic SaaS dashboard template

## ۱۳. استراتژی Branch و PR

- `web/pwa-foundation`: شاخهٔ integration وب
- هر Stage/Batch: شاخه و PR جدا
- PR #3: تاریخچهٔ Mobile/IFKB، نه محل توسعهٔ وب
- هر PR باید Scope محدود، DoD، Evidence و قدم بعدی داشته باشد
- PR چندصد Commit جدید ممنوع است

## ۱۴. وضعیت و قدم بعدی فعلی

**وضعیت در شروع این نوبت:**

- Stage 0 بسته است.
- Stage 1 آغاز می‌شود.
- Supabase و Vercel project هنوز ایجاد نشده‌اند.
- قدم بعدی: ایجاد شاخهٔ Stage 1، ساخت Next.js RTL shell، Today و Food logging prototype با fixtureهای IFKB.

در پایان این نوبت، این بخش باید با Head واقعی و نتیجهٔ تست‌ها به‌روزرسانی شود.

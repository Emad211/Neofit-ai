# نقشهٔ توسعهٔ NeoFit Web/PWA — نسخهٔ ۱

**وضعیت:** تصمیم معماری جدید  
**تاریخ:** ۳ اوت ۲۰۲۶  
**شاخهٔ مبنا:** `agent/iranian-food-kb-foundation`  
**Head مبنا:** `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

## ۱. تصمیم نهایی

NeoFit از یک اپلیکیشن اصلی Expo/React Native به یک **وب‌اپلیکیشن فارسی‌محور، Mobile-first و نصب‌شونده به‌صورت PWA** مهاجرت می‌کند.

معماری هدف:

- **Frontend و Server routes:** Next.js App Router + TypeScript
- **استقرار:** Vercel
- **Auth، Postgres، RLS و داده‌های کاربر:** Supabase
- **PWA و کش آفلاین:** Service Worker + IndexedDB
- **هستهٔ تغذیه:** همان IFKB + USDA SR Legacy + FNDDS و محاسبات deterministic TypeScript
- **AvalAI و Vision:** فقط از مسیر Server-side امن؛ مدل اجازهٔ ساخت کالری، ماکرو، وزن یا Portion ندارد
- **زبان پیش‌فرض:** فارسی با RTL واقعی؛ انگلیسی یک Locale ثانویه است

این سند فقط تصمیم‌های Platform، UX و Delivery را عوض می‌کند. قرارداد علمی و داده‌ای تغذیه، شناسه‌های Canonical، provenance، مرز Vision و الزام Resolveشدن وعده‌های AI در IFKB همچنان معتبر و قفل‌شده هستند.

## ۲. علت تغییر مسیر

نسخهٔ Android نشان داد که مشکل اصلی NeoFit دیگر کمبود دیتاست یا منطق تغذیه نیست. سه مانع محصولی اصلی عبارت‌اند از:

1. UI/UX فعلی برای استفادهٔ روزانهٔ موبایل مناسب نیست.
2. فارسی و RTL از ابتدا به‌عنوان معماری رابط طراحی نشده‌اند و صرفاً ترجمه به رابط LTR اضافه شده است.
3. هزینهٔ نگهداری Native، Build، Migration، Backup و QA دستگاه برای سرعت فعلی محصول زیاد است.

نسخهٔ PWA باید مسیر «بازکردن اپ → دیدن وضعیت امروز → ثبت غذا/تمرین» را بسیار سریع‌تر، واضح‌تر و فارسی‌تر کند.

## ۳. چیزهایی که حفظ می‌شوند

موارد زیر نباید از صفر بازنویسی یا تضعیف شوند:

- ۱۳٬۲۲۵ رکورد عمومی USDA/FNDDS/SR
- ۲۶۱ هویت Canonical غذای ایرانی
- ۹٬۲۷۹ Concept عمومی و ۳۶٬۴۹۴ Portion رسمی
- IDها، mappingها، fingerprints و release manifestهای فعلی
- موتور deterministic محاسبهٔ کالری، ماکرو، Portion، Recipe، Diary و Goal
- اصل «مدل فقط هویت/اجزا را پیشنهاد می‌دهد»
- رد کامل Nutrition تولیدشده توسط Provider
- الزام Resolveشدن همهٔ مواد وعدهٔ AI پیش از ذخیره
- Attribution و مجوز تصاویر
- تست‌های schema، provenance، migration، arithmetic و catalog audit

پوشهٔ `mobile/` به‌عنوان **Mobile RC frozen reference** حفظ می‌شود و تا زمانی که مهاجرت وب اثبات نشده، حذف نخواهد شد.

## ۴. اهداف محصول جدید

### اهداف اصلی

- تجربهٔ فارسی واقعی، نه ترجمهٔ یک رابط انگلیسی
- RTL کامل در Layout، Navigation، فرم‌ها، جدول‌ها، نمودارها و Gestureها
- سرعت بالا روی موبایل‌های میان‌رده
- نصب‌پذیری روی Android و iOS به‌صورت PWA
- همگام‌سازی حساب و داده بین دستگاه‌ها
- ثبت غذا و مشاهدهٔ برنامه با حداقل تعامل
- حفظ قابلیت‌های آفلاین ضروری
- امنیت صحیح کلید شخصی AvalAI
- Preview Deployment برای هر PR

### Anti-goalها

- ساخت Dashboard پیچیده قبل از تأیید UX اصلی
- انتقال همهٔ کد Native به وب به‌صورت خط‌به‌خط
- بازنویسی IFKB یا تغییر شناسه‌ها بدون Migration نسخه‌دار
- استفاده از Template آمادهٔ شلوغ و ظاهر عمومی SaaS
- ساخت Billing، Subscription، شبکهٔ اجتماعی، پنل مربی یا Marketplace در RC اول
- ذخیرهٔ Nutrition مدل یا Raw image بدون رضایت صریح
- ایجاد Supabase Edge Function وقتی Next.js Route Handler کافی است
- اضافه‌کردن Monorepo tooling سنگین قبل از نیاز واقعی

## ۵. معماری هدف

### ۵.۱ ساختار ریپو

ساختار اولیه و کم‌پیچیدگی:

```text
Neofit-ai/
├── web/                         # Next.js PWA
├── packages/
│   └── nutrition-core/          # منطق خالص TypeScript قابل استفاده در وب/تست
├── ifkb/                        # Source، audit و release artifacts فعلی
├── mobile/                      # نسخهٔ Native فریز‌شده برای مرجع و مهاجرت
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── tests/
└── docs/
```

در مرحلهٔ اول Turborepo، Nx یا ابزار مشابه اضافه نمی‌شود. فقط در صورت درد واقعی Build از npm workspaces استفاده خواهد شد.

### ۵.۲ Frontend

- Next.js App Router و TypeScript strict
- React Server Components برای Shell و داده‌های عمومی
- Client Components فقط برای تعامل‌های لازم
- Tailwind CSS با Design Tokenهای اختصاصی NeoFit
- Radix primitives برای Accessibility، بدون ظاهر پیش‌فرض Template
- کامپوننت‌های اختصاصی Mobile-first برای Bottom navigation، Sheet، Search، Meal log و Progress
- `html lang="fa" dir="rtl"` از اولین Commit
- استفاده از CSS logical properties؛ عدم استفادهٔ مستقیم از `left/right` مگر برای موارد تصویری خاص
- Vazirmatn به‌عنوان فونت فارسی متن‌باز
- `Intl` برای عدد، تاریخ، زمان و واحدها

### ۵.۳ Supabase

Supabase برای این پروژه لازم است، اما فقط در نقش Backend محصول:

#### داده‌های عمومی و Versioned

- `catalog_releases`
- `food_concepts`
- `food_variants`
- `food_aliases`
- `food_portions`
- `food_assets`

این جدول‌ها فقط توسط Migration/Release pipeline نوشته می‌شوند. کاربر عادی دسترسی Read دارد و هیچ Write عمومی مجاز نیست.

#### داده‌های خصوصی کاربر

- `profiles`
- `user_settings`
- `diary_entries`
- `recipes`
- `recipe_ingredients`
- `nutrition_goals`
- `favorites`
- `weight_logs`
- `activity_logs`
- `workout_plans`
- `workout_sessions`
- `workout_sets`
- `ai_request_audit`
- `encrypted_provider_credentials`

تمام جدول‌های خصوصی `user_id` دارند و RLS باید برای Select/Insert/Update/Delete اعمال شود.

#### Auth

RC اول با Email OTP/Magic Link آغاز می‌شود. ورود نباید مانع مشاهدهٔ Catalog عمومی شود، اما ذخیره و Sync دادهٔ شخصی نیاز به حساب دارد.

### ۵.۴ Vercel

Vercel مسئول موارد زیر است:

- استقرار Next.js
- Preview Deployment برای هر PR
- Production Deployment
- Route Handlerهای Server-side
- نگهداری Environment Secretهای رمزنگاری
- Proxy امن AvalAI و Vision
- Cache و CDN برای Assetها و snapshotهای Catalog

هیچ `service_role` یا Secret سروری نباید وارد Bundle مرورگر شود.

### ۵.۵ کلید شخصی AvalAI

در وب، ذخیرهٔ Raw API key در `localStorage` یا جدول معمولی قابل قبول نیست.

جریان هدف:

1. کاربر کلید را در Settings وارد می‌کند.
2. کلید فقط به یک Route Handler احراز هویت‌شده در Vercel ارسال می‌شود.
3. Route Handler با یک Secret سروری و AES-GCM آن را رمز می‌کند.
4. فقط `ciphertext`، `iv`، `key_version` و metadata در Supabase ذخیره می‌شوند.
5. هنگام درخواست AI، کلید فقط در حافظهٔ Server decrypt می‌شود.
6. کلید هرگز دوباره به Browser، Log یا Analytics برگردانده نمی‌شود.
7. کاربر می‌تواند کلید را تست، جایگزین و حذف کند.

### ۵.۶ Vision

- Camera/File input در PWA
- Resize و Compression سمت Client
- سقف ۱۰۲۴ پیکسل و ۱.۵ مگابایت مطابق قرارداد فعلی
- Upload موقت به Route Handler
- عدم ذخیرهٔ تصویر خام به‌صورت پیش‌فرض
- خروجی Provider فقط Identity/Ingredients/Confidence
- Resolve نهایی به IFKB/FNDDS/SR
- رد کامل Calories/Macros/Portions مدل

### ۵.۷ PWA و Offline

Offline در دو سطح ساخته می‌شود:

1. **App shell:** صفحه‌های اصلی، فونت، Icon و Assetهای حیاتی
2. **Product data:** snapshot نسخه‌دار Catalog، Draftها و Mutation queue در IndexedDB

Offline کامل از روز اول ساخته نمی‌شود. ابتدا Online UX و Data contract پایدار می‌شوند؛ سپس:

- جست‌وجوی Catalog آفلاین
- ثبت Diary در صف محلی
- Sync بعد از بازگشت اتصال
- Conflict policy بر اساس `updated_at` و operation id
- نمایش واضح وضعیت Offline/Syncing/Failed

به Background Sync مرورگر به‌عنوان تنها مکانیزم اتکا نمی‌شود؛ صف هنگام Focus/Online/Reload نیز تخلیه خواهد شد.

## ۶. اصول UI/UX فارسی

### ۶.۱ قواعد پایه

- فارسی Locale پیش‌فرض است.
- Navigation، ترتیب Icon/Text و Gestureها در RTL طراحی می‌شوند.
- اندازهٔ Targetهای لمسی حداقل ۴۴ پیکسل است.
- متن پایه کمتر از ۱۶ پیکسل نیست.
- Form label همیشه بالای ورودی است و Placeholder جای Label را نمی‌گیرد.
- استفاده از Cardهای تو در تو محدود می‌شود.
- اطلاعات مهم امروز در یک صفحه و بدون Scroll طولانی در دسترس است.
- CTA اصلی هر صفحه فقط یک مورد است.
- اعداد تغذیه با واحد واضح و Typography tabular نمایش داده می‌شوند.
- Empty state، Loading، Error و Offline state برای هر Flow طراحی می‌شوند.

### ۶.۲ Navigation پیشنهادی موبایل

Bottom navigation با حداکثر پنج مقصد:

1. امروز
2. تغذیه
3. تمرین
4. پیشرفت
5. تنظیمات

Quick action ثبت غذا از صفحهٔ امروز و تغذیه در دسترس است؛ برای ثبت معمولی نباید کاربر وارد چند صفحه شود.

### ۶.۳ صفحه‌های بحرانی برای تأیید UX

قبل از ساخت Backend کامل، این پنج Flow با دادهٔ واقعی IFKB ساخته و تأیید می‌شوند:

1. صفحهٔ امروز
2. جست‌وجو و انتخاب غذا
3. ثبت مقدار/Portion و افزودن به Diary
4. برنامهٔ غذایی هفتگی
5. Settings شامل زبان، Theme و AvalAI

## ۷. مراحل توسعه

## Stage 0 — ثبت Pivot و Freeze نسخهٔ Native

**هدف:** جلوگیری از ادامهٔ مسیر اشتباه و حفظ دستاوردها.

خروجی‌ها:

- همین Roadmap
- `docs/DEVELOPMENT_HANDOFF.md`
- به‌روزرسانی Root README
- ثبت Mobile به‌عنوان frozen reference
- ثبت Head و CI معتبر
- تعیین Branch strategy وب

معیار پایان:

- اسناد با وضعیت واقعی ریپو همخوان باشند.
- هیچ ابهامی دربارهٔ Source of truth و قدم بعدی وجود نداشته باشد.

## Stage 1 — Product/UX Foundation فارسی

**هدف:** حل مسئلهٔ اصلی قبل از Backend.

کارها:

- Information architecture
- Design tokens، Type scale، Spacing، Radius، Elevation
- RTL primitives و Layout shell
- Bottom navigation
- پنج Flow بحرانی با دادهٔ واقعی IFKB و Mock user data
- حالت‌های Loading/Error/Empty/Offline
- تست عرض‌های ۳۶۰، ۳۹۰ و ۴۱۲ پیکسل
- تست فارسی و انگلیسی بدون تغییر جهت ناقص

معیار پایان:

- پنج Flow بدون Backend قابل استفاده باشند.
- هیچ overflow افقی یا ترتیب LTR ناخواسته وجود نداشته باشد.
- ثبت یک غذا از Home حداکثر در دو انتقال صفحه انجام شود.
- UI توسط مالک محصول تأیید شود.

**Anti-goal:** ساخت Auth، RLS و Sync قبل از تأیید این Gate.

## Stage 2 — Next.js PWA Foundation و Vercel Preview

**هدف:** ساخت پایهٔ Production-grade بدون منطق محصول اضافی.

کارها:

- ایجاد `web/`
- Next.js App Router + TypeScript strict
- Manifest، Iconها و Installability
- Service worker برای App shell
- Error boundary و loading boundary
- i18n و RTL root
- Unit/component/e2e smoke
- Preview deployment روی Vercel
- Environment separation برای Development/Preview/Production

معیار پایان:

- Install روی Android و iOS ممکن باشد.
- تمام PRها Preview URL داشته باشند.
- Build، lint، typecheck و smoke test سبز باشند.

## Stage 3 — استخراج Nutrition Core و Parity

**هدف:** استفاده از کار علمی موجود بدون وابستگی به React Native/SQLite.

کارها:

- استخراج منطق خالص به `packages/nutrition-core`
- حفظ تمام Typeها و ID semantics
- Adapter برای دادهٔ Supabase/JSON
- اجرای تست‌های arithmetic، portion، recipe، goals و search
- مقایسهٔ خروجی با Mobile RC
- تولید release snapshot وب از IFKB فعلی

معیار پایان:

- ورودی یکسان در Mobile و Web خروجی تغذیه‌ای یکسان بدهد.
- هیچ تغییر بدون نسخه در Canonical ID یا fingerprint رخ ندهد.

## Stage 4 — Supabase Foundation

**هدف:** Backend امن و حداقلی.

پیش‌شرط:

- تأیید Organization، Region و هزینهٔ پروژهٔ جدید Supabase
- عدم استفاده از پروژه‌های قبلی بدون تصمیم صریح

کارها:

- ساخت پروژهٔ جدید NeoFit
- SQL migrations نسخه‌دار
- Auth با Email OTP/Magic Link
- RLS تمام جدول‌های خصوصی
- Public read policy برای Catalog release
- Seed نسخه‌دار Catalog
- Type generation
- Security/Performance advisors
- Preview/Production environment mapping

معیار پایان:

- تست ثابت کند کاربر A هیچ داده‌ای از کاربر B نمی‌بیند یا تغییر نمی‌دهد.
- Service role در Browser وجود نداشته باشد.
- Catalog version و counts با Freeze فعلی برابر باشند.

## Stage 5 — Nutrition Product Vertical Slice

**هدف:** یک محصول روزانهٔ واقعی، نه مجموعه‌ای از صفحه‌های نمایشی.

دامنه:

- Onboarding/Profile
- Today dashboard
- Persian food search
- Portion/grams logging
- Diary
- Favorites/Recents
- Goals
- Recipes
- History و Export JSON/CSV
- Settings و Theme

معیار پایان:

- کاربر از Signup تا ثبت غذا، دیدن Progress و Export داده یک Flow کامل دارد.
- تمام Nutrition values از Core و Catalog می‌آیند.
- هیچ Nutrition AI-generated ذخیره نمی‌شود.

## Stage 6 — AvalAI، Vision و Plan Generation امن

**هدف:** بازگرداندن قابلیت‌های AI با مرز امنیتی و علمی صحیح.

کارها:

- ذخیرهٔ رمز‌شدهٔ BYOK
- Test/Replace/Delete key
- Route Handlerهای احراز هویت‌شده
- Rate limiting و bounded retry
- Vision consent و image preparation
- Identity resolver
- Weekly plan generation
- Resolve همهٔ Ingredients قبل از Save
- یک Repair pass کنترل‌شده
- Audit بدون ذخیرهٔ Secret یا Raw provider response

معیار پایان:

- Ingredient حل‌نشده باعث Reject کامل Plan شود.
- Provider nutrition در تست‌ها عمداً تزریق و سپس حذف شود.
- Raw AvalAI key در Browser storage، DB plaintext و Log دیده نشود.

## Stage 7 — Offline Catalog و Sync

**هدف:** PWA در شرایط شبکهٔ ضعیف قابل استفاده بماند.

کارها:

- IndexedDB schema
- Versioned catalog snapshot
- Persian local search
- Draft persistence
- Diary mutation queue
- Retry/Conflict policy
- Online/Offline status UX
- Cache invalidation با catalog release

معیار پایان:

- Catalog search و ثبت موقت Diary در Airplane mode کار کند.
- پس از اتصال، عملیات بدون Duplicate sync شوند.
- تغییر Catalog release دادهٔ شخصی را خراب نکند.

## Stage 8 — Migration، Backup و Recovery

**هدف:** کاربر و داده به معماری جدید قفل نشوند.

کارها:

- JSON export/import نسخه‌دار
- Transactional import
- Merge و Replace
- Rollback روی فایل نامعتبر
- ابزار یک‌باره برای تبدیل Backup قدیمی NeoFit در صورت نیاز
- تست دادهٔ حجیم و Conflict
- حذف Secretها و Cache از Backup

معیار پایان:

- Export → Delete account data → Import نتیجهٔ معادل تولید کند.
- Import خراب هیچ دادهٔ موجودی را تغییر ندهد.

## Stage 9 — Release Candidate وب

**هدف:** آماده‌کردن PWA برای استفادهٔ واقعی.

کارها:

- QA روی حداقل دو Android و یک iPhone/Safari
- RTL/LTR visual regression
- Accessibility keyboard/screen reader
- Performance profiling
- Security review و Supabase advisors
- Privacy و data deletion flow
- Production Vercel deployment
- Domain و PWA install QA
- README/Handoff نهایی
- سامان‌دهی PRها و تعیین Branch پیش‌فرض

معیار پایان:

- LCP کمتر از ۲.۵ ثانیه در مسیرهای اصلی تحت شرایط هدف
- INP کمتر از ۲۰۰ میلی‌ثانیه
- CLS کمتر از ۰.۱
- Accessibility score هدف حداقل ۹۵
- بدون RLS finding بحرانی
- Startup، Search، Log، AI، Backup و Offline روی دستگاه واقعی پاس شوند.

## ۸. ترتیب دقیق اجرا

ترتیب باید ثابت بماند:

1. Stage 0 اسناد و Freeze
2. Stage 1 UX فارسی با دادهٔ واقعی
3. Stage 2 PWA/Vercel foundation
4. Stage 3 استخراج Core
5. Stage 4 Supabase
6. Stage 5 Vertical slice
7. Stage 6 AI/Vision
8. Stage 7 Offline
9. Stage 8 Migration/Recovery
10. Stage 9 RC

Supabase قبل از تأیید UX ساخته نمی‌شود. Offline sync قبل از تثبیت Data contract ساخته نمی‌شود. AI قبل از امنیت BYOK و Catalog resolution وارد محصول نمی‌شود.

## ۹. استراتژی Branch و PR

- شاخهٔ Mobile فعلی به‌عنوان مرجع حفظ می‌شود.
- پس از Merge این Plan، شاخهٔ `web/pwa-foundation` از Head فعلی ساخته می‌شود.
- هر Stage در PR مستقل و قابل مرور اجرا می‌شود.
- PR شمارهٔ ۳ به‌عنوان تاریخچهٔ Mobile/IFKB نگهداری می‌شود و محل توسعهٔ وب نخواهد بود.
- PRهای وب نباید دوباره به یک PR چندصد Commit تبدیل شوند.
- هر PR باید یک Definition of Done روشن، Preview و Evidence داشته باشد.

## ۱۰. قدم دقیق بعدی

پس از Merge این Plan، کار از **Stage 1 — Product/UX Foundation فارسی** آغاز می‌شود.

اولین Batch اجرایی:

1. ایجاد `web/` فقط با Shell و دادهٔ Mock/IFKB
2. ساخت Design tokenها
3. اعمال RTL در Root
4. ساخت Navigation موبایل
5. پیاده‌سازی صفحهٔ «امروز»
6. پیاده‌سازی Search و Food picker
7. پیاده‌سازی Log meal sheet
8. پیاده‌سازی Weekly plan screen
9. پیاده‌سازی Settings/AvalAI mock
10. Visual QA و تأیید مالک محصول

تا تأیید این Batch، پروژهٔ Supabase جدید ایجاد و Schema محصول پیاده‌سازی نمی‌شود.

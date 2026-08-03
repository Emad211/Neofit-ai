# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۳ اوت ۲۰۲۶ — پایان Batch 1 از Stage 1

## روش استفاده

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. وضعیت واقعی branch، HEAD، PR، CI، Vercel و Supabase بررسی شود.
4. فقط قدم بعدی اثبات‌شده اجرا شود.

در پایان هر نوبت یک Entry جدید باید شامل موارد زیر افزوده شود:

- زمان و تاریخ
- شاخه و Head شروع
- هدف نوبت
- کارهای انجام‌شده
- فایل‌ها و Commitها
- تست‌ها و CI
- مشکلات و Fixها
- کارهای انجام‌نشده
- تصمیم‌ها
- Head پایان
- قدم بعدی دقیق

هیچ موردی بدون شواهد «تمام‌شده» علامت نمی‌خورد.

---

## نمای کلی مراحل

| Stage | عنوان | وضعیت | شواهد اصلی |
|---|---|---|---|
| 0 | Pivot و Freeze نسخهٔ Native | انجام‌شده | PR #12، commit `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | پایهٔ محصول و UX فارسی/RTL | فعال؛ Batch 1 آمادهٔ بازبینی | PR #13، CI `30826619384` |
| 2 | PWA و Vercel foundation | شروع‌نشده | — |
| 3 | استخراج Nutrition Core و parity | شروع‌نشده | — |
| 4 | Supabase foundation | شروع‌نشده | — |
| 5 | Nutrition vertical slice | شروع‌نشده | — |
| 6 | AvalAI، Vision و Plan generation | شروع‌نشده | — |
| 7 | Offline catalog و Sync | شروع‌نشده | — |
| 8 | Migration، Backup و Recovery | شروع‌نشده | — |
| 9 | Web Release Candidate | شروع‌نشده | — |

---

## Entry 000 — بازسازی وضعیت پیش از شروع توسعهٔ وب

**تاریخ:** ۳ اوت ۲۰۲۶  
**شاخهٔ مرجع:** `agent/iranian-food-kb-foundation`  
**Head محصول Native/IFKB:** `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

### وضعیت اثبات‌شده

- APK Android نصب و Startup آن پس از رفع دو مشکل SQLite/Seed موفق شد.
- Mobile CI run 573 روی Head مرجع پاس شد.
- Nutrition RC، IFKB، Stage 7، Stage 8 و Schema/ID freeze در شاخهٔ مرجع حضور دارند.
- UI/UX نسخهٔ Native و تجربهٔ فارسی/RTL از سوی مالک محصول رد شد.

### تصمیم

- UI اصلی به Next.js PWA مهاجرت می‌کند.
- Mobile حذف نمی‌شود و Frozen reference می‌ماند.
- Supabase برای Auth/Postgres/RLS/Sync استفاده خواهد شد، نه برای جایگزینی Nutrition Core.
- Vercel میزبان Web و Route Handlerهای امن خواهد بود.

### زیرساخت موجود

- دسترسی ابزار به Vercel و Supabase برقرار است.
- NeoFit هنوز Project اختصاصی در Vercel یا Supabase ندارد.
- پروژه‌های موجود بدون تصمیم صریح reuse نمی‌شوند.

### شواهد ثبت مسیر

- PR #12: `Plan NeoFit Persian-first PWA pivot`
- Merge commit: `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Issue #10: Roadmap مادر
- Issue #11: Stage 1
- Branch integration: `web/pwa-foundation`

### قدم بعدی ثبت‌شده

ساخت دو سند دائمی و آغاز Stage 1.

---

## Entry 001 — Stage 1 / Batch 1: Persian RTL UX prototype

**تاریخ/زمان شروع:** ۳ اوت ۲۰۲۶، ۱۸:۲۷ ایران  
**شاخهٔ شروع:** `web/pwa-foundation`  
**Head شروع:** `151de2c0d5c9b02602c2f89eb4df808653cdd74e`  
**شاخهٔ اجرا:** `stage1/persian-rtl-ux`

### هدف نوبت

1. ساخت پلن مادر و دفتر پیشرفت دائمی.
2. ساخت شاخه و PR محدود Stage 1.
3. ایجاد اولین Vertical prototype فارسی و RTL.
4. ساخت Today، Search، Meal logging، Weekly plan و Settings.
5. اجرای TypeScript و Production build.
6. ثبت وضعیت در هر دو سند مرجع.

### کارهای انجام‌شده

#### اسناد دائمی

- `docs/NEOFIT_MASTER_PLAN.md` ایجاد و در پایان به‌روزرسانی شد.
- `docs/NEOFIT_PROGRESS_LOG.md` ایجاد و در پایان به‌روزرسانی شد.
- پروتکل خواندن و نوشتن این دو فایل در هر نوبت ثبت شد.

#### Web foundation

- `web/package.json`
- `web/tsconfig.json`
- `web/next-env.d.ts`
- `web/next.config.ts`
- `web/app/layout.tsx`
- `web/app/page.tsx`
- `web/app/globals.css`
- `web/components/neofit-prototype.tsx`
- `web/data/fixtures.ts`
- `web/README.md`
- `.github/workflows/web-stage1-ci.yml`

#### UX پیاده‌شده

- Root فارسی با `lang="fa"` و `dir="rtl"`
- Design tokenها و CSS Mobile-first
- Bottom navigation با امروز، تغذیه، تمرین، پیشرفت و تنظیمات
- Today dashboard با Calorie progress، Macro bars و Timeline وعده‌ها
- Quick action ثبت غذا
- Persian food search با Fixtureهای واقعی‌شکل IFKB
- Search empty state
- Meal logging bottom sheet
- Portion stepper و Meal type selection
- افزودن غذا به State امروز و محاسبهٔ جدید UI
- Weekly plan با برچسب IFKB
- Settings mock برای Language، Theme و AvalAI key
- Loading، Empty، Error و Offline visual states
- Responsive rules برای ۳۶۰، ۳۹۰ و ۴۱۲px

### منبع Fixtureها

مقادیر نمونه از کاتالوگ نسخه‌دار موجود در:

`mobile/src/data/iranian-food-seed.ts`

نمونه‌ها شامل قورمه‌سبزی، چلو سفید، کباب کوبیده، جوجه کباب، آش رشته و تخم‌مرغ آب‌پز هستند. هیچ Nutrition از مدل AI ساخته نشده است.

### Branch و PR

- Branch: `stage1/persian-rtl-ux`
- PR: #13 — `Stage 1: Persian RTL NeoFit UX prototype`
- Product code head پیش از آپدیت اسناد: `ad9620419b79eecf08068400a6df8f90b902d5c4`
- Commit آپدیت پلن مادر: `c63e24ad840006cb9cf8fad0af0cf344ad28284b`
- Head پایان این Entry: Commit همین فایل

### تست و CI

Workflow:

- `Web Stage 1 CI`
- Run ID: `30826619384`

نتیجه:

- Install dependencies: پاس
- Persian RTL contract: پاس
- TypeScript strict: پاس
- Next.js production build: پاس

### مشکل پیدا‌شده و Fix

#### ناسازگاری TypeScript 7 با Next.js Build

اولین CI:

- Run ID: `30826514546`
- RTL contract: پاس
- TypeScript CLI: پاس
- Production build: شکست

علت:

- Next.js 16.2.12 هنوز Compiler API موردنیاز را از TypeScript 7.0.2 دریافت نمی‌کند.

تصمیم:

- گزینهٔ آزمایشی `experimental.useTypeScriptCli` فعال نشد.
- TypeScript روی نسخهٔ سازگار `6.0.3` قفل شد.
- CI دوم کامل پاس شد.

### کارهای انجام‌نشده

- Screenshot واقعی در عرض‌های ۳۶۰، ۳۹۰ و ۴۱۲px ثبت نشده است.
- مالک محصول هنوز UX را تأیید یا رد نکرده است.
- Vazirmatn هنوز به‌صورت self-hosted بسته‌بندی نشده است.
- Vercel Preview ساخته نشده است.
- Supabase، Auth و Backend عمداً ساخته نشده‌اند.
- AvalAI فقط Mock UI است و کلید ذخیره نمی‌شود.
- Workout و Progress در این Batch ساختاری/Placeholder هستند.
- PWA manifest و Service Worker مربوط به Stage 2 هستند.

### تصمیم‌های نوبت

- PR #13 پیش از تأیید مالک محصول Merge نمی‌شود.
- Supabase پیش از بسته‌شدن Gate UX Stage 1 ساخته نمی‌شود.
- Nutrition fixtureها باید همچنان از Source موجود بیایند.
- TypeScript 6.0.3 تا پشتیبانی استاندارد Next.js از TypeScript 7 حفظ می‌شود.

### وضعیت پایان نوبت

- Stage 1 همچنان فعال است.
- Batch 1 از نظر کد و Build آمادهٔ بازبینی است.
- PR #13 باز است.
- هیچ زیرساخت خارجی جدیدی ایجاد نشده است.

### قدم بعدی دقیق

1. مالک محصول ظاهر و Flowهای PR #13 را بررسی کند.
2. بازخوردهای UI/UX در همان PR اعمال شوند.
3. Screenshotهای سه عرض هدف تولید و ثبت شوند.
4. Vazirmatn self-hosted اضافه شود.
5. بعد از تأیید، PR #13 به `web/pwa-foundation` Merge شود.
6. Stage 2 با Manifest، Service Worker و Vercel Preview آغاز شود.

---

## آخرین نقطهٔ قابل ادامه

در نوبت بعد، ابتدا این فایل و پلن مادر خوانده شوند؛ سپس PR #13 و آخرین Head بررسی شود. اگر بازخورد مالک محصول وجود داشت، همان بازخورد اولویت مطلق است. اگر بازخورد جدیدی نبود، قدم بعدی ثبت Screenshot/visual QA و self-hosted font است، نه Supabase.

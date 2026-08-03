# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۳ اوت ۲۰۲۶ — پایان Visual QA و Refinement شمارهٔ ۱ از Stage 1

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
- Head کد پایان
- قدم بعدی دقیق

هیچ موردی بدون شواهد «تمام‌شده» علامت نمی‌خورد.

---

## نمای کلی مراحل

| Stage | عنوان | وضعیت | شواهد اصلی |
|---|---|---|---|
| 0 | Pivot و Freeze نسخهٔ Native | انجام‌شده | PR #12، commit `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | پایهٔ محصول و UX فارسی/RTL | فعال؛ Refinement 1 آمادهٔ بازبینی | PR #13، CI `30829629853`، Artifact `8862378720` |
| 2 | PWA و Vercel foundation | شروع‌نشده | منتظر Accept Stage 1 |
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

- APK Android پس از رفع دو مشکل SQLite/Seed نصب و اجرا شد.
- Mobile CI run 573 پاس شد.
- Nutrition RC، IFKB، Stage 7، Stage 8 و Schema/ID freeze در شاخهٔ مرجع حضور دارند.
- UI/UX نسخهٔ Native و تجربهٔ فارسی/RTL از سوی مالک محصول رد شد.

### تصمیم

- UI اصلی به Next.js PWA مهاجرت می‌کند.
- Mobile حذف نمی‌شود و Frozen reference می‌ماند.
- Supabase برای Auth/Postgres/RLS/Sync استفاده خواهد شد، نه برای جایگزینی Nutrition Core.
- Vercel میزبان Web و Route Handlerهای امن خواهد بود.

### شواهد ثبت مسیر

- PR #12: `Plan NeoFit Persian-first PWA pivot`
- Merge commit: `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Issue #10: Roadmap مادر
- Issue #11: Stage 1
- Branch integration: `web/pwa-foundation`

### قدم بعدی ثبت‌شده

ساخت دو سند دائمی، سپس شروع Stage 1 با Next.js shell، RTL root، Design tokens، Today و Food logging prototype.

---

## Entry 001 — ایجاد دو سند دائمی و Batch اول Stage 1

**تاریخ/زمان شروع:** ۳ اوت ۲۰۲۶، ۱۸:۲۷ ایران  
**شاخهٔ شروع:** `web/pwa-foundation`  
**Head شروع:** `151de2c0d5c9b02602c2f89eb4df808653cdd74e`

### هدف

1. ایجاد پلن مادر و دفتر پیشرفت.
2. ایجاد شاخهٔ متمرکز Stage 1.
3. ساخت اولین Vertical prototype فارسی/RTL.
4. اجرای TypeScript و Production build.

### انجام‌شده

- `docs/NEOFIT_MASTER_PLAN.md` ساخته شد.
- `docs/NEOFIT_PROGRESS_LOG.md` ساخته شد.
- شاخهٔ `stage1/persian-rtl-ux` ایجاد شد.
- PR #13 باز شد.
- `web/` با Next.js App Router و TypeScript strict ساخته شد.
- Today، Nutrition search، Meal sheet، Weekly plan، Settings و حالت‌های Loading/Empty/Error/Offline ساخته شدند.
- fixtureهای غذا از کاتالوگ نسخه‌دار موجود برداشت شدند.
- Supabase، Auth، AI واقعی و Sync وارد نشدند.

### مشکل Build و Fix

- Build اول با TypeScript 7 شکست خورد، چون Next.js 16.2.12 Compiler API مورد نیاز را دریافت نمی‌کرد.
- TypeScript به نسخهٔ سازگار `6.0.3` قفل شد.
- CI run `30827034439` پاس شد.

### Head کد پایان Batch 1

`0833131c64fd284ac52106ee2ff0f22644fb6de9`

### قدم بعدی ثبت‌شده

Visual QA واقعی در عرض‌های ۳۶۰، ۳۹۰ و ۴۱۲ پیکسل، اصلاح ظاهر و تعامل، سپس بازبینی مالک محصول.

---

## Entry 002 — Visual QA واقعی و Refinement شمارهٔ ۱

**تاریخ/زمان شروع:** ۳ اوت ۲۰۲۶، حدود ۱۹:۰۵ ایران  
**شاخه:** `stage1/persian-rtl-ux`  
**PR:** #13  
**Head شروع:** `0833131c64fd284ac52106ee2ff0f22644fb6de9`

### هدف نوبت

1. خواندن کامل پلن مادر و دفتر پیشرفت.
2. اجرای قدم بعدی ثبت‌شده به‌جای شروع Stage یا Backend جدید.
3. تولید Screenshot واقعی از Build در عرض‌های هدف.
4. بازبینی بصری، رفع نقص‌های قابل مشاهده و قفل‌کردن Regressionها.
5. به‌روزرسانی دوبارهٔ همین دو فایل.

### Visual QA Baseline

CI به Playwright مجهز شد و موارد زیر را ثبت کرد:

- Today در عرض ۳۶۰px
- Today در عرض ۳۹۰px
- Today در عرض ۴۱۲px
- Nutrition در ۳۹۰px
- Search نتیجهٔ «قورمه»
- Meal logging sheet
- Weekly plan
- Settings

#### Run و Artifact پایه

- Run: `30828652896`
- Artifact: `8861979601`
- Artifact digest: `sha256:c63346d505f7d9e52755aa67ad87847d6d13011ae1aed5affb5ebf6979c0cdfb`

### مشکلاتی که از تصویر واقعی پیدا شدند

1. Banner توسعهٔ «بدون Backend» در همهٔ صفحه‌ها بیش از حد برجسته بود و سلسله‌مراتب محصول را خراب می‌کرد.
2. صفحات داخلی عنوان واقعی خود را داشتند، اما Topbar دوباره عنوان عمومی/تکراری نشان می‌داد.
3. CSS نام Vazirmatn را داشت، ولی فونت واقعاً Self-host نشده بود و Browser از fallback استفاده می‌کرد.
4. Full-page screenshot با Bottom Navigation ثابت تصویر گمراه‌کننده تولید می‌کرد.
5. مهم‌ترین باگ: پس از Scroll در Weekly plan و ورود به Settings از Bottom Navigation، موقعیت Scroll حفظ می‌شد و Settings ظاهراً خالی دیده می‌شد.

### Fixهای اعمال‌شده

#### Visual evidence pipeline

- `@playwright/test` نسخهٔ `1.61.1` اضافه شد.
- `web/scripts/capture-stage1.mjs` ساخته شد.
- CI Chromium نصب و Screenshot Artifact تولید می‌کند.
- عرض سند و Body با viewport مقایسه می‌شوند.
- `lang=fa` و `dir=rtl` در Runtime بررسی می‌شوند.
- Screenshotها از viewport واقعی گرفته می‌شوند، نه Full page گمراه‌کننده.
- Weekly plan lower state و AvalAI settings section جداگانه ثبت می‌شوند.

#### Typography و hierarchy

- `@fontsource-variable/vazirmatn` نسخهٔ `5.3.0` به‌صورت Self-hosted اضافه شد.
- Layout فایل فونت را مستقیم import می‌کند.
- `web/app/refinements.css` ساخته شد.
- Banner توسعه از مسیر اصلی UI حذف شد.
- عنوان تکراری Topbar در صفحات داخلی پنهان شد.
- فاصله‌ها، Shadow، خط‌ارتفاع و عرض ۳۶۰px اصلاح شدند.
- فضای پایین محتوا برای Bottom Navigation تقویت شد.

#### Navigation bug

- با `useEffect` روی تغییر `screen`، `window.scrollTo({top: 0})` اجرا می‌شود.
- Visual test پس از ورود به Settings منتظر `scrollY === 0` می‌ماند.
- CI قرارداد وجود Scroll reset را نیز بررسی می‌کند.

### Commitهای مهم این نوبت

- `36cd12b71b56991dff238ad9b98521e0e72445c4` — افزودن Playwright visual capture
- `5b79cabaf48f768a551a92568c93f308e549baf5` — Script ثبت Screenshotها
- `d6040dbf86c16308ef18da692215f43699598a09` — Visual QA در CI
- `73fb924af3b9514e0371a63c5d16f0c7f7c19b00` — Self-hosted Vazirmatn dependency
- `89070fc4322c6b5a871f4c8534f81d2adb481112` — Font و refinements import
- `be3f97f88ce324c812e9d2b9857b5b537f9c8a54` — Persian visual refinements
- `19b419e21b221043385d1e567dba239366fb7e2b` — realistic viewport captures
- `b987db40a9378c6fb09a728b347e2cb17360c2a5` — Scroll reset fix
- `dcebb969e7f91685eda4c84f3b0d753a3892cadd` — Scroll regression test
- `489394eceea5b1f6cd9adec5dc8487cc250f1061` — CI contracts for font/navigation

### Validation نهایی

#### CI

- Run: `30829629853`
- Status: success
- RTL/navigation contract: pass
- TypeScript strict: pass
- Next.js Production build: pass
- Chromium install: pass
- Visual capture: pass
- Artifact upload: pass

#### Visual Artifact

- Artifact ID: `8862378720`
- Digest: `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`

#### Runtime results

- ۳۶۰px: document/body width = viewport؛ overflow ندارد
- ۳۹۰px: document/body width = viewport؛ overflow ندارد
- ۴۱۲px: document/body width = viewport؛ overflow ندارد
- Nutrition/Search/Meal sheet/Weekly plan/Settings: overflow ندارند
- Root locale در همهٔ Captureها `fa` و `rtl` است
- Settings پس از Navigation با `scrollY = 0` نمایش داده می‌شود

### کارهای انجام‌نشده

- PR #13 هنوز Merge نشده است.
- تأیید بصری مالک محصول هنوز ثبت نشده است.
- Vercel Project/Preview هنوز ساخته نشده است.
- PWA Manifest و Service Worker هنوز ساخته نشده‌اند.
- Supabase، Auth، AI واقعی و Sync هنوز شروع نشده‌اند.
- صفحهٔ تمرین و Progress هنوز در سطح Placeholder/UX state هستند.

### تصمیم‌های این نوبت

- Visual QA بخشی دائمی از Web CI باقی می‌ماند.
- Font فارسی باید داخل Build باشد و به Font نصب‌شدهٔ سیستم وابسته نباشد.
- تغییر Bottom Navigation باید Scroll reset داشته باشد.
- Stage 1 بدون تأیید مالک محصول تمام نمی‌شود.
- PR #13 پیش از آن Merge نمی‌شود.

### Head کد تأییدشدهٔ پایان نوبت

`489394eceea5b1f6cd9adec5dc8487cc250f1061`

### قدم بعدی دقیق

مالک محصول Screenshotهای نهایی Stage 1 را بررسی می‌کند:

- Accept → PR #13 Merge و Stage 2 آغاز می‌شود.
- Refine → ایرادها به‌صورت صفحه/جزء مشخص ثبت و Refinement دوم در همین PR انجام می‌شود.

تا این تصمیم، Supabase و Vercel Project ساخته نمی‌شوند.

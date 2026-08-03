# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 2، پیش از Vercel Preview

## روش استفاده

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. وضعیت واقعی branch، HEAD، PR، CI، Vercel و Supabase بررسی شود.
4. فقط قدم بعدی اثبات‌شده اجرا شود.

در پایان هر نوبت یک Entry جدید باید شامل موارد زیر افزوده شود:

- تاریخ و زمان
- شاخه و Head شروع
- هدف نوبت
- کارهای انجام‌شده
- فایل‌ها و Commitها
- تست‌ها و CI
- مشکلات و Fixها
- محدودیت‌های خارجی
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
| 1 | پایهٔ محصول و UX فارسی/RTL | انجام‌شده و پذیرفته‌شده | PR #13، merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2 | PWA و Vercel foundation | فعال؛ کد و CI سبز، Preview منتظر Reset سهمیه | PR #15، CI `30851823020`, Artifact `8870912815` |
| 3 | استخراج Nutrition Core و parity | شروع‌نشده | منتظر پایان Stage 2 |
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
**Head Native/IFKB:** `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

### وضعیت اثبات‌شده

- APK Android پس از Fixهای SQLite/Seed نصب و اجرا شد.
- Mobile CI run 573 پاس شد.
- Nutrition RC، IFKB، Stage 7، Stage 8 و Schema/ID freeze وجود داشتند.
- UI/UX Native و فارسی/RTL از سوی مالک محصول رد شد.

### تصمیم

- UI اصلی به Next.js PWA مهاجرت می‌کند.
- Mobile به‌عنوان Frozen reference باقی می‌ماند.
- Supabase برای Auth/Postgres/RLS/Sync خواهد بود، نه جایگزین Nutrition Core.
- Vercel میزبان Web و Route Handlerهای امن خواهد بود.

### شواهد

- PR #12
- Merge: `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Issue #10
- Issue #11
- Branch: `web/pwa-foundation`

### قدم بعدی ثبت‌شده

ساخت پلن مادر و دفتر پیشرفت، سپس Stage 1 فارسی/RTL.

---

## Entry 001 — Batch اول Stage 1

**تاریخ:** ۳ اوت ۲۰۲۶  
**شاخه:** `stage1/persian-rtl-ux`  
**Head شروع:** `151de2c0d5c9b02602c2f89eb4df808653cdd74e`

### انجام‌شده

- دو سند دائمی ایجاد شدند.
- PR #13 باز شد.
- `web/` با Next.js App Router و TypeScript strict ساخته شد.
- Today، Nutrition Search، Meal Sheet، Weekly Plan، Settings و stateهای اصلی ساخته شدند.
- Fixtureهای تغذیه از کاتالوگ نسخه‌دار گرفته شدند.
- Supabase/Auth/AI واقعی وارد نشدند.

### مشکل و Fix

- TypeScript 7 با Compiler API مورد نیاز Next.js 16.2.12 ناسازگار بود.
- TypeScript روی `6.0.3` قفل شد.
- CI run `30827034439` پاس شد.

### Head پایان

`0833131c64fd284ac52106ee2ff0f22644fb6de9`

### قدم بعدی

Visual QA در ۳۶۰، ۳۹۰ و ۴۱۲px و اصلاح مبتنی بر تصویر واقعی.

---

## Entry 002 — Visual QA و Refinement شمارهٔ ۱

**تاریخ:** ۳ اوت ۲۰۲۶  
**شاخه:** `stage1/persian-rtl-ux`  
**PR:** #13  
**Head شروع:** `0833131c64fd284ac52106ee2ff0f22644fb6de9`

### مشکلات کشف‌شده از Screenshot واقعی

1. Banner توسعه بیش از حد برجسته بود.
2. Topbar در صفحات داخلی عنوان تکراری داشت.
3. Vazirmatn فقط در CSS نام برده شده بود و Self-hosted نبود.
4. Full-page Screenshot با Bottom Navigation ثابت گمراه‌کننده بود.
5. Scroll از Weekly Plan هنگام ورود به Settings حفظ می‌شد و صفحه خالی به نظر می‌رسید.

### Fixها

- Playwright Visual QA اضافه شد.
- Vazirmatn variable Self-hosted شد.
- hierarchy و spacing اصلاح شدند.
- Screenshotها viewport-based شدند.
- Scroll reset روی تغییر Screen اضافه و Regression-tested شد.

### Commitهای مهم

- `36cd12b71b56991dff238ad9b98521e0e72445c4`
- `5b79cabaf48f768a551a92568c93f308e549baf5`
- `d6040dbf86c16308ef18da692215f43699598a09`
- `73fb924af3b9514e0371a63c5d16f0c7f7c19b00`
- `89070fc4322c6b5a871f4c8534f81d2adb481112`
- `be3f97f88ce324c812e9d2b9857b5b537f9c8a54`
- `19b419e21b221043385d1e567dba239366fb7e2b`
- `b987db40a9378c6fb09a728b347e2cb17360c2a5`
- `dcebb969e7f91685eda4c84f3b0d753a3892cadd`
- `489394eceea5b1f6cd9adec5dc8487cc250f1061`

### Validation

- CI: `30829629853` — success
- Artifact: `8862378720`
- Digest: `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`
- همهٔ مسیرهای ثبت‌شده بدون Horizontal overflow
- Root locale: `fa` و `rtl`
- Settings بعد از Navigation: `scrollY = 0`

### نتیجه

مالک محصول Stage 1 را پذیرفت.

---

## Entry 003 — پذیرش Stage 1 و آغاز Stage 2

**تاریخ/زمان شروع:** ۳ اوت ۲۰۲۶، حدود ۲۳:۳۰ ایران  
**شاخهٔ شروع:** `stage1/persian-rtl-ux`  
**Head شروع:** `e18855d69f8cffeb8703c08a99687c1dddb735f2`

### هدف

1. ثبت Accept مالک محصول.
2. Merge Stage 1.
3. ایجاد Stage 2 مستقل.
4. ساخت PWA foundation و Web CI دائمی.
5. ایجاد Preview واقعی Vercel پیش از Merge.

### Stage 1 بسته شد

- PR #13 Squash Merge شد.
- Merge commit: `a458a27a2685bfa7d85ea28686b3182c3167d747`
- Issue #11 با state reason `completed` بسته شد.

### Stage 2 ایجاد شد

- Branch: `stage2/pwa-vercel-foundation`
- Issue: #14
- PR: #15
- Base: `web/pwa-foundation`

### قابلیت‌های ساخته‌شده

#### Manifest و Iconها

- `web/app/manifest.ts`
- `web/scripts/generate-icons.mjs`
- Iconهای 192، 512، Maskable و Apple touch
- تولید deterministic PNG بدون وابستگی خارجی Runtime

#### Service Worker و Offline

- `web/public/sw.js`
- `web/components/pwa-register.tsx`
- App-shell cache نسخه‌دار
- Offline reload
- Offline fallback route
- Exclusion صریح:
  - `/api/*`
  - `/auth/*`
  - درخواست غیر-GET
  - Cross-origin
  - Authorization header

#### Boundaries و UX سیستمی

- `web/app/loading.tsx`
- `web/app/error.tsx`
- `web/app/global-error.tsx`
- `web/app/not-found.tsx`
- `web/app/offline/page.tsx`
- `web/app/system-pages.css`

#### Environment و Vercel

- `web/lib/environment.ts`
- `web/.env.example`
- `web/vercel.json`
- URL واقعی از `NEXT_PUBLIC_APP_URL`، `VERCEL_PROJECT_PRODUCTION_URL` یا `VERCEL_URL`
- `metadataBase` متصل به URL Deployment

#### CI و QA

- Workflow موقت Stage 1 حذف شد.
- `.github/workflows/web-ci.yml` ساخته شد.
- `web/scripts/verify-pwa.mjs` ساخته شد.
- Visual regression Stage 1 حفظ شد.
- Runtime PWA gate اضافه شد.
- Source bundle تمیز و Hash‌شده برای Vercel تولید می‌شود.

### CIهای مهم

#### اولین PWA validation

- Run: `30849445243`
- Head: `7ab2d6b5e58bea3cae90cc2fac01a308e74044db`
- Artifact: `8870015510`
- Status: success

#### Environment/Vercel URL validation

- Run: `30851310543`
- Head: `6ab9d61b58bbdf6bdf12d929cab171d28579d866`
- Status: success

#### Final source-bundle validation

- Run: `30851823020`
- Head: `d2330392e9bf8326c55a3ba94cde0a468d124efa`
- Status: success
- Artifact: `8870912815`
- Artifact digest: `sha256:52b24dbfe0e08faf6871595139d2908762fc010b0abd527f78cb9c79db212380`

### Runtime PWA result

- Manifest name: `نئوفیت — تغذیه و تمرین`
- Manifest: `standalone`, `fa`, `rtl`
- Icon 192: valid
- Icon 512: valid
- Maskable 512: valid
- Apple touch 180: valid
- Service Worker: `activated`
- Scope: `/`
- Page controlled after reload: yes
- Offline reload: pass
- Offline root locale: `fa`, `rtl`
- Cached request count: 19 App-shell/static requests
- Cached `/api` requests: zero
- Visual regression 360/390/412: pass

### Reproducible deployment source

CI یک Source bundle تمیز تولید می‌کند و موارد زیر را حذف می‌کند:

- `node_modules`
- `.next`
- `artifacts`
- `.env*`
- `tsconfig.tsbuildinfo`

بسته با SHA-256 داخل Artifact ذخیره می‌شود تا Vercel از همان Source سبز Deploy شود.

### مانع Vercel

فراخوانی واقعی Vercel Deployment انجام شد، اما Vercel پاسخ `402 payment_required` داد؛ علت، پایان سهمیهٔ روزانهٔ API Deployment پلن رایگان بود:

- code: `api-deployments-free-per-day`
- total: `100`
- remaining: `0`
- reset timestamp: `1785875907001`
- زمان تبدیل‌شده: `2026-08-05 00:08:27 +03:30`

این خطا قبل از Build Vercel رخ داد و نشانهٔ شکست کد نیست. هیچ Project ID، Deployment ID یا Preview URL ساخته نشد.

### کارهای انجام‌نشده

- Vercel Project/Preview هنوز ساخته نشده است.
- Build روی Vercel هنوز اجرا نشده است.
- HTTPS Preview PWA verification هنوز انجام نشده است.
- PR #15 Merge نشده است.
- Issue #14 باز است.
- Stage 3 شروع نشده است.
- Supabase ساخته نشده است.

### تصمیم‌ها

- Stage 2 بدون URL و Deployment ID واقعی بسته نمی‌شود.
- PR #15 تا Preview verification Merge نمی‌شود.
- Stage 3 و Supabase جلو نمی‌افتند.
- Retry باید پس از Reset سهمیه و از Source bundle سبز انجام شود.

### Head کد تأییدشدهٔ پایان نوبت

`d2330392e9bf8326c55a3ba94cde0a468d124efa`

### قدم بعدی دقیق

پس از `2026-08-05 00:08:27 +03:30`:

1. دو سند اجباری دوباره خوانده شوند.
2. PR #15 و Head سبز بررسی شوند.
3. آخرین Artifact و Source bundle دریافت شوند.
4. Preview پروژهٔ `neofit-ai` روی Vercel ساخته شود.
5. Project ID، Deployment ID و URL ثبت شوند.
6. Build log بررسی شود.
7. Manifest، Iconها، Service Worker، Offline reload، RTL و Cache boundary روی HTTPS Preview تست شوند.
8. در صورت موفقیت، دو سند Update، PR #15 Merge و Issue #14 بسته شود.
9. در صورت شکست، خطای دقیق ثبت و Fix شود.

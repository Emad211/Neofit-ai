# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — اصلاح وضعیت Vercel و بستن P1 Fresh-install Offline

## روش استفاده

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. وضعیت واقعی branch، HEAD، PR، CI، Vercel و Supabase بررسی شود.
4. فقط قدم بعدی اثبات‌شده اجرا شود.

در پایان هر نوبت یک Entry شامل تاریخ، هدف، Commitها، تست‌ها، مشکلات، Correctionها، Head پایان و Exact continuation point اضافه می‌شود.

هیچ موردی بدون شواهد «تمام‌شده» علامت نمی‌خورد.

---

## نمای کلی مراحل

| Stage | عنوان | وضعیت | شواهد اصلی |
|---|---|---|---|
| 0 | Pivot و Freeze نسخهٔ Native | انجام‌شده | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | پایهٔ محصول و UX فارسی/RTL | انجام‌شده و پذیرفته‌شده | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2 | PWA و Vercel Foundation | فعال؛ PWA سبز، Preview باقی‌مانده | PR #15، CI `30853438059`، Artifact `8871529505` |
| 3 | Nutrition Core parity | شروع‌نشده | منتظر پایان Stage 2 |
| 4 | Supabase Foundation | شروع‌نشده | — |
| 5 | Nutrition vertical slice | شروع‌نشده | — |
| 6 | AvalAI/Vision | شروع‌نشده | — |
| 7 | Offline catalog/Sync | شروع‌نشده | — |
| 8 | Migration/Recovery | شروع‌نشده | — |
| 9 | Web RC | شروع‌نشده | — |

---

## Entry 000 — بازسازی وضعیت پیش از وب

**تاریخ:** ۳ اوت ۲۰۲۶  
**مرجع Native/IFKB:** `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

- Android پس از Fixهای SQLite/Seed اجرا شد.
- IFKB/Nutrition RC حفظ شد.
- UI Native از سوی مالک محصول رد شد.
- تصمیم مهاجرت به Next.js PWA، Vercel و Supabase ثبت شد.
- PR #12 با Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` مسیر جدید را تثبیت کرد.

---

## Entry 001 — Batch اول Stage 1

**تاریخ:** ۳ اوت ۲۰۲۶  
**Branch:** `stage1/persian-rtl-ux`

- دو سند دائمی ساخته شدند.
- `web/` با Next.js App Router و TypeScript strict ایجاد شد.
- Today، Nutrition Search، Meal Sheet، Weekly Plan و Settings ساخته شدند.
- TypeScript 7 با Next.js ناسازگار بود؛ روی `6.0.3` قفل شد.
- CI `30827034439` پاس شد.

---

## Entry 002 — Visual QA و Refinement Stage 1

**تاریخ:** ۳ اوت ۲۰۲۶

مشکلات واقعی Screenshot:

- Banner توسعهٔ برجسته
- عنوان تکراری Topbar
- Vazirmatn غیرواقعی/fallback
- Full-page Screenshot گمراه‌کننده
- حفظ Scroll هنگام Navigation

Fixها:

- Playwright Visual QA
- Vazirmatn Self-hosted
- اصلاح hierarchy/spacing
- Screenshotهای viewport-based
- Scroll reset و Regression test

شواهد:

- CI `30829629853` — success
- Artifact `8862378720`
- Digest `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`
- Visual QA در ۳۶۰/۳۹۰/۴۱۲px بدون Overflow

مالک محصول Stage 1 را پذیرفت.

---

## Entry 003 — Merge Stage 1 و ساخت PWA Foundation

**تاریخ:** ۳ تا ۴ اوت ۲۰۲۶  
**Merge Stage 1:** `a458a27a2685bfa7d85ea28686b3182c3167d747`  
**Branch:** `stage2/pwa-vercel-foundation`  
**Issue:** #14  
**PR:** #15

### ساخته‌شده

- Manifest فارسی/RTL و Standalone
- Icon generator و Iconهای 192/512/Maskable/Apple
- Service Worker App shell
- API/Auth/Authorization/Mutation/Cross-origin exclusion
- Offline fallback
- Loading/Error/Global error/404
- Environment contract
- `vercel.json`
- Web CI دائمی
- PWA Runtime verification
- Source bundle Hash‌شده

### Validation اولیه

- CI `30849445243` — success
- Artifact `8870015510`
- Manifest/Icon/Service Worker/Offline/API exclusion پاس شدند.

### ادعای نادرست ثبت‌شده در این Entry

در پایان این نوبت، پاسخ `api-deployments-free-per-day` با اعداد 100/0 و زمان Reset به‌عنوان مانع Vercel ثبت شد. این ادعا در Entry 004 بازبینی و بازپس گرفته شد، زیرا در بررسی مجدد از پاسخ خام Vercel قابل‌بازتولید نبود.

---

## Entry 004 — Correction وضعیت Vercel و بستن P1 Offline

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۰:۳۲ تا ۰۰:۴۵ ایران  
**Branch:** `stage2/pwa-vercel-foundation`  
**PR:** #15  
**Head شروع:** `4f5cf90513d1a71869474eba81eeba640068ab6c`

### هدف

1. پاسخ دقیق به تردید مالک دربارهٔ سهمیه و اتصال Vercel.
2. بازتولید مستقیم وضعیت اتصال و Deploy.
3. اصلاح تمام ادعاهای اثبات‌نشده.
4. بررسی و رفع Review P1 قبل از Deploy.
5. به‌روزرسانی دو سند اجباری.

### وضعیت واقعی Vercel که مستقیم اثبات شد

- اتصال Connector برقرار است.
- Team: `Emad's projects`
- Team ID: `team_BsUv0VprkU4YjdFbQi2hZCEm`
- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Framework: `null`
- `latestDeployment`: `null`
- Deployment count: `0`
- Domain: ندارد

بنابراین عبارت قبلی «Project هنوز ساخته نشده» نادرست بود.

### Correction سهمیه

فراخوانی قابل‌بازتولید `deploy_to_vercel` این خطا را برگرداند:

- Action در Schema عمومی بدون Argument است.
- Runtime ورودی‌های `target`، `name` و `files` را اجباری می‌داند.

خطای سهمیهٔ روزانه در بررسی مجدد بازتولید نشد. در نتیجه:

- ادعای سهمیه بازپس گرفته شد.
- PR #15 اصلاح شد.
- Issue #14 Correction دریافت کرد.
- Automation مبتنی بر Reset سهمیه غیرفعال شد.
- مانع فعلی به‌عنوان **Connector schema mismatch** ثبت شد.

### P1 کشف‌شده در Review

Review خودکار نشان داد تست قبلی Offline پس از یک Reload آنلاین اجرا می‌شد و می‌توانست نبودن JS/CSS/Font در Precache را با HTTP cache مرورگر پنهان کند.

### Fix فنی

Commit `40d07107da46f239da9c95404b0f02b5fe662b94`:

- Service Worker cache version به `v2` ارتقا یافت.
- هنگام Install، `/` و `/offline` Fetch می‌شوند.
- Assetهای `/_next/static/` از HTML استخراج می‌شوند.
- Dependencyهای Font/Media از CSS recursively استخراج و Cache می‌شوند.
- JS، CSS و Font پیش از اولین Offline reload در Cache Storage قرار می‌گیرند.

Commit `0bb0278f50312819029445c20dd5823ee8c719ed`:

- Reload آنلاین واسط حذف شد.
- تست منتظر `clients.claim()` و controller روی Client اولیه می‌ماند.
- وجود JS/CSS/Font در Cache assert می‌شود.
- HTTP cache Chromium با CDP پاک می‌شود.
- Browser مستقیم Offline و Reload می‌شود.
- تعامل React در حالت Offline با مسیر Today → Nutrition → Today تست می‌شود.
- API cache count باید صفر بماند.

### شواهد نهایی این Correction

- Web CI run: `30853438059`
- Status: success
- Artifact: `8871529505`
- Digest: `sha256:7f50f89a15c37871bbafda95d3cea6e105ab5c0a344f9f408b5f5fe787823c77`
- TypeScript: pass
- Production build: pass
- JS/CSS/Font precache: pass
- Fresh-install Offline با HTTP cache خالی: pass
- Offline React navigation: pass
- Cached `/api`: zero
- Review thread `PRRT_kwDOThqnVM6WHFMC`: resolved

### وضعیت انجام‌نشده

- هیچ Deployment واقعی Vercel وجود ندارد.
- Deployment ID و Preview URL نداریم.
- Framework پروژهٔ Vercel هنوز configure نشده است.
- PR #15 Merge نشده است.
- Issue #14 باز است.
- Stage 3 و Supabase آغاز نشده‌اند.

### تصمیم‌ها

- سهمیهٔ Vercel بدون پاسخ خام قابل‌بازتولید دوباره ادعا نمی‌شود.
- اتصال Vercel برقرار است؛ مشکل فعلی Deploy action Schema است.
- Stage 2 بدون Preview واقعی بسته نمی‌شود.
- P1 Offline قبل از Deploy بسته شد.

### Head کد تأییدشده

`0bb0278f50312819029445c20dd5823ee8c719ed`

### Exact continuation point

1. پلن مادر و این دفتر خوانده شوند.
2. PR #15 و آخرین Web CI بررسی شوند.
3. Project `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG` و Deployment count دوباره خوانده شوند.
4. Schema صحیح Action Deploy یا یک مسیر رسمی دیگر که Connector واقعاً پشتیبانی می‌کند کشف شود.
5. آخرین Source bundle سبز به Preview Deploy شود.
6. Deployment ID، URL، Build/Runtime logs ثبت شوند.
7. HTTPS Manifest، Iconها، Service Worker، Fresh-install Offline و Cache boundary تست شوند.
8. فقط در صورت پاس کامل، دو سند Update، PR #15 Merge و Issue #14 بسته شود.
9. Stage 3 و Supabase پیش از آن شروع نشوند.

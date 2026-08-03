# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — تصمیم تفکیک Stage 2A/2B

## روش اجباری استفاده

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. وضعیت واقعی Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase بررسی شود.
4. فقط قدم بعدی ثبت‌شده اجرا شود.

در پایان هر نوبت، Entry جدید باید هدف، شواهد، Commitها، تست‌ها، مشکلات، تصمیم‌ها و Exact continuation point را ثبت کند.

---

## نمای کلی مراحل

| Stage | عنوان | وضعیت | شواهد اصلی |
|---|---|---|---|
| 0 | Pivot و Freeze | انجام‌شده | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | UX فارسی/RTL | انجام‌شده و پذیرفته‌شده | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | PWA Code Foundation | آمادهٔ Merge | PR #15، CI `30853827867` |
| 2B | Vercel Preview/HTTPS validation | تعویق‌شده و باز | Issue #16 |
| 3 | Nutrition Core parity | مرحلهٔ بعد | پس از Merge PR #15 |
| 4 | Supabase Foundation | شروع‌نشده | منتظر Core parity و تأیید هزینه |
| 5 | Nutrition vertical slice | شروع‌نشده | — |
| 6 | AvalAI/Vision | شروع‌نشده | — |
| 7 | Offline catalog/Sync | شروع‌نشده | — |
| 8 | Migration/Recovery | شروع‌نشده | — |
| 9 | Web RC | شروع‌نشده | Issue #16 باید قبل از RC بسته شود |

---

## Entry 000 — بازسازی وضعیت پیش از وب

**تاریخ:** ۳ اوت ۲۰۲۶  
**مرجع Native/IFKB:** `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

- Android پس از Fixهای SQLite/Seed اجرا شد.
- IFKB و Nutrition RC به‌عنوان دارایی علمی حفظ شدند.
- UX Native از سوی مالک محصول رد شد.
- مهاجرت به Next.js PWA، Vercel و Supabase ثبت شد.
- PR #12 مسیر جدید را با Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` تثبیت کرد.

---

## Entry 001 — Batch اول Stage 1

**تاریخ:** ۳ اوت ۲۰۲۶  
**Branch:** `stage1/persian-rtl-ux`

- دو سند دائمی ساخته شدند.
- `web/` با Next.js App Router و TypeScript strict ساخته شد.
- Today، Nutrition Search، Meal Sheet، Weekly Plan و Settings ساخته شدند.
- TypeScript روی نسخهٔ سازگار `6.0.3` قفل شد.
- CI `30827034439` پاس شد.

---

## Entry 002 — Visual QA و پذیرش Stage 1

مشکلات کشف‌شده:

- Banner توسعهٔ برجسته
- عنوان تکراری
- فونت fallback
- Screenshot گمراه‌کننده
- حفظ Scroll هنگام Navigation

Fixها:

- Playwright Visual QA
- Vazirmatn Self-hosted
- hierarchy و spacing اصلاح‌شده
- Screenshotهای viewport-based
- Scroll reset و Regression test

شواهد:

- CI `30829629853` — success
- Artifact `8862378720`
- Digest `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`
- Visual QA در ۳۶۰/۳۹۰/۴۱۲px بدون Overflow

مالک محصول Stage 1 را پذیرفت و PR #13 با Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` بسته شد.

---

## Entry 003 — ساخت Stage 2 PWA Foundation

**تاریخ:** ۳ تا ۴ اوت ۲۰۲۶  
**Branch:** `stage2/pwa-vercel-foundation`  
**Issue:** #14  
**PR:** #15

ساخته‌شده:

- Manifest فارسی/RTL و Standalone
- Icon generator و Iconهای 192/512/Maskable/Apple
- Service Worker App shell
- API/Auth/Authorization/Mutation/Cross-origin exclusion
- Offline fallback و system boundaries
- Environment contract و `vercel.json`
- Web CI و PWA Runtime verification
- Source bundle Hash‌شده

Validation اولیه:

- CI `30849445243` — success
- Artifact `8870015510`

در پایان این Entry یک خطای سهمیهٔ Vercel به‌صورت قطعی ثبت شد؛ Entry 004 آن را بازبینی و اصلاح کرد.

---

## Entry 004 — Correction Vercel و بستن P1 Offline

**تاریخ:** ۴ اوت ۲۰۲۶  
**Head شروع:** `4f5cf90513d1a71869474eba81eeba640068ab6c`

وضعیت واقعی Vercel:

- اتصال برقرار
- Team: `Emad's projects`
- Team ID: `team_BsUv0VprkU4YjdFbQi2hZCEm`
- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Framework: `null`
- `latestDeployment`: `null`
- Deployment count: `0`
- Domain: ندارد

Correction:

- خطای سهمیه در بررسی مجدد قابل‌بازتولید نبود و ادعای قطعی آن بازپس گرفته شد.
- مانع قابل‌بازتولید، ناسازگاری Schema در `deploy_to_vercel` بود.
- Automation مبتنی بر Reset سهمیه غیرفعال شد.

P1 Review:

تست قبلی می‌توانست به HTTP cache مرورگر متکی باشد و Assetهای Build را در Fresh install واقعاً Precache نکند.

Fixها:

- `40d07107da46f239da9c95404b0f02b5fe662b94`: Service Worker v2، استخراج و Precache گراف HTML/JS/CSS/Font
- `0bb0278f50312819029445c20dd5823ee8c719ed`: حذف Reload آنلاین واسط، پاک‌کردن HTTP cache و تست مستقیم Offline React

شواهد:

- Web CI `30853438059` — success
- Artifact `8871529505`
- Digest `sha256:7f50f89a15c37871bbafda95d3cea6e105ab5c0a344f9f408b5f5fe787823c77`
- JS/CSS/Font precache: pass
- Fresh-install Offline: pass
- Offline React navigation: pass
- Cached `/api`: zero
- Review thread `PRRT_kwDOThqnVM6WHFMC`: resolved

آخرین CI روی Head مستندات پیش از تصمیم جدید:

- Head: `351ee467c8dac026b3166f05b0996ec4bfe3aa39`
- Web CI: `30853827867` — success

---

## Entry 005 — تفکیک Stage 2 و آزادکردن مسیر Stage 3

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۱:۱۱ ایران  
**Branch:** `stage2/pwa-vercel-foundation`  
**PR:** #15  
**Head شروع:** `351ee467c8dac026b3166f05b0996ec4bfe3aa39`

### درخواست و تصمیم مالک

مالک محصول خواست Vercel فعلاً کنار گذاشته شود و توسعهٔ باقی بخش‌ها ادامه پیدا کند، با الزام ثبت دقیق تمام تصمیم‌ها و شواهد.

### بازسازی واقعی پیش از تصمیم

- هر دو سند کامل خوانده شدند.
- PR #15 باز، Mergeable و غیر Draft بود.
- Head: `351ee467c8dac026b3166f05b0996ec4bfe3aa39`
- Web CI `30853827867`: success
- تنها Review thread موجود resolved و outdated بود.
- هیچ Deployment واقعی Vercel وجود نداشت.

### تصمیم معماری/فرآیندی

Stage 2 به دو بخش تقسیم شد:

1. **Stage 2A — PWA Code Foundation**
   - مستقل از Hosting
   - تمام تست‌های کد و Runtime محلی پاس شده‌اند
   - PR #15 می‌تواند Merge شود

2. **Stage 2B — Vercel Preview و HTTPS validation**
   - در Issue #16 مستقل و باز ثبت شد
   - هیچ Deployment موفقی ادعا نمی‌شود
   - باید پیش از Web RC بسته شود
   - دیگر Stage 3 را Block نمی‌کند

### Issue جدید

- Issue #16: `Deferred: Vercel Preview deployment and HTTPS PWA validation`
- Vercel Project ID، وضعیت صفر Deployment و شواهد لازم برای بستن Gate در آن ثبت شد.

### تغییر پلن مادر

- Anti-goal «شروع Stage 3 پیش از Vercel» حذف شد.
- Stage 2A/2B به‌صورت مستقل تعریف شدند.
- Stage 3 به‌عنوان قدم بعدی فعال ثبت شد.
- Supabase همچنان تا پایان Core parity ممنوع ماند.

### کارهای باقیماندهٔ همین Entry

- اجرای CI روی Commitهای مستندات جدید
- Merge PR #15
- بستن Issue #14 به‌عنوان Stage 2A completed
- باز نگه‌داشتن Issue #16
- ساخت Issue و Branch Stage 3
- Inventory واقعی Nutrition Core از Mobile/IFKB

### Exact continuation point

1. CI آخرین Head اسناد بررسی شود.
2. PR #15 با expected head Merge شود.
3. Issue #14 با شواهد PWA Foundation بسته شود.
4. Branch جدید Stage 3 از Merge commit ساخته شود.
5. Issue Stage 3 با Definition of Done و Non-goal روشن ساخته شود.
6. قبل از هر extraction، فایل‌ها، توابع، تست‌ها، precision policy و وابستگی‌های Mobile/IFKB Inventory شوند.
7. Batch اول Stage 3 فقط Boundary، types، Golden fixtures و parity harness باشد.
8. در پایان همان نوبت هر دو سند با Merge SHA و وضعیت Stage 3 دوباره Update شوند.

**Supabase، Auth و AI واقعی هنوز شروع نمی‌شوند.**
# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 1 Golden parity

## روش اجباری استفاده

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزارهای واقعی بررسی شوند.
4. فقط Exact continuation point ثبت‌شده اجرا شود.

در پایان هر نوبت، Entry جدید باید هدف، شواهد، Commitها، تست‌ها، مشکلات، تصمیم‌ها و نقطهٔ ادامه را ثبت کند.

---

## نمای کلی مراحل

| Stage | عنوان | وضعیت | شواهد اصلی |
|---|---|---|---|
| 0 | Pivot و Freeze | انجام‌شده | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | UX فارسی/RTL | انجام‌شده و پذیرفته‌شده | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | PWA Code Foundation | انجام‌شده | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | Vercel Preview/HTTPS | تعویق‌شده و باز | Issue #16 |
| 3 | Nutrition Core parity | فعال؛ Batch 1 سبز | Issue #17، PR #18، CI `30856939220` |
| 4 | Supabase Foundation | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
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
- PR #12 مسیر جدید را تثبیت کرد.

---

## Entry 001 — Batch اول Stage 1

**تاریخ:** ۳ اوت ۲۰۲۶  
**Branch:** `stage1/persian-rtl-ux`

- دو سند دائمی ساخته شدند.
- `web/` با Next.js App Router و TypeScript strict ساخته شد.
- Today، Nutrition Search، Meal Sheet، Weekly Plan و Settings ساخته شدند.
- TypeScript روی `6.0.3` قفل شد.
- CI `30827034439` پاس شد.

---

## Entry 002 — Visual QA و پذیرش Stage 1

مشکلات واقعی:

- Banner توسعهٔ برجسته
- عنوان تکراری
- فونت fallback
- Screenshot گمراه‌کننده
- حفظ Scroll هنگام Navigation

Fixها:

- Playwright Visual QA
- Vazirmatn Self-hosted
- hierarchy/spacing اصلاح‌شده
- Screenshotهای viewport-based
- Scroll reset و Regression test

شواهد:

- CI `30829629853` — success
- Artifact `8862378720`
- Digest `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`
- Visual QA در ۳۶۰/۳۹۰/۴۱۲px بدون Overflow

Stage 1 پذیرفته و PR #13 با Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` بسته شد.

---

## Entry 003 — ساخت Stage 2 PWA Foundation

**تاریخ:** ۳ تا ۴ اوت ۲۰۲۶  
**Branch:** `stage2/pwa-vercel-foundation`  
**Issue:** #14  
**PR:** #15

ساخته‌شده:

- Manifest فارسی/RTL و Standalone
- Icon generator و Iconهای PWA
- Service Worker app shell
- API/Auth/Authorization/Mutation/Cross-origin exclusion
- Offline/system boundaries
- Environment contract و `vercel.json`
- Web CI، PWA Runtime verification و Source bundle

Validation اولیه:

- CI `30849445243` — success
- Artifact `8870015510`

یک خطای سهمیهٔ Vercel به‌صورت قطعی ثبت شد که Entry 004 آن را اصلاح کرد.

---

## Entry 004 — Correction Vercel و بستن P1 Offline

**تاریخ:** ۴ اوت ۲۰۲۶

وضعیت مستقیم Vercel:

- Team: `Emad's projects`
- Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Deployment count: صفر
- `latestDeployment`: null

Correction:

- خطای سهمیه در بررسی مجدد قابل‌بازتولید نبود و ادعای قطعی آن بازپس گرفته شد.
- مانع قابل‌بازتولید، ناسازگاری Schema در `deploy_to_vercel` بود.
- Automation مربوط به Reset غیرفعال شد.

P1 Offline:

- `40d07107da46f239da9c95404b0f02b5fe662b94`: Precache گراف HTML/JS/CSS/Font
- `0bb0278f50312819029445c20dd5823ee8c719ed`: تست مستقیم Fresh-install Offline با HTTP cache خالی

شواهد:

- Web CI `30853438059` — success
- Artifact `8871529505`
- Digest `sha256:7f50f89a15c37871bbafda95d3cea6e105ab5c0a344f9f408b5f5fe787823c77`
- Offline React navigation: pass
- Cached `/api`: zero
- Review P1: resolved

---

## Entry 005 — تفکیک Stage 2A/2B و Merge PWA

**تاریخ:** ۴ اوت ۲۰۲۶  
**درخواست مالک:** Vercel فعلاً کنار گذاشته شود و توسعهٔ مستقل ادامه پیدا کند.

تصمیم:

- Stage 2A: PWA Code Foundation
- Stage 2B: Vercel Preview/HTTPS validation

اقدام‌ها:

- Issue #16 برای Stage 2B ساخته شد و باز ماند.
- Final Stage 2A CI `30856060076` پاس شد.
- PR #15 با Merge commit `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` وارد `web/pwa-foundation` شد.
- Issue #14 completed بسته شد.
- Stage 2B دیگر Stage 3 را Block نمی‌کند، ولی پیش از Web RC اجباری است.

---

## Entry 006 — Stage 3 Batch 1: Pure Core و Golden parity

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۱:۲۰ تا ۰۱:۳۰ ایران  
**Issue:** #17  
**Branch:** `stage3/nutrition-core-parity`  
**PR:** #18  
**Branch base:** `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`  
**Head پیاده‌سازی پیش از اسناد:** `f11b1ec84355d1311ce53d877163ec66b965611f`

### هدف

1. Inventory واقعی Mobile/IFKB قبل از Extraction.
2. تعیین Pure-domain boundary.
3. ساخت Package مستقل بدون ابزار Monorepo سنگین.
4. قفل‌کردن Golden behavior و numeric/missing policy.
5. اثبات Parity در CI.

### Authority خوانده‌شده

- `docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`
- `mobile/README.md`
- `mobile/tsconfig.json`
- `mobile/src/nutrition-core/index.ts`
- `types.ts`, `nutrition.ts`, `recipe.ts`, `diary.ts`, `goals.ts`
- `search.ts`, `catalog-release.ts`, `catalog-provenance.ts`
- `legacy-catalog-adapter.ts`
- `universal-catalog-ranking.ts`
- `universal-food-estimate.ts`
- `mobile/tests/nutrition-core.test.ts`

### یافتهٔ معماری مهم

Mobile از قبل `mobile/src/nutrition-core/` دارد. بنابراین Stage 3 بازنویسی نیست؛ Extraction کنترل‌شده و اثبات Parity است.

ماژول‌های Batch 1 هیچ وابستگی به React، React Native، Expo، SQLite، UI، فایل‌سیستم یا شبکه ندارند:

- `types`
- `nutrition`
- `recipe`
- `diary`
- `goals`

Search، ranking، provenance، release، legacy adapter و Universal estimate خالص‌اند، اما برای جلوگیری از PR بزرگ به Batchهای بعد منتقل شدند.

### Numeric policy ثبت‌شده

- canonicalization: ۱۵ رقم معنادار
- display rounding جداگانه
- `-0` به صفر
- per-100g basis دقیقاً 100g
- Gram calculation با وزن نامعلوم fail-closed

### Missing policy ثبت‌شده

- absence یعنی unknown، نه zero
- وزن نامعلوم `null`
- strict aggregate با nutrient ناقص آن nutrient را حذف می‌کند
- Recipe/Diary وزن نامعلوم را propagate می‌کنند
- Goal progress برای consumed نامعلوم ratio/remaining را null نگه می‌دارد

### فایل‌های ساخته‌شده

- `docs/NEOFIT_NUTRITION_CORE_AUTHORITY_MAP.md`
- `packages/nutrition-core/package.json`
- `packages/nutrition-core/tsconfig.json`
- `packages/nutrition-core/README.md`
- `packages/nutrition-core/src/index.ts`
- `packages/nutrition-core/src/types.ts`
- `packages/nutrition-core/src/nutrition.ts`
- `packages/nutrition-core/src/recipe.ts`
- `packages/nutrition-core/src/diary.ts`
- `packages/nutrition-core/src/goals.ts`
- `packages/nutrition-core/tests/mobile-rc-golden-v1.ts`
- `packages/nutrition-core/tests/parity.test.ts`
- `.github/workflows/nutrition-core-ci.yml`

### Source provenance قفل‌شده

- Frozen reference head: `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`
- Mobile golden test Blob: `2291e1958efe5e17010230c5864c9fadc9bc47ba`
- Types Blob: `55e0100964e32b392493dd604a12e0f845b7e5e7`
- Nutrition Blob: `53ac392d69f351e145f51db140dd5701cdcbaeab`
- Recipe Blob: `51784eb1a522eda8bee5b4ba394b67844c04db6c`
- Diary Blob: `e297eed728a7457b9b46529a761e450bd647e97d`
- Goals Blob: `16a2d91dfa173f88f3d56b26ce58aa679df25cf3`

### CI و Parity

- Run: `30856939220`
- Status: success
- Artifact: `8872828407`
- Digest: `sha256:c064cd3d53a1f7b31ad12eeb2f11c54a8a098acce3f768a3ae12c53904ada24a`
- Pure dependency boundary: pass
- TypeScript strict: pass
- Tests: 10
- Pass: 10
- Fail: 0
- Skip: 0

Golden scenarios شامل Portion/modifier، وزن نامعلوم، fail-closed grams، recipe، diary، missing nutrients، goal modes و ۱۵-digit canonicalization هستند.

### مشکلات/محدودیت‌ها

- Sparse checkout محلی به‌دلیل DNS محیط اجرا نشد؛ Inventory از GitHub Contents API متصل انجام شد.
- Search/ranking و SQLite equivalence هنوز Extract نشده‌اند.
- Web هنوز از Package جدید استفاده نمی‌کند.
- Stage 3 کامل نشده و Issue #17 باز می‌ماند.
- Supabase، Auth و AI واقعی شروع نشده‌اند.

### تصمیم‌ها

- Batchهای Stage 3 کوچک و مستقل Merge می‌شوند.
- اختلاف با Mobile باید Fail/Parity report شود؛ silent fix ممنوع است.
- Search/Ranking بدون Golden corpus وارد Package نمی‌شود.
- Web adapter فقط پس از تکمیل Pure Core ساخته می‌شود.

### Exact continuation point

1. CI اسناد روی Head جدید PR #18 بررسی شود.
2. PR #18 با expected head Merge شود.
3. Issue #17 باز بماند و Batch 1 completed ثبت شود.
4. Branch Batch 2 از Merge commit ساخته شود.
5. Persian Search authority و benchmark manifests خوانده شوند.
6. Golden corpus برای normalization، modifiers، aliases و SR/FNDDS ranking ساخته شود.
7. `search.ts` و `universal-catalog-ranking.ts` فقط پس از سبزشدن Golden parity منتقل شوند.
8. هر دو سند در پایان Batch 2 دوباره Update شوند.

**Issue #16 باز است. Supabase، Auth و AI واقعی هنوز ممنوع‌اند.**
# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 2 initial parity

## پروتکل

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. Branch/HEAD/PR/Issue/CI/Review/Vercel/Supabase از منبع واقعی بررسی شود.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت باید هدف، شواهد، Commitها، تست‌ها، مشکلات، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 — Pivot/Freeze | انجام‌شده | PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 — Persian RTL UX | انجام‌شده و پذیرفته‌شده | PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A — PWA code | انجام‌شده | PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B — Vercel HTTPS | تعویق‌شده | Issue #16؛ محدودیت روزانه با Vercel bot تأیید شده |
| 3 — Nutrition Core parity | فعال؛ Batch 1 merged، Batch 2 سبز | Issue #17، PR #19 |
| 4 — Supabase | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
| 5–9 | شروع‌نشده | طبق پلن مادر |

---

## Entry 000 — بازسازی Native/IFKB و Pivot

**تاریخ:** ۳ اوت ۲۰۲۶  
**مرجع:** `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

- Nutrition RC و IFKB حفظ شدند.
- UX Native رد شد و Web/PWA pivot ثبت شد.
- PR #12 مسیر جدید را Merge کرد.

---

## Entry 001 — Stage 1 Batch 1

- دو سند دائمی ساخته شدند.
- Next.js App Router، TypeScript strict، Today، Search، Meal sheet، Plan و Settings ساخته شدند.
- TypeScript روی `6.0.3` قفل شد.
- CI `30827034439` پاس شد.

---

## Entry 002 — Visual QA و پذیرش Stage 1

Fixهای واقعی:

- حذف Banner توسعه و عنوان تکراری
- Vazirmatn self-hosted
- viewport screenshots
- Scroll reset و Regression test

شواهد:

- CI `30829629853`
- Artifact `8862378720`
- Digest `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`
- 360/390/412px بدون overflow
- Merge Stage 1: `a458a27a2685bfa7d85ea28686b3182c3167d747`

---

## Entry 003 — Stage 2 PWA Foundation

ساخته‌شده:

- Persian RTL manifest
- deterministic icons
- Service Worker
- offline/system boundaries
- environment contract و `vercel.json`
- Web CI و PWA runtime verification

Initial CI `30849445243` پاس شد.

---

## Entry 004 — Offline P1 و Vercel correction

Vercel state:

- Team `Emad's projects`
- Project `neofit-ai`
- ID `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Deployment count صفر

P1 Service Worker:

- Build asset graph در Install precache شد.
- Browser HTTP cache قبل از Offline test پاک شد.
- Offline React navigation تست شد.

شواهد:

- Web CI `30853438059`
- Artifact `8871529505`
- Digest `sha256:7f50f89a15c37871bbafda95d3cea6e105ab5c0a344f9f408b5f5fe787823c77`

بعداً `vercel[bot]` مستقیماً خطای `api-deployments-free-per-day` با «more than 100» را ثبت کرد؛ این مدرک در Issue #16 نگه‌داری می‌شود.

---

## Entry 005 — تفکیک Stage 2A/2B

درخواست مالک: Vercel فعلاً مانع سایر توسعه نباشد.

- Stage 2A PWA code با PR #15 و Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` بسته شد.
- Issue #14 بسته شد.
- Stage 2B در Issue #16 باز ماند و پیش‌شرط Web RC است.

---

## Entry 006 — Stage 3 Batch 1: Pure arithmetic/domain

**Issue:** #17  
**Branch:** `stage3/nutrition-core-parity`  
**PR:** #18

Authority:

- Frozen Mobile head `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`
- Mobile test Blob `2291e1958efe5e17010230c5864c9fadc9bc47ba`

Extracted:

- types
- nutrition arithmetic
- recipe
- diary
- goals
- schema version 1
- AST pure-boundary verifier

Policies:

- 15-significant-digit canonicalization
- display rounding separate
- missing != zero
- unknown grams = null
- fail-closed gram basis

Review fixes:

- Regex boundary replaced by TypeScript AST parser covering static/side-effect/dynamic/CommonJS/re-export imports.
- stale handoff documents corrected.

Final evidence:

- final head `7861c4f56f0474b61d8dd9b3a7101e6b616b524d`
- Nutrition Core CI `30857715438`
- Artifact `8873108322`
- Digest `sha256:de0197b9ae9762a921a32c13071701064863aef8e77e612fb2e35bd49893d25f`
- Web CI `30857715413`
- 10/10 tests pass
- PR #18 Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`

---

## Entry 007 — Stage 3 Batch 2: Controlled Persian Search/Ranking

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۱:۵۰ ایران  
**Branch:** `stage3/search-ranking-parity`  
**PR:** #19  
**Base:** `c9599c4905f9fc1d28ba7e9086edf20376991740`  
**Initial green head:** `a7807a212315feca656c4ed88dd746cb6be752ce`

### هدف

1. استخراج دقیق Persian normalization، modifiers و local search.
2. استخراج Alias routing و Universal SR/FNDDS ranking.
3. Freeze کردن ادعای Controlled benchmark و جلوگیری از ادعای Natural NLU.
4. ساخت Golden subset نماینده از Release رسمی.

### Authority خوانده‌شده

- `mobile/src/nutrition-core/search.ts`
  - Blob `bb99c934beeed5094da7e0a29a8f53635ace48b3`
- `mobile/src/nutrition-core/universal-catalog-ranking.ts`
  - Blob `9b23b1ef7d6817ff2b946e1fdedcad76608279e1`
- `mobile/tests/nutrition-core.test.ts`
  - Blob `2291e1958efe5e17010230c5864c9fadc9bc47ba`
- Alias registry
  - Blob `94429b1937edc6234b23fc8398531b531a891cc2`
- Search workflow
  - Blob `a398cfe3feb493c17721bbf6ea59e1f81f2a6857`
- evaluator
  - Blob `54cdb9857d4412e43991045a3b6d76fe8abdc549`
- generator
  - Blob `e8683a1fcb88d4578a2b4e5adca8692534bec9f6`
- SQLite candidate preparer
  - Blob `b75de4558100e87a31fa4fc9181a54f51f335702`
- benchmark manifest
  - Blob `24a1d20effe679b23e4ee4966d0bdb01f2b06ec0`
- Natural corpus validator
  - Blob `221de26f9e6ba99a5f76014ee85957092baacdc5`
- Natural release README
  - Blob `143be5c17c409ba42c25b65c51eb016c320199ea`

### مرز ادعا

Controlled Release رسمی:

- version `1.1.0`
- catalog `1.2.0`
- database SHA `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- aliases 218
- cases 500
- Route/Top-1/Top-5 = 1.0
- failures 0
- Artifact `8660666147`
- Digest `sha256:d43931525ade2f1b685b18647d1554cc317f14bd8874ed66fe5c85370454fbde`

این Corpus از Alias registry تولید شده است و Natural Query evidence نیست.

Independent Natural Query corpus هنوز Release نشده است. Generated aliases/model paraphrases قابل‌قبول نیستند و Release آینده نیازمند privacy review، دو annotator و adjudicator است.

### Extracted files

- `packages/nutrition-core/src/search.ts`
- `packages/nutrition-core/src/universal-catalog-ranking.ts`
- exportهای Package
- `docs/NEOFIT_SEARCH_RANKING_AUTHORITY_MAP.md`
- `packages/nutrition-core/tests/search-ranking-golden-v1.ts`
- `packages/nutrition-core/tests/search-ranking-parity.test.ts`
- CI provenance metadata برای Search Release
- README Package به‌روز شد.

### Golden coverage

تمام ۹ variation رسمی:

1. exact alias
2. quantity context
3. Arabic characters
4. context sentence
5. extra spacing
6. half-space
7. punctuation
8. joined spacing
9. trailing serving

همچنین:

- longest alias match
- Iranian canonical precedence
- modifier-aware local search
- Generic target resolution
- FTS sanitization
- prepared query → FNDDS preference
- atomic/raw query → SR Legacy preference
- unrequested process penalty
- macro-incomplete exclusion
- stable ties
- fail-closed invalid limits

### Initial validation

- Nutrition Core CI `30858434028` — success
- Artifact `8873368541`
- Digest `sha256:3fed8d5c491184280437d34f135fdc1323f3c68998a0cebeccebf911ac28ad9c`
- AST boundary: 8 source files pass
- TypeScript: pass
- total tests: 25
- pass: 25
- fail/skipped: 0
- Review thread در زمان ثبت: ندارد

### محدودیت‌ها

- Full 500-query benchmark در این Package اجرا نشد؛ Authority آن Pipeline واقعی IFKB + SQLite است.
- Natural Query accuracy اثبات نشده است.
- typo/colloquial/regional/ambiguity/abstention metrics نداریم.
- Catalog release/provenance و Universal estimate هنوز منتقل نشده‌اند.
- Web هنوز از Package استفاده نمی‌کند.
- Supabase/Auth/AI شروع نشده‌اند.

### تصمیم‌ها

- Representative Golden tests مکمل Full benchmark هستند، نه جایگزین آن.
- هر تغییر Alias/Catalog/normalization/ranking باید Full IFKB benchmark را دوباره اجرا کند.
- Natural Query claim فقط با Corpus مستقل و privacy-reviewed مجاز است.
- Batch 3 قبل از extraction باید manifest/fingerprint/legacy adapter authority را Freeze کند.

### Exact continuation point

1. Nutrition Core CI و Web CI روی Head اسناد نهایی پاس شوند.
2. Reviewهای PR #19 بررسی و رفع شوند.
3. PR #19 با expected head Merge شود.
4. Issue #17 باز بماند و Batch 2 completed ثبت شود.
5. Branch Batch 3 از Merge commit ساخته شود.
6. `catalog-release.ts`, `catalog-provenance.ts`, `legacy-catalog-adapter.ts` و تست‌های release/fingerprint/migration Inventory شوند.
7. Golden fixtureهای Batch 3 پیش از کد ساخته شوند.
8. هر دو سند بعد از Batch 3 دوباره Update شوند.

**Issue #16 باز است. Supabase، Auth، AI واقعی و Web adapter هنوز ممنوع‌اند.**

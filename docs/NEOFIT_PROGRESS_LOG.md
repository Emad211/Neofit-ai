# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 implementation parity

## پروتکل

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، مشکلات، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | انجام‌شده | PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | انجام‌شده | PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | انجام‌شده | PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | تعویق‌شده | Issue #16؛ Vercel daily API limit ثبت شده |
| 3 | فعال | Batch 1/2 merged، Batch 3 در PR #20 و Gate نهایی |
| 4 | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## تاریخچهٔ فشردهٔ اثبات‌شده

### Stage 0–1

- Pivot Merge: `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX Merge: `a458a27a2685bfa7d85ea28686b3182c3167d747`
- Final Stage 1 CI `30829629853`
- Visual Artifact `8862378720`

### Stage 2A/2B

- PWA code Merge: `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Fresh-install Offline P1 رفع شد.
- Vercel Project `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview ندارد؛ Issue #16 باز است.
- `vercel[bot]` محدودیت `api-deployments-free-per-day` را ثبت کرده است.

### Stage 3 Batch 1

- PR #18 Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- types/nutrition/recipe/diary/goals
- AST pure-boundary
- CI `30857715438`
- Artifact `8873108322`
- 10/10 pass
- Web CI `30857715413`

### Stage 3 Batch 2

- PR #19 Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- Persian normalization/modifiers/search
- Alias routing و SR/FNDDS ranking
- CI `30858722741`
- Artifact `8873475224`
- 25/25 pass
- Web CI `30858722681`
- Controlled Alias benchmark از Natural Query claim جدا شد.

---

## Entry 008 — Stage 3 Batch 3 Authority/Golden checkpoint

**Branch:** `stage3/catalog-provenance-parity`  
**Base:** `917f04e319a924dda7dfb16d079453a5e5686541`  
**Issue:** #17  
**PR:** #20

در مرحلهٔ اول Batch 3:

- Authority chain Generator → Asset/Manifest → Audit/Freeze → Runtime projection ثبت شد.
- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md` ساخته شد.
- `catalog-provenance-golden-v1.ts` پیش از implementation ساخته شد.
- Nutrition RC/Catalog frozen از Schema/ID `candidate-not-final` جدا شد.
- Initial Golden checkpoint:
  - Head `22b7034843a97fa9ded83b10db495dc9bc50a340`
  - Nutrition CI `30859529407`
  - Artifact `8873784525`
  - Web CI `30859529411`
- Final handoff checkpoint پیش از implementation:
  - Head `ef8cfbd0ffa72107a261d48d80e1d1dfc9fbe040`
  - Nutrition CI `30859761558`
  - Artifact `8873871345`
  - Web CI `30859761557`
  - Web Artifact `8873894595`

در این checkpoint هیچ Parity برای سه ماژول هدف ادعا نشد.

---

## Entry 009 — Stage 3 Batch 3 Test-first implementation

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۲:۲۵ تا ۰۲:۳۵ ایران  
**Branch:** `stage3/catalog-provenance-parity`  
**PR:** #20  
**Issue:** #17

### هدف

1. ساخت تست‌های Batch 3 قبل از implementation.
2. استخراج Release/Provenance/Legacy surface بدون ورود Infrastructure.
3. قفل‌کردن Manifest projection، Candidate non-final status و Legacy semantics.
4. اجرای Red→Green واقعی در CI.
5. ثبت کامل Commit/Run/Artifact و Correctionها.

### بازسازی وضعیت شروع

- هر دو سند اجباری کامل خوانده شدند.
- PR #20 باز، Draft و Mergeable بود.
- Head شروع `6f06136ac37e322915f715bc74f8517c68a6d03c`.
- Nutrition CI `30859987731` success.
- Web CI `30859987735` success.
- Review thread باز: صفر.

### Test-first Red

Commit:

- `0d0be7ed7afc24404ebae46ea852970928259f87`
- فایل: `packages/nutrition-core/tests/catalog-provenance-parity.test.ts`

تست‌ها قبل از APIهای هدف ساخته شدند و این موارد را قفل کردند:

- Authority Blobها
- Release projection کامل
- Release invariant rejection
- Schema/ID `candidate-not-final`
- Evidence matrix
- Imported allowlist
- Legacy per-serving/null weight
- uncertainty clamp
- sourceRecord/sourceVersion behavior

CI Red evidence:

- Run `30860579622` — failure مورد انتظار
- Golden provenance و AST boundary پاس شدند.
- TypeScript فقط به‌علت نبود Export/APIهای Batch 3 شکست خورد:
  - `IFKB_CATALOG_RELEASE`
  - `SCHEMA_ID_CANDIDATE_BASELINE`
  - provenance functions
  - Legacy adapter
  - validators/types
- تست‌ها اجرا نشدند.

CI در این Red run یک ضعف ثانویه نشان داد: چون Artifact directory هنوز ساخته نشده بود، `if: always()` upload نیز failure ثانویه داد. این مورد بعداً با preflight evidence directory رفع شد.

### Implementation

Commitها:

- `fca5113ba9127ec0ceb02d9d95676c366bf60f0e`
  - `src/catalog-release.ts`
  - typed Release/Candidate contracts
  - frozen Catalog projection
  - validation functions
- `f743b7effbb6c20896cf0e755bc9302514dea573`
  - `src/catalog-provenance.ts`
- `3ecbaee7a2b56d6cb3246751c8dee0e1cdecea9d`
  - `src/legacy-catalog-adapter.ts`
- `589a504666a97c174fac3f6481599118c59a80d4`
  - Package exports

### Intentional Manifest projection expansion

Mobile Release constant همهٔ Manifest metadata را نداشت. Package جدید این فیلدهای ثابت و موردنیاز مصرف‌کننده را نیز شامل می‌کند:

- `databaseFile`
- `genericMappingPolicies`
- validation of SHA/count/coverage/policy totals
- Schema/ID comparison baseline

این تغییر فقط Metadata/validation است و Nutrition arithmetic یا Catalog content را تغییر نمی‌دهد. Generator/Manifest Authority اصلی باقی مانده و تفاوت در Authority map و Golden test ثبت شده است.

### First implementation run و Failure واقعی

- Run `30860691909`
- TypeScript: pass
- AST boundary: 11 files pass
- Tests: 33/34 pass
- Artifact `8874216304`
- Digest `sha256:2d8c6f834fb099d4c719cf1ef9e54b6a3ec00886afea24f41fc590ef030ce40e`

تنها Failure:

- تست uncertainty مقدار خام `83.99999999999999` را انتظار داشت.
- Domain طبق Numeric policy موجود، آن را با ۱۵ رقم معنادار به `84` canonical کرده بود.
- نتیجه: کد Domain درست بود و تست اشتباه بود.

### Correction تست

- Commit `52934ab172beea7d939b3024344de8f20f529b3a`
- انتظار تست با همان canonical precision رسمی هماهنگ شد.
- هیچ تغییر Domain برای عبور تست انجام نشد.

Green run:

- Run `30860781048` — success
- 34/34 pass
- 0 fail، 0 skipped
- Artifact `8874244557`
- Digest `sha256:a39d6f61096b4e7f535d9cba20beda184dbebcd902ad031b4d538d674d444580`

### README و CI evidence hardening

Commitها:

- `f3ab394d3787066890e6d016f3408465f35c3aa2`
  - Package README با Batch 3 surface/claim boundaries
- `03eb666cc7a864598b8ceb416df9bb35cd53896c`
  - Batch 3 authority paths و Blobها در CI
  - Manifest/Freeze metadata در Artifact report
  - `artifacts/preflight.json` قبل از TypeScript، تا Failureهای اولیه هم Evidence قابل‌دانلود داشته باشند

Final implementation validation:

- Nutrition Core CI `30860892868` — success
- Artifact `8874284638`
- Digest `sha256:1f25275a79fe6d4766b1839512f9159875b8dfc07b18eefacadc2460b50b8908`
- Web CI `30860892878` — success
- Web Artifact `8874311104`
- Web digest `sha256:6b1f59acc0800f0ebd2805173c3b08b4d0afd2cd41a98214644a87aecf209cfa`

### رفتار اثبات‌شده

- 11 Pure source files بدون import/I/O ممنوع
- strict TypeScript pass
- 34/34 tests pass
- Catalog Release projection برابر Golden Manifest
- invalid SHA/coverage/policy totals رد می‌شوند
- Schema/ID status باید `candidate-not-final` بماند
- Custom → `user_entered`
- DS0/broad fallback → `broad_fallback`
- Imported allowlist فقط:
  - `verified_source`
  - `digital_consensus`
  - `legacy_estimate`
- Legacy unknown weight → `null`
- basis = `per_serving`
- uncertainty clamp = `0..0.8`
- blank sourceRecord → Food ID
- blank sourceVersion حذف می‌شود
- Web/PWA regression سبز است

### عمداً خارج از Scope

- SQLite build/query/equivalence execution
- filesystem/hash calculation
- migrations/repositories/persistence precedence
- Supabase/Auth/RLS
- AI/Vision
- Web adapter

### Gate پایان Entry

- اسناد مادر و دفتر پیشرفت با Implementation evidence به‌روزرسانی شدند.
- PR #20 هنوز تا CI اسناد و Review نهایی Merge نشده است.

### Exact continuation point

1. CI روی Commitهای اسناد بررسی شود.
2. PR #20 و Review threadها دوباره خوانده شوند.
3. PR از Draft به Ready فقط پس از سبز ماندن هر دو CI تبدیل شود.
4. Reviewهای جدید رفع شوند.
5. PR #20 با expected head Merge شود.
6. Issue #17 باز بماند و Batch 3 completed ثبت شود.
7. Branch Batch 4 از Merge commit ساخته شود.
8. Authority/Golden-first برای Universal SR/FNDDS estimate و SQLite↔TypeScript equivalence آغاز شود.

**Issue #16 باز است. Supabase، Auth، AI، repositories و Web adapter هنوز خارج از Scope هستند.**

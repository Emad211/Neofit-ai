# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 Draft/Golden checkpoint نهایی

## پروتکل

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، مشکلات، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | انجام‌شده | PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | انجام‌شده | PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | انجام‌شده | PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | تعویق‌شده | Issue #16؛ Vercel daily API limit ثبت شده |
| 3 | فعال | Batch 1/2 merged، Batch 3 Draft PR #20 |
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

## Entry 008 — Stage 3 Batch 3: Catalog Release/Provenance Golden-first

**تاریخ:** ۴ اوت ۲۰۲۶  
**Branch:** `stage3/catalog-provenance-parity`  
**Base:** `917f04e319a924dda7dfb16d079453a5e5686541`  
**Issue:** #17  
**Draft PR:** #20  
**Final validated handoff head:** `ef8cfbd0ffa72107a261d48d80e1d1dfc9fbe040`

### هدف

- Generator authority از Runtime projection جدا شود.
- Catalog Manifest، provenance و Legacy adapter semantics Freeze شوند.
- Schema/ID candidate به‌اشتباه Final معرفی نشود.
- Golden fixtures پیش از implementation ساخته شوند.

### Authority targets

- `catalog-release.ts` Blob `1afb7266b7d456530febb5c1c49c109e3d1f3ef7`
- `catalog-provenance.ts` Blob `1edb7e8eed151305075e634a84596db2211dffaf`
- `legacy-catalog-adapter.ts` Blob `30fcc0d774a43f0f0608bd29c342c3e20d339f58`
- Mobile tests Blob `2291e1958efe5e17010230c5864c9fadc9bc47ba`

### Generator/asset authority

- Workflow `1012754613cf99bd3c73de49830731e9cc52adcf`
- Builder `597180d6bd540bc9b8bf0fc931c030d534289f5c`
- Concept augmenter `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0`
- Manifest `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Schema audit `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1`
- Candidate doc `0f372496cbad2ecf5cca72a6fdf7604255179be0`
- Nutrition RC freeze doc `3c0601f469c6d15618fcadd1179c16c581da6f6e`

### یافتهٔ معماری

`catalog-release.ts` Source of Truth مستقل نیست. Authority order:

1. Python generators
2. SQLite asset + Manifest
3. Workflow checks
4. Release/Freeze evidence
5. Runtime TypeScript projection

### Frozen Catalog 1.2.0

- DB bytes `13,885,440`
- DB SHA `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- foods `13,225`
- concepts `9,279`
- portions `36,494`
- macro complete `13,224`
- calcium `13,139`
- iron `13,144`
- potassium `12,947`
- vitamin C `12,763`
- Canon IDs `261`
- aliases `218`
- mappings `13,225`
- coverage `1.0`

### Provenance rules

- Custom → `user_entered`
- DS0/broad fallback → `broad_fallback`
- explicit tier preserved
- missing tier → `legacy_estimate`
- Imported allowlist:
  - `verified_source`
  - `digital_consensus`
  - `legacy_estimate`

### Legacy adapter rules

- per-serving basis
- null weight preserved
- standard portion multiplier 1
- macros preserved
- variability clamp `0..80%`
- sourceRecord fallback to food ID
- blank sourceVersion omitted
- evidence resolved conservatively

### Freeze distinction

- Nutrition RC/Catalog 1.2.0 frozen است.
- Schema/ID 1.1.0 صریحاً `candidate-not-final` است.
- Candidate فقط auditable baseline است، نه public stable compatibility.

Hash baseline includes:

- schema `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`
- food IDs `8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d`
- concept IDs `23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8`
- mappings `6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9`
- Canon IDs `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c`
- app→Canon `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71`
- aliases `9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e`

### فایل‌های ساخته‌شده

- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`
  - Commit `1a8624fb08bf64b563b77c5dfda6ccdfaaca1286`
- `packages/nutrition-core/tests/catalog-provenance-golden-v1.ts`
  - Commit `8952aee52affa0112988de5cd92d68b2d74fc01d`
- Draft PR #20 opened

Golden fixture شامل:

- complete Release projection
- Candidate status/hash baseline
- Evidence matrix
- Imported allowlist
- Legacy null-weight/per-serving/uncertainty/source metadata

### Golden checkpoint CI

Initial checkpoint:

- Head `22b7034843a97fa9ded83b10db495dc9bc50a340`
- Nutrition Core CI `30859529407` success
- Artifact `8873784525`
- Digest `sha256:1a85f9f6574ae5563e29fb40f25fb7cc1bcee605be478caec6b9fd4f00fa0bb3`
- Web CI `30859529411` success

Final handoff validation:

- Head `ef8cfbd0ffa72107a261d48d80e1d1dfc9fbe040`
- Nutrition Core CI `30859761558` success
- Artifact `8873871345`
- Digest `sha256:97504ad88572a5f8efafa957b7525e05223a120f3a54f205c7d4c3a8ddb9f645`
- Web CI `30859761557` success
- Web Artifact `8873894595`
- Web digest `sha256:79c86d24321b3e3c5a5c0cb81a638ed7ffb50884cd375ae76d3c39ab9ebe68d9`
- Review threads: none

### Honest status

این checkpoint فقط Authority docs، Golden fixture compilation، existing Batch 1/2 tests، pure boundary و Web regression را اثبات می‌کند.

**Batch 3 implementation parity هنوز وجود ندارد.**

عمداً انجام‌نشده:

- `catalog-provenance-parity.test.ts`
- استخراج سه ماژول هدف
- Package exports/README برای Batch 3
- Catalog/Freeze metadata در CI report
- Ready for Review و Merge PR #20
- SQLite execution/repositories/Supabase/Auth/AI/Web adapter

### Exact continuation point

1. در نوبت بعد هر دو سند و PR #20/CI/Reviews دوباره خوانده شوند.
2. `catalog-provenance-parity.test.ts` قبل از implementation ساخته شود.
3. Tests قفل کنند:
   - Release projection = Golden Manifest
   - `candidate-not-final`
   - Evidence matrix/imported allowlist
   - Legacy per-serving/null weight
   - variability clamp 0 و 0.8
   - sourceRecord fallback/sourceVersion omission
4. سه Pure module بدون semantic change Extract شوند.
5. Package index/README و CI metadata به Manifest/Freeze Blobs وصل شوند.
6. Nutrition Core CI و Web CI دوباره اجرا شوند.
7. Reviewها رفع و فقط با شواهد کامل PR #20 Ready شود.
8. هر دو سند با final implementation evidence به‌روزرسانی شوند.

**Issue #16 و #17 باز هستند. Supabase، Auth، AI، SQLite execution، repositories و Web adapter خارج از Scope هستند.**

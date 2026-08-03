# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 4 Universal Estimate/SQLite parity

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
| 3 | فعال | Batch 1–3 merged، Batch 4 در PR #21 و Gate نهایی |
| 4 | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## تاریخچهٔ فشردهٔ اثبات‌شده

### Stage 0–1

- Pivot Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- Final Stage 1 CI `30829629853`
- Visual Artifact `8862378720`

### Stage 2A/2B

- PWA code Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Fresh-install Offline P1 رفع شد.
- Vercel Project `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview ندارد؛ Issue #16 باز است.
- `vercel[bot]` محدودیت `api-deployments-free-per-day` را ثبت کرده است.

### Stage 3 Batch 1

- PR #18 Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- CI `30857715438`
- Artifact `8873108322`
- 10/10 pass
- Web CI `30857715413`

### Stage 3 Batch 2

- PR #19 Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- CI `30858722741`
- Artifact `8873475224`
- 25/25 pass
- Web CI `30858722681`

### Stage 3 Batch 3

- PR #20 Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- Nutrition CI `30861155760`
- Artifact `8874374046`
- Web CI `30861155825`
- Web Artifact `8874391849`
- 34/34 pass، 11 Pure files

---

## Entry 010 — Batch 4 Authority/Golden start

**Branch:** `stage3/universal-estimate-sqlite-parity`  
**Base:** `02c1bcf0b301a920b12abcff4f653575cb97bf7f`  
**Issue:** #17  
**PR:** #21

- Batch 3 Merge و Issue comment ثبت شد.
- Branch Batch 4 از Merge واقعی ساخته شد.
- هر دو سند اجباری روی Branch جدید دوباره خوانده شدند.
- Authorityهای estimator، Repository، Expo DB adapter، SQLite equivalence، SQL و macro guard خوانده شدند.
- `docs/NEOFIT_UNIVERSAL_ESTIMATE_SQLITE_AUTHORITY_MAP.md` ساخته شد.
- `packages/nutrition-core/tests/universal-estimate-golden-v1.ts` ساخته شد.
- Draft PR #21 به‌صورت Authority/Golden-only و no-parity باز شد.

Checkpoint evidence:

- Head `4d2b8856747a20a98a367fde178ee5508b2594e0`
- Nutrition CI `30861878272` — success
- Artifact `8874629427`
- Digest `sha256:aa75ab81bc0595ee45440af9c01c0dfbe99095b5b09abab5e5559b0786891a3b`
- Web CI `30861878306` — success

در این checkpoint estimator و Batch 4 parity test هنوز وجود نداشتند و هیچ success برای Batch 4 ادعا نشد.

---

## Entry 011 — Stage 3 Batch 4 Test-first implementation

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۲:۵۰ ایران  
**Branch:** `stage3/universal-estimate-sqlite-parity`  
**PR:** #21  
**Issue:** #17

### هدف

1. تست‌های Universal estimate و SQLite equivalence قبل از implementation.
2. ثبت Red CI واقعی.
3. استخراج Pure estimator بدون Repository/SQLite runtime.
4. اثبات missing-value، uncertainty، grams boundaries و SQL center parity.
5. حفظ macro-completeness در Ranker به‌جای تکرار در estimator.
6. ثبت کامل شواهد در CI/Artifact/docs.

### Authority

- Estimator `7f54426e0b6838700f09b831c7df5a94afef8361`
- Repository `cdfacc1eafba4267cdc793284462bbabd7ca93b5`
- Expo DB Adapter `687d7b41dac26e1821a141c181fa13cdd81b2186`
- UI consumer `df367a5d598925fa56eb3b2c36e47da8df504415`
- SQLite equivalence test `80538220517f8b4f0bc80117469b16f6a82c7bdf`
- SQLite helper `d03caf85ccfbb68b245101d0646956fd9c32e045`
- Nutrition SQL `35ecdbd1f5baec8ee1b5845cfd994f15b5ff769d`
- Macro guard `3f16b43a37f98b807c3b95577102bf682bff905d`
- Range test `2fd1f7f3c601c2ae48931f50a7ca1552ff45a2a2`

### Boundary

Pure Core:

- `UniversalNutrientRecord`
- `universalNutritionVector`
- `universalSourceUncertainty`
- `calculateUniversalFoodEstimate`

Test-only:

- `node:sqlite`
- SQL fixture/query/equivalence

Excluded:

- Expo Asset/FileSystem/SQLite
- DB lifecycle/query/cache
- Repository runtime/persistence
- UI/Diary
- Supabase/Auth/AI/Vision/Web adapter

### Test-first Red

Commit:

- `58552cb7c8a586aa064b676096d23cfa77f26137`
- فایل: `universal-estimate-sqlite-parity.test.ts`

Coverage:

- Authority provenance
- source uncertainty
- FNDDS 150g
- SR Legacy 50g
- nutrient order/null omission
- grams boundaries
- snake_case row mapping fixture
- direct `node:sqlite` equivalence
- macro guard continuity

Expected Red CI:

- Nutrition CI `30861996867` — failure مورد انتظار
- Golden provenance pass
- AST boundary pass
- TypeScript فقط به‌علت نبود چهار API estimator شکست خورد
- Tests skipped
- Preflight Artifact `8874670235`
- Digest `sha256:45fd21c208b11f1772a2514ba1fcd852cc23c5bf40b538e5f0da35054c31fe50`

### Implementation

- `19b0fdc8f47a76996450e5a829113cc001bf036b`
  - exact semantic extraction of `universal-food-estimate.ts`
- `7128badbda60a581f860067aae28f24fd0d7cfb3`
  - Package export

هیچ Repository mapping، Expo dependency یا SQLite runtime وارد `src/` نشد.

### First Green

- Nutrition CI `30862069748` — success
- Artifact `8874698782`
- Digest `sha256:0d5e80453e5b52137143464e8c23417701451147da28edeba9b54b338d226899`
- Web CI `30862069747` — success
- Web Artifact `8874722004`
- Web digest `sha256:9963c9454b44212a493ba8b83ba44a5acaa4e0bb9b727f0f1b6f79cbe0a9e206`
- 43/43 tests pass
- 12 Pure source files

### README/CI metadata hardening

- README commit `a526e8040b7fe3bd27207ccfce574c993de5f779`
- CI metadata commit/head `9a405cdb625e2b479f9d4ef0bfe566de9eb57bb4`

CI changes:

- Batch 4 Authority doc در path gate
- Golden/parity files در provenance gate
- exact estimator/Repository/equivalence Blob checks
- FNDDS/SR uncertainty checks
- Artifact metadata شامل:
  - estimator Blob
  - Repository Blob
  - SQLite equivalence Blob
  - uncertainty values
  - `sqliteRuntimeBoundary=test-only`

Final implementation evidence:

- Nutrition CI `30862265021` — success
- Artifact `8874767798`
- Digest `sha256:cb54c5d2c0968a98949ac834c7c81c575c040a7f814e08a9829c7bdd3b006033`
- Web CI `30862264999` — success
- Web Artifact `8874785715`
- Web digest `sha256:7f5eedb931be548cb80bff75a0924061f51503a56ef050e6d10c5116b4087800`
- Review thread در زمان ثبت: صفر

### رفتار اثبات‌شده

- FNDDS uncertainty = `0.15`
- SR Legacy uncertainty = `0.08`
- grams valid only when finite، >0 و <=100000
- null nutrient remains absent
- vector order follows `NUTRIENT_KEYS`
- SQL center equals TypeScript center over fractional gram values
- tolerance matches Mobile test policy
- macro-incomplete record remains unselectable
- complete no-portion record remains grams-usable
- 43/43 pass، 0 fail، 0 skipped
- 12 Pure source files pass AST boundary
- Web/PWA regression remains green

### Claim boundary

این Batch Golden-row SQLite equivalence و estimator parity را اثبات می‌کند. Full 13,225-record Catalog audit در این Batch دوباره اجرا نشده است.

### عمداً خارج از Scope

- Repository runtime
- Expo/SQLite production adapter
- migrations/persistence precedence
- Supabase/Auth/RLS
- AI/Vision
- Web adapter

### Exact continuation point

1. CI روی Commitهای اسناد بررسی شود.
2. PR #21 و Review threadها دوباره خوانده شوند.
3. PR #21 پس از سبز ماندن CI از Draft به Ready تبدیل شود.
4. Reviewهای جدید رفع شوند.
5. PR #21 با expected head Merge شود.
6. Issue #17 باز بماند و Batch 4 completed ثبت شود.
7. Branch Batch 5 از Merge commit ساخته شود.
8. Schema/ID/Catalog fingerprints و Release freeze authority قبل از کد Batch 5 Inventory شوند.
9. Authority/Golden-first Batch 5 اجرا شود.

**Issue #16 و #17 باز هستند. Supabase، Auth، AI، Repository runtime و Web adapter خارج از Scope باقی می‌مانند.**

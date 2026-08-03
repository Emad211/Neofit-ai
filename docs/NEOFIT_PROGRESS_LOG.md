# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 Draft/Golden checkpoint

## پروتکل اجباری

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، مشکلات، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی مراحل

| Stage | وضعیت | شواهد اصلی |
|---|---|---|
| 0 — Pivot/Freeze | انجام‌شده | PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 — Persian RTL UX | انجام‌شده | PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A — PWA code | انجام‌شده | PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B — Vercel HTTPS | تعویق‌شده | Issue #16؛ Vercel bot محدودیت روزانه را ثبت کرده |
| 3 — Nutrition Core | فعال؛ Batch 1/2 merged، Batch 3 Draft | Issue #17، PR #20 |
| 4 — Supabase | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## تاریخچهٔ اثبات‌شده

### Entry 000 — Pivot

- مرجع Native/IFKB: `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`
- PR #12 Merge: `151de2c0d5c9b02602c2f89eb4df808653cdd74e`

### Entry 001/002 — Stage 1

- Next.js Persian RTL UX و Visual QA ساخته و پذیرفته شد.
- CI `30829629853`
- Artifact `8862378720`
- Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`

### Entry 003/004/005 — Stage 2

- PWA manifest/icons/service worker/offline/runtime boundaries ساخته شد.
- Fresh-install Offline P1 با precache JS/CSS/fonts و HTTP-cache-empty test رفع شد.
- Final PWA code CI `30856060076`
- Stage 2A Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Stage 2B در Issue #16 جدا شد.
- Vercel Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview ندارد؛ `vercel[bot]` محدودیت `api-deployments-free-per-day` را ثبت کرده است.

### Entry 006 — Stage 3 Batch 1

- types، nutrition، recipe، diary، goals Extract شدند.
- AST pure-boundary verifier اضافه شد.
- PR #18 Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- Final CI `30857715438`
- Artifact `8873108322`
- Digest `sha256:de0197b9ae9762a921a32c13071701064863aef8e77e612fb2e35bd49893d25f`
- 10/10 pass
- Web CI `30857715413`

### Entry 007 — Stage 3 Batch 2

- Persian normalization/modifiers/local search Extract شد.
- Alias routing و SR/FNDDS ranking Extract شد.
- Controlled-vs-Natural claim boundary ثبت شد.
- PR #19 Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- Final CI `30858722741`
- Artifact `8873475224`
- Digest `sha256:28b428876f4c8295ddf359e89d7ba72b06d0dbc4928929c8ec0d17d5a7ca045b`
- 25/25 pass
- Web CI `30858722681`

---

## Entry 008 — Stage 3 Batch 3: Authority/Golden-first

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۲:۰۰ تا ۰۲:۱۵ ایران  
**Branch:** `stage3/catalog-provenance-parity`  
**Base:** Batch 2 merge `917f04e319a924dda7dfb16d079453a5e5686541`  
**Issue:** #17  
**Draft PR:** #20  
**Golden checkpoint head:** `22b7034843a97fa9ded83b10db495dc9bc50a340`

### هدف

1. جداسازی Generator authority از Runtime Release projection.
2. Freeze کردن Catalog Manifest، provenance و Legacy adapter semantics.
3. ثبت تفاوت Nutrition RC frozen با Schema/ID candidate-not-final.
4. ساخت Golden fixture پیش از implementation.

### اسناد اجباری و وضعیت واقعی

در ابتدای Batch، هر دو سند از Branch جدید خوانده شدند. آن‌ها Batch 2 را Active نشان می‌دادند؛ این Entry آن‌ها را به Batch 2 merged و Batch 3 active منتقل کرد.

### Pure TypeScript targets

- `catalog-release.ts`
  - Blob `1afb7266b7d456530febb5c1c49c109e3d1f3ef7`
- `catalog-provenance.ts`
  - Blob `1edb7e8eed151305075e634a84596db2211dffaf`
- `legacy-catalog-adapter.ts`
  - Blob `30fcc0d774a43f0f0608bd29c342c3e20d339f58`
- Mobile nutrition tests
  - Blob `2291e1958efe5e17010230c5864c9fadc9bc47ba`

### Generator/asset authority

- Workflow Blob `1012754613cf99bd3c73de49830731e9cc52adcf`
- Builder Blob `597180d6bd540bc9b8bf0fc931c030d534289f5c`
- Concept augmenter Blob `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0`
- Manifest Blob `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Schema audit Blob `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1`
- Schema candidate doc Blob `0f372496cbad2ecf5cca72a6fdf7604255179be0`
- Nutrition RC freeze doc Blob `3c0601f469c6d15618fcadd1179c16c581da6f6e`

### یافتهٔ معماری

`catalog-release.ts` Source of Truth مستقل نیست؛ Projection تولیدشده از Manifest است.

Authority order:

1. Python generators
2. SQLite asset + generated Manifest
3. Workflow integrity/count/search checks
4. Release/Freeze evidence
5. Runtime TS projection

### Frozen Catalog 1.2.0

- DB bytes `13,885,440`
- DB SHA `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- foods `13,225`
- portions `36,494`
- macro-complete `13,224`
- calcium `13,139`
- iron `13,144`
- potassium `12,947`
- vitamin C `12,763`
- Canon `261`
- aliases `218`
- concepts `9,279`
- mappings `13,225`
- mapping coverage `1.0`
- clustered `1,321`
- multi-source `209`
- max variants `76`

### Provenance policy

- Custom → `user_entered`
- DS0/broad fallback → `broad_fallback`
- explicit tier preserved
- absent tier → `legacy_estimate`
- Imported allowlist:
  - `verified_source`
  - `digital_consensus`
  - `legacy_estimate`

### Legacy adapter policy

- `per_serving`
- null weight preserved
- Standard portion multiplier 1
- macros preserved
- variability clamped `0..80%`
- sourceRecord fallback to food ID
- blank sourceVersion omitted
- conservative evidence resolution

### Freeze distinction

- Nutrition RC/Catalog `1.2.0` is frozen.
- Schema/ID `1.1.0` remains `candidate-not-final`.
- Candidate is auditable baseline, not public stable compatibility.

Hash baseline:

- schema `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`
- food IDs `8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d`
- concept IDs `23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8`
- mappings `6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9`
- Canon IDs `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c`
- app→Canon `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71`
- Alias mapping `9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e`

### فایل‌های ساخته‌شده

- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`
  - Commit `1a8624fb08bf64b563b77c5dfda6ccdfaaca1286`
- `packages/nutrition-core/tests/catalog-provenance-golden-v1.ts`
  - Commit `8952aee52affa0112988de5cd92d68b2d74fc01d`
- Handoff docs updated
  - final checkpoint head `22b7034843a97fa9ded83b10db495dc9bc50a340`

Golden fixture includes:

- complete Release projection
- Candidate hash/status baseline
- Evidence matrix
- Imported allowlist
- Legacy null-weight/per-serving/uncertainty/source metadata cases

### Draft PR و CI checkpoint

- PR #20 opened as Draft
- Nutrition Core CI `30859529407` — success
- Artifact `8873784525`
- Digest `sha256:1a85f9f6574ae5563e29fb40f25fb7cc1bcee605be478caec6b9fd4f00fa0bb3`
- Web CI `30859529411` — success
- Review threads: none

این checkpoint فقط ثابت می‌کند Authority docs و Golden fixtures Type-safe و Boundary-safe هستند و Regression وب ندارند.

**سه ماژول هنوز Extract نشده‌اند و Batch 3 parity هنوز ادعا نمی‌شود.**

### کارهای عمداً انجام‌نشده

- `catalog-provenance-parity.test.ts` هنوز ساخته نشده است.
- سه ماژول هدف هنوز Package نشده‌اند.
- Runtime Release validation هنوز اجرا نشده است.
- Generator/SQLite/hash execution وارد Pure Core نشده است.
- persistence precedence وارد Pure Core نشده است.
- PR #20 Ready for Review نشده است.
- Supabase/Auth/AI/Web adapter شروع نشده‌اند.

### Exact continuation point

1. هر دو سند و PR #20/CI/Reviews دوباره خوانده شوند.
2. `catalog-provenance-parity.test.ts` قبل از implementation ساخته شود.
3. Tests قفل کنند:
   - Release projection = Golden Manifest
   - candidate status = `candidate-not-final`
   - Evidence matrix/imported allowlist
   - Legacy per-serving/null weight
   - variability clamp 0 و 0.8
   - sourceRecord fallback/sourceVersion omission
4. سپس سه Pure module بدون تغییر معنایی Extract شوند.
5. Package index/README و CI metadata به Manifest/Freeze Blobs متصل شوند.
6. Nutrition Core CI و Web CI دوباره اجرا شوند.
7. Reviewها رفع و فقط با شواهد کامل PR #20 Ready شود.
8. هر دو سند با final head/run/artifact به‌روزرسانی شوند.

**Issue #16 و #17 باز هستند. Supabase، Auth، AI، SQLite execution، repositories و Web adapter خارج از Scope هستند.**

# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 3 Authority/Golden-first

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
| 1 — Persian RTL UX | انجام‌شده و پذیرفته‌شده | PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A — PWA code | انجام‌شده | PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B — Vercel HTTPS | تعویق‌شده | Issue #16؛ Vercel bot محدودیت روزانه را تأیید کرده |
| 3 — Nutrition Core parity | فعال؛ Batch 1/2 merged، Batch 3 Golden-first | Issue #17 |
| 4 — Supabase | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## Entry 000 — بازسازی Native/IFKB و Pivot

**تاریخ:** ۳ اوت ۲۰۲۶  
**مرجع:** `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

- Nutrition RC و IFKB حفظ شدند.
- UX Native رد و Web/PWA pivot ثبت شد.
- PR #12 مسیر جدید را Merge کرد.

---

## Entry 001 — Stage 1 Foundation

- دو سند دائمی ساخته شدند.
- Next.js App Router، TypeScript strict و پنج Flow اصلی ساخته شدند.
- TypeScript روی `6.0.3` قفل شد.
- CI `30827034439` پاس شد.

---

## Entry 002 — Visual QA و پذیرش Stage 1

Fixها:

- حذف Banner و عنوان تکراری
- Vazirmatn self-hosted
- viewport screenshots
- Scroll reset و Regression test

شواهد:

- CI `30829629853`
- Artifact `8862378720`
- Digest `sha256:7c9c86100355743a262d41ae6233e1513c804bd0792b19ff5eff5946c49c98e4`
- 360/390/412px بدون overflow
- Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`

---

## Entry 003 — Stage 2 PWA Foundation

ساخته‌شده:

- Persian RTL manifest
- deterministic icons
- Service Worker و Offline boundaries
- environment contract و `vercel.json`
- Web CI و PWA runtime verification

Initial CI `30849445243` پاس شد.

---

## Entry 004 — Offline P1 و وضعیت Vercel

Vercel:

- Team `Emad's projects`
- Project `neofit-ai`
- ID `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Deployment count صفر

P1 Fix:

- Build asset graph در Install precache شد.
- HTTP cache قبل از Offline test پاک شد.
- Offline React navigation تست شد.

Evidence:

- Web CI `30853438059`
- Artifact `8871529505`
- Digest `sha256:7f50f89a15c37871bbafda95d3cea6e105ab5c0a344f9f408b5f5fe787823c77`

`vercel[bot]` بعداً خطای `api-deployments-free-per-day` با «more than 100» را مستقیماً ثبت کرد. Issue #16 باز ماند.

---

## Entry 005 — تفکیک Stage 2A/2B

درخواست مالک: Vercel فعلاً مانع توسعهٔ Core نباشد.

- Stage 2A با PR #15 و Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` بسته شد.
- Issue #14 بسته شد.
- Stage 2B در Issue #16 باقی ماند و پیش‌شرط Web RC شد.

---

## Entry 006 — Stage 3 Batch 1: Pure arithmetic/domain

**Issue:** #17  
**PR:** #18  
**Merge:** `c9599c4905f9fc1d28ba7e9086edf20376991740`

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

Final evidence:

- head `7861c4f56f0474b61d8dd9b3a7101e6b616b524d`
- Nutrition Core CI `30857715438`
- Artifact `8873108322`
- Digest `sha256:de0197b9ae9762a921a32c13071701064863aef8e77e612fb2e35bd49893d25f`
- Web CI `30857715413`
- 10/10 pass

---

## Entry 007 — Stage 3 Batch 2: Controlled Persian Search/Ranking

**Branch:** `stage3/search-ranking-parity`  
**PR:** #19  
**Merge:** `917f04e319a924dda7dfb16d079453a5e5686541`

Extracted:

- Persian normalization and modifier parsing
- deterministic local search
- Alias exact/longest/compact routing
- Iranian-vs-Generic evaluator precedence
- Generic target resolution
- SR Legacy/FNDDS ranking and stable tie policy

Authority:

- Search Blob `bb99c934beeed5094da7e0a29a8f53635ace48b3`
- Ranking Blob `9b23b1ef7d6817ff2b946e1fdedcad76608279e1`
- Alias registry Blob `94429b1937edc6234b23fc8398531b531a891cc2`
- Benchmark Manifest Blob `24a1d20effe679b23e4ee4966d0bdb01f2b06ec0`

Controlled benchmark:

- Release `1.1.0`
- Catalog `1.2.0`
- 218 Alias rows
- 500 deterministic cases
- Route/Top-1/Top-5 = 1.0
- failures = 0
- Artifact `8660666147`
- Digest `sha256:d43931525ade2f1b685b18647d1554cc317f14bd8874ed66fe5c85370454fbde`

Claim boundary:

- Corpus از Alias registry تولید شده است، نه Natural user queries.
- Independent Natural Query frozen release وجود ندارد.
- typo/colloquial/regional/ambiguity/abstention accuracy اثبات نشده است.

Final evidence:

- head `34e576a5704d8f5ba4407bd0f063cca246849e4d`
- Nutrition Core CI `30858722741`
- Artifact `8873475224`
- Digest `sha256:28b428876f4c8295ddf359e89d7ba72b06d0dbc4928929c8ec0d17d5a7ca045b`
- Web CI `30858722681`
- 25/25 pass
- all 9 official controlled variations represented
- Review thread resolved

---

## Entry 008 — Stage 3 Batch 3: Catalog Release/Provenance Golden-first

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۲:۰۰ ایران  
**Branch:** `stage3/catalog-provenance-parity`  
**Base:** Batch 2 merge `917f04e319a924dda7dfb16d079453a5e5686541`  
**PR:** هنوز ساخته نشده  
**Issue:** #17

### هدف

1. جداسازی Generator authority از Runtime projection.
2. Freeze کردن Catalog Manifest، provenance و Legacy adapter semantics.
3. جلوگیری از معرفی Schema/ID Candidate به‌عنوان Final public freeze.
4. ساخت Golden fixtures پیش از extraction.

### اسناد اجباری خوانده‌شده

- `docs/NEOFIT_MASTER_PLAN.md`
- `docs/NEOFIT_PROGRESS_LOG.md`

آن‌ها هنوز Batch 2 را Active نشان می‌دادند؛ این Entry آن وضعیت را اصلاح کرد.

### Source authority خوانده‌شده

Pure TypeScript targets:

- `catalog-release.ts`
  - Blob `1afb7266b7d456530febb5c1c49c109e3d1f3ef7`
- `catalog-provenance.ts`
  - Blob `1edb7e8eed151305075e634a84596db2211dffaf`
- `legacy-catalog-adapter.ts`
  - Blob `30fcc0d774a43f0f0608bd29c342c3e20d339f58`
- Mobile nutrition tests
  - Blob `2291e1958efe5e17010230c5864c9fadc9bc47ba`

Generator/asset authority:

- Catalog workflow
  - Blob `1012754613cf99bd3c73de49830731e9cc52adcf`
- `build_mobile_catalog.py`
  - Blob `597180d6bd540bc9b8bf0fc931c030d534289f5c`
- `augment_mobile_catalog_concepts.py`
  - Blob `b0ed12152b8a0001fedfa0c35e52ddf2fc81fcc0`
- generated Manifest
  - Blob `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Schema/ID audit
  - Blob `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c`
- Schema/ID candidate document
  - Blob `0f372496cbad2ecf5cca72a6fdf7604255179be0`
- Nutrition RC freeze document
  - Blob `3c0601f469c6d15618fcadd1179c16c581da6f6e`

### یافتهٔ معماری اصلی

`catalog-release.ts` Source of Truth نیست؛ Projection تولیدشده از Manifest است.

Authority واقعی:

1. Python generators
2. SQLite asset + Manifest
3. Workflow integrity/count/search checks
4. Release/Freeze evidence
5. Runtime TS projection

بنابراین Package نباید Catalog را مستقل و دستی تعریف کند.

### Frozen Catalog 1.2.0

- DB bytes `13,885,440`
- DB SHA `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- foods `13,225`
- portions `36,494`
- macro complete `13,224`
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
- DS0/broad fallback label → `broad_fallback`
- explicit tier preserved otherwise
- absent tier → `legacy_estimate`
- Imported allowlist:
  - `verified_source`
  - `digital_consensus`
  - `legacy_estimate`

### Legacy adapter policy

- per-serving basis preserved
- null physical weight preserved
- one Standard portion with multiplier 1
- exact macro values preserved
- variability clamped to 0..80%
- sourceRecord fallback to food ID
- blank sourceVersion omitted
- Evidence tier resolved conservatively

### Freeze distinction

Nutrition RC/Catalog 1.2.0 is frozen.

Schema/ID `1.1.0` remains `candidate-not-final`; it is an auditable baseline, not public stable compatibility.

Candidate baseline includes:

- migration 5 / count 5
- 23 tables / 43 SQLite objects
- schema fingerprint `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`
- food ID set `8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d`
- concept ID set `23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8`
- mapping set `6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9`
- Canon ID set `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c`
- app→Canon set `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71`
- Alias mapping set `9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e`
- mapping count 261، unresolved 0، ambiguous 0

### فایل‌های ایجادشده

- `docs/NEOFIT_CATALOG_PROVENANCE_AUTHORITY_MAP.md`
  - Commit `1a8624fb08bf64b563b77c5dfda6ccdfaaca1286`
- `packages/nutrition-core/tests/catalog-provenance-golden-v1.ts`
  - Commit `8952aee52affa0112988de5cd92d68b2d74fc01d`

Golden fixture شامل:

- complete Release projection
- Candidate hash/status baseline
- Evidence matrix
- Imported allowlist
- Legacy null-weight/per-serving/uncertainty/source metadata cases

### کارهایی که عمداً انجام نشد

- سه ماژول هنوز Extract نشده‌اند.
- هیچ Parity test برای Batch 3 هنوز پاس نشده است.
- Generator/SQLite/audit code وارد Pure Core نشد.
- Schema/ID Candidate نهایی اعلام نشد.
- Repository overwrite behavior وارد Pure Core نشد.
- PR ساخته نشد.
- Supabase/Auth/AI/Web adapter شروع نشد.

### Exact continuation point

1. CI Commitهای Authority/Golden و Head اسناد بررسی شود.
2. `catalog-provenance-parity.test.ts` قبل از implementation ساخته شود.
3. Tests باید Release projection، candidate status، Evidence matrix، Imported allowlist، null weight، uncertainty clamps و source metadata را قفل کنند.
4. سپس `catalog-release.ts`, `catalog-provenance.ts`, `legacy-catalog-adapter.ts` بدون تغییر معنایی Extract شوند.
5. Package index و README به‌روزرسانی شوند.
6. CI metadata به Manifest/Freeze Blobs متصل شود.
7. Nutrition Core CI و Web CI اجرا شوند.
8. فقط پس از سبزشدن tests یک PR متمرکز Batch 3 باز شود.
9. هر دو سند با PR/CI/Artifact نهایی دوباره Update شوند.

**Issue #16 باز است. Issue #17 باز است. Supabase، Auth، AI، SQLite execution، repositories و Web adapter هنوز ممنوع‌اند.**

# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 3 closure candidate

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
| 2B | تعویق‌شده | Issue #16؛ Vercel Preview واقعی ندارد |
| 3 | Closure candidate | Batchهای 1–6 Merge شده؛ Closure docs/CI باقی است |
| 4 | شروع‌نشده | منتظر Stage 3 closure و تأیید Organization/Region/Cost |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## Stage 0–2 evidence

- Pivot Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- PWA Foundation Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Vercel HTTPS validation در Issue #16 باز است.

---

## Stage 3 evidence ledger

### Batch 1 — Arithmetic/domain

- PR #18
- Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- `10/10` tests
- types، nutrition، recipe، diary، goals

### Batch 2 — Controlled Persian Search/Ranking

- PR #19
- Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- `25/25` tests
- Search normalization، modifier parsing، Alias routing، SR/FNDDS ranking
- Natural Query accuracy خارج از Claim است.

### Batch 3 — Catalog Release/Provenance/Legacy Adapter

- PR #20
- Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- `34/34` tests
- Catalog `1.2.0`، evidence resolver، Legacy adapter
- Schema/ID `1.1.0` همچنان `candidate-not-final`

### Batch 4 — Universal Estimate/SQLite parity

- PR #21
- Merge `d6c0df31999595096224ec1011574245d5dc75ad`
- `43/43` tests
- 12 Pure files
- FNDDS uncertainty 0.15، SR Legacy 0.08
- SQLite فقط در Test layer

### Batch 5 — ID/Fingerprint/Release parity

- PR #22
- Merge `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- `52/52` tests
- 13 Pure files
- Mapping precedence، fail-closed ambiguity، fingerprint payload، source replacement matrix

### Batch 6 — Web Nutrition Adapter

- PR #23
- Merge `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`
- Web Adapter tests `9/9`
- Core tests `52/52`
- React component بدون Nutrition math تکراری
- Web fixtures به Source records تبدیل شدند.
- Web از Shared Core برای estimate، recipe، day summary، goals و Persian normalization استفاده می‌کند.

Final Batch 6 evidence:

- Branch/docs head `5b33d137ab3f35a1f89bcb186e410b2533e94c5c`
- Nutrition CI `30868394519` — success
- Nutrition Artifact `8876962490`
- Nutrition digest `sha256:4827344e1441a61dbeab6675bd7684869ab5bee7a6281c92c19a4e1ce48033c3`
- Web CI `30868394529` — success
- Web Artifact `8876973096`
- Web digest `sha256:c1c326e8463f0fa8177154c0fd012326a8c362b7826bad098948ba85fda960f4`
- strict TypeScript، Next build، Visual، PWA runtime/offline، Web+Core bundle: pass
- Review thread باز: صفر

---

## Entry 018 — Batch 6 Merge و Closure start

**تاریخ:** ۴ اوت ۲۰۲۶  
**Batch 6 PR:** #23  
**Batch 6 Merge:** `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`  
**Closure branch:** `stage3/closure-evidence`  
**Issue:** #17

### انجام‌شده

- PR #23 پس از CI سبز و Review صفر با expected head Merge شد.
- شواهد Batch 6 در Issue #17 ثبت شد.
- Branch closure از Merge واقعی Batch 6 ساخته شد.
- این دو سند از حالت Batch 6 active به Closure candidate منتقل شدند.

### Stage 3 DoD review

| Gate | Evidence |
|---|---|
| Arithmetic/domain | Batch 1 |
| Persian Search/Ranking | Batch 2 |
| Catalog Release/Provenance | Batch 3 |
| Universal estimates + SQLite equivalence | Batch 4 |
| Canonical ID/Fingerprint | Batch 5 |
| Web Adapter بدون duplicated arithmetic | Batch 6 |
| Pure boundary | 13 source files |
| Core parity suite | 52 tests |
| Web Adapter suite | 9 tests |
| Next build/Visual/PWA | Batch 6 final Web CI |
| Mandatory closure docs | این PR |

### Honest boundaries

Stage 3 implementation کامل است، اما تا Merge Closure docs و CI سبز، Issue #17 بسته نمی‌شود.

هنوز انجام‌نشده:

- Full browser Catalog/IndexedDB
- Supabase/Auth/RLS/Sync
- AI/Vision Web flow
- Vercel HTTPS Preview
- Public Final Schema/ID freeze

### Exact continuation point

1. Closure PR باز شود.
2. Nutrition Core CI و Web CI روی Closure candidate پاس شوند.
3. Master Plan و Progress Log با Closure Run/Artifactها به `Stage 3 complete` نهایی شوند.
4. CI نهایی دوباره پاس شود.
5. Reviewها بررسی و رفع شوند.
6. Closure PR Merge شود.
7. Issue #17 با Closure merge/CI بسته شود.
8. Stage 4 بدون تأیید صریح Organization، Region و Cost شروع نشود.
9. Issue #16 تا Vercel Preview واقعی باز بماند.

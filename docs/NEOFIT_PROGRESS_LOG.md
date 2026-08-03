# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Batch 5 ID/Fingerprint Golden checkpoint

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
| 3 | فعال | Batch 1–4 merged، Batch 5 Draft PR #22 |
| 4 | شروع‌نشده | منتظر پایان Stage 3 و تأیید هزینه |
| 5–9 | شروع‌نشده | مطابق پلن مادر |

---

## تاریخچهٔ فشردهٔ اثبات‌شده

### Stage 0–2

- Pivot Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- PWA Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Vercel Preview در Issue #16 تعویق شده است.

### Stage 3 Batch 1

- PR #18 Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- 10/10 pass

### Stage 3 Batch 2

- PR #19 Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- 25/25 pass

### Stage 3 Batch 3

- PR #20 Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- 34/34 pass

### Stage 3 Batch 4

- PR #21 Merge `d6c0df31999595096224ec1011574245d5dc75ad`
- Final head `036207aaf722253a66aaffb1949949c3002296af`
- Nutrition CI `30862460190`
- Artifact `8874842655`
- Digest `sha256:10e1b877cf7e26f2ebdf7e55cfa97ea547d82db99a0b8144638651e9098741c0`
- Web CI `30862460176`
- Artifact `8874859573`
- Digest `sha256:796468a9f3b83c57289ab03c5f5e872a30bf0ab881aff2a3ce0d56e8245e8fc8`
- 43/43 pass، 12 Pure source files

---

## Entry 012 — Batch 5 Authority start

**Branch:** `stage3/id-fingerprint-release-parity`  
**Base:** `d6c0df31999595096224ec1011574245d5dc75ad`  
**Issue:** #17

- Batch 4 completion در Issue #17 ثبت شد.
- Branch از Merge واقعی Batch 4 ساخته شد.
- هر دو سند اجباری روی Branch جدید دوباره خوانده شدند.
- Freeze generator/docs، Catalog contract، Canon/Alias CSV، profile seeds، migrations و precedence tests خوانده شدند.

Files:

- Authority map commit `96abf2c472b6f30e1383785a2ad8003899b27753`
- Golden fixture commit `785796941cf22a09baabd5bc48ccfc3544091843`
- Master Plan update `d341b4bdd5022239d3e651f2284d2e3e6ba8d865`
- Progress update/head `f02848dbffc9945793b21b4e4f9da8c6a56f6e23`

No Implementation/Parity was claimed.

---

## Entry 013 — Batch 5 Authority/Golden CI checkpoint

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۳:۱۵ ایران  
**Branch:** `stage3/id-fingerprint-release-parity`  
**PR:** #22 — Draft  
**Issue:** #17  
**Checkpoint head:** `f02848dbffc9945793b21b4e4f9da8c6a56f6e23`

### هدف

1. Freeze کردن Authority و Golden contract قبل از code.
2. ردیابی checkpoint در PR/CI/Review.
3. جلوگیری از معرفی Candidate به‌عنوان Final.
4. قفل‌کردن Mapping precedence، canonical payload و replacement matrix.

### Draft PR

- PR #22 ساخته شد.
- Title: `Draft Stage 3 Batch 5: freeze ID fingerprint and release authority`
- Base: `web/pwa-foundation`
- Head: `stage3/id-fingerprint-release-parity`
- Draft: true
- Body صریحاً اعلام می‌کند:
  - mapping resolver وجود ندارد؛
  - fingerprint payload API وجود ندارد؛
  - source precedence API وجود ندارد؛
  - parity `.test.ts` وجود ندارد؛
  - Full Hash recomputation اجرا نشده است.

### Authority chain

- Audit generator `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c`
- Schema/ID candidate doc `0f372496cbad2ecf5cca72a6fdf7604255179be0`
- Nutrition RC freeze doc `3c0601f469c6d15618fcadd1179c16c581da6f6e`
- Release contract test `73d61f35383f3acb7298ec2fa5e0c5dd2989c457`
- Catalog Manifest `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Canon CSV `175b8754c1afd4f6bcd2303d8b1113f3bf211ed5`
- Alias CSV `94429b1937edc6234b23fc8398531b531a891cc2`
- Legacy profiles `6810dffaf51afdf8b7161d3c9eb8028ae5add4be`
- Fallback profiles `62be2ae9ebb1f5bf448b848bf0e502a6d1870aa0`
- Base migrations `e6c9eede66f2bfe4c32a726ff010d0f96033dc02`
- Migration v5 `1176a7084784822ed012511b2b3e49ca11dd1fa4`
- Source precedence `b68655faba8ba8f526f6c358ffd1ff06aa532edd`
- Promotion test `740432a8568f2f3f70aed69f41ec19d0da109845`

### Golden contract

`id-fingerprint-release-golden-v1.ts` شامل:

- Schema/ID `candidate-not-final` status
- تمام counts و frozen comparison hashes
- ID Namespace counts
- canonical sorted-line payload نمونه
- expected test-only SHA-256
- fallback encoded mapping
- exact primary before Alias
- alias-only mapping
- unresolved and ambiguous fail-closed cases
- 9-case source replacement matrix

### Checkpoint CI

Nutrition Core:

- Run `30863067237` — success
- Artifact `8875067557`
- Digest `sha256:85036aeaf6c55156ab0dafb0592706b60dbd153cf410f778cdf8db7201ce691a`
- Existing 43 tests pass
- Existing 12-source AST boundary pass
- Golden fixture compiles

Web/PWA:

- Run `30863067246` — success
- Artifact `8875083961`
- Digest `sha256:7d0f58570a4c8d258f59c2b0fae24b46c3ed1ae7697a4ff45d989df9158c1a85`
- Build/visual/PWA runtime gates pass

### Claim boundary

این checkpoint فقط ثابت می‌کند:

- Authority/Golden files سالم‌اند؛
- Regression قبلی وجود ندارد؛
- Draft PR قابل Review است.

این checkpoint اثبات نمی‌کند:

- Batch 5 parity انجام شده؛
- Full 261/13,225 set Hashها در این Branch recompute شده‌اند؛
- Schema/ID Candidate Final شده؛
- APIهای mapping/payload/precedence ساخته شده‌اند.

### وضعیت پایان Entry

- PR #22 Draft و باز است.
- Implementation وجود ندارد.
- parity `.test.ts` وجود ندارد.
- Red CI ثبت نشده است.
- Supabase/Auth/AI/Repository/Web adapter شروع نشده‌اند.

### Exact continuation point

1. هر دو سند اجباری و PR #22 دوباره خوانده شوند.
2. Review threadها و Head/CI بررسی شوند.
3. parity tests قبل از implementation نوشته شوند.
4. Red CI ناشی از نبود mapping/payload/precedence APIs ثبت شود.
5. Pure implementation اضافه شود.
6. `node:crypto` فقط در Test layer استفاده شود.
7. Package exports، README و CI metadata به‌روزرسانی شوند.
8. Nutrition Core CI و Web CI پاس شوند.
9. Reviewها رفع و اسناد دوباره Update شوند.
10. PR #22 تا آن زمان Draft باقی بماند.

**Issue #16 و #17 باز هستند. Supabase، Auth، AI، Repository runtime و Web adapter خارج از Scope باقی می‌مانند.**

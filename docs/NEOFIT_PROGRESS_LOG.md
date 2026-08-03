# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Batch 4 Merge و Batch 5 ID/Fingerprint Authority

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
| 3 | فعال | Batch 1–4 merged، Batch 5 Authority/Golden active |
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

- Authority `200f60e02f8503e418e04ec6d79f4d3e087d2d37`
- Golden `56dd449fb9aa169c00b60057aa26dff594d1e0d0`
- Expected Red test commit `58552cb7c8a586aa064b676096d23cfa77f26137`
- Expected Red CI `30861996867`
- Estimator `19b0fdc8f47a76996450e5a829113cc001bf036b`
- Export `7128badbda60a581f860067aae28f24fd0d7cfb3`
- Final branch head `036207aaf722253a66aaffb1949949c3002296af`
- Nutrition CI `30862460190`
- Artifact `8874842655`
- Digest `sha256:10e1b877cf7e26f2ebdf7e55cfa97ea547d82db99a0b8144638651e9098741c0`
- Web CI `30862460176`
- Web Artifact `8874859573`
- Digest `sha256:796468a9f3b83c57289ab03c5f5e872a30bf0ab881aff2a3ce0d56e8245e8fc8`
- 43/43 pass، 12 Pure files
- PR #21 Merge `d6c0df31999595096224ec1011574245d5dc75ad`

---

## Entry 012 — Stage 3 Batch 5: ID/Fingerprint/Release Authority start

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۳:۰۵ ایران  
**Issue:** #17  
**Branch:** `stage3/id-fingerprint-release-parity`  
**Base:** Batch 4 Merge `d6c0df31999595096224ec1011574245d5dc75ad`

### پایان Batch 4

- PR #21 Ready شد.
- Review thread و Review submission باز/ثبت‌شده: صفر.
- PR با expected head Merge شد.
- Merge commit `d6c0df31999595096224ec1011574245d5dc75ad`.
- Issue #17 با Final CI/Artifact و 43/43 evidence Comment شد و باز ماند.

### Branch جدید

- `stage3/id-fingerprint-release-parity`
- دقیقاً از Merge commit Batch 4 ساخته شد.

### پروتکل شروع

- هر دو سند اجباری روی Branch جدید دوباره خوانده شدند.
- پیش از هر Implementation، Authorityهای Freeze/ID/Mapping/Precedence خوانده شدند.

### Authority خوانده‌شده

- Freeze audit generator
  - `mobile/scripts/audit-schema-freeze-candidate.ts`
  - Blob `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c`
- Schema/ID candidate document
  - Blob `0f372496cbad2ecf5cca72a6fdf7604255179be0`
- Nutrition RC freeze document
  - Blob `3c0601f469c6d15618fcadd1179c16c581da6f6e`
- Catalog Release contract test
  - Blob `73d61f35383f3acb7298ec2fa5e0c5dd2989c457`
- Catalog Manifest
  - Blob `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Iranian Canon CSV
  - Blob `175b8754c1afd4f6bcd2303d8b1113f3bf211ed5`
- Persian Alias CSV
  - Blob `94429b1937edc6234b23fc8398531b531a891cc2`
- Legacy app profiles
  - Blob `6810dffaf51afdf8b7161d3c9eb8028ae5add4be`
- Fallback app profiles
  - Blob `62be2ae9ebb1f5bf448b848bf0e502a6d1870aa0`
- Base migrations
  - Blob `e6c9eede66f2bfe4c32a726ff010d0f96033dc02`
- Migration plan v5
  - Blob `1176a7084784822ed012511b2b3e49ca11dd1fa4`
- Food source precedence
  - Blob `b68655faba8ba8f526f6c358ffd1ff06aa532edd`
- Promotion/precedence test
  - Blob `740432a8568f2f3f70aed69f41ec19d0da109845`

### Freeze distinction

- Nutrition RC/Catalog `1.2.0`: frozen release candidate
- Schema/ID `1.1.0`: `candidate-not-final`
- هیچ Public stable compatibility promise وجود ندارد.

### Baseline ثبت‌شده

Schema:

- migration version/count `5 / 5`
- tables `23`
- objects `43`
- SHA `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`

Identifiers:

- Generic food IDs `13,225`
- Generic concepts `9,279`
- Generic mappings `13,225`
- Canon IDs `261`
- App profiles `261`
- Legacy `83`
- Fallback `178`
- App→Canon mappings `261`
- Alias mappings `218`
- unresolved/ambiguous `0 / 0`

Hashها در پلن مادر و Golden fixture کامل ثبت شدند.

### Mapping algorithm

1. encoded fallback Canon ID
2. exact normalized primary Persian name
3. aliases only if primary has no match

Outcomes:

- one candidate → mapping
- zero → unresolved
- multiple → ambiguous

### Source replacement precedence

- seeded incoming replaces seeded only
- imported incoming replaces seeded/imported only
- custom incoming replaces custom only

SQLite predicate/Repository restore خارج از Pure Core باقی می‌ماند؛ pure decision function می‌تواند استخراج شود.

### Canonical fingerprint payload

- ascending sort
- newline-delimited strings
- final newline
- SHA-256 UTF-8 در Test/Audit layer

### فایل‌های ساخته‌شده

- `docs/NEOFIT_ID_FINGERPRINT_RELEASE_AUTHORITY_MAP.md`
  - Commit `96abf2c472b6f30e1383785a2ad8003899b27753`
- `packages/nutrition-core/tests/id-fingerprint-release-golden-v1.ts`
  - Commit `785796941cf22a09baabd5bc48ccfc3544091843`

Golden coverage:

- تمام Freeze counts/hashes/status
- canonical ID/mapping/Alias payload نمونه و SHA
- fallback encoded mapping
- primary-before-alias precedence
- alias-only mapping
- unresolved/ambiguous fail-closed
- 9-case source replacement matrix

### وضعیت پایان Entry

- Batch 5 implementation وجود ندارد.
- parity `.test.ts` وجود ندارد.
- Red CI ثبت نشده است.
- Draft PR هنوز باز نشده است.
- هیچ Batch 5 success ادعا نمی‌شود.
- `node:crypto`/SQLite/migrations در Pure Core وارد نشده‌اند.

### Exact continuation point

1. CI Head Authority/Golden/docs بررسی شود.
2. Draft PR Batch 5 با no-parity status باز شود.
3. Tests قبل از implementation نوشته شوند.
4. Red CI ناشی از نبود APIها ثبت شود.
5. Pure canonical payload، mapping resolver و source precedence استخراج شوند.
6. `node:crypto` فقط در tests Hash parity را محاسبه کند.
7. Package exports/README/CI metadata به‌روزرسانی شوند.
8. Nutrition Core CI و Web CI پاس شوند.
9. Reviewها رفع و دو سند اجباری دوباره Update شوند.

**Issue #16 و #17 باز هستند. Supabase، Auth، AI، Repository runtime و Web adapter خارج از Scope باقی می‌مانند.**

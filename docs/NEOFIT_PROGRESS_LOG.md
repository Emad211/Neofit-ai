# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Batch 5 implementation parity

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
| 3 | فعال | Batch 1–4 merged، Batch 5 PR #22 در Gate نهایی |
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
- `10/10` pass

### Stage 3 Batch 2

- PR #19 Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- `25/25` pass

### Stage 3 Batch 3

- PR #20 Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- `34/34` pass

### Stage 3 Batch 4

- PR #21 Merge `d6c0df31999595096224ec1011574245d5dc75ad`
- Final head `036207aaf722253a66aaffb1949949c3002296af`
- Nutrition CI `30862460190`
- Artifact `8874842655`
- Web CI `30862460176`
- Artifact `8874859573`
- `43/43` pass، 12 Pure source files

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

Authority/Golden checkpoint:

- initial head `f02848dbffc9945793b21b4e4f9da8c6a56f6e23`
- Nutrition CI `30863067237` — success
- Artifact `8875067557`
- Web CI `30863067246` — success
- Artifact `8875083961`
- final handoff head `707a16f91158e465f3571d683de91d0fefe7be62`
- Nutrition CI `30863247927` — success
- Artifact `8875133688`
- Web CI `30863247923` — success
- Artifact `8875149780`

Checkpoint ثابت کرد Authority/Golden سالم است؛ Implementation، parity test و Full Hash recomputation هنوز وجود نداشت.

---

## Entry 014 — Batch 5 Test-first implementation

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۰۴:۱۰ تا ۰۴:۲۰ ایران  
**Branch:** `stage3/id-fingerprint-release-parity`  
**PR:** #22  
**Issue:** #17

### وضعیت شروع

- هر دو سند اجباری دوباره کامل خوانده شدند.
- PR #22 باز، Draft و Mergeable بود.
- Head شروع `707a16f91158e465f3571d683de91d0fefe7be62`.
- Nutrition CI `30863247927` success.
- Web CI `30863247923` success.
- Review thread باز: صفر.

### Test-first Red

Commit:

- `8214f2780d0c15d890097ba8081c123b53f90947`
- فایل `packages/nutrition-core/tests/id-fingerprint-release-parity.test.ts`

Tests قبل از Implementation این قراردادها را قفل کردند:

- Authority Blob provenance
- Snapshot کامل `candidate-not-final`
- silent Final promotion rejection
- count/coverage/one-to-one invariants
- canonical sorted/newline/final-newline payload
- test-only SHA-256 sample parity
- Persian identity normalization
- encoded fallback mapping
- exact primary before Alias
- alias-only mapping
- unresolved/ambiguous fail-closed
- deterministic sorted mapping output
- complete 3×3 source replacement matrix

Red evidence:

- Nutrition CI `30866441913` — expected failure
- Golden provenance pass
- AST pure-boundary pass روی 12 فایل قبلی
- TypeScript فقط به‌علت نبود APIهای Batch 5 شکست خورد:
  - `IDENTITY_FREEZE_CANDIDATE`
  - `canonicalFingerprintPayload`
  - `normalizeIdentityPersian`
  - `resolveAppProfilesToCanon`
  - `canFoodCatalogSourceReplace`
  - validator/type exports
- Test execution skipped شد.
- preflight Artifact `8876268829`
- Digest `sha256:b2bb9914efd8f5e974506a0908a5df2b272e017bdd250eb3be3292f54e682eac`

### Pure implementation

Commit:

- `039eb52f944bd253cff0fa24f15f9af3a2c4d0ee`
- فایل `packages/nutrition-core/src/id-fingerprint-release.ts`

Implemented:

- `IdentityFreezeCandidate`
- `IDENTITY_FREEZE_CANDIDATE`
- `validateIdentityFreezeCandidate`
- `canonicalFingerprintPayload`
- `normalizeIdentityPersian`
- `resolveAppProfilesToCanon`
- `FoodCatalogSourceType`
- `canFoodCatalogSourceReplace`

Export commit:

- `44f0b6cb265186704ea845db183b36292fd65955`

### Boundary decisions

- Snapshot counts و Hashes از Catalog/Schema constants قبلی compose می‌شوند؛ Authority مستقل جدید اختراع نشده است.
- `canonicalFingerprintPayload` Crypto اجرا نمی‌کند.
- `node:crypto` فقط در Test layer باقی ماند.
- Resolver عین ترتیب Audit generator است.
- SQLite، filesystem، migrations و Repository runtime وارد Pure Core نشدند.

### First Green

- Nutrition CI `30866552575` — success
- AST boundary: 13 Pure TypeScript files pass
- strict TypeScript pass
- tests `52/52` pass
- 0 fail، 0 skipped
- Artifact `8876307563`
- Digest `sha256:38aa76624560e187da5e5d79b0832d171778da51ca23bc9310f04e155b363a32`

### README و CI evidence

- README commit `c5765d104ec25c727f10ba5635fd61dec9731186`
- CI provenance/metadata commit `37315232c222001f9cb9fcaf56eb4993208335db`

CI metadata اکنون ثبت می‌کند:

- Audit generator/source precedence/promotion-test Blobs
- Freeze version/status
- mapping/unresolved/ambiguous counts
- Resolver precedence
- fingerprint payload format
- crypto boundary = test-only

### Final implementation validation

Nutrition:

- Run `30866657790` — success
- Artifact `8876345516`
- Digest `sha256:02ab4e012a346eec96152ab7906aae50b898d09d2143d565d61f0dd7853f503b`

Web/PWA:

- Run `30866657781` — success
- Artifact `8876366702`
- Digest `sha256:330ede033ce3a6856497f217fbfbe82a04e69a1e968aab050b7ba0dd7491aad9`

### رفتار اثبات‌شده

- complete candidate Snapshot equals Golden baseline
- `candidate-not-final` cannot silently become Final
- broken profile sum، mapping coverage و one-to-one mapping reject می‌شوند
- sample ID/mapping/Alias payload hashes match with test-only crypto
- Persian normalization matches Audit algorithm
- encoded fallback mapping wins without relying on display names
- exact primary name wins before Alias
- Alias route works only when primary route absent است
- unresolved and ambiguous remain explicit
- output independent of input order است
- all 9 source replacement cases match frozen precedence
- Web/PWA regression remains green

### Claim boundary

این Batch Pure contract parity را ثابت می‌کند. Full production Asset/Schema Hash recomputation داخل runtime Core اجرا نشده و Schema/ID Candidate به Final ارتقا نیافته است.

### عمداً خارج از Scope

- crypto runtime
- SQLite/filesystem/migrations
- Repository restore/synchronize
- Supabase/Auth/RLS
- AI/Vision
- Web adapter

### Gate پایان Entry

- Master Plan و Progress Log با Implementation evidence به‌روزرسانی شدند.
- PR #22 تا CI اسناد و Review نهایی Draft باقی می‌ماند.

### Exact continuation point

1. CI روی Commitهای اسناد بررسی شود.
2. PR #22 و Review threadها دوباره خوانده شوند.
3. PR فقط پس از سبز ماندن Nutrition/Web CI از Draft به Ready تبدیل شود.
4. Findingهای جدید رفع شوند.
5. PR #22 با expected head Merge شود.
6. Issue #17 باز بماند و Batch 5 completed ثبت شود.
7. Branch Batch 6 از Merge commit ساخته شود.
8. Web adapter، fixture/model layer و هر arithmetic تکراری داخل `web/` Inventory شود.
9. Golden adapter tests قبل از implementation ساخته شوند.

**Issue #16 و #17 باز هستند. Supabase، Auth، AI، Repository runtime و sync خارج از Scope باقی می‌مانند.**

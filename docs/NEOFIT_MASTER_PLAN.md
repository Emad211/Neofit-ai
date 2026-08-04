# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 5 implementation parity  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/id-fingerprint-release-parity`  
**Active PR:** #22 — Draft تا Gate نهایی اسناد/Review  
**Stage 3 Issue:** #17  
**Deferred Vercel Issue:** #16  
**Batch 5 base:** Batch 4 merge `d6c0df31999595096224ec1011574245d5dc75ad`  
**Validated implementation/metadata head:** `37315232c222001f9cb9fcaf56eb4993208335db`  
**Nutrition Core CI:** `30866657790` — success  
**Nutrition artifact:** `8876345516`  
**Nutrition digest:** `sha256:02ab4e012a346eec96152ab7906aae50b898d09d2143d565d61f0dd7853f503b`  
**Web CI:** `30866657781` — success  
**Web artifact:** `8876366702`  
**Web digest:** `sha256:330ede033ce3a6856497f217fbfbe82a04e69a1e968aab050b7ba0dd7491aad9`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** CI اسناد، Review نهایی، Ready/Merge PR #22؛ سپس Batch 6 Web adapter بدون duplicated arithmetic

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point این سند اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای وضعیت واقعی ریپو و CI را نمی‌گیرد.

## ۲. معماری و قراردادهای قفل‌شده

- Web: Next.js App Router + TypeScript strict
- Pure nutrition domain: `packages/nutrition-core`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Supabase فقط پس از پایان Stage 3 و تأیید Organization/Region/Cost
- AI/Vision بدون اختیار تولید Nutrition
- Pure Core بدون UI، React Native، Expo، SQLite driver، Network، filesystem، environment یا crypto runtime
- `node:crypto`، `node:sqlite`، Asset loading و full audits فقط در Test/Audit/Adapter layer
- Canonical IDs، fingerprints و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.
- App-profile ID و IFKB Canonical ID Namespaceهای جدا هستند؛ Stability با Mapping صریح تعریف می‌شود.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- Imported/Custom با Seed overwrite یا downgrade نمی‌شوند.

## ۳. وضعیت مراحل

### Stage 0–2

- Pivot: PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX: PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- PWA Foundation: PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Vercel Preview/HTTPS در Issue #16 تعویق شده و پیش از Web RC اجباری است.

### Stage 3 Batch 1 — Arithmetic/domain

انجام‌شده — PR #18، Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`؛ `10/10` tests.

### Stage 3 Batch 2 — Controlled Persian Search/Ranking

انجام‌شده — PR #19، Merge `917f04e319a924dda7dfb16d079453a5e5686541`؛ `25/25` tests.

مرز ادعا: Benchmark 500تایی Controlled Alias است؛ Independent Natural Query frozen corpus منتشر نشده است.

### Stage 3 Batch 3 — Catalog Release/Provenance/Legacy Adapter

انجام‌شده — PR #20، Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`؛ `34/34` tests.

### Stage 3 Batch 4 — Universal SR/FNDDS Estimate + SQLite Equivalence

انجام‌شده — PR #21، Merge `d6c0df31999595096224ec1011574245d5dc75ad`.

Final evidence:

- Head `036207aaf722253a66aaffb1949949c3002296af`
- Nutrition CI `30862460190`
- Artifact `8874842655`
- Web CI `30862460176`
- Web Artifact `8874859573`
- `43/43` pass، 12 Pure files

### Stage 3 Batch 5 — Canonical ID/Fingerprint/Release Parity

**پیاده‌سازی و Parity سبز؛ PR #22 در Gate نهایی.**

#### Authority

- `docs/NEOFIT_ID_FINGERPRINT_RELEASE_AUTHORITY_MAP.md`
- Freeze audit generator Blob `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c`
- Schema/ID candidate doc Blob `0f372496cbad2ecf5cca72a6fdf7604255179be0`
- Nutrition RC freeze doc Blob `3c0601f469c6d15618fcadd1179c16c581da6f6e`
- Catalog release contract test Blob `73d61f35383f3acb7298ec2fa5e0c5dd2989c457`
- Canon CSV Blob `175b8754c1afd4f6bcd2303d8b1113f3bf211ed5`
- Alias CSV Blob `94429b1937edc6234b23fc8398531b531a891cc2`
- Legacy profiles Blob `6810dffaf51afdf8b7161d3c9eb8028ae5add4be`
- Fallback profiles Blob `62be2ae9ebb1f5bf448b848bf0e502a6d1870aa0`
- Base migrations Blob `e6c9eede66f2bfe4c32a726ff010d0f96033dc02`
- Migration v5 plan Blob `1176a7084784822ed012511b2b3e49ca11dd1fa4`
- Source precedence Blob `b68655faba8ba8f526f6c358ffd1ff06aa532edd`
- Promotion tests Blob `740432a8568f2f3f70aed69f41ec19d0da109845`

#### Extracted Pure surface

File:

- `packages/nutrition-core/src/id-fingerprint-release.ts`

Exports:

- `IdentityFreezeCandidate`
- `IDENTITY_FREEZE_CANDIDATE`
- `validateIdentityFreezeCandidate`
- `canonicalFingerprintPayload`
- `normalizeIdentityPersian`
- `resolveAppProfilesToCanon`
- `FoodCatalogSourceType`
- `canFoodCatalogSourceReplace`

#### Freeze and namespace contract

- Nutrition RC/Catalog `1.2.0`: frozen release candidate
- Schema/ID `1.1.0`: `candidate-not-final`
- Public stable compatibility هنوز وعده داده نشده است.
- Generic records، Generic concepts، Iranian Canon و App profiles Namespaceهای مستقل‌اند.
- App profiles با Mapping صریح و one-to-one به Canon متصل می‌شوند.
- direct App-profile/Canon ID overlap باید صفر بماند.

Frozen candidate baseline:

- migrations `5 / 5`
- tables `23`
- SQLite objects `43`
- Schema SHA `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`
- Generic food IDs `13,225`
- Generic Concept IDs `9,279`
- Generic mappings `13,225` با coverage `1.0`
- Iranian Canon IDs `261`
- App profiles `261` = legacy `83` + fallback `178`
- App→Canon mappings `261`
- Alias mappings `218`
- unresolved/ambiguous `0 / 0`

#### Mapping behavior

ترتیب دقیق:

1. encoded fallback ID: `iranian-fallback-ifkb-canon-#####`
2. exact normalized primary Persian name
3. Alias فقط در نبود Primary match

Fail-closed:

- zero candidate → unresolved
- multiple candidates → ambiguous
- exactly one → mapping
- output arrays lexicographically sorted

Persian normalization عین Audit generator است:

- NFKC
- Arabic→Persian character folding
- diacritic removal
- half-space/bidi marks → space
- punctuation removal
- whitespace collapse

#### Fingerprint payload

- values lexicographically sorted
- newline-delimited
- final newline always present
- duplicates preserved
- SHA-256 execution فقط در Test/Audit layer با `node:crypto`
- Pure Core فقط payload deterministic تولید می‌کند.

#### Source replacement matrix

- incoming `seeded` replaces existing `seeded` only
- incoming `imported` replaces existing `seeded` or `imported`
- incoming `custom` replaces existing `custom` only
- Custom و Imported در برابر reseeding محافظت می‌شوند.

#### Test-first evidence

Authority/Golden checkpoint:

- Authority commit `96abf2c472b6f30e1383785a2ad8003899b27753`
- Golden commit `785796941cf22a09baabd5bc48ccfc3544091843`
- final checkpoint head `707a16f91158e465f3571d683de91d0fefe7be62`
- Nutrition CI `30863247927` — success
- Artifact `8875133688`
- Web CI `30863247923` — success
- Web Artifact `8875149780`

Expected Red:

- Test commit `8214f2780d0c15d890097ba8081c123b53f90947`
- Nutrition CI `30866441913` — expected failure
- Golden provenance: pass
- AST boundary: pass
- TypeScript فقط به‌علت نبود APIهای Batch 5 شکست خورد.
- preflight Artifact `8876268829`
- Digest `sha256:b2bb9914efd8f5e974506a0908a5df2b272e017bdd250eb3be3292f54e682eac`

Implementation:

- Pure implementation commit `039eb52f944bd253cff0fa24f15f9af3a2c4d0ee`
- Package export commit `44f0b6cb265186704ea845db183b36292fd65955`

First Green:

- Nutrition CI `30866552575` — success
- `52/52` pass، 0 fail، 0 skipped
- 13 Pure TypeScript source files pass AST boundary
- Artifact `8876307563`
- Digest `sha256:38aa76624560e187da5e5d79b0832d171778da51ca23bc9310f04e155b363a32`

README/CI provenance:

- README commit `c5765d104ec25c727f10ba5635fd61dec9731186`
- CI metadata head `37315232c222001f9cb9fcaf56eb4993208335db`

Final implementation validation:

- Nutrition CI `30866657790` — success
- Artifact `8876345516`
- Digest `sha256:02ab4e012a346eec96152ab7906aae50b898d09d2143d565d61f0dd7853f503b`
- Web CI `30866657781` — success
- Web Artifact `8876366702`
- Web digest `sha256:330ede033ce3a6856497f217fbfbe82a04e69a1e968aab050b7ba0dd7491aad9`

#### Proven behavior

- complete candidate Snapshot equals Golden baseline
- silent promotion to `final` rejected
- count/coverage/one-to-one invariants fail closed
- canonical sample payload SHA values match with test-only crypto
- Persian normalization parity passes
- encoded fallback mapping passes
- exact primary outranks Alias
- Alias-only mapping passes
- unresolved and ambiguous outputs remain explicit
- mapping output deterministic across input order
- complete 3×3 source replacement matrix passes
- Web/PWA regression remains green

#### Claim boundary

Batch 5 proves Pure mapping، payload، validation و replacement-decision parity against Golden fixtures. It does not recompute the complete production Schema/Asset Hashes inside runtime Core and does not promote Schema/ID candidate to Final.

### Remaining Stage 3

1. Batch 6 — Web adapter without duplicated arithmetic
2. Stage 3 closure evidence and Issue #17 close decision

## ۴. Stage 4–9

- Stage 4: Supabase پس از Stage 3 و تأیید هزینه
- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Offline Catalog/Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC و بستن Issue #16

## ۵. Anti-goalها

- Supabase پیش از Stage 3 parity
- معرفی Schema/ID candidate به‌عنوان Final
- واردکردن crypto/SQLite/filesystem/migrations به Pure runtime
- direct string identity فرض‌کردن App profile و Canon ID
- Alias override روی exact primary identity
- silent unresolved/ambiguous mapping
- تغییر replacement precedence بدون Migration/Review
- duplicated nutrition arithmetic در Web adapter
- ادعای Full production audit از Golden fixtures

## ۶. Exact continuation point

1. Nutrition Core CI و Web CI روی Commitهای این دو سند پاس شوند.
2. PR #22 و تمام Review threadها دوباره بررسی شوند.
3. PR #22 فقط پس از سبز ماندن CI از Draft به Ready تبدیل شود.
4. Reviewهای جدید رفع شوند.
5. PR #22 با expected head Merge شود.
6. Issue #17 باز بماند و Batch 5 completed ثبت شود.
7. Branch متمرکز Batch 6 از Merge commit ساخته شود.
8. پیش از کد Batch 6 این موارد Inventory شوند:
   - Web fixture/model layer
   - Meal logging/search adapters
   - Package import/build strategy
   - هر محاسبهٔ calories/macros داخل `web/`
9. Adapter فقط داده را به `@neofit/nutrition-core` تبدیل کند و arithmetic را تکرار نکند.
10. Golden adapter tests پیش از implementation ساخته شوند.
11. Supabase، Auth، AI/Vision و persistence sync خارج از Scope بمانند.

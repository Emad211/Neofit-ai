# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 Batch 5 ID/Fingerprint Golden checkpoint  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/id-fingerprint-release-parity`  
**Active PR:** #22 — Draft  
**Stage 3 Issue:** #17  
**Deferred Vercel Issue:** #16  
**Batch 5 base:** Batch 4 merge `d6c0df31999595096224ec1011574245d5dc75ad`  
**Validated Authority/Golden head:** `f02848dbffc9945793b21b4e4f9da8c6a56f6e23`  
**Nutrition Core CI:** `30863067237` — success  
**Nutrition artifact:** `8875067557`  
**Nutrition digest:** `sha256:85036aeaf6c55156ab0dafb0592706b60dbd153cf410f778cdf8db7201ce691a`  
**Web CI:** `30863067246` — success  
**Web artifact:** `8875083961`  
**Web digest:** `sha256:7d0f58570a4c8d258f59c2b0fae24b46c3ed1ae7697a4ff45d989df9158c1a85`  
**مرحلهٔ فعال:** Stage 3 — Nutrition Core Extraction و Parity  
**Gate فعلی:** test-first implementation Batch 5؛ PR #22 عمداً Draft و no-parity است

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point این سند اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای ریپو و CI را نمی‌گیرد.

## ۲. معماری و قراردادهای قفل‌شده

- Web: Next.js App Router + TypeScript strict
- Pure nutrition domain: `packages/nutrition-core`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Supabase فقط پس از پایان Stage 3 و تأیید Organization/Region/Cost
- AI/Vision بدون اختیار تولید Nutrition
- Pure Core بدون UI، React Native، Expo، SQLite driver، Network، filesystem یا environment access
- `node:crypto`، `node:sqlite` و Asset loading فقط در Test/Audit/Adapter layer
- Canonical IDs، fingerprints و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.
- App-profile ID و IFKB Canonical ID Namespaceهای جدا هستند؛ Stability با Mapping صریح تعریف می‌شود.

## ۳. وضعیت مراحل

### Stage 0–2

- Pivot: PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX: PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- PWA Foundation: PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Vercel Preview/HTTPS در Issue #16 تعویق شده و پیش از Web RC اجباری است.

### Stage 3 Batch 1

انجام‌شده — PR #18، Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`؛ 10/10 tests.

### Stage 3 Batch 2

انجام‌شده — PR #19، Merge `917f04e319a924dda7dfb16d079453a5e5686541`؛ 25/25 tests.

### Stage 3 Batch 3

انجام‌شده — PR #20، Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`؛ 34/34 tests.

### Stage 3 Batch 4

انجام‌شده — PR #21، Merge `d6c0df31999595096224ec1011574245d5dc75ad`.

Final evidence:

- Head `036207aaf722253a66aaffb1949949c3002296af`
- Nutrition CI `30862460190`
- Artifact `8874842655`
- Digest `sha256:10e1b877cf7e26f2ebdf7e55cfa97ea547d82db99a0b8144638651e9098741c0`
- Web CI `30862460176`
- Web Artifact `8874859573`
- Digest `sha256:796468a9f3b83c57289ab03c5f5e872a30bf0ab881aff2a3ce0d56e8245e8fc8`
- 43/43 pass، 12 Pure files

Completed:

- Universal SR/FNDDS estimator
- FNDDS `0.15` / SR Legacy `0.08` uncertainty
- direct Golden-row SQLite↔TypeScript center parity
- grams boundaries و missing-value preservation

### Stage 3 Batch 5 — Canonical ID/Fingerprint/Release Parity

**فعال؛ Authority/Golden checkpoint سبز، Implementation شروع‌نشده است.**

Branch/PR:

- Branch `stage3/id-fingerprint-release-parity`
- PR #22 — Draft
- Base `d6c0df31999595096224ec1011574245d5dc75ad`

Authority document:

- `docs/NEOFIT_ID_FINGERPRINT_RELEASE_AUTHORITY_MAP.md`

Golden fixture:

- `packages/nutrition-core/tests/id-fingerprint-release-golden-v1.ts`

Authority Blobها:

- Freeze audit generator `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c`
- Schema/ID candidate doc `0f372496cbad2ecf5cca72a6fdf7604255179be0`
- Nutrition RC freeze doc `3c0601f469c6d15618fcadd1179c16c581da6f6e`
- Catalog release contract test `73d61f35383f3acb7298ec2fa5e0c5dd2989c457`
- Catalog Manifest `f6bcc7bbeeed078b2798b625591b08a11bce0b78`
- Canon CSV `175b8754c1afd4f6bcd2303d8b1113f3bf211ed5`
- Alias CSV `94429b1937edc6234b23fc8398531b531a891cc2`
- Legacy profiles `6810dffaf51afdf8b7161d3c9eb8028ae5add4be`
- Fallback profiles `62be2ae9ebb1f5bf448b848bf0e502a6d1870aa0`
- Base migrations `e6c9eede66f2bfe4c32a726ff010d0f96033dc02`
- Migration v5 plan `1176a7084784822ed012511b2b3e49ca11dd1fa4`
- Source precedence `b68655faba8ba8f526f6c358ffd1ff06aa532edd`
- Promotion tests `740432a8568f2f3f70aed69f41ec19d0da109845`

Freeze status:

- Nutrition RC/Catalog `1.2.0`: frozen release candidate
- Schema/ID `1.1.0`: `candidate-not-final`
- Public stable compatibility هنوز وعده داده نشده است.

Schema baseline:

- migration version/count `5 / 5`
- tables `23`
- SQLite objects `43`
- schema SHA `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`

Identifier baseline:

- Generic food IDs: `13,225` / `8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d`
- Generic Concept IDs: `9,279` / `23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8`
- Generic mappings: `13,225` / `6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9`
- Iranian Canon IDs: `261` / `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c`
- App profiles: `261` / `0f86759cd45e9d3456cddb090e9ebd5a75c46f44a2fa9c6dc8b9fadd5c215f4a`
- Legacy profiles: `83` / `b35f8936a5effab341775c3b7864aeaa5a190da8604e88c6b6e72b431b673e01`
- Fallback profiles: `178` / `8dcd4aeaa07331043eeb25e47999e43956d9c78e640f220b0831fca805bf7560`
- App→Canon mappings: `261` / `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71`
- Alias mappings: `218` / `9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e`
- unresolved/ambiguous `0 / 0`

Mapping precedence:

1. encoded fallback Canon ID
2. exact normalized primary Persian name
3. Alias only if primary match absent

Fail-closed:

- zero candidates → unresolved
- multiple candidates → ambiguous
- exactly one → mapping

Canonical fingerprint payload:

- ascending sorted strings
- newline-delimited
- final newline
- SHA-256 UTF-8 فقط در Test/Audit layer

Source replacement matrix:

- incoming seeded replaces existing seeded only
- incoming imported replaces existing seeded/imported only
- incoming custom replaces existing custom only

Pure target:

- typed Identity/Freeze contracts
- Persian identity normalizer
- deterministic App-profile→Canon resolver
- canonical fingerprint payload builder بدون crypto I/O
- `FoodCatalogSourceType` و `canFoodCatalogSourceReplace`

Golden coverage:

- تمام counts/hashes/status
- نمونهٔ ID/mapping/Alias payload و expected SHA
- fallback encoded mapping
- primary-before-alias
- alias-only
- unresolved/ambiguous
- 9-case source precedence matrix

Authority/Golden checkpoint evidence:

- Authority commit `96abf2c472b6f30e1383785a2ad8003899b27753`
- Golden commit `785796941cf22a09baabd5bc48ccfc3544091843`
- Docs/PR head `f02848dbffc9945793b21b4e4f9da8c6a56f6e23`
- Nutrition CI `30863067237` — success
- Artifact `8875067557`
- Digest `sha256:85036aeaf6c55156ab0dafb0592706b60dbd153cf410f778cdf8db7201ce691a`
- Web CI `30863067246` — success
- Web Artifact `8875083961`
- Digest `sha256:7d0f58570a4c8d258f59c2b0fae24b46c3ed1ae7697a4ff45d989df9158c1a85`

این checkpoint فقط سلامت Authority/Golden و Regression قبلی را اثبات می‌کند. Batch 5 `.test.ts` و Implementation وجود ندارند و هیچ Batch 5 parity claim مجاز نیست.

### Remaining Stage 3

1. تکمیل Batch 5 implementation/parity
2. Batch 6 — Web adapter بدون duplicated arithmetic

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
- کپی Hash ثابت بدون Authority/Golden
- واردکردن `node:crypto`، SQLite، filesystem یا migrations به Pure Core
- direct string identity فرض‌کردن App profile و Canon ID
- Alias override روی exact primary identity
- silent unresolved/ambiguous mapping
- تغییر replacement precedence بدون Migration/Review
- ادعای Full audit از روی Golden fixture

## ۶. Exact continuation point

1. این فایل و `docs/NEOFIT_PROGRESS_LOG.md` دوباره خوانده شوند.
2. PR #22، Head، CI و Reviewها بررسی شوند.
3. Mapping/payload/precedence parity tests قبل از Implementation نوشته شوند.
4. Red CI ناشی از نبود APIها ثبت شود.
5. Pure canonical payload، mapping resolver و source precedence استخراج شوند.
6. `node:crypto` فقط در Test layer برای Hash parity استفاده شود.
7. Freeze snapshot باید `candidate-not-final` باقی بماند.
8. Package exports، README و CI metadata به‌روزرسانی شوند.
9. Nutrition Core CI و Web CI پاس شوند.
10. Reviewها رفع و دو سند اجباری دوباره Update شوند.
11. PR #22 تا آن زمان Draft باقی بماند.
12. Supabase، Auth، AI، Repository runtime و Web adapter خارج از Scope بمانند.

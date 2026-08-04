# NeoFit Canonical ID, Fingerprint and Release Parity — Authority Map

**وضعیت:** مرجع Stage 3 Batch 5  
**تاریخ ثبت:** ۴ اوت ۲۰۲۶  
**Issue:** #17  
**Branch:** `stage3/id-fingerprint-release-parity`  
**مبنای Branch:** Batch 4 merge `d6c0df31999595096224ec1011574245d5dc75ad`  
**مرجع Native/IFKB:** `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

## ۱. هدف Batch 5

Batch 5 باید قراردادهای شناسه، mapping، fingerprint و Release status را برای مهاجرت وب تثبیت کند، بدون اینکه Hashهای Audit را دوباره از روی Fixture نمایشی اختراع کند.

سطح هدف:

- Namespaceهای پایدار Generic، Iranian Canon و App Profile
- ترتیب و fail-closed بودن App-profile → Canon mapping
- Canonical fingerprint payload contract
- Schema/ID candidate snapshot validation
- Runtime source-replacement precedence
- Release status distinction: frozen Nutrition RC در برابر non-final Schema/ID candidate
- Test-only recomputation با `node:crypto`/`node:sqlite`

## ۲. Source authority و Blobهای دقیق

| منبع | Blob SHA | نقش |
|---|---|---|
| `mobile/scripts/audit-schema-freeze-candidate.ts` | `ddcf4cfceefcecf2d1f9d8ad922e4472c212bc1c` | Generator اصلی Schema/ID/Fingerprint candidate |
| `docs/releases/NEOFIT_SCHEMA_ID_FREEZE_CANDIDATE_V1.md` | `0f372496cbad2ecf5cca72a6fdf7604255179be0` | Baseline مستند `candidate-not-final` |
| `docs/releases/NEOFIT_NUTRITION_RELEASE_CANDIDATE_FREEZE_V1.md` | `3c0601f469c6d15618fcadd1179c16c581da6f6e` | Nutrition RC و Catalog contract فریز‌شده |
| `mobile/tests/catalog-release-contract.test.ts` | `73d61f35383f3acb7298ec2fa5e0c5dd2989c457` | Asset bytes/SHA/Manifest ↔ runtime projection |
| `mobile/assets/ifkb/ifkb-universal-v1.manifest.json` | `f6bcc7bbeeed078b2798b625591b08a11bce0b78` | Generated Catalog Manifest `1.2.0` |
| `ifkb/universal/iranian_canon_v1.csv` | `175b8754c1afd4f6bcd2303d8b1113f3bf211ed5` | 261 Canonical Iranian identities |
| `ifkb/universal/persian_search_aliases_v1.csv` | `94429b1937edc6234b23fc8398531b531a891cc2` | 218 Alias→target records |
| `mobile/src/data/iranian-food-seed.ts` | `6810dffaf51afdf8b7161d3c9eb8028ae5add4be` | 83 Legacy app-profile namespace |
| `mobile/src/data/iranian-fallback-seed.generated.ts` | `62be2ae9ebb1f5bf448b848bf0e502a6d1870aa0` | 178 generated fallback profiles |
| `mobile/src/db/migrations.ts` | `e6c9eede66f2bfe4c32a726ff010d0f96033dc02` | Base personal DB migrations |
| `mobile/src/db/migration-plan.ts` | `1176a7084784822ed012511b2b3e49ca11dd1fa4` | Migration v5 provenance/promotion extension |
| `mobile/src/db/food-catalog-precedence.ts` | `b68655faba8ba8f526f6c358ffd1ff06aa532edd` | Pure source-replacement matrix و SQLite predicate |
| `mobile/tests/food-catalog-promotion.test.ts` | `740432a8568f2f3f70aed69f41ec19d0da109845` | Precedence، imported/custom protection و provenance integration |

## ۳. Release status distinction

### Nutrition RC / Catalog

فریز‌شده:

- Catalog version `1.2.0`
- Database bytes `13,885,440`
- Database SHA-256 `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- Generic foods `13,225`
- Generic concepts `9,279`
- Generic mappings `13,225 / 13,225`
- Official portions `36,494`
- Iranian Canon IDs `261`

### Schema/ID snapshot

وضعیت دقیق:

- format `neofit-schema-id-freeze-candidate`
- version `1.1.0`
- status `candidate-not-final`

این Baseline قابل ممیزی است، اما Public stable compatibility promise نیست. تغییر Status به `final` بدون Freeze جدید و Review مجاز نیست.

## ۴. Personal schema fingerprint contract

- latest migration version: `5`
- migration count: `5`
- application tables: `23`
- audited SQLite objects: `43`
- schema fingerprint:
  `73e67213c7b8300723ddf91195d1c07384b2b3a0198d622a7d451af90c48bcbf`

Generator این موارد را در Fingerprint وارد می‌کند:

- normalized migration SQL
- SQLite object type/name/table/SQL hash
- columns، types، nullability، defaults، PK positions و hidden flags
- foreign keys
- indexes/triggers

اجرای Schema و Hash calculation در Audit/Test layer باقی می‌ماند؛ SQL یا `node:crypto` وارد Pure Core نمی‌شود.

## ۵. Identifier namespaces و Hash baseline

### Generic source records

- count `13,225`
- ID-set SHA-256:
  `8e1de257cb871260f9a13f6d8eee61c9290e73de159f3223e4841f565cbb6e3d`

### Generic concepts

- count `9,279`
- ID-set SHA-256:
  `23aab29455cdc9af62b16756dddb8fc5fd8d5dd3b3e429b56240e2e799b50ac8`

### Source→Concept mappings

- count `13,225`
- coverage `1.0`
- mapping-set SHA-256:
  `6a603b63c7faca46b687ca56a7087716e11d165fdfa73a1fe4488475e46559c9`

### IFKB Canonical Iranian IDs

- namespace `IFKB-CANON-*`
- count `261`
- ID-set SHA-256:
  `6759ea828bea201299f5f11eacc2e8ebc6247b45767357e103a39d12f02e907c`

### App-profile IDs

Combined:

- count `261`
- ID-set SHA-256:
  `0f86759cd45e9d3456cddb090e9ebd5a75c46f44a2fa9c6dc8b9fadd5c215f4a`

Legacy namespace:

- count `83`
- SHA-256:
  `b35f8936a5effab341775c3b7864aeaa5a190da8604e88c6b6e72b431b673e01`

Fallback namespace:

- pattern `iranian-fallback-ifkb-canon-#####`
- count `178`
- SHA-256:
  `8dcd4aeaa07331043eeb25e47999e43956d9c78e640f220b0831fca805bf7560`

App-profile strings عمداً با Canonical strings یکسان نیستند. Stability با Mapping صریح تعریف می‌شود، نه با direct string identity.

## ۶. App-profile → Canon mapping contract

نتیجهٔ Freeze:

- mapping count `261`
- unresolved `0`
- ambiguous `0`
- one-to-one coverage `261 / 261`
- mapping-set SHA-256:
  `ea66d4b2b532bff1ec2f637c136adb90fa110f00cc67ca51209bc816d08ffe71`

ترتیب Resolver قفل‌شده:

1. fallback ID encoded Canon number
2. exact normalized primary Persian name
3. aliases، فقط وقتی primary match وجود ندارد

Fail-closed outcomes:

- zero candidate → unresolved
- بیش از یک candidate → ambiguous
- فقط دقیقاً یک candidate → mapping

Aliasهای broad نباید primary identity دقیق را override کنند.

## ۷. Persian Alias mapping fingerprint

- rows `218`
- canonical line form:
  `alias_fa=>target_type:target`
- mapping-set SHA-256:
  `9dbfc998b90c0924e895942da18836046d94407dc860e7705c563a55f4ce777e`

Alias order در فایل منبع Authority نیست؛ canonical sorted line payload Authority Hash است.

## ۸. Canonical fingerprint payload

Generator برای Set/Mappingهای متنی از این قرارداد استفاده می‌کند:

1. values به stringهای canonical تبدیل می‌شوند.
2. ascending sort اعمال می‌شود.
3. هر value با `\n` جدا می‌شود.
4. payload با یک newline نهایی پایان می‌یابد.
5. SHA-256 روی UTF-8 payload محاسبه می‌شود.

Pure Core در صورت نیاز فقط canonical payload تولید می‌کند. `node:crypto`/filesystem/SQLite Hash execution در Test/Audit layer باقی می‌ماند.

## ۹. Source replacement precedence

ماتریس قفل‌شده:

| Existing | Seeded incoming | Imported incoming | Custom incoming |
|---|---:|---:|---:|
| seeded | allow | allow | deny |
| imported | deny | allow | deny |
| custom | deny | deny | allow |

قواعد:

- Bundled reseed فقط seeded را به‌روزرسانی می‌کند.
- Imported evidence seeded/imported را promote می‌کند، custom را نه.
- Custom فقط همان custom identity را به‌روزرسانی می‌کند.
- حذف Import باید built-in profile را restore و Canonical IDs را resynchronize کند.

`canFoodCatalogSourceReplace` Pure است و می‌تواند استخراج شود؛ SQLite predicate/trigger و Repository restore خارج از Pure Core می‌مانند.

## ۱۰. Batch 5 Pure boundary پیشنهادی

قابل استخراج به Pure Core:

- typed Identity/Freeze snapshot contract
- canonical fingerprint payload builder بدون Hash I/O
- Persian identity normalization مورد استفادهٔ Mapping Audit
- deterministic App-profile→Canon resolver
- `FoodCatalogSourceType`
- `canFoodCatalogSourceReplace`

Test-only:

- `node:crypto`
- `node:sqlite`
- اجرای migrations و recompute Hash
- comparison با Freeze baseline

خارج از Pure Core:

- Asset/CSV/DB loading
- filesystem
- migration execution
- Repository restore/synchronize
- Production persistence
- Supabase/Web adapter

## ۱۱. Claim boundary

Batch 5 می‌تواند اثبات کند:

- Pure mapping precedence و fail-closed behavior
- canonical payload/hash-input parity
- typed Freeze snapshot consistency
- source-replacement matrix parity
- Golden hash baseline consistency

Batch 5 نمی‌تواند ادعا کند:

- Freeze candidate به Final تبدیل شده است؛
- Full Catalog/Schema دوباره Audit شده، مگر Asset/Migrations واقعی در CI اجرا شوند؛
- Public backwards compatibility تضمین شده؛
- Supabase/Web storage migration آماده است.

## ۱۲. Exact implementation order

1. Golden fixture با counts/hashes/namespaces ساخته شود.
2. Mapping/precedence/payload parity tests قبل از implementation نوشته شوند.
3. Red CI ناشی از نبود APIها ثبت شود.
4. Pure mapping/payload/precedence contracts استخراج شوند.
5. `node:crypto` فقط در Test layer Hashهای Golden payload را محاسبه کند.
6. Full Freeze baseline به‌عنوان comparison constant باقی بماند؛ Status Final نشود.
7. Package exports، README و CI metadata به‌روزرسانی شوند.
8. Nutrition Core CI و Web CI پاس شوند.
9. Reviewها رفع و دو سند اجباری به‌روزرسانی شوند.

Supabase، Auth، AI/Vision، Repository runtime و Web adapter خارج از Scope هستند.

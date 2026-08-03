# NeoFit Nutrition Core — Authority Map

**وضعیت:** مرجع استخراج Stage 3  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Batch 2 Search/Ranking  
**Issue:** #17  
**Branch فعال:** `stage3/search-ranking-parity`  
**مبنای فعلی:** Batch 1 merge `c9599c4905f9fc1d28ba7e9086edf20376991740`  
**مرجع Native/IFKB:** `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

## ۱. ترتیب Authority

1. `docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`
2. `mobile/src/nutrition-core/*`
3. Mobile tests و IFKB equivalence/benchmark workflows
4. IFKB release/freeze manifests و Artifact digests
5. Repository و UI فقط برای Adapter/consumer boundaries

`mobile/` تا پایان Stage 3 Frozen parity oracle است. اختلاف با آن باید Fail و بررسی شود؛ silent fix ممنوع است.

## ۲. قراردادهای دامنه

- محاسبات deterministic TypeScript/SQLite هستند.
- AI/Vision Nutrition، وزن یا Portion تولید نمی‌کند.
- منبع داده IFKB + USDA SR Legacy + FNDDS است.
- Missing value صفر نیست و وزن نامعلوم `null` است.
- Provider nutrition نادیده گرفته می‌شود.
- Canonical ID، fingerprint و provenance ثابت می‌مانند.

## ۳. ماژول‌های استخراج‌شده

### Batch 1 — Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`

| Mobile source | Blob SHA | Package source |
|---|---|---|
| `types.ts` | `55e0100964e32b392493dd604a12e0f845b7e5e7` | `packages/nutrition-core/src/types.ts` |
| `nutrition.ts` | `53ac392d69f351e145f51db140dd5701cdcbaeab` | `packages/nutrition-core/src/nutrition.ts` |
| `recipe.ts` | `51784eb1a522eda8bee5b4ba394b67844c04db6c` | `packages/nutrition-core/src/recipe.ts` |
| `diary.ts` | `e297eed728a7457b9b46529a761e450bd647e97d` | `packages/nutrition-core/src/diary.ts` |
| `goals.ts` | `16a2d91dfa173f88f3d56b26ce58aa679df25cf3` | `packages/nutrition-core/src/goals.ts` |

Batch 1 evidence:

- PR #18
- final head `7861c4f56f0474b61d8dd9b3a7101e6b616b524d`
- Nutrition Core CI `30857715438`
- Artifact `8873108322`
- Digest `sha256:de0197b9ae9762a921a32c13071701064863aef8e77e612fb2e35bd49893d25f`
- 10/10 tests passed

### Batch 2 — PR #19 active

| Mobile source | Blob SHA | Package source |
|---|---|---|
| `search.ts` | `bb99c934beeed5094da7e0a29a8f53635ace48b3` | `packages/nutrition-core/src/search.ts` |
| `universal-catalog-ranking.ts` | `9b23b1ef7d6817ff2b946e1fdedcad76608279e1` | `packages/nutrition-core/src/universal-catalog-ranking.ts` |

Focused authority: `docs/NEOFIT_SEARCH_RANKING_AUTHORITY_MAP.md`.

Batch 2 initial evidence:

- implementation head `a7807a212315feca656c4ed88dd746cb6be752ce`
- Nutrition Core CI `30858434028`
- Artifact `8873368541`
- Digest `sha256:3fed8d5c491184280437d34f135fdc1323f3c68998a0cebeccebf911ac28ad9c`
- 25/25 tests passed
- 8 TypeScript source files passed AST pure-boundary verification

## ۴. Numeric و Missing policy

- finite non-negative nutrition inputs
- positive basis/portion factors where required
- internal canonicalization: `Number(value.toPrecision(15))`
- display rounding separate and explicit
- `-0` becomes `0`
- per-100g requires exactly `basisGrams=100`
- unknown basis rejects gram calculation
- strict aggregate omits a nutrient if any observation lacks it
- Recipe/Diary propagate unknown grams
- unknown consumed goal produces null ratio/remaining

## ۵. Search claim boundary

Controlled Persian Alias benchmark is authoritative for Batch 2. It is not an unrestricted Natural Query benchmark.

The independent Natural Query release is not available yet; its validator/privacy/annotation contract exists, but no frozen 500-row corpus exists. Generated Alias variants must not be relabelled as natural user queries.

## ۶. Pure-core boundary

Forbidden in `packages/nutrition-core/src`:

- React, React Native, Expo, Next or UI
- SQLite driver, SQL execution or repository
- filesystem, HTTP/network or environment access
- Vercel, Supabase or provider clients
- SecureStore/ImagePicker/backup transport

`verify-pure-boundary.mjs` parses static imports, side-effect imports, dynamic imports, CommonJS requires, import-equals and re-exports with the TypeScript AST.

## ۷. Remaining Stage 3 inventory

| Module/group | Current decision |
|---|---|
| `catalog-release.ts` | Batch 3 with release manifest authority |
| `catalog-provenance.ts` | Batch 3 with ID/fingerprint provenance |
| `legacy-catalog-adapter.ts` | Batch 3 after contract fixtures |
| `universal-food-estimate.ts` | Batch 4 with SR/FNDDS and SQLite equivalence |
| SQL/repositories | remain outside pure core |
| Web adapter | final Stage 3 batch after pure parity |

## ۸. Next exact authority work

After Batch 2 merge:

1. inventory catalog release/provenance/legacy adapter source and tests;
2. freeze exact manifest, fingerprint and migration contracts;
3. create Golden fixtures before extraction;
4. preserve imported/custom precedence and Canonical IDs;
5. do not start Supabase before Stage 3 completion.

# NeoFit Universal SR/FNDDS Estimate and SQLite Equivalence — Authority Map

**وضعیت:** مرجع Stage 3 Batch 4  
**تاریخ ثبت:** ۴ اوت ۲۰۲۶  
**Issue:** #17  
**Branch:** `stage3/universal-estimate-sqlite-parity`  
**مبنای Branch:** Batch 3 merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`  
**مرجع Native/IFKB:** `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

## ۱. هدف Batch 4

Batch 4 باید رفتار محاسبهٔ Nutrition برای رکوردهای عمومی USDA SR Legacy و FNDDS را از Mobile RC استخراج و با محاسبهٔ مستقیم SQLite مقایسه کند، بدون اینکه SQLite driver یا Repository را وارد Pure Core کند.

سطح هدف:

- `universalNutritionVector`
- `universalSourceUncertainty`
- `calculateUniversalFoodEstimate`
- Golden fixtures برای SR Legacy و FNDDS
- direct SQLite ↔ TypeScript equivalence در Test layer
- ثبت صریح Adapter boundary برای row mapping و Asset loading

## ۲. Source authority و Blobهای دقیق

| منبع | Blob SHA | نقش |
|---|---|---|
| `mobile/src/nutrition-core/universal-food-estimate.ts` | `7f54426e0b6838700f09b831c7df5a94afef8361` | Pure record→vector، source uncertainty و grams scaling |
| `mobile/src/db/universal-catalog-repository.ts` | `cdfacc1eafba4267cdc793284462bbabd7ca93b5` | SQLite row→Domain mapping، portions و ranker integration |
| `mobile/src/db/universal-catalog-database.ts` | `687d7b41dac26e1821a141c181fa13cdd81b2186` | Expo Asset/FileSystem/SQLite loading و runtime asset validation |
| `mobile/app/food-search.tsx` | `df367a5d598925fa56eb3b2c36e47da8df504415` | مصرف واقعی estimator برای grams و official portions |
| `mobile/tests/nutrition-sqlite-equivalence.test.ts` | `80538220517f8b4f0bc80117469b16f6a82c7bdf` | direct SQLite↔TypeScript arithmetic oracle |
| `mobile/tests/sqlite-test-helpers.ts` | `d03caf85ccfbb68b245101d0646956fd9c32e045` | Node SQLite adapter و FTS portable test substitution |
| `mobile/src/nutrition-core/sql.ts` | `35ecdbd1f5baec8ee1b5845cfd994f15b5ff769d` | canonical Nutrition SQLite schema v1 |
| `mobile/tests/universal-catalog-macro-guard.test.ts` | `3f16b43a37f98b807c3b95577102bf682bff905d` | macro-incomplete non-selectable و grams-only complete records |
| `mobile/tests/nutrition-range.test.ts` | `2fd1f7f3c601c2ae48931f50a7ca1552ff45a2a2` | relative range و missing-nutrient behavior |

## ۳. Boundary تصمیم‌گیری‌شده

### وارد Pure Core می‌شود

- `UniversalNutrientRecord`
- `universalNutritionVector`
- `universalSourceUncertainty`
- `calculateUniversalFoodEstimate`

### فقط Test layer

- `node:sqlite`
- test schema/queries
- SQLite↔TypeScript tolerance comparison
- snake_case row fixture برای اثبات Adapter semantics

### خارج از Pure Core می‌ماند

- Expo Asset و FileSystem
- `expo-sqlite`
- DB lifecycle و close policy
- SQL execution و FTS query
- Repository cache/promise state
- UI state و Diary persistence
- IndexedDB/Supabase/Web adapter

`packages/nutrition-core/src` نباید `node:sqlite`، Expo، filesystem یا Network import کند. Node SQLite فقط در `tests/` مجاز است.

## ۴. Record mapping contract

Repository رکورد SQLite را بدون ساخت مقدار جدید به Domain منتقل می‌کند:

| SQLite | Domain |
|---|---|
| `source_type` | `sourceType` |
| `calories_kcal` | `caloriesKcal` |
| `protein_g` | `proteinG` |
| `fat_g` | `fatG` |
| `carbs_g` | `carbsG` |
| `fiber_g` | `fiberG` |
| `sugars_g` | `sugarsG` |
| `sodium_mg` | `sodiumMg` |
| `cholesterol_mg` | `cholesterolMg` |
| `calcium_mg` | `calciumMg` |
| `iron_mg` | `ironMg` |
| `potassium_mg` | `potassiumMg` |
| `vitamin_c_mg` | `vitaminCMg` |

SQLite `NULL` باید `null` بماند. سپس `universalNutritionVector` آن nutrient را از `NutritionVector` حذف می‌کند؛ `NULL` هرگز صفر نیست.

## ۵. Source uncertainty policy

مرجع: `universal-food-estimate.ts`.

- FNDDS: relative fraction `0.15`
- SR Legacy: relative fraction `0.08`

این Range یک App-level uncertainty band است، نه laboratory confidence interval.

فرآیند:

1. رکورد per-100g به missing-aware vector تبدیل می‌شود.
2. Range حول per-100g center ساخته می‌شود.
3. Center و Range با `grams / 100` scale می‌شوند.
4. Numeric canonicalization همان قرارداد ۱۵ رقم معنادار Batch 1 را حفظ می‌کند.

## ۶. Input contract

`calculateUniversalFoodEstimate` فقط grams زیر را می‌پذیرد:

- finite
- بزرگ‌تر از صفر
- حداکثر `100_000`

صفر، مقدار منفی، `NaN`، `Infinity` و بیش از `100_000` fail-closed هستند.

## ۷. Selectability و Macro completeness

Macro completeness بخشی از estimator نیست؛ Gate انتخاب رکورد در Ranker/Repository است.

- `macroComplete=false`: هرگز selectable نیست.
- `macroComplete=true` با `portionCount=0`: همچنان با grams قابل استفاده است.
- estimator missing micronutrient را حفظ می‌کند و صفر نمی‌سازد.

بنابراین Batch 4 نباید `macroComplete` را به `UniversalNutrientRecord` اضافه یا Provider-style validation جدید اختراع کند.

## ۸. SQLite equivalence policy

تست Native موجود دو قرارداد را اثبات می‌کند:

1. per-100g/portion arithmetic در SQLite و TypeScript با tolerance زیر برابر است:
   - `max(1e-10, abs(expected) * 1e-12)`
2. unknown serving weight و missing nutrients حفظ می‌شوند.

Batch 4 این مدل را برای Universal record گسترش می‌دهد:

- یک `generic_foods` row با مقادیر SR/FNDDS در SQLite درج می‌شود.
- SQL center با `value * grams / 100` محاسبه می‌شود.
- TypeScript center/range با estimator محاسبه می‌شود.
- `NULL` SQL با absent TypeScript nutrient مقایسه می‌شود.
- Source uncertainty برای Range در TypeScript به‌طور جداگانه Golden می‌شود.

این تست Integration evidence است؛ SQL query به API عمومی Package تبدیل نمی‌شود.

## ۹. Consumer behavior

Mobile UI برای Universal food:

- details را از Repository دریافت می‌کند؛
- default mode را grams می‌گذارد؛
- official portion را به `gramWeight * count` تبدیل می‌کند؛
- همان grams را به `calculateUniversalFoodEstimate` می‌دهد؛
- نتیجه را در Diary ذخیره می‌کند.

هیچ provider nutrition یا AI value وارد این مسیر نمی‌شود.

## ۱۰. Golden scenarios پیش از Implementation

1. FNDDS، 150g:
   - uncertainty `0.15`
   - center scale `1.5`
   - missing nutrient absent
2. SR Legacy، 50g:
   - uncertainty `0.08`
   - center scale `0.5`
3. Full 12-key mapping با ترتیب رسمی `NUTRIENT_KEYS`
4. Partial micronutrient record:
   - null→absent
   - existing values scale deterministically
5. grams boundaries:
   - `0`, negative, NaN, Infinity, >100000 reject
   - `100000` accepted
6. SQLite row center equals TypeScript center at multiple fractional grams
7. Macro-incomplete row remains excluded by ranker
8. Macro-complete row without portions remains grams-usable

## ۱۱. Claim boundary

Batch 4 می‌تواند ادعا کند:

- Pure estimator parity با Mobile RC
- source uncertainty parity
- direct SQLite center arithmetic equivalence برای Golden rows
- missing-value preservation

Batch 4 نمی‌تواند ادعا کند:

- کل 13,225 رکورد دوباره Audit شده‌اند، مگر Workflow واقعی Catalog اجرا شود؛
- SQLite/Expo runtime در Package منتقل شده؛
- Web adapter ساخته شده؛
- Database migration یا persistence parity کامل شده؛
- Nutrition values scientific/clinical validation جدید گرفته‌اند.

## ۱۲. Exact implementation order

1. Golden fixtures ایجاد شوند.
2. parity tests قبل از implementation نوشته شوند.
3. Red CI ناشی از نبود estimator ثبت شود.
4. `universal-food-estimate.ts` بدون تغییر معنایی استخراج شود.
5. Test-only SQLite equivalence اضافه شود.
6. Package exports/README/CI metadata به‌روزرسانی شوند.
7. Nutrition Core CI و Web CI پاس شوند.
8. Reviewها رفع و هر دو سند اجباری به‌روزرسانی شوند.

Supabase، Auth، AI/Vision، Repository runtime و Web adapter خارج از Scope هستند.

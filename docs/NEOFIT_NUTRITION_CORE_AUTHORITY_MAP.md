# NeoFit Nutrition Core — Authority Map

**وضعیت:** مرجع استخراج Stage 3  
**تاریخ ثبت:** ۴ اوت ۲۰۲۶  
**Issue:** #17  
**Branch فعال:** `stage3/nutrition-core-parity`  
**مبنای Branch:** Stage 2A merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`  
**مرجع Native/IFKB:** branch `agent/iranian-food-kb-foundation`

## ۱. اصل Authority

Core وب از روی رفتار واقعی Mobile RC استخراج می‌شود؛ نه از UI وب، fixtureهای نمایشی یا برداشت جدید.

ترتیب Authority:

1. `docs/NEOFIT_NUTRITION_FINAL_SCOPE_V3.md`
2. `mobile/src/nutrition-core/*`
3. `mobile/tests/nutrition-core.test.ts` و تست‌های equivalence/migration مرتبط
4. IFKB release/freeze manifests
5. Repositoryها و UI موبایل فقط برای شناخت Adapter و مصرف‌کننده

`mobile/` تا پایان Parity، Frozen reference و Oracle مقایسه باقی می‌ماند.

## ۲. تصمیم‌های قفل‌شدهٔ دامنه

- محاسبات فقط deterministic TypeScript/SQLite هستند.
- AI/Vision اجازهٔ تولید کالری، مواد مغذی، وزن یا Portion ندارد.
- دادهٔ نهایی از IFKB + USDA SR Legacy + FNDDS Resolve می‌شود.
- Missing value با صفر برابر نیست.
- وزن نامعلوم `null` باقی می‌ماند.
- Provider nutrition حذف و نادیده گرفته می‌شود.
- Canonical ID، fingerprint و provenance باید پایدار بمانند.

## ۳. Inventory ماژول‌ها

### Pure Domain — Batch 1

| ماژول Mobile | Blob SHA | نقش | تصمیم |
|---|---|---|---|
| `mobile/src/nutrition-core/types.ts` | `55e0100964e32b392493dd604a12e0f845b7e5e7` | Nutrient keys، Food/Portion/Diary/Goal contracts | استخراج بدون تغییر معنایی |
| `mobile/src/nutrition-core/nutrition.ts` | `53ac392d69f351e145f51db140dd5701cdcbaeab` | validation، scaling، missing-aware sums، serving resolution | استخراج بدون تغییر معنایی |
| `mobile/src/nutrition-core/recipe.ts` | `51784eb1a522eda8bee5b4ba394b67844c04db6c` | total/per-serving/per-100g recipe arithmetic | استخراج بدون تغییر معنایی |
| `mobile/src/nutrition-core/diary.ts` | `e297eed728a7457b9b46529a761e450bd647e97d` | day/meal summaries و entry transforms | استخراج بدون تغییر معنایی |
| `mobile/src/nutrition-core/goals.ts` | `16a2d91dfa173f88f3d56b26ce58aa679df25cf3` | target/minimum/maximum progress | استخراج بدون تغییر معنایی |

این پنج ماژول فقط به یکدیگر وابسته‌اند و هیچ import از React، Expo، SQLite، فایل‌سیستم، شبکه یا UI ندارند.

### Pure Domain — Batchهای بعدی

| ماژول | Blob SHA | علت تعویق از Batch 1 |
|---|---|---|
| `search.ts` | `bb99c934beeed5094da7e0a29a8f53635ace48b3` | نیازمند Corpus/Ranking golden set جداگانه |
| `catalog-release.ts` | `1afb7266b7d456530febb5c1c49c109e3d1f3ef7` | باید به Release manifest generator متصل شود، نه دستی کپی شود |
| `catalog-provenance.ts` | `1edb7e8eed151305075e634a84596db2211dffaf` | همراه ID/fingerprint/provenance batch منتقل می‌شود |
| `legacy-catalog-adapter.ts` | `30fcc0d774a43f0f0608bd29c342c3e20d339f58` | Adapter مهاجرتی است؛ پس از Pure arithmetic |
| `universal-catalog-ranking.ts` | `9b23b1ef7d6817ff2b946e1fdedcad76608279e1` | نیازمند search corpus و source ranking fixtures |
| `universal-food-estimate.ts` | `7f54426e0b6838700f09b831c7df5a94afef8361` | همراه SR/FNDDS adapter و source uncertainty policy |

### خارج از Pure Core

موارد زیر در `packages/nutrition-core` وارد نمی‌شوند:

- SQLite migrations و SQL strings
- Expo/React Native repositories
- backup/restore فایل و DB
- Vision transport و provider client
- SecureStore، FileSystem، ImagePicker
- UI components و routeها
- Network، Vercel و Supabase adapters

برای این موارد بعداً Interface/Adapter در لایهٔ مصرف‌کننده ساخته می‌شود.

## ۴. Numeric policy اثبات‌شده

مرجع: `mobile/src/nutrition-core/nutrition.ts`.

- ورودی‌های تغذیه باید finite و non-negative باشند.
- `basisGrams` و `basisMultiplier` در محل‌های لازم finite و positive هستند.
- Noise باینری با ۱۵ رقم معنادار canonical می‌شود:
  `Number(value.toPrecision(15))`.
- این canonicalization، display rounding نیست.
- Display rounding فقط با `roundNutritionVector` و ۰ تا ۶ رقم اعشار انجام می‌شود.
- `-0` به `0` تبدیل می‌شود.
- per-100g variant باید دقیقاً `basisGrams = 100` داشته باشد.
- Gram calculation برای basis با وزن نامعلوم رد می‌شود.

## ۵. Missing/Null policy اثبات‌شده

- `NutritionVector` یک Partial record است؛ absence یعنی unknown، نه zero.
- `NutritionEstimate.grams` برای وزن نامعلوم `null` است.
- `sumNutritionVectorsStrict` فقط وقتی یک nutrient را جمع می‌کند که تمام ورودی‌ها آن nutrient را داشته باشند.
- Recipe و Diary وزن نامعلوم را به `null` propagate می‌کنند.
- Goal progress برای consumed نامعلوم، `consumed/ratio/remaining = null` می‌دهد.

## ۶. Golden scenarios برای Batch 1

مرجع رفتار: `mobile/tests/nutrition-core.test.ts` blob `2291e1958efe5e17010230c5864c9fadc9bc47ba`.

1. دو Portion سفیدهٔ ۳۳ گرمی + ۵ گرم روغن:
   - grams = 66
   - energyKcal = 79.32
   - proteinG = 7.194
   - fatG = 5.132
2. Serving با وزن نامعلوم و multiplier برابر 1.5:
   - grams = null
   - energyKcal = 600
   - proteinG = 30
3. Gram calculation روی serving با وزن نامعلوم باید throw شود.
4. Recipe سه سفیده با cooked yield برابر 90g:
   - perServing grams = 30
   - per100g protein ≈ 11.99
5. Recipe و Diary نباید nutrient غایب را صفر فرض کنند.
6. Diary با یک وزن معلوم و یک وزن نامعلوم:
   - total grams = null
   - total protein ≈ 23.597
7. Goal با protein مصرف‌شدهٔ نامعلوم:
   - ratio = null
8. Vector addition عمومی missing-aware است؛ strict aggregate جداگانه fail-closed عمل می‌کند.

## ۷. Boundary بستهٔ Batch 1

Batch 1 فقط شامل این موارد است:

- Package مستقل `packages/nutrition-core`
- قراردادهای Versioned TypeScript
- پنج ماژول Pure Domain بالا
- Golden fixtures دارای provenance
- Node test parity harness
- Package typecheck/test در CI
- Forbidden dependency gate برای React Native/Expo/SQLite/UI/Network

Batch 1 شامل Web adapter، Catalog database، Search، Vision، Supabase یا Migration نیست.

## ۸. معیار پذیرش Batch 1

- Package بدون وابستگی Runtime خارجی Build/Typecheck شود.
- Golden scenarios دقیقاً پاس شوند.
- هیچ import ممنوع در `src/` وجود نداشته باشد.
- Source file و blob SHA هر fixture ثبت باشد.
- تغییر معنایی نسبت به Mobile RC صفر باشد؛ هر اصلاح احتمالی باید ابتدا به‌صورت اختلاف Parity ثبت شود، نه silent fix.

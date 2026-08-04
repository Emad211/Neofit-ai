# NeoFit Web Nutrition Adapter — Authority Map

**وضعیت:** مرجع Stage 3 Batch 6  
**تاریخ ثبت:** ۴ اوت ۲۰۲۶  
**Issue:** #17  
**Branch:** `stage3/web-adapter-parity`  
**مبنای Branch:** Batch 5 merge `d3c0a28ecf2596e94c86ff74e2f00a0523219433`  
**مرجع Native/IFKB:** `agent/iranian-food-kb-foundation` @ `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

## ۱. هدف Batch 6

Batch 6 آخرین Batch پیاده‌سازی Stage 3 است. هدف آن اتصال Web Prototype به `@neofit/nutrition-core` بدون بازنویسی یا تکرار Nutrition arithmetic است.

Adapter وب باید فقط این کارها را انجام دهد:

- تبدیل Fixture وب به Contractهای Core؛
- تبدیل Meal label فارسی به `MealType`؛
- ساخت Entry/Recipe input برای Core؛
- تبدیل خروجی `NutritionVector` به View model محدود و fail-closed؛
- تولید متن نمایشی سهم و برچسب‌های UI؛
- Presentation-only clamp/format روی Progress خروجی Core.

Adapter وب نباید:

- کالری یا Macro را ضرب، جمع یا Round کند؛
- Range یا uncertainty تولید کند؛
- Missing nutrient را صفر فرض کند؛
- Search normalization دیگری بسازد؛
- Provider/AI nutrition را بپذیرد؛
- Persistence، Supabase، Auth یا Sync را وارد کند.

## ۲. Source authority و Blobهای دقیق

| منبع | Blob SHA | نقش |
|---|---|---|
| `web/data/fixtures.ts` | `08e623948b84e4e4e261528b1c332ae2e76af4b7` | Stage 1 IFKB-shaped food/diary/goal fixtures |
| `web/components/neofit-prototype.tsx` | `add0839d207e5b3b12288657fe53077c9a4fda0a` | UI مصرف‌کننده و محل arithmetic تکراری فعلی |
| `web/package.json` | `599fb8c7ce6e5703cc9724e95fbfd54140a5b261` | Web dependency/test/build contract پیش از Package integration |
| `web/tsconfig.json` | `3f0ab28d24fb690113a256d85600830b748e656c` | strict/bundler TypeScript contract |
| `web/next.config.ts` | `4b336694b82f1a0e33bfc15b1d9436736eee83c7` | Next build configuration پیش از Core transpilation |
| `mobile/src/services/food-catalog-core-adapter.ts` | `bbacac7a376ba9edb14b14f673d3d708dfa3319e` | شاهد Adapter قدیمی دارای scale/round تکراری؛ Authority برای تکرار نیست |
| `packages/nutrition-core/src/legacy-catalog-adapter.ts` | `eb4be071cfb3ccc6bb03261abf49aa7ae972028d` | Legacy food → Concept/Variant authority |
| `packages/nutrition-core/src/search.ts` | `3dc081e6f22f9d98518ad7411bcbd5c6394cc983` | Persian normalization/search authority |
| `packages/nutrition-core/src/diary.ts` | `e297eed728a7457b9b46529a761e450bd647e97d` | Missing-aware day summary authority |
| `packages/nutrition-core/src/types.ts` | `62fde93f8ce534b199cfe41e28da3b9903741576` | Food/Diary/Goal contracts |

Core behavior imported by Web:

- `legacyCatalogFoodToDocument`
- `calculateVariantNutrition`
- `calculateRecipe`
- `summarizeDiaryDay`
- `calculateGoalProgress`
- `normalizePersianText`

## ۳. Findings از Web فعلی

### ۳.۱ جمع Macro تکراری

`sumMacros` در Component:

- calories/protein/carbs/fat را دستی جمع می‌کند؛
- Missing semantics را دور می‌زند؛
- Range را حذف می‌کند؛
- با `summarizeDiaryDay` موازی است.

این Function باید حذف شود.

### ۳.۲ Scale/Round تکراری

`addSelectedFood` و Meal sheet:

- `selectedFood.calories * portionCount`
- `proteinG/carbsG/fatG * portionCount`
- `Math.round` و `toFixed(1)`

را مستقیم اجرا می‌کنند. این منطق با `calculateVariantNutrition` و Numeric policy Core موازی است و باید حذف شود.

### ۳.۳ Initial diary precomputed

Breakfast و Lunch macros از قبل به‌صورت جمع‌شده در Fixture ذخیره شده‌اند. Batch 6 باید Initial diary را به Source references تبدیل کند:

- Breakfast: تخم‌مرغ × 2
- Lunch: قورمه‌سبزی × 1 + چلو × 1

ترکیب Lunch باید با `calculateRecipe` انجام شود، نه جمع Web.

### ۳.۴ Search normalization تکراری

Web فقط `ي→ی` و `ك→ک` را جایگزین می‌کند. Search Core قرارداد کامل NFKC، digit، diacritic، half-space و punctuation را دارد. Web باید `normalizePersianText` را مصرف کند.

### ۳.۵ Goal progress

Web نسبت و remaining calorie را از Macroهای خام محاسبه می‌کند. Batch 6 باید `calculateGoalProgress` را Authority قرار دهد. درصد نمایشی می‌تواند فقط در Adapter به `0..100` clamp و Round شود.

## ۴. Fixture migration contract

Food fixture باید شکل کامل `LegacyCatalogFood` را داشته باشد:

- ID، نام‌ها و Aliasها؛
- Category؛
- Portion labels و `portionGrams`؛
- Nutrition per serving؛
- `variabilityPct`؛
- Source type/label/version/evidence.

Fixture nutrition همچنان فقط Demo data نسخه‌دار Stage 1 است؛ Batch 6 ادعای اتصال به Asset کامل 13,225 رکوردی ندارد.

Initial diary fixture باید فقط این موارد را نگه دارد:

- ID و Label؛
- Core `MealType`؛
- Source food IDs و portion counts؛
- متن نمایشی Portion؛
- local date/timestamp ثابت برای تست.

هیچ Macro جمع‌شده‌ای در diary seed نگه‌داری نمی‌شود.

## ۵. Web Adapter contract

Adapter پیشنهادی: `web/lib/nutrition-adapter.ts`.

APIهای هدف:

- `filterWebFoods`
- `estimateWebFood`
- `createWebDiaryEntry`
- `buildInitialWebDiary`
- `summarizeWebDiary`
- `webMacrosFromEstimate`
- `mealTypeLabelFa`

قواعد:

- هر Food از طریق `legacyCatalogFoodToDocument` به Variant تبدیل شود؛
- Standard portion از Document Core استفاده شود؛
- single food با `calculateVariantNutrition` محاسبه شود؛
- multiple foods با `calculateRecipe(...).total` محاسبه شوند؛
- Diary state شامل `DiaryEntry` Core و View metadata باشد؛
- Day totals از `summarizeDiaryDay` بیاید؛
- Goal ratios/remaining از `calculateGoalProgress` بیاید؛
- تبدیل به Macro view اگر یکی از چهار Macro اصلی Missing بود fail-closed کند.

## ۶. Package integration strategy

بدون Turborepo/Nx/workspace framework:

1. `packages/nutrition-core/package.json` یک `exports` مستقیم به `src/index.ts` می‌دهد؛
2. `web/package.json` از dependency محلی `file:../packages/nutrition-core` استفاده می‌کند؛
3. `web/next.config.ts` با `transpilePackages: ['@neofit/nutrition-core']` Source TypeScript را Compile می‌کند؛
4. Web unit tests با `tsx` اجرا می‌شوند؛
5. Web CI قبل از Build، Adapter tests و source-boundary gate را اجرا می‌کند.

این اتصال کوچک و شفاف است و Monorepo orchestrator جدید ایجاد نمی‌کند.

## ۷. Test-first contract

پیش از Implementation، Tests باید قفل کنند:

1. Base food estimate از Standard portion Core می‌آید.
2. 1.5 سهم قورمه‌سبزی = Core estimate، نه Web multiplication.
3. Initial breakfast = 2 تخم‌مرغ.
4. Initial lunch = Recipe جمع قورمه‌سبزی + چلو.
5. Day total = 866 kcal، protein 41، carbs 98، fat 34 برای Fixture فعلی.
6. Goal remaining/progress از Core محاسبه شود.
7. Arabic/Persian variants در Search یکسان عمل کنند.
8. Missing Macro conversion fail-closed باشد.
9. Component دیگر `sumMacros`، `toFixed` یا مستقیم `selectedFood.* * portionCount` نداشته باشد.
10. Package import و Next production build پاس شوند.

## ۸. Boundaries و Claim limits

Batch 6 اثبات می‌کند:

- Web Prototype برای Nutrition arithmetic از Shared Core استفاده می‌کند؛
- Stage 1 Fixture flow همان خروجی قبلی مورد انتظار را با Core تولید می‌کند؛
- Component دیگر Nutrition math تکراری ندارد؛
- Search normalization و Goal progress از Core می‌آیند.

Batch 6 اثبات نمی‌کند:

- Catalog کامل در Browser بارگذاری شده است؛
- IndexedDB/Offline catalog آماده است؛
- Supabase schema/Auth/Sync وجود دارد؛
- AI/Vision flow فعال است؛
- Vercel HTTPS Preview تأیید شده است.

## ۹. Exact continuation

1. Golden fixture وب پیش از Implementation ساخته شود.
2. Draft PR برای Authority/Golden checkpoint باز شود.
3. Adapter parity tests و source-boundary test قبل از APIs ساخته شوند.
4. Red CI ثبت شود.
5. Package integration و Adapter اجرا شوند.
6. Component/fixtures refactor شوند و arithmetic تکراری حذف شود.
7. Web unit، Nutrition Core، Next build، visual و PWA gates پاس شوند.
8. دو سند اجباری با Evidence نهایی همگام شوند.
9. پس از Merge Batch 6، Stage 3 closure evidence بررسی و Issue #17 فقط در صورت تکمیل همهٔ Gateها بسته شود.

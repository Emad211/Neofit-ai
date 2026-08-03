# NeoFit Search and Universal Ranking — Authority Map

**وضعیت:** مرجع Stage 3 Batch 2  
**تاریخ:** ۴ اوت ۲۰۲۶  
**Issue:** #17  
**Branch:** `stage3/search-ranking-parity`  
**مبنای Branch:** Batch 1 merge `c9599c4905f9fc1d28ba7e9086edf20376991740`  
**مرجع Native/IFKB:** `agent/iranian-food-kb-foundation`

## ۱. مرز ادعا

NeoFit در این Batch فقط رفتار **Controlled Persian Alias Search** و **Universal catalog ranking** را استخراج و قفل می‌کند.

این Batch ادعا نمی‌کند که جست‌وجو، زبان فارسی آزاد را می‌فهمد. Release رسمی نیز صریحاً می‌گوید Corpus فعلی به‌صورت deterministic از Alias registry تولید شده است.

Independent Natural Query corpus مسیر جداگانه‌ای دارد و هنوز منتشر نشده است. فایل Release آن صریحاً می‌گوید:

- contract و validator آماده‌اند؛
- `queries.csv` 500 ردیفی هنوز وجود ندارد؛
- Generated aliases یا model-generated queries حق ندارند به‌عنوان Natural corpus معرفی شوند؛
- Corpus نهایی نیازمند privacy review، دو annotator و adjudicator است.

بنابراین تا Release واقعی Natural corpus، typo/colloquial/regional/ambiguity/abstention accuracy به‌عنوان قابلیت اثبات‌شده اعلام نمی‌شود.

## ۲. Source authority

| منبع | Blob SHA | نقش |
|---|---|---|
| `mobile/src/nutrition-core/search.ts` | `bb99c934beeed5094da7e0a29a8f53635ace48b3` | Persian normalization، modifier parsing و deterministic local document scoring |
| `mobile/src/nutrition-core/universal-catalog-ranking.ts` | `9b23b1ef7d6817ff2b946e1fdedcad76608279e1` | Alias index/routing، generic target resolution و SR/FNDDS ranking |
| `mobile/tests/nutrition-core.test.ts` | `2291e1958efe5e17010230c5864c9fadc9bc47ba` | Mobile normalization، modifier و local-search golden behavior |
| `.github/workflows/ifkb-persian-search-benchmark.yml` | `a398cfe3feb493c17721bbf6ea59e1f81f2a6857` | Full controlled 500-query benchmark pipeline و thresholds |
| `mobile/scripts/evaluate-persian-search-benchmark.ts` | `54cdb9857d4412e43991045a3b6d76fe8abdc549` | Production evaluator behavior |
| `ifkb/universal/generate_persian_search_benchmark.py` | `e8683a1fcb88d4578a2b4e5adca8692534bec9f6` | Deterministic query variants |
| `ifkb/universal/prepare_persian_search_benchmark.py` | `b75de4558100e87a31fa4fc9181a54f51f335702` | Candidate extraction from real bundled SQLite FTS5 |
| `ifkb/universal/persian_search_aliases_v1.csv` | `94429b1937edc6234b23fc8398531b531a891cc2` | Controlled 218-row alias registry |
| `ifkb/universal/releases/persian-search-benchmark-v1/manifest.json` | `24a1d20effe679b23e4ee4966d0bdb01f2b06ec0` | Frozen benchmark release/evidence |
| `ifkb/universal/releases/persian-search-benchmark-v1/README.md` | `ab5713112b9eaa46748ae981abcd35a0de0db1cc` | Interpretation and limitations |
| `ifkb/universal/natural_query_corpus.py` | `221de26f9e6ba99a5f76014ee85957092baacdc5` | Independent-corpus validation/privacy contract |
| `ifkb/universal/releases/persian-natural-query-corpus-v1/README.md` | `143be5c17c409ba42c25b65c51eb016c320199ea` | Explicit status: frozen Natural corpus not released |

## ۳. Frozen full benchmark

Release `persian-search-benchmark-v1`:

- release version: `1.1.0`
- catalog version: `1.2.0`
- bundled database SHA-256: `0164cb344c22eeec2556f9decdf13931e700078a9566bd884609edee78667247`
- generic foods: `13,225`
- generic concepts: `9,279`
- Iranian canonical identities: `261`
- controlled aliases: `218`
- cases: `500`
  - generic: `222`
  - iranian_canon: `278`
- frozen result:
  - route accuracy: `1.0`
  - Top-1 accuracy: `1.0`
  - Top-5 accuracy: `1.0`
  - failures: `0`
- workflow run: `30285619578`
- artifact: `8660666147`
- digest: `sha256:d43931525ade2f1b685b18647d1554cc317f14bd8874ed66fe5c85370454fbde`

Locked minimum thresholds:

- Alias route >= `0.98`
- Top-1 >= `0.90`
- Top-5 >= `0.97`

## ۴. Query variants رسمی

Full benchmark این variationها را پوشش می‌دهد:

- exact alias: 202
- quantity context: 202
- Arabic characters: 14
- context sentence: 14
- extra spacing: 14
- half-space: 14
- punctuation: 14
- joined spacing: 13
- trailing serving language: 13

Golden set داخل Package یک subset نماینده و سریع از تمام این variationها است. عدد 500 و Accuracy رسمی فقط متعلق به Benchmark کامل متصل به SQLite واقعی است.

## ۵. Persian normalization policy

رفتار استخراج‌شونده از `search.ts`:

- Unicode NFKC
- lowercase
- Arabic `ي/ى/ك/ة/ۀ/ؤ/إ/أ` به شکل Persian/Canonical
- Persian و Arabic digits به ASCII digits
- حذف diacritics
- نیم‌فاصله، joiner، `_`, `-`, `/` به space
- حذف punctuation
- collapse whitespace

## ۶. Modifier policy

Modifierهای قفل‌شده:

- `without_yolk`
- `egg_white`
- `low_fat`
- `grilled`
- `boiled`
- `fried`
- `without_added_fat`
- `with_oil`
- `skinless`

Generic target resolver فقط Preparationهای اثبات‌شده را به target انگلیسی اضافه می‌کند و Nutrition تولید نمی‌کند.

## ۷. Alias routing policy

- exact normalized alias اولویت اول است؛
- سپس طولانی‌ترین Alias contained؛
- سپس compact alias برای joined-spacing؛
- اگر یک Alias هم Generic و هم Iranian canonical داشته باشد، evaluator رسمی Iranian route را ترجیح می‌دهد؛
- Iranian canonical route مستقیماً Canon ID را برمی‌گرداند؛
- Generic route ابتدا modifier-aware target را Resolve و سپس candidateها را Rank می‌کند.

## ۸. Universal ranking policy

- فقط candidateهای `macroComplete=true` قابل رتبه‌بندی‌اند؛
- exact/prefix/contains/token coverage امتیاز می‌گیرند؛
- BM25 منفی‌تر بهتر است؛
- Portion موجود امتیاز محدود می‌گیرد؛
- غذای prepared به FNDDS تمایل دارد؛
- غذای atomic/raw/fresh به SR Legacy تمایل دارد؛
- processهای درخواست‌نشده مانند dried/frozen/powder/restaurant جریمه می‌شوند؛
- fresh/raw common form تقویت می‌شود؛
- Tie-break به ترتیب score، نام کوتاه‌تر و ID است.

## ۹. Batch 2 acceptance boundary

Batch 2 شامل:

- استخراج دقیق `search.ts`
- استخراج دقیق `universal-catalog-ranking.ts`
- representative Golden corpus با provenance
- پوشش تمام 9 query variant رسمی
- modifier/local-search tests
- alias precedence and longest-match tests
- source-aware ranking tests
- CI metadata tied to benchmark release

Batch 2 شامل این موارد نیست:

- SQLite FTS implementation
- کپی دیتابیس 13,225 رکوردی داخل Package
- ادعای Natural Query accuracy
- typo/colloquial/regional/abstention metrics
- تغییر Alias registry
- Web adapter یا UI integration

## ۱۰. ادامهٔ بعد از Batch 2

- Full 500-query benchmark باید هنگام تغییر Catalog/Alias/Ranking همچنان روی IFKB pipeline اجرا شود.
- Natural Query corpus فقط پس از جمع‌آوری مستقل، privacy review و adjudication می‌تواند Release شود.
- Batch بعدی Stage 3 روی Catalog release/provenance و Legacy adapters تمرکز می‌کند.

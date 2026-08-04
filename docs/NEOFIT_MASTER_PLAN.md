# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 3 closure candidate  
**Integration branch:** `web/pwa-foundation`  
**Active branch:** `stage3/closure-evidence`  
**Active PR:** Closure PR هنوز باز نشده  
**Stage 3 Issue:** #17 — فقط منتظر Closure docs/CI  
**Deferred Vercel Issue:** #16  
**Stage 3 implementation merge:** `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`  
**مرحلهٔ فعال:** Stage 3 closure evidence  
**Gate فعلی:** Closure docs PR، Nutrition/Web CI، Merge و سپس بستن Issue #17

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

- Web: Next.js App Router + strict TypeScript
- Shared nutrition domain: `packages/nutrition-core`
- Web Nutrition boundary: `web/lib/nutrition-adapter.ts`
- Data authority: IFKB + USDA SR Legacy + FNDDS
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- Pure Core بدون UI، React، Expo، SQLite runtime، Network، filesystem، environment یا crypto runtime است.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.
- App-profile ID و IFKB Canonical ID Namespaceهای جدا و متصل با Mapping صریح‌اند.
- Imported/Custom با Seed overwrite یا downgrade نمی‌شوند.
- Web Nutrition arithmetic، daily aggregation، goals و Persian normalization را تکرار نمی‌کند.
- Supabase فقط پس از بسته‌شدن Stage 3 و تأیید صریح Organization/Region/Cost ایجاد می‌شود.

## ۳. وضعیت مراحل

### Stage 0 — Pivot/Freeze

انجام‌شده — PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`.

### Stage 1 — Persian RTL UX

انجام‌شده و پذیرفته‌شده — PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`.

### Stage 2A — PWA Code Foundation

انجام‌شده — PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`.

### Stage 2B — Vercel Preview/HTTPS

تعویق‌شده در Issue #16.

- Vercel Project: `neofit-ai`
- Project ID: `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview واقعی: ندارد
- HTTPS PWA validation پیش از Web RC اجباری است.

### Stage 3 — Nutrition Core Extraction و Parity

**تمام Batchهای پیاده‌سازی ۱ تا ۶ Merge شده‌اند؛ Closure docs/CI باقی است.**

#### Batch 1 — Arithmetic/domain

- PR #18
- Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- types، nutrition، recipe، diary، goals
- `10/10` tests

#### Batch 2 — Controlled Persian Search/Ranking

- PR #19
- Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- normalization، modifier parsing، Alias routing و SR/FNDDS ranking
- `25/25` tests
- 500-case release فقط Controlled Alias است؛ Natural Query accuracy ادعا نمی‌شود.

#### Batch 3 — Catalog Release/Provenance/Legacy Adapter

- PR #20
- Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- Catalog `1.2.0` projection/invariants
- Schema/ID `1.1.0` = `candidate-not-final`
- Evidence resolver و Legacy adapter
- `34/34` tests

#### Batch 4 — Universal SR/FNDDS Estimate + SQLite Equivalence

- PR #21
- Merge `d6c0df31999595096224ec1011574245d5dc75ad`
- FNDDS uncertainty `0.15`
- SR Legacy uncertainty `0.08`
- direct test-layer SQLite equivalence
- `43/43` tests
- 12 Pure files

#### Batch 5 — Canonical ID/Fingerprint/Release Parity

- PR #22
- Merge `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- mapping precedence: encoded fallback → exact primary → Alias
- unresolved/ambiguous fail-closed
- sorted newline fingerprint payload
- Seeded/Imported/Custom replacement matrix
- `52/52` tests
- 13 Pure files

#### Batch 6 — Web Nutrition Adapter

- PR #23
- Merge `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`
- Web local dependency به `@neofit/nutrition-core`
- Fixtureها به Source records تبدیل شدند.
- Initial diary Macroهای precomputed ندارد.
- `web/lib/nutrition-adapter.ts` تنها Nutrition boundary وب است.
- React component هیچ جمع، ضرب یا Round مستقل Nutrition ندارد.
- `9/9` Web Adapter tests
- `52/52` Core tests

Final pre-merge Batch 6 evidence:

- Branch/docs head `5b33d137ab3f35a1f89bcb186e410b2533e94c5c`
- Nutrition CI `30868394519` — success
- Nutrition Artifact `8876962490`
- Nutrition digest `sha256:4827344e1441a61dbeab6675bd7684869ab5bee7a6281c92c19a4e1ce48033c3`
- Web CI `30868394529` — success
- Web Artifact `8876973096`
- Web digest `sha256:c1c326e8463f0fa8177154c0fd012326a8c362b7826bad098948ba85fda960f4`
- strict TypeScript، Next build، Visual regression، PWA runtime/offline و Web+Core source bundle: pass
- Review thread باز پیش از Merge: صفر

## ۴. Stage 3 Definition of Done

| Gate | وضعیت |
|---|---|
| Pure arithmetic/domain parity | پاس |
| Persian Search/Ranking parity | پاس |
| Catalog Release/Provenance parity | پاس |
| Universal estimates + SQLite equivalence | پاس |
| Canonical ID/Fingerprint parity | پاس |
| Web Adapter بدون duplicated arithmetic | پاس |
| Nutrition Core CI | پاس |
| Web build/visual/PWA CI | پاس |
| Mandatory docs closure روی Integration | در حال اجرا |
| Issue #17 close | منتظر Closure docs merge |

Stage 3 فقط پس از Merge همین Closure docs و CI سبز، `complete` اعلام می‌شود.

## ۵. Claim boundaries

Stage 3 ثابت کرده است:

- Shared Nutrition Core از Mobile/IFKB authorities استخراج شده است.
- Web Prototype از Shared Core برای Nutrition استفاده می‌کند.
- Nutrition از Provider/AI ساخته نمی‌شود.
- Missing data، uncertainty، IDs و provenance قراردادهای fail-closed دارند.

Stage 3 ثابت نکرده است:

- Full Catalog 13,225 رکوردی در Browser بارگذاری شده است.
- IndexedDB/Offline Catalog/Sync آماده است.
- Supabase/Auth/RLS ساخته شده است.
- AI/Vision Web flow فعال است.
- Vercel HTTPS Preview واقعی تأیید شده است.
- Schema/ID candidate یک Public Final freeze است.

## ۶. Stage 4–9

- Stage 4: Supabase project، Auth، Postgres، RLS و sync foundation — فقط پس از تأیید Organization/Region/Cost
- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Offline Catalog/Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC، Vercel HTTPS و بستن Issue #16

## ۷. Anti-goalها

- شروع Supabase بدون تأیید هزینه/Region/Organization
- معرفی Schema/ID candidate به‌عنوان Final
- Nutrition arithmetic داخل UI/React
- Provider-created Nutrition
- واردکردن persistence/network/SQLite به Pure Core
- ادعای Full Browser Catalog از Fixture adapter
- ادعای Vercel Preview پیش از Deployment واقعی

## ۸. Exact continuation point

1. Closure PR از `stage3/closure-evidence` به `web/pwa-foundation` باز شود.
2. Nutrition Core CI و Web CI روی Closure candidate پاس شوند.
3. هر دو سند با Run/Artifactهای Closure به وضعیت نهایی `Stage 3 complete` به‌روزرسانی شوند.
4. CI نهایی روی Head نهایی اسناد پاس شود.
5. Review threadها بررسی و رفع شوند.
6. Closure PR با expected head Merge شود.
7. Issue #17 با Merge SHA و Closure CI بسته شود.
8. Stage 4 شروع نشود تا کاربر Organization، Region و Cost را صریحاً تأیید کند.
9. Issue #16 تا Vercel Preview واقعی باز بماند.

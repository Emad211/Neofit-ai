# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 4 Supabase planning/decision gate  
**Integration branch:** `web/pwa-foundation`  
**Stage 3 closure merge:** `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`  
**Stage 3 Issue:** #17 — closed/completed  
**Active branch:** `stage4/supabase-foundation-plan`  
**Active Issue:** #25 — Supabase Auth/Postgres/RLS foundation  
**Deferred Vercel Issue:** #16  
**مرحلهٔ فعال:** Stage 4 planning/decision فقط؛ Project creation هنوز مجاز نیست

---

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- هر دو سند با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- هیچ Build، Deployment، Preview، Parity، Freeze، Migration، Coverage یا Accuracy بدون شواهد اعلام نشود.
- حافظهٔ مکالمه جای ریپو، CI یا Connector state را نمی‌گیرد.

---

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
- Supabase Schema authority فقط migration versioned خواهد بود.
- RLS روی تمام Tableهای exposed و user-owned پیش از Application use اجباری است.
- Service Role هیچ‌وقت وارد Browser bundle، Client Component، log یا Artifact نمی‌شود.

---

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

**انجام‌شده و بسته‌شده.**

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
- Fixtureها Source records هستند.
- Initial diary Macro precomputed ندارد.
- `web/lib/nutrition-adapter.ts` تنها Nutrition boundary وب است.
- React component جمع، ضرب یا Round مستقل Nutrition ندارد.
- Web Adapter tests `9/9`
- Core tests `52/52`

Final Batch 6 evidence:

- Head `5b33d137ab3f35a1f89bcb186e410b2533e94c5c`
- Nutrition CI `30868394519` — success
- Nutrition Artifact `8876962490`
- Nutrition digest `sha256:4827344e1441a61dbeab6675bd7684869ab5bee7a6281c92c19a4e1ce48033c3`
- Web CI `30868394529` — success
- Web Artifact `8876973096`
- Web digest `sha256:c1c326e8463f0fa8177154c0fd012326a8c362b7826bad098948ba85fda960f4`

#### Stage 3 Closure

- Closure PR #24
- Closure merge `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`
- Issue #17: closed/completed

Closure candidate head `9ee1a2411bb0113e40735e79fcd5e8bbb34a3d95`:

- Nutrition CI `30868701581` — success
- Artifact `8877065210`
- Digest `sha256:6bcf2cb716adc49e69121f87338fd838ed0e2bd4b7568bd1dc7888c764f9538b`
- Web CI `30868701585` — success
- Artifact `8877082184`
- Digest `sha256:2e30058850433028e369adc6c36b48006d945d393f0d42176fa905b37226bb9b`

Final closure document head `43102e4925effb4f8c80dfa05b1588c08dd2f263`:

- Nutrition CI `30868884712` — success
- Artifact `8877128689`
- Digest `sha256:de56b9d8f7f38b07c18d8424a9da51a7d68617785c4eb8f4a415655204ae689e`
- Web CI `30868884702` — success
- Artifact `8877147921`
- Digest `sha256:f35e03b57db23bdda15fe1b6c7659d3c5af94e2a2125be12ecbe6a104fd9f76c`

### Stage 4 — Supabase Auth/Postgres/RLS Foundation

**فعال فقط در سطح Planning/Decision. زیرساخت ساخته نشده است.**

Issue/Branch:

- Issue #25 — `Stage 4: Supabase Auth, Postgres and RLS foundation`
- Branch `stage4/supabase-foundation-plan`
- Authority/decision plan: `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`

#### Supabase account inventory — verified

Organization:

- Name: `Emad's Org`
- ID: `yzymkjsfqoohxbqkhzhs`

Existing projects:

| Name | Ref | Region | Status |
|---|---|---|---|
| `Emad211's Project` | `albwvkdamcmvukhzafep` | `eu-central-1` | `INACTIVE` |
| `nila-gol` | `msiowolgbuffddhcdmqw` | `eu-central-1` | `INACTIVE` |

NeoFit Supabase project:

- وجود ندارد
- Project ID/ref ندارد
- Table/Auth/RLS/Migration ندارد

Cost read from Supabase Connector:

- type: `project`
- recurrence: `monthly`
- amount: `0`

#### Proposed decision — not yet accepted

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Region به‌دلیل Region فعلی هر دو Project حساب و geography اروپایی پیشنهاد شده است؛ Benchmark latency یا residency claim نیست.

#### Stage 4 batches

- 4A: تصمیم صریح + cost confirmation + Project creation
- 4B: Supabase CLI/config + SSR browser/server/proxy clients
- 4C: `profiles` و `user_settings` + RLS + generated types
- 4D: `nutrition_goals` و `nutrition_entries` persistence contract
- Closure: advisors، RLS tests، Web/Core CI و docs

#### Stage 4 security gate

- `@supabase/ssr` و cookie-based SSR clients
- Browser/Server client separation
- `getClaims()` برای protected identity paths
- RLS روی تمام public user tables
- ownership با `auth.uid()` و `with check`
- anon denied برای user data
- Service Role server/operations only
- generated DB types از Schema واقعی
- DDL فقط در migrations
- SQL هیچ Nutrition arithmetic انجام نمی‌دهد.

#### Stage 4 current blocker

کاربر باید سه مقدار را صریحاً بپذیرد:

1. Organization `Emad's Org`
2. Region `eu-central-1`
3. Cost `0` monthly

تا قبل از این پذیرش:

- `confirm_cost` اجرا نمی‌شود؛
- Supabase Project ساخته نمی‌شود؛
- Auth/Schema/RLS implementation آغاز نمی‌شود.

---

## ۴. Claim boundaries

تا این نقطه ثابت شده است:

- Stage 3 کامل و بسته است.
- Shared Nutrition Core و Web Adapter با Evidence سبز Merge شده‌اند.
- Supabase Organization/Project inventory و current project cost بررسی شده‌اند.
- Stage 4 architecture/security plan ثبت شده است.

ثابت یا انجام نشده است:

- پذیرش Organization/Region/Cost؛
- NeoFit Supabase Project؛
- Auth/SSR clients؛
- Postgres migrations؛
- RLS policies/tests؛
- Full Catalog در Browser؛
- IndexedDB/Offline sync؛
- AI/Vision Web flow؛
- Vercel HTTPS Preview؛
- Public Final Schema/ID freeze.

---

## ۵. Stage 5–9

- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Full Browser Catalog، IndexedDB و Offline Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC، Vercel HTTPS و بستن Issue #16

---

## ۶. Anti-goalها

- ساخت Project بدون پذیرش هزینه/Region/Organization
- استفاده از Project قدیمی یا unrelated برای NeoFit
- شروع Schema با Dashboard click و بدون Migration
- RLS permissive یا موقت
- Service Role در Browser
- اعتماد Server authorization به `getSession()` بدون identity validation
- duplicated Nutrition arithmetic در SQL یا React
- ذخیرهٔ Provider-created Nutrition
- ORM یا monorepo tooling بدون نیاز اثبات‌شده
- Full Catalog/IndexedDB در Stage 4
- ادعای Vercel Preview بدون Deployment واقعی

---

## ۷. Exact continuation point

1. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`، این فایل و Progress Log خوانده شوند.
2. Issue #25، Branch/PR، Supabase Organization/Projects/Cost و Issue #16 بررسی شوند.
3. Planning PR روی CI و Review اعتبارسنجی و Merge شود.
4. کاربر باید Organization/Region/Cost را صریحاً بپذیرد.
5. فقط پس از پذیرش، `Supabase.confirm_cost` اجرا شود.
6. Project جدید با نام `neofit` در Organization/Region پذیرفته‌شده ایجاد شود.
7. Project ID/ref/region/status در Issue #25 و هر دو سند ثبت شود.
8. Stage 4B در Branch/PR مستقل و test-first آغاز شود.
9. Issue #16 تا Preview واقعی HTTPS باز بماند.

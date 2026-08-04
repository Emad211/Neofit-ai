# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۴ اوت ۲۰۲۶ — Stage 4 Supabase planning checkpoint validated  
**Integration branch:** `web/pwa-foundation`  
**Stage 3 closure merge:** `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`  
**Stage 3 Issue:** #17 — closed/completed  
**Active branch:** `stage4/supabase-foundation-plan`  
**Active PR:** #26 — Draft تا Final docs CI/Review  
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

- Project `neofit-ai`
- Project ID `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`
- Preview واقعی ندارد.
- HTTPS PWA validation پیش از Web RC اجباری است.

### Stage 3 — Nutrition Core Extraction و Parity

**انجام‌شده و بسته‌شده.**

| Batch | PR | Merge | Evidence |
|---|---|---|---|
| 1 Arithmetic/domain | #18 | `c9599c4905f9fc1d28ba7e9086edf20376991740` | `10/10` |
| 2 Persian Search/Ranking | #19 | `917f04e319a924dda7dfb16d079453a5e5686541` | `25/25` |
| 3 Catalog/Provenance | #20 | `02c1bcf0b301a920b12abcff4f653575cb97bf7f` | `34/34` |
| 4 Universal Estimate/SQLite | #21 | `d6c0df31999595096224ec1011574245d5dc75ad` | `43/43` |
| 5 ID/Fingerprint | #22 | `d3c0a28ecf2596e94c86ff74e2f00a0523219433` | `52/52`، 13 Pure files |
| 6 Web Adapter | #23 | `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412` | Core `52/52`، Web `9/9` |

Batch 6 final:

- Nutrition CI `30868394519` — success
- Artifact `8876962490`
- Digest `sha256:4827344e1441a61dbeab6675bd7684869ab5bee7a6281c92c19a4e1ce48033c3`
- Web CI `30868394529` — success
- Artifact `8876973096`
- Digest `sha256:c1c326e8463f0fa8177154c0fd012326a8c362b7826bad098948ba85fda960f4`

Closure:

- PR #24
- Merge `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`
- Issue #17 closed/completed

Final Closure document head `43102e4925effb4f8c80dfa05b1588c08dd2f263`:

- Nutrition CI `30868884712` — success
- Artifact `8877128689`
- Digest `sha256:de56b9d8f7f38b07c18d8424a9da51a7d68617785c4eb8f4a415655204ae689e`
- Web CI `30868884702` — success
- Artifact `8877147921`
- Digest `sha256:f35e03b57db23bdda15fe1b6c7659d3c5af94e2a2125be12ecbe6a104fd9f76c`

### Stage 4 — Supabase Auth/Postgres/RLS Foundation

**Planning/Decision checkpoint سبز؛ زیرساخت ساخته نشده است.**

Records:

- Issue #25
- Branch `stage4/supabase-foundation-plan`
- PR #26 — Draft
- Plan `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`

#### Verified Supabase inventory

Organization:

```text
Emad's Org
yzymkjsfqoohxbqkhzhs
```

Existing projects:

| Name | Ref | Region | Status |
|---|---|---|---|
| `Emad211's Project` | `albwvkdamcmvukhzafep` | `eu-central-1` | `INACTIVE` |
| `nila-gol` | `msiowolgbuffddhcdmqw` | `eu-central-1` | `INACTIVE` |

NeoFit Supabase project:

- وجود ندارد
- Project ID/ref ندارد
- Table/Auth/RLS/Migration ندارد

Cost read:

```text
type: project
recurrence: monthly
amount: 0
```

#### Proposed decision — pending explicit acceptance

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Region بر اساس Region فعلی Projectهای حساب و geography اروپایی پیشنهاد شده است؛ latency/residency benchmark claim نیست.

#### Stage 4 architecture gate

- `@supabase/supabase-js` + `@supabase/ssr`
- Browser/Server client separation
- cookie-aware Next.js proxy
- `getClaims()` برای protected identity paths
- migrations as Schema authority
- generated database types
- RLS پیش از Application use
- ownership با `auth.uid()` و `with check`
- anon denied برای User data
- Service Role فقط Server/Operations
- SQL بدون Nutrition arithmetic
- Shared Core output با schema version persist می‌شود.

#### Stage 4 proposed batches

- 4A: explicit decision، cost confirmation، Project creation
- 4B: CLI/config + SSR clients
- 4C: profiles/user_settings + RLS + generated types
- 4D: nutrition_goals/nutrition_entries persistence contracts
- Closure: advisors، RLS tests، Core/Web CI و docs

#### Planning commits

- Stage 4 Plan `c2dc8a9f582eb501fc14a947a03ab9da15a6f473`
- Master initial update `653510cfcd8f4e4867bf5a2e2347daa3ccd5c7f2`
- Progress initial head `65868b0ebd50e99781c5d0dee49e598352e10b96`

#### Planning candidate CI

Candidate head:

```text
65868b0ebd50e99781c5d0dee49e598352e10b96
```

Nutrition:

- Run `30916037781` — success
- Artifact `8895077703`
- Digest `sha256:1772d2b6a66f34bbcb2044d1e28be82e2b3780b78636e687104c6d49add556a1`
- Core parity/AST/TypeScript pass

Web:

- Run `30916032109` — success
- Artifact `8895107603`
- Digest `sha256:fd2b5de8c0f55f5d4d93b5b3c0fd34a6723a49e0ee31470d2c2cb620699d610f`
- TypeScript، Adapter tests، Next build، Visual و PWA runtime pass

Review thread باز پیش از Final docs update: صفر.

#### Current blocker

کاربر باید سه مقدار را صریحاً بپذیرد:

1. Organization `Emad's Org`
2. Region `eu-central-1`
3. Cost `0` monthly

تا قبل از پذیرش:

- `confirm_cost` اجرا نمی‌شود؛
- Supabase Project ساخته نمی‌شود؛
- Auth/Schema/RLS implementation آغاز نمی‌شود.

---

## ۴. Claim boundaries

ثابت شده است:

- Stage 3 کامل و بسته است.
- Supabase Organization/Projects/Cost بررسی شده‌اند.
- Stage 4 Plan و Security gates ثبت شده‌اند.
- Planning candidate در Core/Web CI سبز است.

ثابت یا انجام نشده است:

- پذیرش Organization/Region/Cost؛
- NeoFit Supabase Project؛
- Auth/SSR clients؛
- Postgres migrations؛
- RLS policies/tests؛
- Full Browser Catalog/IndexedDB؛
- AI/Vision Web flow؛
- Vercel HTTPS Preview؛
- Public Final Schema/ID freeze.

---

## ۵. Stage 5–9

- Stage 5: Nutrition vertical slice
- Stage 6: AvalAI/Vision
- Stage 7: Full Browser Catalog، IndexedDB و Offline Sync
- Stage 8: Migration/Recovery
- Stage 9: Web RC، Vercel HTTPS و Issue #16

---

## ۶. Anti-goalها

- Project creation بدون explicit acceptance
- reuse کردن Project unrelated
- Dashboard-only Schema edits
- permissive RLS
- Service Role در Browser
- Server authorization فقط با `getSession()`
- Nutrition arithmetic در SQL/React
- Provider-created Nutrition
- ORM/monorepo tooling بدون نیاز اثبات‌شده
- Full Catalog/IndexedDB در Stage 4
- Vercel claim بدون Deployment واقعی

---

## ۷. Exact continuation point

1. Stage 4 Plan، این فایل و Progress Log خوانده شوند.
2. PR #26 Head/CI/Review و Issue #25 بررسی شوند.
3. Final Nutrition/Web CI روی Head این اسناد پاس شود.
4. PR #26 از Draft به Ready و با expected head Merge شود.
5. Merge SHA و Planning evidence در Issue #25 ثبت شود.
6. کاربر Organization/Region/Cost را صریحاً بپذیرد.
7. فقط پس از پذیرش `Supabase.confirm_cost` اجرا شود.
8. Project `neofit` ایجاد و ID/ref/region/status ثبت شود.
9. Stage 4B در Branch/PR مستقل و test-first آغاز شود.
10. Issue #16 تا Preview واقعی HTTPS باز بماند.

# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 4 Supabase planning/decision gate

## پروتکل

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، مشکلات، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | انجام‌شده | PR #12، Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | انجام‌شده | PR #13، Merge `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | انجام‌شده | PR #15، Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | تعویق‌شده | Issue #16؛ Vercel Preview واقعی ندارد |
| 3 | انجام‌شده | Batch 1–6 Merge، PR #24 Closure، Issue #17 closed |
| 4 | Planning/Decision | Issue #25؛ Supabase project هنوز ساخته نشده |
| 5–9 | شروع‌نشده | مطابق Master Plan |

---

## Stage 0–2 evidence

- Pivot Merge `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Persian RTL UX Merge `a458a27a2685bfa7d85ea28686b3182c3167d747`
- PWA Foundation Merge `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b`
- Vercel HTTPS validation در Issue #16 باز است.

---

## Stage 3 evidence ledger

### Batch 1 — Arithmetic/domain

- PR #18
- Merge `c9599c4905f9fc1d28ba7e9086edf20376991740`
- `10/10` tests

### Batch 2 — Controlled Persian Search/Ranking

- PR #19
- Merge `917f04e319a924dda7dfb16d079453a5e5686541`
- `25/25` tests
- Natural Query accuracy خارج از Claim است.

### Batch 3 — Catalog Release/Provenance/Legacy Adapter

- PR #20
- Merge `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- `34/34` tests
- Schema/ID `1.1.0` همچنان `candidate-not-final`

### Batch 4 — Universal Estimate/SQLite parity

- PR #21
- Merge `d6c0df31999595096224ec1011574245d5dc75ad`
- `43/43` tests
- 12 Pure files

### Batch 5 — ID/Fingerprint/Release parity

- PR #22
- Merge `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- `52/52` tests
- 13 Pure files

### Batch 6 — Web Nutrition Adapter

- PR #23
- Merge `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`
- Web Adapter tests `9/9`
- Core tests `52/52`
- Web از Shared Core برای estimate، recipe، diary summary، goals و Persian normalization استفاده می‌کند.
- React component Nutrition math تکراری ندارد.

Final Batch 6 evidence:

- Head `5b33d137ab3f35a1f89bcb186e410b2533e94c5c`
- Nutrition CI `30868394519` — success
- Artifact `8876962490`
- Digest `sha256:4827344e1441a61dbeab6675bd7684869ab5bee7a6281c92c19a4e1ce48033c3`
- Web CI `30868394529` — success
- Artifact `8876973096`
- Digest `sha256:c1c326e8463f0fa8177154c0fd012326a8c362b7826bad098948ba85fda960f4`

### Stage 3 Closure

- PR #24
- Merge `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`
- Issue #17 closed/completed

Closure candidate:

- Head `9ee1a2411bb0113e40735e79fcd5e8bbb34a3d95`
- Nutrition CI `30868701581` — success
- Artifact `8877065210`
- Digest `sha256:6bcf2cb716adc49e69121f87338fd838ed0e2bd4b7568bd1dc7888c764f9538b`
- Web CI `30868701585` — success
- Artifact `8877082184`
- Digest `sha256:2e30058850433028e369adc6c36b48006d945d393f0d42176fa905b37226bb9b`

Final document head:

- Head `43102e4925effb4f8c80dfa05b1588c08dd2f263`
- Nutrition CI `30868884712` — success
- Artifact `8877128689`
- Digest `sha256:de56b9d8f7f38b07c18d8424a9da51a7d68617785c4eb8f4a415655204ae689e`
- Web CI `30868884702` — success
- Artifact `8877147921`
- Digest `sha256:f35e03b57db23bdda15fe1b6c7659d3c5af94e2a2125be12ecbe6a104fd9f76c`

---

## Entry 020 — Stage 4 real-state reconstruction

**تاریخ/زمان:** ۴ اوت ۲۰۲۶، حدود ۱۷:۱۰ ایران  
**Integration:** `web/pwa-foundation`  
**Base merge:** `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

### Start protocol

- `docs/NEOFIT_MASTER_PLAN.md` از Integration کامل خوانده شد.
- این Progress Log از Integration کامل خوانده شد.
- PR #24 از GitHub واقعی بررسی شد: closed/merged.
- Issue #17 بررسی شد: closed/completed.
- Repository برای Supabase/Auth/RLS env/code جست‌وجو شد: مورد موجود پیدا نشد.

### Supabase organization inventory

Connector `list_organizations`:

```text
Name: Emad's Org
ID: yzymkjsfqoohxbqkhzhs
```

### Supabase projects inventory

Connector `list_projects`:

```text
Emad211's Project
ref: albwvkdamcmvukhzafep
region: eu-central-1
status: INACTIVE

nila-gol
ref: msiowolgbuffddhcdmqw
region: eu-central-1
status: INACTIVE
```

نتیجه:

- NeoFit Supabase project وجود ندارد.
- هیچ Project قدیمی به‌عنوان NeoFit reuse نشد.
- هیچ Table/Auth/RLS/Migration برای NeoFit وجود ندارد.

### Cost inventory

Connector `get_cost` با Organization واقعی:

```text
type: project
recurrence: monthly
amount: 0
```

هیچ `confirm_cost` یا `create_project` اجرا نشد.

### Official architecture verification

مستندات رسمی Supabase کنترل شدند:

- SSR/Next.js: `@supabase/ssr`، browser/server clients، cookie refresh proxy، `getClaims()` برای protected identity.
- RLS: فعال روی تمام exposed public tables، ownership با `auth.uid()`، Insert/Update با `with check`.
- Generated types: Supabase CLI از Schema واقعی.
- Database changes: migration versioned.

---

## Entry 021 — Stage 4 planning checkpoint

**Issue:** #25  
**Branch:** `stage4/supabase-foundation-plan`  
**Base:** `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

### GitHub records

Issue #25 ساخته شد:

```text
Stage 4: Supabase Auth, Postgres and RLS foundation
```

Issue صریحاً ثبت می‌کند:

- Planning/Decision only؛
- NeoFit project وجود ندارد؛
- Organization/Region/Cost پیشنهادی؛
- project creation فقط پس از پذیرش صریح؛
- Service Role، RLS، migration و Nutrition boundaries.

Branch از Closure merge واقعی ساخته شد:

```text
stage4/supabase-foundation-plan
```

### Documents

Authority/decision plan:

```text
docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md
```

Commit:

```text
c2dc8a9f582eb501fc14a947a03ab9da15a6f473
```

Master Plan update:

```text
653510cfcd8f4e4867bf5a2e2347daa3ccd5c7f2
```

Progress Log update/head:

```text
<current commit after this update>
```

### Proposed decision — pending explicit acceptance

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

### Planned Stage 4 batches

- 4A: explicit decision، cost confirmation، Project creation
- 4B: CLI/config، SSR browser/server/proxy clients
- 4C: profiles/user_settings + RLS + generated types
- 4D: nutrition_goals/nutrition_entries persistence contracts
- Closure: advisors، RLS tests، Core/Web CI، docs

### Current status

- Supabase project: not created
- Cost confirmation: not executed
- Auth: not started
- Schema: not started
- RLS: not started
- Migrations: not started
- Stage 4 implementation parity: not claimed
- Issue #16: open/deferred

### Exact continuation point

1. Issue #25، Stage 4 Plan، Master Plan و Progress Log خوانده شوند.
2. Planning PR ساخته و Nutrition/Web CI روی Head نهایی پاس شود.
3. Reviewها رفع و Planning PR Merge شود.
4. کاربر باید Organization، Region و Cost را صریحاً بپذیرد.
5. فقط بعد از پذیرش `confirm_cost` و Project creation اجرا شود.
6. Project ID/ref/region/status در Issue #25 و هر دو سند ثبت شود.
7. Stage 4B در Branch/PR مستقل و test-first آغاز شود.

**هیچ Supabase resource در این Entry ساخته نشده است.**

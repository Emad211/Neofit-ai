# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۵ اوت ۲۰۲۶ — Stage 4A project provisioning complete

## پروتکل

در شروع هر نوبت:

1. Master Plan کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md` خوانده شود.
5. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
6. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، Failureها، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | active/parallel | Issue #16، Draft PR #28 |
| 3 | complete | PR #18–#24، Issue #17 closed |
| 4A | complete | Project `rjwrobltmjodfarnltal` ACTIVE_HEALTHY |
| 4B | next | Supabase CLI/config + SSR clients |
| 4C–4D | not started | Schema/RLS سپس Nutrition persistence |
| 5–9 | not started | مطابق Master Plan |

---

## Stage 3 closure

- Closure merge: `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`.
- Core `52/52`.
- Web Adapter `9/9`.
- 13 Pure source files.
- Issue #17 closed/completed.

---

## Entry 020–024 — Stage 4 planning history

### Account reconstruction

```text
Organization: Emad's Org
Organization ID: yzymkjsfqoohxbqkhzhs
Existing project region: eu-central-1
NeoFit project at planning time: none
Cost: 0 monthly
```

### Planning records

- Issue #25 created.
- `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` created.
- Planning PR #26 merged: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`.
- Handoff PR #27 merged: `e79df1b20b1769f4c2b4b2084510664d76bd0d72`.
- Planning established Browser/Server separation، `getClaims()`، versioned migrations، RLS fail-closed، generated types and Shared Core authority.

At the end of Entry 024:

- Project did not exist.
- `confirm_cost` had not run.
- Auth/Schema/RLS had not started.
- Explicit Organization/Region/Cost acceptance was the hard gate.

---

## Entry 025 — Stage 4A explicit decision and project creation

**Date:** 5 Aug 2026  
**Issue:** #25  
**Integration branch:** `web/pwa-foundation`

### Accepted values

The user explicitly accepted:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

### Cost recheck and confirmation

Supabase Connector returned:

```text
type: project
recurrence: monthly
amount: 0
```

`confirm_cost` was executed only after that explicit acceptance.

### Project creation result

```text
name: neofit
project id/ref: rjwrobltmjodfarnltal
organization id: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
created at: 2026-08-04T20:45:48.830422Z
api url: https://rjwrobltmjodfarnltal.supabase.co
```

Connector checks:

- modern publishable key enabled؛ value not committed or documented.
- legacy anon key exists for compatibility؛ value not committed.
- Service Role was not requested or exposed.
- `public` schema baseline: zero Application tables.

### Evidence file

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`

### Direct-integration process correction

The intended action was to create a focused Stage 4A evidence branch. Tool routing caused direct Integration writes instead:

```text
3f23d1e569d22de4d2cc93eb399be68e416e56e8  placeholder evidence created
4345d9509c525873ffc20073690af78d89d5905a  placeholder replaced by verified evidence
f48698a723386d01bd7387c3390b8e732d39519b  accidental docs/.tmp created
f824b83c98bfb90bafd39c90abf9cbacfc76f7b3  docs/.tmp removed
364948a57bace2e93c424bdbf7c6a4a98a0a7656  initial correction record
b310925e5183c3fb01711a1c7f23870366e3e4b1  accidental root file x created
53352a5e70200a73565e15b71f88fb2fc58fe766  root file x removed
944acc79a60f91421ede46a9bbcee5ca910355f7  complete correction record
```

Impact boundary:

- no Application code changed؛
- no database schema or Auth config changed؛
- no key entered Git؛
- no migration ran؛
- no runtime behavior changed.

Correction decision:

- preserve transparent history instead of rewriting it؛
- synchronize all mandatory docs immediately؛
- enforce normal Branch/PR workflow again from Stage 4B.

### Mandatory document updates

- Master Plan: `bf6432da85443390ade497c05bc3449ac014cd22`.
- Stage 4 Plan: `e438fbd7a21232eecec0e5e8650182c6cc6e094f`.
- README: `bf3c0e4f61bd34b3e26f84602836660037744342`.
- Development Handoff: `6e8d087c76d17c11e83bea8acf616e3ecfd5a4b2`.
- Issue #25 body synchronized with Project evidence.

### Claim boundaries

Proven:

- explicit decision accepted.
- Cost confirmation executed.
- independent Project exists and is healthy.
- Project ref/region/status/URL verified.
- baseline public schema is empty.

Not proven:

- Web client or SSR client works.
- Auth session works.
- migrations or user tables exist.
- RLS exists.
- generated database types exist.
- Vercel environment variables are configured.

---

## Stage 2B parallel state

Vercel Stage 2B remains independent in Issue #16 / Draft PR #28. Supabase Project creation does not close or merge that work.

---

## Exact continuation point

1. Verify Core/Web CI on the final Integration HEAD containing Stage 4A evidence/docs.
2. Create `stage4b/supabase-ssr-foundation` from that verified HEAD.
3. Open a focused Draft PR.
4. Write tests/contracts before implementation.
5. Add env/config/Browser/Server/Proxy foundation without user tables.
6. Run Core/Web CI، inspect review threads and secret boundaries.
7. Update mandatory docs at every checkpoint.
8. Start Stage 4C only after Stage 4B review/merge.

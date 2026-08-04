# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۴ اوت ۲۰۲۶ — Stage 4 planning merged؛ decision pending

## پروتکل

در شروع هر نوبت:

1. Master Plan کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
5. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، مشکلات، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | complete | PR #12، `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | complete/accepted | PR #13، `a458a27a2685bfa7d85ea28686b3182c3167d747` |
| 2A | complete | PR #15، `b7b19a52f06b3ef9db1bd08ee58a5965ddf8540b` |
| 2B | deferred | Issue #16؛ Preview واقعی ندارد |
| 3 | complete | Batch 1–6 + Closure PR #24؛ Issue #17 closed |
| 4 | decision gate | Planning PR #26 merged؛ Issue #25 open؛ Project ندارد |
| 5–9 | not started | مطابق Master Plan |

---

## Stage 3 closure evidence

Implementation merges:

- Batch 1 `c9599c4905f9fc1d28ba7e9086edf20376991740`
- Batch 2 `917f04e319a924dda7dfb16d079453a5e5686541`
- Batch 3 `02c1bcf0b301a920b12abcff4f653575cb97bf7f`
- Batch 4 `d6c0df31999595096224ec1011574245d5dc75ad`
- Batch 5 `d3c0a28ecf2596e94c86ff74e2f00a0523219433`
- Batch 6 `6b46f1d6af2df345b2504a8d6bca3e4c8aa2d412`
- Closure `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

Final:

- Core `52/52`
- Web Adapter `9/9`
- 13 Pure files
- Issue #17 closed/completed
- Final Nutrition CI `30868884712`، Artifact `8877128689`
- Final Web CI `30868884702`، Artifact `8877147921`

---

## Entry 020 — Stage 4 account reconstruction

**تاریخ:** ۴ اوت ۲۰۲۶  
**Base:** `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`

شروع:

- سه سند اجباری/مرتبط بررسی شدند.
- PR #24 merged و Issue #17 closed تأیید شد.
- Repo برای Supabase/Auth/RLS/Env جست‌وجو شد: مورد موجود نبود.

Organization:

```text
Emad's Org
yzymkjsfqoohxbqkhzhs
```

Projects:

```text
Emad211's Project
ref albwvkdamcmvukhzafep
region eu-central-1
status INACTIVE

nila-gol
ref msiowolgbuffddhcdmqw
region eu-central-1
status INACTIVE
```

NeoFit project:

- وجود ندارد
- Project ID/ref ندارد
- Auth/Table/RLS/Migration ندارد

Cost:

```text
type project
recurrence monthly
amount 0
```

هیچ `confirm_cost` یا `create_project` اجرا نشد.

Official Supabase docs برای SSR، `getClaims()`، RLS، generated types و migrations بررسی شدند.

---

## Entry 021 — Stage 4 planning records

- Issue #25 ساخته شد.
- Branch `stage4/supabase-foundation-plan` از Closure merge ساخته شد.
- Plan ایجاد شد:
  - `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`
  - Commit `c2dc8a9f582eb501fc14a947a03ab9da15a6f473`
- Master initial update `653510cfcd8f4e4867bf5a2e2347daa3ccd5c7f2`
- Initial Progress head `65868b0ebd50e99781c5d0dee49e598352e10b96`
- Draft PR #26 باز شد.

Proposed decision:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

این تصمیم در این Entry پذیرفته نشده بود.

---

## Entry 022 — Planning candidate CI

Head `65868b0ebd50e99781c5d0dee49e598352e10b96`:

Nutrition:

- Run `30916037781` — success
- Artifact `8895077703`
- Digest `sha256:1772d2b6a66f34bbcb2044d1e28be82e2b3780b78636e687104c6d49add556a1`

Web:

- Run `30916032109` — success
- Artifact `8895107603`
- Digest `sha256:fd2b5de8c0f55f5d4d93b5b3c0fd34a6723a49e0ee31470d2c2cb620699d610f`

Review threads: صفر.

---

## Entry 023 — Final planning validation and merge

Final docs head:

```text
e54a2bdf7c40a60e70c6c36737e25ac434ea5b19
```

Nutrition:

- Run `30916469886` — success
- Artifact `8895252025`
- Digest `sha256:b94888510ea6ed4d6a094fb1667114432aa3678edcd862bf6167ebde47adb6fd`

Web:

- Run `30916467290` — success
- Artifact `8895277329`
- Digest `sha256:64d11b14be1edf70bd3723cdbeb4d38ff9e8fda708807b9618841e68add77fdb`

Gates:

- Core parity/AST/TypeScript pass
- Web TypeScript، Adapter tests، Next build، Visual، PWA runtime/offline pass
- Review threads: صفر

PR #26:

- Ready شد.
- expected head merge شد.
- Merge SHA:

```text
094fc099f624b0349d6ed3bd1485bad6f11fdf14
```

Planning merge ثابت می‌کند:

- Supabase account inventory ثبت شده؛
- Organization/Region/Cost proposal ثبت شده؛
- Auth/RLS/migration/security plan Merge شده؛
- هیچ Regression در Core/Web ایجاد نشده است.

Planning merge ثابت نمی‌کند:

- کاربر تصمیم را پذیرفته؛
- Project ساخته شده؛
- Auth/RLS/Migration وجود دارد.

---

## Entry 024 — Post-merge exact handoff

**Branch:** `stage4/planning-handoff`  
**Base:** `094fc099f624b0349d6ed3bd1485bad6f11fdf14`

هدف:

- حذف وضعیت قدیمی `PR #26 Draft/active` از اسناد؛
- ثبت Planning merge واقعی؛
- تعیین Hard gate فعلی بدون ساخت Resource.

Current actual state:

- PR #26 merged
- Issue #25 open
- Supabase project: none
- `confirm_cost`: not called
- Auth: not started
- Schema/RLS: not started
- Issue #16: open

Hard gate:

کاربر باید صریحاً این سه مقدار را بپذیرد:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
```

### Exact continuation point

1. Master Plan، این Log و Stage 4 Plan خوانده شوند.
2. Issue #25 و Supabase inventory/cost دوباره بررسی شوند.
3. پذیرش صریح Organization/Region/Cost از کاربر دریافت شود.
4. فقط بعد از پذیرش `Supabase.confirm_cost` اجرا شود.
5. Project `neofit` ساخته شود.
6. Project ID/ref/region/status در Issue و دو سند ثبت شود.
7. Stage 4B در Branch/PR مستقل و test-first آغاز شود.
8. Issue #16 تا Preview واقعی HTTPS باز بماند.

**در این Handoff نیز هیچ Supabase resource ساخته نشده است.**

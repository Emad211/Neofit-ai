# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۵ اوت ۲۰۲۶ — Stage 4C از نظر کد و Remote اثبات شده؛ PR #33 هنوز Draft و unmerged است

## پروتکل

در شروع هر نوبت:

1. Master Plan، این دفتر و Handoff خوانده شوند.
2. سند Stage فعال و Evidenceهای مرتبط خوانده شوند.
3. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر برش، هدف، Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه ثبت شود.

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | complete | PR #12 |
| 1 | complete/accepted | PR #13 |
| 2A | complete | PR #15 |
| 2B | active/parallel | Issue #16، Draft PR #28 |
| 3 | complete | PR #18–#24، Core `52/52`، Web `9/9` |
| 4A | complete | Project `rjwrobltmjodfarnltal` |
| 4B | complete/merged | PR #30، merge `17d0e8c…` |
| 4C | implementation + remote proof complete؛ unmerged | Draft PR #33 |
| 4D | not started | بعد از Merge 4C |
| Frontend | complete؛ separate/unmerged | Draft PR #34 |

---

## Stage 3 closure

- Closure merge: `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`.
- Shared Nutrition Core `52/52`.
- Web Adapter `9/9`.
- Issue #17 closed.

---

## Stage 4A — Supabase Project

```text
project ref: rjwrobltmjodfarnltal
organization: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
cost confirmation: 0 monthly
```

- هیچ key value commit نشد.
- baseline public Application tables هنگام ایجاد: `0`.

Authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`

---

## Stage 4B — SSR foundation complete and merged

پیاده‌سازی:

- fail-closed public env parser؛
- Browser/Server client separation؛
- cookie-aware SSR client؛
- Proxy با `getClaims()` و cookie synchronization؛
- `private, no-store`؛
- secret-boundary tests.

```text
PR #30 implementation merge: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
Closure merge: 72202f2f0ff281bf0624b9ebb933ac5afeaad8fc
```

Final Stage 4B CI:

```text
Supabase Foundation CI 30958530329 — success
Nutrition Core CI 30958530294 — success
Web CI 30958530262 — success
Vercel Build Contract 30958530296 — success
```

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`

---

## Stage 4C — test-first implementation, drift correction and Remote proof

**Issue:** #25  
**Branch:** `stage4c/identity-schema-rls`  
**Draft PR:** #33

### Red checkpoint

در اولین implementation head، دو failure عمدی/واقعی باقی مانده بود:

```text
head: f2082a050763e5bb9f2171cb1efa2a0da407557b
Identity CI 30959449583 — failure
Foundation CI 30959449610 — failure
```

علت‌ها:

1. `web/lib/supabase/database.types.ts` هنوز تولید نشده بود.
2. تست قدیمی Stage 4B هنوز به‌اشتباه انتظار صفر migration در تمام Stageهای بعد داشت.

### Corrections

- types مستقیماً از Project زنده تولید و commit شد.
- Foundation test به قرارداد درست تغییر کرد: Stage 4B migration اضافه نمی‌کند، اما migrationهای versioned Stageهای بعد مجازند؛ secret و permissive RLS همچنان ممنوع‌اند.
- migration filename با Remote history همگام شد:

```text
old planned repository name: 20260805000100_identity_foundation.sql
actual remote version:       20260804232149
final repository filename:   20260804232149_identity_foundation.sql
```

- SQL دوباره اجرا نشد؛ فقط drift نام فایل رفع شد.
- CI metadata از ادعای قدیمی `remoteMigrationApplied:false` به `remoteState: verified-separately` اصلاح شد.

### Remote schema

```text
profiles       RLS enabled
user_settings  RLS enabled
```

Migration history:

```text
version: 20260804232149
name: identity_foundation
```

Policies:

- هشت policy own-row؛
- فقط role `authenticated`؛
- INSERT دارای `WITH CHECK`؛
- UPDATE دارای `USING` و `WITH CHECK`؛
- هیچ policy permissive وجود ندارد.

Grants:

- authenticated: SELECT/INSERT/UPDATE/DELETE؛
- anon/PUBLIC: بدون grant.

Advisors:

```text
Security lints: 0
Performance lints: 0
```

### Runtime RLS proof

Project هیچ Auth user نداشت. تست با UUIDهای موقت و cleanup کامل انجام شد؛ هیچ account دائمی ساخته نشد.

Passed:

```text
anon_read_denied
user_a_reads_own
user_a_cannot_read_b
user_a_cannot_update_b
user_a_cannot_delete_b
user_a_cannot_insert_as_b
ownership_change_denied
```

Post-test:

```text
profiles_count: 0
user_settings_count: 0
auth_user_count: 0
```

### Green checkpoint

```text
validated implementation head: c5cface86f46134a4a0afcfc3c980f7ce613ee7a

Identity CI 30996283909 — success
Artifact 8926287946
Digest sha256:192ae440dfb98fb2329249fb3b1f0c881841b5774d2ec642c63efdd6f34fcfe9

Foundation CI 30996283993 — success
Artifact 8926292359
Digest sha256:528deb7235762d631751f5a6d8b469fe6a7291e49900b6e2f30c7c4f0ee9b549

Web CI 30996283899 — success
Artifact 8926312456
Digest sha256:60064bab80150fcb72c0952d29a2466625d4b11d1dcd667ee2d628d617deecc2

Vercel Build Contract 30996283903 — success
```

Authority:

- `docs/NEOFIT_STAGE4C_IDENTITY_RLS_EVIDENCE.md`

Stage 4C هنوز Merge نشده است.

---

## Frontend completion program — separate branch

**Branch:** `revival/full-ui-front`  
**Draft PR:** #34

فرانت فارسی end-to-end کامل و browser-proven شد:

- Onboarding 15 مرحله‌ای و Body Map 73 ناحیه‌ای؛
- Today، Workout، Nutrition، Progress؛
- Profile/Settings/Notifications؛
- Coach محلی و مرز پزشکی؛
- PWA، Offline، 404، Error و accessibility hardening.

```text
runtime head: d36a67b001a280fefbba6c676e69fb4f22ff20b2
UI Revival CI 30994858208 — success
Public Static Export 30994858276 — success
Public RawGitHack Preview 30994858167 — success
routes: 42/42
```

این Branch معماری فعلی `web/`، Supabase SSR و Shared Core را جایگزین نمی‌کند. انتقال بعدی باید کنترل‌شده باشد؛ Merge مستقیم ممنوع است.

---

## Stage 2B parallel state

Vercel HTTPS validation در Issue #16 / Draft PR #28 مستقل و باز است.

---

## Exact continuation point

1. Master Plan، Stage 4 Plan، Handoff، README، Issue #25 و PR #33 با Evidence Stage 4C همگام شوند.
2. CI documentation head بررسی شود.
3. PR #33 Draft و unmerged بماند تا تأیید صریح کاربر.
4. پس از تأیید، PR #33 Merge و Closure evidence ثبت شود.
5. Stage 4D فقط پس از Merge، با red migration/RLS tests آغاز شود.
6. برای انتقال فرانت PR #34، branch ادغام جدا از معماری فعلی ساخته شود؛ Merge مستقیم دو شاخه انجام نشود.

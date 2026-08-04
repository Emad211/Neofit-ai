# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۵ اوت ۲۰۲۶ — Stage 4B merged؛ Stage 4C exact next

## پروتکل

در شروع هر نوبت:

1. Master Plan کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. Stage 4A/4B Evidenceها خوانده شوند.
5. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از منبع واقعی بررسی شوند.
6. فقط Exact continuation point اجرا شود.

در پایان هر نوبت، هدف، شواهد، Commitها، تست‌ها، Failureها، Correctionها، تصمیم‌ها و نقطهٔ ادامه ثبت شود.

---

## نمای کلی

| Stage | وضعیت | شواهد |
|---|---|---|
| 0 | complete | PR #12 |
| 1 | complete/accepted | PR #13 |
| 2A | complete | PR #15 |
| 2B | active/parallel | Issue #16، Draft PR #28 |
| 3 | complete | PR #18–#24، Core `52/52`، Web `9/9` |
| 4A | complete | Project `rjwrobltmjodfarnltal` |
| 4B | complete | PR #30، Merge `17d0e8c…` |
| 4C | exact next | Identity schema + RLS |
| 4D | not started | Nutrition persistence |
| 5–9 | not started | مطابق Master Plan |

---

## Stage 3 closure

- Closure merge: `d1f4c465fc3192cb6c919fca6d4940f1ab75d3d5`.
- Core `52/52`.
- Web Adapter `9/9`.
- 13 Pure source files.
- Issue #17 closed/completed.

---

## Entry 020–024 — Stage 4 planning

- Issue #25 created.
- Planning PR #26 merged: `094fc099f624b0349d6ed3bd1485bad6f11fdf14`.
- Handoff PR #27 merged: `e79df1b20b1769f4c2b4b2084510664d76bd0d72`.
- Browser/Server separation، `getClaims()`، migration authority، fail-closed RLS و Shared Core authority قفل شدند.

---

## Entry 025 — Stage 4A Project provisioning

Accepted:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

Executed:

- `get_cost` → `0 monthly`.
- `confirm_cost`.
- `create_project`.

Result:

```text
project ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
api url: https://rjwrobltmjodfarnltal.supabase.co
public schema tables: 0
```

Evidence:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`.
- no key value committed.
- no privileged key requested or exposed.

---

## Entry 026 — Stage 4B implementation

**Issue:** #25  
**PR:** #30  
**Branch:** `stage4b/supabase-ssr-foundation`

### Red checkpoint

```text
Head: dc8e718d4a95f0cdf271840578157bf599de3183
Web CI 30957552355 — failure
Foundation CI 30957552028 — failure
First error: missing web/lib/supabase/env.ts
```

### Implementation

```text
supabase/config.toml
web/lib/supabase/env.ts
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/.env.example
web/tests/supabase-foundation.test.ts
.github/workflows/supabase-foundation-ci.yml
```

Dependencies:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Contracts:

- fail-closed public env parsing.
- Browser/Server client separation.
- async cookie-aware server client.
- request/response cookie synchronization.
- `getClaims()` verified identity refresh.
- no `getSession()` authorization.
- session `private, no-store`.
- future auth/account matcher only.
- blank Supabase values in `.env.example`.
- no migration/table/RLS.

Corrections:

1. Existing App/Vercel env assignments preserved.
2. `.ts` dynamic import suffix corrected؛ Assertions unchanged.
3. secret scanner narrowed from explanatory docs to runtime/config.

### Green candidate

```text
Head: d796ff66469be062602cc08c11be4f7da6e9279f
Foundation CI 30958021239 — success
Artifact 8911823269
Digest sha256:72ea57192d121d72474611a65d3a50ea31975336f76f45c6bbdc0f6471d772d5

Web CI 30958021241 — success
Artifact 8911836376
Digest sha256:f9b43059040787f990a601c2be559958adda963660d0d15b2fc5a4611cabbb97

Vercel Build Contract 30958021244 — success
```

### Base synchronization

```text
Integration Vercel commit: 13a9407374d2d84d754dcf5eb7d50b8b4176bb64
Conflict-free sync: e36b5310fc443afbc4f69ca6bf73ca921c050a5c
```

Branch behind Integration: zero.

---

## Entry 027 — Stage 4B final validation and merge

Final implementation/documentation head:

```text
7ed955139d51b3546b489c8f649f144f390cb8f0
```

Final CI:

```text
Supabase Foundation CI 30958530329 — success
Artifact 8912018526
Digest sha256:1455fd4ff726ac4ee2a5cbb0a99dd09d3528becb2f86ce9dd858cbdb37e6cba7

Nutrition Core CI 30958530294 — success
Artifact 8912013429
Digest sha256:649639a40dc0b20594ea48e6534cc6cd215a170fd251699279032a5a4d68b12c

Web CI 30958530262 — success
Artifact 8912039816
Digest sha256:790d13b030e96038be394ec50108da38c601988f8bb9106b57b8153892a83c6a

Vercel Build Contract 30958530296 — success
```

Review:

- actual current-base diff: 16 files.
- review threads: zero.
- branch behind Integration: zero.
- remote `public` Application tables: 0.

Merge:

```text
PR #30 marked Ready
expected head: 7ed955139d51b3546b489c8f649f144f390cb8f0
merge SHA: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
```

Stage 4B is complete.

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`.

---

## Stage 2B parallel state

Vercel protected HTTPS validation remains independent in Issue #16 / Draft PR #28.

---

## Exact continuation point

1. Merge Stage 4B closure handoff after documentation CI.
2. Update Issue #25 to record Stage 4B complete.
3. Create `stage4c/identity-schema-rls` from closure Integration head.
4. Write migration/RLS policy tests before remote DDL.
5. Add versioned migration for `profiles` and `user_settings`.
6. Apply migration only after static/local review.
7. Generate database types، run advisors and prove anon/cross-user denial.
8. Keep Stage 2B Vercel independent and open.

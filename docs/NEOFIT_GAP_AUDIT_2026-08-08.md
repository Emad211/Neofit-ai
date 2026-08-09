# NeoFit Gap Audit — 2026-08-08

Status: active canonical backlog for the Preview-only development cycle.

Detailed incident/design history lives in each Stage document. This file intentionally tracks the **current truth**, not every intermediate implementation attempt.

## Severity

- **P0** — identity, privacy, data-integrity or core runtime blocker
- **P1** — core user feature still fake/incomplete or unnecessarily expensive
- **P2** — important pre-Production hardening/completeness
- **P3** — polish/expansion after core data and agent contracts are proven

---

## P0 — Identity / security / data integrity

### Auth confirmation + recovery — CODE/LOCAL-RUNTIME GREEN; HOSTED MAILBOX E2E OPEN

Stage 13 replaced the broken cross-host PKCE confirmation path with scanner-safe staged `TokenHash` verification:

- email-link GET does not consume OTP;
- short-lived HttpOnly staged-token cookie;
- clean canonical URL without `token_hash`;
- explicit user POST performs `verifyOtp`;
- exact cookie-path cleanup;
- recovery intent HMAC-bound to user + session + timestamp;
- sensitive Auth headers are verified by real built-Next HTTP smoke.

Hosted Supabase/Vercel configuration is now in place:

- stable Preview Site URL;
- custom SMTP for Preview QA;
- Confirm Signup TokenHash template;
- Reset Password TokenHash template;
- `AUTH_RECOVERY_INTENT_KEY` in Preview environment.

Still required after latest stacked Preview deploy:

- fresh mailbox signup → confirm → session → onboarding;
- forgot password → mailbox → recovery → new password;
- password-changed security notification delivery.

### Email change — STAGE 14 CODE + HOSTED CONFIG GREEN; TWO-ADDRESS E2E OPEN

Stage 14 adds live-session-gated `updateUser({ email })` and reuses the same scanner-safe confirmation boundary for `email_change`.

Hosted settings now confirmed:

- Secure Email Change ON;
- Change Email TokenHash template configured;
- Email Address Changed security template configured;
- Password Changed notification enabled.

Still required: disposable old-address + new-address mailbox E2E.

### Password policy — APP/HOSTED CORE SETTINGS ALIGNED

Current hosted settings confirmed:

- minimum password length = 12;
- Require current password when updating = ON;
- Email OTP expiration = 3600 seconds;
- Secure password change = intentionally OFF until NeoFit implements/tests the exact reauthentication nonce flow;
- password character-class requirement = intentionally unset until app validation/copy matches it;
- leaked-password protection = unavailable on current Free plan and must not be claimed active.

### Session semantics — CODE HARDENED; MULTI-BROWSER QA OPEN

Stage 13 provides:

- pending submit state to reduce accidental duplicate sessions;
- normal logout = local session;
- explicit global logout;
- revoke-other-sessions control;
- live `getUser()` validation for password/session/BYOK/provider-cost-sensitive actions.

Do not fabricate browser/device labels from current Supabase session metadata; login is server-side and observed user agents are not reliable device identity.

Still required: Browser A + Browser B revoke proof.

### Fresh-account post-login correctness — FIXED IN STAGE 13

Fresh account with zero Nutrition goals and zero diary entries no longer crashes `/today`. Empty diary = exactly zero consumed; malformed non-empty data still fails closed.

---

## P1 — Core user data truth

### Progress body measurements — STAGE 10 FIXED; HOSTED QA OPEN

Real `body_measurements` under own-row RLS replaced synthetic weight trend. Need real account add/refresh/history QA.

### Account Nutrition targets — STAGE 11 FIXED

Real accounts no longer receive demo calorie/macro targets. Guest fixtures remain explicitly demo-only.

### Workout Plan — STAGE 16 LIVE SCHEMA + CODE + CI GREEN; HOSTED E2E OPEN

`public.workout_plans` is now the authenticated source of truth:

- immutable-content versions;
- `draft | active | archived` lifecycle;
- one active version per user;
- own-row RLS;
- SECURITY INVOKER plan RPCs;
- no authenticated plan-content UPDATE/DELETE;
- plan activation blocked during active Workout session;
- `workout_sessions` stores plan id/version provenance;
- Player resume fails closed on provenance mismatch;
- Account with no active plan shows empty state;
- Guest fixture remains explicitly Demo;
- synthetic workout calorie burn removed from account workout UI;
- Player route reuses plan-snapshot identity rather than making a second identity read.

Live migrations:

- `20260809133914_workout_plan_versioning`
- `20260809133953_index_workout_session_plan_fk`
- `20260809134603_guard_workout_plan_activation_during_session`

Final code evidence: `Workout Plan Persistence CI` run `31317223286` success.

Hosted proof still required: account empty state, deliberate plan activation, exact UI reflection, Player provenance/resume, activation block mid-session, activation after complete/cancel.

### Nutrition Plan — STAGE 17 LIVE SCHEMA + CODE + CI GREEN; HOSTED E2E OPEN

`public.nutrition_plans` is now the authenticated source of truth:

- immutable-content versions;
- one active version per user;
- own-row RLS;
- SECURITY INVOKER plan RPCs;
- Account never silently receives `weeklyPlan` fixture;
- Guest weekly plan remains explicitly Demo;
- Account with no active plan shows empty state;
- persisted account plan stores only food identity + exact `sourceVersion` + portion count;
- catalog resolution requires exact id/version match;
- parser rejects stored nutrition claims including `calories`, `macros`, `energyKcal`, `proteinG`, `carbsG`, `fatG`, `nutrition`, `estimate`;
- plan UI never renders stored macro/calorie properties;
- `nutrition_entries` now has optional plan id/version/meal-id provenance for future plan-meal logging.

Live migration:

- `20260809140618_nutrition_plan_versioning`

Final code evidence: `Nutrition Plan Persistence CI` run `31317881612` success.

Hosted proof still required: account empty state, deliberate catalog-versioned plan activation, exact UI resolution, mismatch fail-closed, version activation/archive.

### Plan-meal → diary logging — OPEN

Stage 17 intentionally does not expose a fake “log this meal” button yet. The next write path must:

1. resolve plan food ids/source versions;
2. run the Shared Nutrition Core;
3. persist the Core-produced estimate;
4. store `nutrition_plan_id`, `nutrition_plan_version`, `nutrition_plan_meal_id` provenance;
5. remain idempotent under duplicate click/retry.

### Notifications center / push delivery — OPEN

No real notification persistence/delivery contract yet. Do not request push permission until there is a real notification source and delivery path.

---

## P1 — Request/performance architecture

### Main app Nutrition over-fetch — FIXED IN STAGE 11

App shell is identity-only; Today loads date-scoped diary data where needed.

### Plan page requests — BOUNDED

Workout Plan and Nutrition Plan pages use lightweight identity + one active-plan query. Catalog/plan resolution happens in-process. No AI call is needed to display plans.

### Future history pages — NEED PAGINATION

Today is date-bounded. Long-term diary/workout/audit history pages must use explicit range/cursor pagination rather than unbounded history reads.

---

## P1 — AI runtime / observability

### Google BYOK runtime proof — OPEN

Google-first vault/router/settings exist, but hosted Save/Test + real Coach request still need proof on the latest Preview stack.

### AvalAI fallback runtime proof — OPEN

Fallback/cooldown is contract-tested; still need a controlled Google failure followed by AvalAI success.

### AI request audit/budget — STAGE 15 LIVE SCHEMA + CODE + CI GREEN; HOSTED PROOF OPEN

`public.ai_request_audit` is metadata-only and bounded:

- one user reservation for the entire Google→AvalAI chain;
- default 12 rolling requests/minute, 120/hour;
- advisory-lock atomic reservation;
- 429 + `Retry-After` on exhaustion;
- no prompt/history/system text/output/API key/raw provider payload stored;
- no `countTokens` provider preflight;
- provider-returned token usage recorded when available, otherwise null;
- SECURITY INVOKER + RLS + column grants after Advisor caught the initial definer design.

Live migrations:

- `20260809131359_ai_request_audit_budget`
- `20260809132552_harden_ai_request_audit_rpc_invoker`

Final code evidence: `AI Request Audit Budget CI` run `31316133575` success.

Hosted proof still required:

- Google success → one audit row, attempt=1;
- controlled Google→AvalAI fallback → same request row, attempt=2;
- verify no sensitive content stored.

### Coach — READ-ONLY BY DESIGN

Coach context is selective and real (Profile/Safety/Nutrition/Workout/Progress). Do not enable plan mutation tools until hosted AI audit + plan runtime proofs are green.

---

## P2 — Auth / abuse / Production hardening

### CAPTCHA — OPEN, DO NOT FAKE

No visual-only CAPTCHA. Add Turnstile/hCaptcha only with real site key, Supabase provider secret, client token flow and E2E.

### Reauthentication — TEMPLATE READY; PRODUCT FLOW OPEN

Canonical Supabase reauthentication OTP template exists. NeoFit does not claim generic reauth elevation until the exact nonce contract is implemented/tested.

### Account deletion — DELIBERATELY OPEN

Do not expose a Delete Account button until there is:

- recent/proven reauthentication;
- exact-user binding;
- tightly scoped privileged backend delete boundary;
- Storage ownership cleanup;
- cascade/session semantics;
- disposable-account E2E.

Never put `service_role` / `sb_secret_*` into the browser/runtime bundle.

### MFA — OPEN

No MFA factors currently proven. Implement only with a complete enrollment/challenge/recovery UX.

### Session timeout/single-session policy — NOT PROVEN

Observed sessions were not time-boxed. Do not claim inactivity/single-session policy unless hosted plan/settings support and runtime prove it.

### SMTP — PREVIEW READY; PRODUCTION SENDER OPEN

Gmail SMTP is acceptable for Preview mailbox QA, not final Production transactional mail. Before Production move to a dedicated provider/domain with SPF/DKIM/DMARC and Auth-link tracking disabled.

---

## P2 — Product completeness

### Food catalog coverage — OPEN

Current Web catalog is small and IFKB-shaped. Expand through IFKB/FNDDS/SR-backed resolution before claiming broad food search or broad Nutrition Plan generation.

### Body photos/media — OPEN

Needs consent, private Storage RLS, deletion semantics and metadata minimization.

### Reports — OPEN

Must consume real Progress/Workout/Nutrition sources; do not resurrect old Firebase/Genkit flows.

---

## P2 — Agentic capability

Before any meaningful write-agent action:

1. deploy latest green stack to the same Preview Lab;
2. runtime-prove Auth mailbox/session flows;
3. runtime-prove Google/AvalAI + Stage 15 audit;
4. runtime-prove Stage 16 Workout Plan versions/provenance;
5. runtime-prove Stage 17 Nutrition Plan identity/version resolution;
6. implement Core-backed plan-meal logging;
7. define typed proposal schemas;
8. require explicit user confirmation for meaningful plan mutation;
9. never give the model raw SQL/unrestricted DB access.

---

## P3 — UX / PWA polish

Service Worker excludes `/api/`, `/auth/`, authorization-bearing requests and private/no-store responses. Remaining polish includes browser/device QA, accessibility regression, install UX and notification permission UX after real notification delivery exists.

---

## Current recommended order

1. Keep coding without extra Vercel deployments until the existing `neofit-preview-lab` quota is available.
2. Deploy the **latest green stacked candidate once**, Preview-only.
3. Run signup-confirm, password recovery, password-change notification, two-browser revoke, and two-address email-change E2E.
4. Run Google BYOK/Coach request and verify Stage 15 audit metadata.
5. Run controlled Google→AvalAI fallback and verify the same request/audit semantics.
6. Runtime-prove Stage 16 Workout Plan and Stage 17 Nutrition Plan empty/version/resolution flows.
7. Add Nutrition Plan meal → diary logging through Nutrition Core + plan provenance.
8. Runtime-prove body measurements and normal diary persistence.
9. Add real notifications and remaining Auth hardening (CAPTCHA/MFA/deletion) before public Production.
10. Add controlled Coach proposal/write flows only after the above.

## Release rule

All work remains Preview-only in `neofit-preview-lab`. No Production promotion until core P0/P1 hosted proofs are green with real accounts and real provider/mailbox traffic.

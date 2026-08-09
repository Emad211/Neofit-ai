# NeoFit Gap Audit — 2026-08-08

Status: active engineering backlog. This document is the canonical gap inventory for the Preview-only development cycle.

## Severity model

- **P0**: breaks identity, privacy, data integrity, or blocks core runtime proof.
- **P1**: user-facing core feature is fake, incomplete, or unnecessarily expensive.
- **P2**: important product hardening before Production, but not blocking current Preview development.
- **P3**: polish / expansion after the core data and agent contracts are proven.

## P0 — identity / security / data integrity

### Auth confirmation/recovery architecture — CODE + REAL NEXT HTTP PROOF COMPLETE IN STAGE 13; HOSTED E2E OPEN

The original incident was real: Supabase verified the email, then the Preview app failed to establish the SSR PKCE session because signup and callback crossed Vercel hostnames.

Stage 13 now has a scanner-safe one-time-link architecture:

- GET never calls `verifyOtp`;
- `token_hash` is staged in a short-lived HttpOnly cookie;
- the redirect URL is clean and contains no token hash;
- explicit user POST consumes the token;
- cookie cleanup uses the same exact Path + Max-Age=0;
- recovery intent is HMAC-signed and bound to user id + exact session id + timestamp;
- recovery configuration is checked before sending/consuming a one-time recovery link.

A real built Next server HTTP smoke proved the behavior, including canonical redirect host continuity, no-referrer/no-store headers, verification interstitial rendering and cross-origin signout rejection.

Hosted mailbox proof remains open until the next Preview deployment.

### Canonical Auth origin — CODE FIXED; HOSTED SITE URL CONFIGURED; MAILBOX PROOF OPEN

Sensitive Auth redirects use `NEXT_PUBLIC_APP_URL` / canonical origin directly. The stable Preview alias is configured in hosted Supabase. Final evidence is a fresh mailbox round-trip after the next Preview deployment.

Canonical Preview origin:

`https://neofit-preview-lab-emadk50000-9178-emads-projects-41cb6447.vercel.app`

### Sensitive Auth headers — REAL HTTP FIXED IN STAGE 13

The real Next smoke proved that the generic `Referrer-Policy` rule overrode the Route Handler's `no-referrer`. `next.config.ts` now has explicit `/auth/confirm` and `/auth/callback` rules after the generic header contract:

- `Referrer-Policy: no-referrer`
- `Cache-Control: private, no-store`

The HTTP smoke verifies the actual emitted headers.

### Password recovery — CODE COMPLETE; HOSTED CONFIG INSTALLED; MAILBOX E2E OPEN

Stage 13 adds generic/non-enumerating recovery request, scanner-safe token verification, signed 15-minute recovery intent, live Auth-server validation, password update and revoke-other-refresh-sessions behavior.

The Preview recovery signing secret is installed, custom SMTP is enabled and the hosted Recovery template uses NeoFit's `TokenHash` route. A real mailbox round-trip remains required after the next Preview deployment.

### Leaked-password protection — PLAN-GATED / OPEN

Supabase Security Advisor still reports `auth_leaked_password_protection` disabled. Current project plan is Free and the dashboard marks this control Pro-only, so NeoFit must not claim it is active.

### Session accumulation / duplicate login — REAL EVIDENCE; CODE CONTROL ADDED; MULTI-BROWSER QA OPEN

The one-user project had three `auth.sessions` rows and three refresh-token rows at the prior audit point. Two successful password sign-ins occurred only seconds apart.

Stage 13 adds pending/disabled Auth submit buttons, local default logout, explicit global logout and revoke-other-sessions controls.

Current session metadata is server-side (`user_agent=node`, Vercel/server IP), so NeoFit intentionally does not fabricate browser/device labels.

All observed sessions were AAL1, MFA factors = 0 and `not_after = null`.

### Locally valid but server-ended session gap — FIXED FOR SENSITIVE/COSTLY ACTIONS

Ordinary navigation remains fast with `getClaims()`. Security-sensitive mutations and BYOK/Coach provider access use `activeAuthSession()` = `getClaims()` + live `getUser()` Auth-server validation.

This intentionally adds one Auth-server request to AI interactions but no extra LLM inference call.

### First-account post-login crash — REAL BUG FIXED IN STAGE 13

Auth QA found real Stage 12 `/today` errors:

`energyKcal is missing from the Web macro view`

A fresh account had no Nutrition target and no diary entries. Stage 13 treats an empty diary as exactly zero consumed macros while malformed non-empty data still fails closed. The fresh-account case is in the Supabase app regression suite.

### First-account bootstrap transient failure — FIXED IN STAGE 9

Bootstrap retries only failed idempotent writes and never destroys an otherwise valid authenticated session solely because an optional bootstrap write remains partial.

## P1 — fake or incomplete core user data

### Synthetic Progress weight trend — FIXED IN STAGE 10

Progress uses real `body_measurements` with own-row RLS and explicit empty states. Hosted account measurement QA remains.

### Synthetic account Nutrition targets — FIXED IN STAGE 11

Real accounts no longer receive demo targets. Guest fixtures remain explicitly demo-only.

### Nutrition plan is fixture-backed — OPEN

The weekly Nutrition plan is still fixture-backed and is not yet a persisted per-user plan. This is now the largest remaining plan source-of-truth gap after Workout Stage 16.

### Workout plan fixture leakage — STAGE 16 LIVE SCHEMA + CODE + CI FIXED; HOSTED E2E OPEN

Stage 16 replaces the authenticated account's static workout fixture with `public.workout_plans`, a user-owned, versioned, immutable-content source under RLS.

Live migrations:

- `20260809133914_workout_plan_versioning`
- `20260809133953_index_workout_session_plan_fk`
- `20260809134603_guard_workout_plan_activation_during_session`

Key contracts:

- Guest keeps an explicitly labeled demo plan.
- Account with no active plan gets an empty state, never the Guest fixture.
- Plan definition changes create a new version instead of mutating historical JSON.
- At most one active plan exists per user.
- plan activation is blocked while a workout session is active.
- `workout_sessions` stores `workout_plan_id` and `workout_plan_version`.
- Player resume rejects plan provenance mismatch.
- authenticated workout/detail UI no longer displays fixture calorie-burn values.
- persisted duration/rest values are numeric; localized strings are presentation-only.
- Player reuses the plan snapshot identity instead of a separate workout-identity read.

Supabase Security Advisor reports no Stage 16 issue. Performance Advisor's new uncovered-FK warning was fixed by adding the dedicated session-plan FK index.

Transaction/rollback QA exercised version creation and the active-session activation guard without leaving synthetic rows.

`Workout Plan Persistence CI` run `31317223286` is green: plan contracts, Player regression, complete Supabase app regression, TypeScript, Next production build and data-truth/RLS/versioning gate all succeeded.

Hosted proof remains: account empty state, deliberately created active plan, exact UI reflection, session provenance/resume, blocked mid-session activation, and successful activation after completion/cancel.

### Notifications center / push contract — OPEN

No real notification persistence/push delivery contract exists yet.

## P1 — request / performance architecture

### Main app Nutrition over-fetch — FIXED IN STAGE 11

Shared shell is identity-only; Today loads date-scoped Nutrition data only where needed.

### Nutrition entry history query unbounded — FIXED FOR TODAY

Today's query is user/date bounded. A future history page still needs explicit pagination/range design.

## P1 — AI runtime proof / observability

### Google BYOK real request proof — OPEN

Vault/router/UI exist, but real hosted Save/Test + Coach provider request is still required.

### AvalAI controlled fallback proof — OPEN

Fallback/cooldown is contract-tested but has not been proven with a real Google failure followed by AvalAI success.

### AI request audit / user budget — STAGE 15 LIVE SCHEMA + CODE + CI COMPLETE; HOSTED PROOF OPEN

Stage 15 has a metadata-only `public.ai_request_audit` source of truth and atomic per-user request reservation.

Live migrations:

- `20260809131359_ai_request_audit_budget`
- `20260809132552_harden_ai_request_audit_rpc_invoker`

Default server budget is 12 requests/rolling minute and 120 requests/rolling hour, configurable with bounded server-only env values. One Google→AvalAI fallback chain consumes one user reservation and records `attempt_count=2`.

Privacy boundary: no prompt, Coach history, system prompt text, model output, API key, credential ciphertext or raw provider payload is stored. Provider-returned usage token counts are recorded when present; NeoFit does not make a `countTokens` request or estimate missing token counts.

The first implementation used authenticated-callable `SECURITY DEFINER` RPCs. Supabase Security Advisor flagged that design. Stage 15 hardened both RPCs to `SECURITY INVOKER` plus column-level grants/RLS. The two AI RPC warnings are gone; only the unrelated plan-gated leaked-password warning remains.

Direct authenticated table mutation cannot backdate `created_at`, change `user_id`, delete a reservation or reduce the budget count. A direct caller can at worst consume extra own budget.

`AI Request Audit Budget CI` run `31316133575` is green across audit contracts, full Supabase regression, TypeScript, Next production build and privacy/privilege/request-budget gates.

Runtime proof still requires one real Google request to create/complete a row and one controlled Google→AvalAI fallback to complete the same row with two attempts.

### Coach Progress context — CODE FIXED IN STAGE 12, HOSTED RUNTIME QA OPEN

Coach loads `body_measurements` only for Progress intent and does not add this query to unrelated prompts.

## P2 — Auth / abuse / Production hardening

### Email change — STAGE 14 CODE + HOSTED SETTINGS/TEMPLATE COMPLETE; TWO-ADDRESS E2E OPEN

Stage 14 adds a live-session-gated `updateUser({ email })` request from `/profile/security` and reuses the scanner-safe one-time-link boundary for `type=email_change`. NeoFit does not claim the email changed immediately.

Hosted Supabase has Secure Email Change enabled, so both the old and new addresses participate in secure confirmation behavior. The NeoFit Change Email `TokenHash` template is installed.

Canonical template: `supabase/templates/email-change.html`.

The remaining proof is a disposable two-address mailbox E2E on the next Preview deployment.

### Password policy — APP + HOSTED CORE SETTINGS ALIGNED

NeoFit requires new passwords of 12–128 characters. Hosted Supabase is configured with minimum password length 12 and `Require current password when updating` enabled. Email OTP expiration is 3600 seconds.

`Secure password change` remains intentionally disabled because enabling it introduces the Supabase reauthentication/nonce flow for older sessions. NeoFit will not enable that hosted control until the product implements and tests the exact nonce contract.

Additional character-class requirements remain unset so hosted policy does not silently diverge from NeoFit's current user-facing validation. Strengthening them requires first updating app validation/copy/tests.

Leaked-password protection remains Pro-only on the current project.

### Password-change notification — HOSTED TOGGLE ENABLED / DELIVERY E2E OPEN

The hosted `Password changed` security notification is enabled. Stage 14 owns `supabase/templates/password-changed.html` as canonical Persian content. Hosted delivery still needs proof during a real password-change E2E.

### Email-address-changed notification — TEMPLATE CONFIGURED; DELIVERY E2E OPEN

Stage 14 owns `supabase/templates/email-changed.html`. The hosted lifecycle email template is configured. Delivery remains part of the two-address email-change E2E.

### Reauthentication — CANONICAL TEMPLATE ADDED; PRODUCT FLOW NOT YET CLAIMED

`supabase/templates/reauthentication.html` uses Supabase's real six-digit `{{ .Token }}`. No local fake reauthentication protocol is claimed. A feature should consume this only after its exact nonce verification contract is implemented and tested.

### Account deletion — DELIBERATELY OPEN / DO NOT FAKE

No Delete Account button exists yet. Official Supabase user deletion is an admin operation requiring a privileged server boundary, and owned Storage objects can block deletion. NeoFit will not place a service-role/secret key in the Web app just to make a button appear functional.

Future deletion must prove recent reauthentication, exact-user binding, a tightly scoped privileged backend function, owned Storage cleanup, cascade semantics and disposable-account E2E.

### CAPTCHA / bot protection — OPEN, DO NOT FAKE

No real CAPTCHA token flow exists. Wire Cloudflare Turnstile/hCaptcha only after real provider site key + Supabase provider secret are available. Do not add a visual-only checkbox.

### Session timeout / inactivity / single-session policy — NOT ACTIVE/NOT PROVEN

Observed `auth.sessions.not_after` values were null. Do not claim time-boxed sessions. Hosted Supabase controls are plan/settings dependent and remain manual.

### SMTP — PREVIEW CUSTOM SMTP CONFIGURED; PRODUCTION TRANSACTIONAL SMTP OPEN

Custom Gmail SMTP is configured for Preview QA, allowing hosted templates to be edited and mailbox tests to proceed. Gmail is not treated as the final transactional sender. Before Production, move Auth mail to a dedicated provider/domain with SPF/DKIM/DMARC and link tracking disabled for Auth links.

### Still open before Production

- latest green Stage 13–16 stacked Vercel Preview deployment after quota availability;
- fresh mailbox signup-confirm E2E;
- mailbox password-recovery E2E;
- password-change notification delivery;
- email-change two-address E2E;
- real multi-browser/session revoke proof;
- Google BYOK + audit row runtime proof;
- controlled AvalAI fallback proof;
- Workout Plan runtime/version/provenance proof;
- leaked-password control if/when plan supports it;
- CAPTCHA runtime integration;
- dedicated transactional SMTP / branded Auth domain;
- MFA policy/enrollment if product scope requires it;
- account deletion + proven reauthentication boundary;
- intentional Production Auth URLs only when Production exists.

## P2 — product data completeness

### Food catalog coverage — OPEN

Current Web catalog is a small IFKB-shaped fixture set. Expand through IFKB/FNDDS/SR-backed resolution before claiming broad food search.

### Body photos / media — OPEN

Progress photos need consent, private Storage policy, deletion semantics and metadata minimization before implementation.

### Reports — OPEN

Reports must consume real Progress/Workout/Nutrition sources and must not resurrect old Firebase/Genkit behavior.

## P2 — agentic capability

Current Coach is intentionally read-only. Before write tools:

1. finish real data sources, especially persisted Nutrition Plan;
2. runtime-prove Stage 15 AI auditing / abuse bounds;
3. runtime-prove Stage 16 Workout Plan versioning;
4. define proposal schemas;
5. require explicit user confirmation for meaningful plan mutations;
6. never give the model raw SQL or unrestricted database access.

## P3 — UX / PWA polish

Service Worker excludes `/api/`, `/auth/`, authorization-bearing requests and private/no-store responses. Remaining work includes browser/device QA, accessibility regression coverage, install UX and notification permission UX after real notification delivery exists.

## Current recommended order

1. When the same Preview Lab deployment quota is available, deploy the latest green Stage 16 stacked candidate once.
2. Run fresh mailbox signup-confirm + recovery E2E, password-change notification, two-browser session revoke and two-address Secure Email Change proof.
3. Runtime-prove Google BYOK/Coach and verify the Stage 15 audit row/token metadata.
4. Run controlled Google failure → AvalAI fallback proof against the same audit row.
5. Runtime-prove Stage 16 account empty state, plan version activation, Player provenance/resume and activation guard.
6. Runtime-prove body measurements and truthful Nutrition flows.
7. Persist/version Nutrition plans through catalog/Core authority.
8. Notifications and remaining account lifecycle hardening (MFA/CAPTCHA/deletion) before public Production.
9. Add controlled Coach proposal/write flows only after data, audit and confirmation boundaries above are proven.

## Release rule

All work remains Preview-only in `neofit-preview-lab`. No Production promotion until core P0/P1 hosted proofs are green with a real account.

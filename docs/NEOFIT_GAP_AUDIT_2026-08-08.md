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

Sensitive Auth redirects use `NEXT_PUBLIC_APP_URL` / canonical origin directly. The user configured the stable Preview alias in hosted Supabase. Final evidence is a fresh mailbox round-trip after the next Preview deployment.

Canonical Preview origin:

`https://neofit-preview-lab-emadk50000-9178-emads-projects-41cb6447.vercel.app`

### Sensitive Auth headers — REAL HTTP FIXED IN STAGE 13

The real Next smoke proved that the generic `Referrer-Policy` rule overrode the Route Handler's `no-referrer`. `next.config.ts` now has explicit `/auth/confirm` and `/auth/callback` rules after the generic header contract:

- `Referrer-Policy: no-referrer`
- `Cache-Control: private, no-store`

The HTTP smoke verifies the actual emitted headers.

### Password recovery — CODE COMPLETE; HOSTED CONFIG INSTALLED; MAILBOX E2E OPEN

Stage 13 adds generic/non-enumerating recovery request, scanner-safe token verification, signed 15-minute recovery intent, live Auth-server validation, password update and revoke-other-refresh-sessions behavior.

The user reports the Preview recovery signing secret is installed, custom SMTP is enabled and the hosted Recovery template uses NeoFit's `TokenHash` route. A real mailbox round-trip remains required after the next Preview deployment.

### Leaked-password protection — PLAN-GATED / OPEN

Supabase Security Advisor still reports `auth_leaked_password_protection` disabled. Current project plan is Free and the dashboard marks this control Pro-only, so NeoFit must not claim it is active.

### Session accumulation / duplicate login — REAL EVIDENCE; CODE CONTROL ADDED; MULTI-BROWSER QA OPEN

The one-user project has three `auth.sessions` rows and three refresh-token rows at the prior audit point. Two successful password sign-ins occurred only seconds apart.

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

The weekly Nutrition plan is still fixture-backed and is not yet a persisted per-user plan.

### Workout plan is fixture-backed — OPEN

Workout sessions/sets are real, but the actual weekly workout plan is still static fixture data.

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

### AI request audit / user budget — STAGE 15 LIVE SCHEMA + CODE IMPLEMENTED; CI/HOSTED PROOF OPEN

Stage 15 now has a metadata-only `public.ai_request_audit` source of truth and atomic per-user request reservation.

Live migrations:

- `20260809131359_ai_request_audit_budget`
- `20260809132552_harden_ai_request_audit_rpc_invoker`

Default server budget is 12 requests/rolling minute and 120 requests/rolling hour, configurable with bounded server-only env values. One Google→AvalAI fallback chain consumes one user reservation and records `attempt_count=2`.

Privacy boundary: no prompt, Coach history, system prompt text, model output, API key, credential ciphertext or raw provider payload is stored. Provider-returned usage token counts are recorded when present; NeoFit does not make a `countTokens` request or estimate missing token counts.

The first implementation used authenticated-callable `SECURITY DEFINER` RPCs. Supabase Security Advisor flagged that design. Stage 15 hardened both RPCs to `SECURITY INVOKER` plus column-level grants/RLS. The two AI RPC warnings are now gone; only the unrelated plan-gated leaked-password warning remains.

Direct authenticated table mutation cannot backdate `created_at`, change `user_id`, delete a reservation or reduce the budget count. A direct caller can at worst consume extra own budget.

Before declaring Stage 15 runtime-complete: CI must be green, then a real Google request must create/complete one metadata row; a controlled Google failure + AvalAI success must prove one row with two attempts.

### Coach Progress context — CODE FIXED IN STAGE 12, HOSTED RUNTIME QA OPEN

Coach loads `body_measurements` only for Progress intent and does not add this query to unrelated prompts.

## P2 — Auth / abuse / Production hardening

### Email change — STAGE 14 CODE + HOSTED SETTINGS/TEMPLATE COMPLETE; TWO-ADDRESS E2E OPEN

Stage 14 adds a live-session-gated `updateUser({ email })` request from `/profile/security` and reuses the scanner-safe one-time-link boundary for `type=email_change`. NeoFit does not claim the email changed immediately.

Hosted Supabase now has Secure Email Change enabled, so both the old and new addresses are expected to participate in the secure confirmation behavior. The user installed the NeoFit Change Email `TokenHash` template.

Canonical template: `supabase/templates/email-change.html`.

The remaining proof is a disposable two-address mailbox E2E on the next Preview deployment.

### Password policy — APP + HOSTED CORE SETTINGS ALIGNED

NeoFit requires new passwords of 12–128 characters. Hosted Supabase is now configured with minimum password length 12 and `Require current password when updating` enabled. Email OTP expiration is 3600 seconds.

`Secure password change` remains intentionally disabled because enabling it introduces the Supabase reauthentication/nonce flow for older sessions. NeoFit will not enable that hosted control until the product implements and tests the exact nonce contract.

Additional character-class requirements remain unset for now so hosted policy does not silently diverge from NeoFit's current user-facing validation. Strengthening them requires first updating the app's validation/copy/tests.

Leaked-password protection remains Pro-only on the current project.

### Password-change notification — HOSTED TOGGLE ENABLED / DELIVERY E2E OPEN

The hosted `Password changed` security notification is enabled. Stage 14 owns `supabase/templates/password-changed.html` as canonical Persian content. Hosted delivery still needs proof during a real password-change E2E.

### Email-address-changed notification — TEMPLATE CONFIGURED; DELIVERY E2E OPEN

Stage 14 owns `supabase/templates/email-changed.html`. The user reports the hosted lifecycle email work is configured. Delivery remains part of the two-address email-change E2E.

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

- latest green Stage 13/14/15 Vercel Preview deployment after quota availability;
- fresh mailbox signup-confirm E2E;
- mailbox password-recovery E2E;
- email-change two-address E2E;
- real multi-browser/session revoke proof;
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

1. finish real data sources;
2. make Stage 15 AI auditing / abuse bounds green and runtime-proven;
3. define proposal schemas;
4. require explicit user confirmation for meaningful plan mutations;
5. never give the model raw SQL or unrestricted database access.

## P3 — UX / PWA polish

Service Worker excludes `/api/`, `/auth/`, authorization-bearing requests and private/no-store responses. Remaining work includes browser/device QA, accessibility regression coverage, install UX and notification permission UX after real notification delivery exists.

## Current recommended order

1. Make Stage 15 request-audit/budget CI fully green without spending another Vercel deployment.
2. When the same Preview Lab deployment quota is available, deploy the latest green stacked candidate once.
3. Run fresh mailbox signup-confirm + recovery E2E, password-change notification, two-browser session revoke and two-address Secure Email Change proof.
4. Runtime-prove Google BYOK/Coach and verify the new audit row/token metadata.
5. Run controlled Google failure → AvalAI fallback proof against the same audit row.
6. Runtime-prove body measurements and truthful Nutrition flows.
7. Persist/version workout plans.
8. Persist/version Nutrition plans through catalog/Core authority.
9. Notifications and remaining account lifecycle hardening (MFA/CAPTCHA/deletion) before public Production.
10. Controlled write-agent proposals only after the above.

## Release rule

All work remains Preview-only in `neofit-preview-lab`. No Production promotion until core P0/P1 hosted proofs are green with a real account.

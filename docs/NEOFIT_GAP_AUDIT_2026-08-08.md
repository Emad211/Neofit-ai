# NeoFit Gap Audit — 2026-08-08

Status: active engineering backlog. This document is the canonical gap inventory for the Preview-only development cycle.

## Severity model

- **P0**: breaks identity, privacy, data integrity, or blocks core runtime proof.
- **P1**: user-facing core feature is fake, incomplete, or unnecessarily expensive.
- **P2**: important product hardening before Production, but not blocking current Preview development.
- **P3**: polish / expansion after the core data and agent contracts are proven.

## P0 — identity / security / data integrity

### Email confirmation/session hostname mismatch — ROOT CAUSE PROVEN, STAGE 9 FIX + STAGE 13 HARDENING

The original incident was real: Supabase verified the email, then the Preview app failed to establish the SSR PKCE session because signup and callback crossed Vercel hostnames. Stage 9 canonicalized Preview origin and moved new email confirmation to token-hash verification.

A deeper Stage 13 audit found that the Stage 9 GET confirmation still consumed a single-use token immediately. This is SSR-correct in a basic flow but fragile around automated email security scanners. Stage 13 now stages `token_hash` in a short-lived HttpOnly cookie, redirects to a clean URL, and calls `verifyOtp` only after an explicit user POST.

Hosted Supabase template QA remains required:

`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`

### Password recovery — CODE IMPLEMENTED IN STAGE 13, HOSTED RUNTIME PROOF OPEN

Password-based Auth was previously incomplete because there was no reset/recovery path. Stage 13 adds:

- generic/non-enumerating reset request;
- recovery token verification through the scanner-safe interstitial;
- signed 15-minute recovery intent bound to verified claims;
- recovered password update;
- revocation of other refresh sessions.

Manual Preview requirements before real recovery QA:

- `AUTH_RECOVERY_INTENT_KEY` in Vercel Preview;
- hosted Recovery email template using `type=recovery`;
- a real mailbox round-trip.

### Recovery-intent tamper resistance — FIXED DURING STAGE 13 SELF-AUDIT

The first Stage 13 draft used only an HttpOnly recovery-intent cookie. That was insufficient because HttpOnly prevents JavaScript access but does not cryptographically prove the cookie was not modified. Before CI/release, it was replaced with HMAC-SHA256 using a dedicated server-only 32-byte key and constant-time signature comparison.

### One-time token URL leakage — FIXED IN STAGE 13

The first scanner-safe draft copied `token_hash` into `/auth/verify` query parameters. Before release it was improved again: the token is now staged server-side in a short-lived HttpOnly cookie, removed from the clean verification URL, omitted from client hidden fields, and the staging redirect uses `Referrer-Policy: no-referrer`.

### Leaked-password protection — OPEN / HOSTED SETTING

Supabase Security Advisor still reports `auth_leaked_password_protection` as disabled. Enable it in Auth Password Security if the current plan exposes the feature, then rerun the advisor.

### First-account bootstrap transient failure — FIXED IN STAGE 9

A real runtime login previously produced a transient `user_settings` 401 while other first-account writes succeeded. Bootstrap now retries only failed idempotent writes and never destroys a valid authenticated session solely because bootstrap remains partial.

### Auth session accumulation — REAL RUNTIME EVIDENCE / STAGE 13 CONTROL ADDED

The current one-user Supabase project has recorded multiple session rows. Real Preview logs also show two successful password logins within seconds. Plain Server Action buttons previously did not expose pending state, so accidental double submission could create multiple sessions.

Stage 13 adds:

- pending/disabled Auth submit buttons;
- normal logout explicitly scoped to the current session;
- `/profile/security` controls to revoke other sessions or explicitly log out globally.

Real multi-device revoke QA remains open.

### Hosted Auth Site URL / Referer inconsistency — OPEN / MANUAL VERIFY

Recent successful password logins are proven to originate from the Vercel Preview deployment, but Supabase Auth logs record `referer=http://localhost:3000`. The connector cannot read hosted Auth URL configuration directly, so do not assume the dashboard setting is correct. Manually verify the Supabase Auth Site URL is exactly the stable Preview Lab alias, not localhost or a unique deployment URL.

## P1 — fake or incomplete core user data

### Synthetic Progress weight trend — FIXED IN STAGE 10

Previous Progress hardcoded six personal-looking weights (`95 → 92.2 kg`). Stage 10 replaces this with `body_measurements`, own-row RLS, account/Guest persistence, real charting and explicit empty states. CI is green; runtime account measurement QA remains.

### Synthetic account Nutrition targets — FIXED IN STAGE 11

The Guest demo fixture still intentionally contains sample targets, but Stage 11 prevents them from entering a real account. Account UI can represent `targets not configured`; the one known bootstrap-generated fixture goal row was removed with a narrow guard.

### Nutrition plan is fixture-backed — OPEN

`NutritionPlanScreen` still renders the fixture-backed weekly plan. It is not yet a persisted per-user plan.

### Workout plan is fixture-backed — OPEN

Workout sessions/sets are real and persistent, but the weekly workout plan is still static fixture data.

### Notifications center / push contract — OPEN

No real notification-center persistence/push delivery contract exists yet.

## P1 — request / performance architecture

### Main app Nutrition over-fetch — FIXED IN STAGE 11

The shared app shell is identity-only. Today loads its date-scoped Nutrition snapshot; unrelated screens no longer hydrate the diary globally.

### Nutrition entry history query unbounded — FIXED FOR TODAY IN STAGE 11

Today's account query is bounded by `user_id` and account-local date. A future history page still needs explicit pagination/range design.

## P1 — AI runtime proof / observability

### Google BYOK real request proof — OPEN

Vault/router/UI exist, but the last database audit still had zero stored provider credentials. A real Save/Test + Coach request is required.

### AvalAI controlled fallback proof — OPEN

Fallback/cooldown is contract-tested but not yet proven with a real Google failure followed by AvalAI success.

### AI request audit / user budget — OPEN

No metadata-only `ai_request_audit` source of truth exists yet. Add it before write agents, without storing raw prompts or provider keys and without adding hidden inference calls.

### Coach Progress context — CODE FIXED IN STAGE 12, RUNTIME QA OPEN

Coach now loads `body_measurements` only for body/progress intent and does not add Progress query cost to unrelated prompts.

## P2 — Auth / abuse / Production hardening

### CAPTCHA / bot protection — OPEN, DO NOT FAKE

Supabase supports Cloudflare Turnstile/hCaptcha for signup/signin/password reset, but NeoFit has no real CAPTCHA token flow yet. A real provider site key and Supabase provider secret are required before wiring it. Do not add a visual-only checkbox.

### Password policy — APP HARDENED, HOSTED POLICY VERIFY OPEN

Stage 13 requires 12–128 characters for new passwords while allowing existing shorter passwords to continue signing in. Hosted Supabase minimum length / required-character settings remain a separate control plane and must be reviewed.

### Session semantics / security center — CODE FIXED IN STAGE 13, MULTI-DEVICE QA OPEN

Normal logout is local; global logout is explicit. Signed-in password changes require the current password and revoke other refresh sessions. Access JWTs may remain usable until expiry after refresh-token revocation, so the UI must not claim instantaneous token invalidation.

### Still open before Production

- custom SMTP / branded sender;
- CAPTCHA runtime integration;
- MFA policy/enrollment if product scope requires it;
- email-change flow;
- account deletion + reauthentication contract;
- real multi-browser/device session QA;
- intentional Production Auth URLs only when Production exists.

## P2 — product data completeness

### Food catalog coverage — OPEN

Current connected Web catalog is a small IFKB-shaped fixture set. Expand through IFKB/FNDDS/SR-backed resolution before claiming broad food search.

### Body photos / media — OPEN

Progress photos need explicit consent, private Storage policy, deletion semantics and metadata minimization before implementation.

### Reports — OPEN

Weekly/on-demand reports must consume real Progress/Workout/Nutrition sources and must not resurrect old Firebase/Genkit behavior.

## P2 — agentic capability

Current Coach is intentionally read-only. Before write tools:

1. finish real data sources;
2. add AI request auditing / abuse bounds;
3. define proposal schemas;
4. require explicit user confirmation for meaningful plan mutations;
5. never give the model raw SQL or unrestricted database access.

## P3 — UX / PWA polish

The service worker excludes `/api/`, `/auth/`, authorization-bearing requests and private/no-store responses. Remaining work includes browser/device QA, accessibility regression coverage, install UX and notification permission UX after real notification delivery exists.

## Current recommended order

1. Finish Stage 13 Auth CI and Preview runtime smoke tests.
2. Manually install/verify hosted Confirm + Recovery templates, Site URL and recovery signing secret; run fresh email-confirm + password-recovery E2E.
3. Enable leaked-password protection if plan supports it; later wire real Turnstile before public exposure.
4. Runtime-prove body measurements, truthful Nutrition and Google BYOK/Coach.
5. Add AI request audit/budget foundation.
6. Persist/version workout plans.
7. Persist/version Nutrition plans through catalog/Core authority.
8. Notifications and remaining account lifecycle flows.
9. Controlled write-agent proposals only after the above.

## Release rule

All work remains Preview-only in `neofit-preview-lab`. No Production promotion until core P0/P1 runtime proofs are green with a real account.

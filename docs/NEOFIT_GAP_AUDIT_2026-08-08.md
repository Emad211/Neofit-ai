# NeoFit Gap Audit — 2026-08-08

Status: active engineering backlog. This document is the canonical gap inventory for the Preview-only development cycle.

## Severity model

- **P0**: breaks identity, privacy, data integrity, or blocks core runtime proof.
- **P1**: user-facing core feature is fake, incomplete, or unnecessarily expensive.
- **P2**: important product hardening before Production, but not blocking current Preview development.
- **P3**: polish / expansion after the core data and agent contracts are proven.

## P0 — identity / security / data integrity

### Email confirmation/session mismatch — CODE FIXED IN STAGE 9, HOSTED TEMPLATE QA STILL REQUIRED

Real signup evidence proved Supabase verified the email but NeoFit could not establish the SSR session after crossing Vercel Preview hostnames. Stage 9 adds canonical Preview-origin enforcement, token-hash `/auth/confirm` + `verifyOtp`, resend recovery, and bootstrap resilience.

Manual hosted requirement remains until confirmed by the project owner: Supabase Confirm-signup template must point to:

`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`

After that, run one fresh signup confirmation through the stable Preview Lab alias.

### Leaked-password protection — OPEN / MANUAL

Supabase Security Advisor reports `auth_leaked_password_protection` as disabled. Enable it in Auth Password Security and re-run the Security Advisor.

### First-account bootstrap transient failure — FIXED IN STAGE 9

Observed real runtime: one `user_settings` upsert returned 401 while parallel account writes succeeded. Stage 9 retries only failed idempotent bootstrap writes and never destroys a valid authenticated session solely because bootstrap remains partial.

## P1 — fake or incomplete core user data

### Synthetic Progress weight trend — FIXED IN STAGE 10

Previous Progress hardcoded six personal-looking weights (`95 → 92.2 kg`). Stage 10 replaces this with `body_measurements`, own-row RLS, account/Guest persistence, real charting and explicit empty states. CI is green; runtime account measurement QA remains.

### Synthetic account Nutrition targets — FIXED IN STAGE 11

The demo fixture still intentionally contains `2200 kcal / 140 g protein / 250 g carbs / 70 g fat` for Guest UX testing, but Stage 11 prevents those values from entering a real account:

- first-account bootstrap no longer writes `nutrition_goals`;
- account reads no longer fall back to `dailyTargets`;
- Today supports `targets not configured` while still showing real consumed totals;
- Coach reports `goalsConfigured: false` when a real goal does not exist;
- the one known untouched bootstrap-generated fixture row from the Auth incident was deleted with a narrow guard.

Legitimate personalized target creation remains a separate future deterministic contract; Stage 11 does not invent a replacement formula.

### Nutrition plan is fixture-backed — OPEN

`NutritionPlanScreen` still renders `weeklyPlan` from `web/data/fixtures.ts`. It is not yet a persisted per-user plan. The catalog/Core boundary is correct, but the plan itself remains demo data.

### Workout plan is fixture-backed — OPEN

Workout sessions/sets are real and persistent, but the weekly workout plan still comes from static `workout-fixtures.ts`. A future plan schema must preserve exercise identity, versions, user confirmation, and safety constraints.

### Notifications center / push contract — OPEN

The connected build has no real notification-center persistence/push delivery contract. The full UI reference had notification controls, but push subscription, preferences, delivery policy and privacy behavior are not connected.

## P1 — request / performance architecture

### Main app Nutrition over-fetch — FIXED IN STAGE 11

The shared `(main)` layout is now identity-only:

- verified claims + Profile for the shell;
- Today alone calls `loadNutritionSnapshot()`;
- Profile, Progress, Workout and Coach UI do not hydrate the Nutrition diary from the global shell;
- Nutrition catalog/add-food does not preload diary history.

### Nutrition entry history query unbounded — FIXED FOR TODAY IN STAGE 11

Today now filters account entries by both `user_id` and the account's current `local_date`. Full historical Nutrition UX still needs explicit pagination/range design when history is added; it is no longer accidentally fetched on every route.

## P1 — AI runtime proof / observability

### Google BYOK real request proof — OPEN

Credential vault, Google-first routing and UI exist, but live `encrypted_provider_credentials` count has remained zero in the last database audit. A real user Save/Test + Coach request is still required.

### AvalAI controlled fallback proof — OPEN

Fallback/cooldown is implemented and contract-tested, but real runtime Google-failure → AvalAI-success has not yet been proven.

### AI request audit / user budget — OPEN / NEXT HIGH-VALUE SLICE

There is not yet an `ai_request_audit` source of truth for provider/model/latency/fallback/outcome. Add metadata-only auditing without raw prompts or provider keys. Before write-agents, define a request-abuse/budget strategy that does not add hidden provider calls.

### Coach Progress context — OPEN / SOURCE READY

Stage 10 established `body_measurements` as the real Progress source. Coach can now gain a selectively loaded Progress domain without using fake measurements or global page state.

## P2 — Auth / abuse / Production hardening

- password reset / recovery UX
- branded custom SMTP sender for Production
- CAPTCHA / signup-resend abuse controls
- optional social providers only if product needs them
- Production Auth URLs only when Production is intentionally created
- review MFA expectations if sensitive-account scope expands

## P2 — product data completeness

### Food catalog coverage — OPEN

Current connected Web catalog is a small IFKB-shaped fixture set. Nutrition Core authority is correct, but coverage is intentionally limited. Expand through IFKB/FNDDS/SR-backed resolution before claiming broad food search.

### Body photos / media — OPEN

Progress photos are not yet a persistent privacy-reviewed Storage feature. Add only with explicit consent, private bucket policies, deletion semantics and metadata minimization.

### Reports — OPEN

Weekly/on-demand reports from the old reference are not connected to the current architecture. They should consume real Progress/Workout/Nutrition sources, not recreate old Firebase/Genkit behavior.

## P2 — agentic capability

Current Coach is intentionally read-only. Before write tools:

1. finish real data sources;
2. add AI request auditing / abuse bounds;
3. define proposal schemas;
4. require explicit user confirmation for meaningful plan mutations;
5. never give the model raw SQL or unrestricted database access.

First controlled write candidates later:

- propose exercise replacement
- prepare workout adjustment
- prepare meal alternative resolved through catalog/Core
- save Coach note

Do not start with autonomous loops or many independent agents.

## P3 — UX / PWA polish

The service worker correctly excludes `/api/`, `/auth/`, authorization-bearing requests and private/no-store responses. Remaining polish includes broader browser/device QA, accessibility regression coverage, install UX and notification permission UX after notification delivery exists.

## Current recommended order

1. Finish Stage 9 hosted Auth actions and fresh-signup runtime proof.
2. Runtime-prove Stage 10 real body measurements.
3. Runtime-prove Stage 11 truthful/date-scoped Nutrition account behavior.
4. Add Coach Progress context and metadata-only AI request audit/budget foundation.
5. Persist/version workout plans.
6. Persist/version Nutrition plans through catalog/Core authority.
7. Notifications.
8. Password recovery + Production Auth hardening.
9. Controlled write-agent proposals.
10. Vision / bounded autonomous workflows only after the above is proven.

## Release rule

All work remains Preview-only in `neofit-preview-lab`. No Production promotion until core P0/P1 runtime proofs are green with a real account.

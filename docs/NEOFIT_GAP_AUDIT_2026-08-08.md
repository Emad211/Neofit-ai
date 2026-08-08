# NeoFit Gap Audit — 2026-08-08

Status: active engineering backlog. This document is the canonical gap inventory for the Preview-only development cycle.

## Severity model

- **P0**: breaks identity, privacy, data integrity, or blocks core runtime proof.
- **P1**: user-facing core feature is fake, incomplete, or unnecessarily expensive.
- **P2**: important product hardening before Production, but not blocking current Preview development.
- **P3**: polish / expansion after the core data and agent contracts are proven.

## P0 — identity / security / data integrity

### Email confirmation/session mismatch — FIXED IN STAGE 9, hosted template action still required

Real signup evidence proved Supabase verified the email but NeoFit could not establish the SSR session after crossing Vercel Preview hostnames. Stage 9 adds canonical Preview-origin enforcement, token-hash `/auth/confirm` + `verifyOtp`, resend recovery, and bootstrap resilience.

Manual hosted requirement remains: Supabase Confirm-signup template must point to:

`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`

### Leaked-password protection — OPEN / MANUAL

Supabase Security Advisor currently reports `auth_leaked_password_protection` as disabled. Enable it in Auth Password Security before Production and preferably during Preview QA.

### First-account bootstrap transient failure — FIXED IN STAGE 9

Observed real runtime: one `user_settings` upsert returned 401 while parallel account writes succeeded. Stage 9 retries only failed idempotent bootstrap writes and never destroys a valid authenticated session solely because bootstrap remains partial.

## P1 — fake or incomplete core user data

### Synthetic Progress weight trend — FIXED IN STAGE 10

Previous Progress hardcoded six personal-looking weights (`95 → 92.2 kg`). Stage 10 replaces this with `body_measurements`, own-row RLS, account/Guest persistence, real charting and explicit empty states.

### Synthetic account Nutrition targets — OPEN / NEXT

`dailyTargets` currently contains `2200 kcal / 140 g protein / 250 g carbs / 70 g fat`. First-account bootstrap writes these values into `nutrition_goals`, and account reads fall back to them. This is acceptable as an explicit Guest/demo fixture but not as a personalized account target.

Required outcome:

- no account receives fabricated targets;
- account UI can represent `targets not configured` safely;
- Nutrition arithmetic remains `@neofit/nutrition-core` authority;
- legitimate target calculation/configuration becomes its own deterministic contract.

### Nutrition plan is fixture-backed — OPEN

`NutritionPlanScreen` still renders `weeklyPlan` from `web/data/fixtures.ts`. It is not yet a persisted per-user plan. The catalog/Core boundary is correct, but the plan itself is demo data.

### Workout plan is fixture-backed — OPEN

Workout sessions/sets are real and persistent, but the actual weekly workout plan still comes from static `workout-fixtures.ts`. A future plan schema must preserve exercise identity, versions, user confirmation, and safety constraints.

### Notifications center / push contract — OPEN

The current connected build has no `/notifications` route. The full UI reference had notification controls, but persistence, push subscriptions and delivery policy are not connected.

## P1 — request / performance architecture

### Main app layout over-fetches Nutrition — OPEN / NEXT

Every `(main)` route currently executes `loadAccountSnapshot()`, which reads profile + nutrition goals + the entire nutrition diary. That means Profile, Workout, Progress and even Coach page navigation can pay Nutrition-read cost before those screens need it.

Required outcome:

- lightweight account identity in the shared shell;
- Nutrition data loaded only by Today/Nutrition screens that need it;
- bounded date/range queries instead of unbounded all-history reads;
- Coach continues using its own selective context loader.

### Nutrition entry history query unbounded — OPEN

`loadAccountSnapshot()` currently orders all `nutrition_entries` by `logged_at` with no date/range limit. This must be date-scoped or paginated before meaningful user history accumulates.

## P1 — AI runtime proof / observability

### Google BYOK real request proof — OPEN

Credential vault, Google-first routing and UI exist, but live `encrypted_provider_credentials` count is still zero. A real user Save/Test + Coach request is still required.

### AvalAI controlled fallback proof — OPEN

Fallback/cooldown is implemented and tested at contract level, but real runtime Google-failure → AvalAI-success has not yet been proven.

### AI request audit / user budget — OPEN

The architecture roadmap calls for request auditing. There is not yet an `ai_request_audit` source of truth for provider/model/latency/fallback/outcome. Add metadata-only auditing without storing raw prompts or provider keys; pair it with bounded per-user abuse/request controls before write-agents.

### Coach Progress context — BLOCKED UNTIL STAGE 10 SOURCE EXISTS, THEN OPEN

Read-only Coach can use Profile/Safety/Nutrition/Workout. Real body-measurement Progress context should be added only after `body_measurements` is the source of truth.

## P2 — Auth / abuse / Production hardening

- password reset / recovery UX
- branded custom SMTP sender for Production
- CAPTCHA / signup-resend abuse controls
- optional social providers only if product needs them
- Production Auth URLs only when Production is intentionally created
- review MFA expectations if sensitive-account scope expands

## P2 — product data completeness

### Food catalog coverage

Current connected Web catalog is a small IFKB-shaped fixture set. Nutrition Core authority is correct, but coverage is intentionally limited. Expand through IFKB/FNDDS/SR-backed resolution before claiming broad food search.

### Body photos / media

Progress photos are not yet a persistent privacy-reviewed Storage feature. Add only with explicit consent, private bucket policies, deletion semantics and metadata minimization.

### Reports

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

1. Stage 9 Auth runtime hardening + hosted email template.
2. Stage 10 real Body Measurement Progress.
3. Remove fake account Nutrition targets and split shared identity from Nutrition data loading.
4. Add AI request audit/budget and Progress context to Coach.
5. Persist/version workout plans.
6. Persist/version nutrition plans through catalog/Core authority.
7. Notifications.
8. Password recovery + Production Auth hardening.
9. Controlled write-agent proposals.
10. Vision / bounded autonomous workflows only after the above is proven.

## Release rule

All work remains Preview-only in `neofit-preview-lab`. No Production promotion until the core P0/P1 runtime proofs are green with a real account.

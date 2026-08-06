# NeoFit Auth and Persistence Integration Evidence

**Date:** 2026-08-06  
**Branch:** `web/full-frontend-integration`  
**Draft PR:** #36  
**Supabase project:** `rjwrobltmjodfarnltal`  
**Current evidence scope:** code/CI contracts plus Auth and Guest-state hardening; public real-account runtime remains pending

## Architecture path

```text
Guest
  -> Shared Nutrition Core
  -> validated Browser-local diary envelope

Authenticated account
  -> Supabase Auth cookies
  -> getClaims() verified identity
  -> own-row RLS
  -> profiles / user_settings
  -> nutrition_goals / nutrition_entries
```

Nutrition values are produced only by `packages/nutrition-core` and persisted as versioned estimate JSON.

## Existing connected behavior

- email/password sign-in/sign-up through Server Actions؛
- PKCE callback and email-token confirmation؛
- server-side sign-out؛
- typed Browser/Server Supabase clients؛
- account snapshot reads؛
- authenticated Nutrition insert/delete؛
- display-name persistence؛
- Guest local fallback؛
- optimistic insert with rollback؛
- private/no-store account HTML؛
- Auth/API/Authorization requests excluded from Service Worker cache.

## Hardening correction 1 — non-destructive bootstrap

Previous behavior used ordinary `upsert` during every Sign-in/Callback. That could overwrite existing:

- `profiles.display_name`/timezone/locale؛
- `user_settings.theme`/units؛
- `nutrition_goals.daily`.

Current contract:

```text
profiles        onConflict=id      ignoreDuplicates=true
user_settings   onConflict=user_id ignoreDuplicates=true
nutrition_goals onConflict=user_id ignoreDuplicates=true
```

Only absent rows are created. An existing user-owned row remains authoritative.

## Hardening correction 2 — local date

Previous code derived `local_date` by UTC ISO slicing. Current code:

- reads `profiles.timezone`؛
- validates IANA timezone names؛
- falls back to `Asia/Tehran`؛
- formats `YYYY-MM-DD` with `Intl.DateTimeFormat`؛
- refreshes date during a long-running client session؛
- uses the same current Local date for Summary, Add and Reset.

## Hardening correction 3 — local persistence

Current local diary contract:

```json
{
  "version": 1,
  "diary": []
}
```

Behavior:

- empty diary is valid؛
- old plain-array v1 is migrated؛
- malformed JSON/version/entry fails closed؛
- count is capped at 1000؛
- IDs, text lengths, local date, types and timestamps are checked؛
- Nutrition estimate values must be finite and non-negative؛
- unknown grams remains `null`؛
- macro view is reconstructed from validated Core estimate؛
- Persian meal label is reconstructed from meal type؛
- localStorage read/write failures are surfaced without crashing the app.

## Tests

Behavioral tests:

```text
account-bootstrap.test.ts
local-date.test.ts
web-diary-storage.test.ts
```

Contract suite:

```text
supabase-app-integration.test.ts
```

`npm run test:supabase-app` executes all four files.

Local Source-Bundle preflight passed runtime checks for:

- insert-only bootstrap؛
- error propagation؛
- UTC vs Asia/Tehran boundary؛
- invalid timezone fallback؛
- storage round-trip؛
- valid empty diary؛
- Legacy array migration؛
- negative/tampered estimate rejection؛
- Core-derived Macro and Meal label normalization؛
- syntax transpilation of every changed TypeScript file.

GitHub CI remains the final TypeScript/build/browser authority for this commit.

## Live Supabase evidence

Latest read-only live check:

```text
project status: ACTIVE_HEALTHY
security advisors: 0
performance advisors: 0
auth users: 0
profiles: 0
user_settings: 0
nutrition_goals: 0
nutrition_entries: 0
```

This proves schema cleanliness but also proves no real-account browser round-trip has happened.

## Runtime claim boundary

Proven:

- Auth/Application implementation and RLS targets exist؛
- Shared Core remains sole Nutrition calculator؛
- Guest state is now validated and Timezone-aware؛
- Bootstrap no longer has a reset-on-login contract؛
- Canonical Preview build exists.

Not yet proven:

- Preview environment rollout؛
- public signup/confirmation؛
- Cookie/session round-trip؛
- Remote meal persistence after new session/device؛
- non-reset behavior against a real previously edited account؛
- Production.

## Exact runtime procedure

After green CI and external configuration:

1. create one disposable account؛
2. verify creation of exactly the three missing first-account rows؛
3. edit display name/settings/goals؛
4. sign out/in and verify values remain unchanged؛
5. add a meal and verify Remote row؛
6. sign out/in and verify Diary persistence؛
7. delete test rows and Auth user؛
8. record deployment, run, artifact and cleanup evidence before Merge.

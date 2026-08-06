# NeoFit Stage 4 — Supabase Auth, Postgres and RLS

**Status:** Stage 4A–4D merged؛ Application wiring implemented؛ Auth/Guest state hardening active؛ public Runtime proof pending  
**Date:** 2026-08-06  
**Project ref:** `rjwrobltmjodfarnltal`

## Architecture

```text
Browser/Server Auth
  -> verified claims
  -> own-row RLS
  -> versioned Shared Nutrition Core persistence
```

Out of scope for current Stage 4 hardening:

- new Table or Migration؛
- SQL/UI Nutrition arithmetic؛
- Service Role in Browser؛
- Catalog/Recipe persistence؛
- Queue/Event Bus/IndexedDB/Background Sync؛
- AI/Vision؛
- Production.

## Merged schema

```text
profiles
user_settings
nutrition_goals
nutrition_entries
```

Migrations:

```text
20260804232149_identity_foundation.sql
20260805132201_nutrition_persistence.sql
```

All four Tables have authenticated own-row SELECT/INSERT/UPDATE/DELETE policies and no anon/PUBLIC grants.

## Current application wiring

- Server Action sign-in/sign-up؛
- PKCE and email-token callbacks؛
- server sign-out؛
- `getClaims()` identity refresh؛
- profile/goals/entries reads؛
- Nutrition insert/delete؛
- display-name update؛
- Guest local fallback؛
- private/no-store account HTML؛
- Service Worker sensitive-route exclusions.

## Hardening

### Bootstrap

Initial rows now use insert-only conflict behavior. Existing profile, settings and goals are never overwritten during later Login/Callback.

### Timezone

`profiles.timezone` is loaded and normalized. Diary `local_date` no longer depends on UTC ISO slicing.

### Guest state

Local diary is schema-versioned, validated and normalized from Shared Core data. Empty diary is a valid persisted state.

## Environment

Browser-safe Preview values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=<stable Preview alias>
```

Security rests on RLS, not on hiding the Publishable key. No actual value is committed.

## Live claim boundary

Latest live check found zero Auth users and zero rows in all four Tables. Therefore code and schema are proven, but real public Auth/persistence is not.

## Exact continuation

1. current hardening CI becomes green؛
2. Vercel project cleanup/settings/env are completed؛
3. Supabase Site/Redirect URLs are configured؛
4. one exact-head Preview is released؛
5. temporary-account E2E verifies create-only bootstrap and persistence؛
6. cleanup and Runtime Evidence are recorded؛
7. PR #36 remains Draft until then.

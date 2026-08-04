# NeoFit Stage 4A — Supabase Project Provisioning Evidence

**Status:** complete — project created and healthy  
**Date:** 5 Aug 2026  
**Issue:** #25  
**Integration branch:** `web/pwa-foundation`

## Accepted decision

The user explicitly accepted:

```text
Organization: Emad's Org (yzymkjsfqoohxbqkhzhs)
Region: eu-central-1
Cost: 0 monthly
Project name: neofit
```

## Connector execution

Supabase `get_cost` returned:

```text
type: project
recurrence: monthly
amount: 0
```

After explicit acceptance, `confirm_cost` was executed and a new independent project was created.

## Created project

```text
name: neofit
project id/ref: rjwrobltmjodfarnltal
organization id: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
created at: 2026-08-04T20:45:48.830422Z
api url: https://rjwrobltmjodfarnltal.supabase.co
```

The project exposes an enabled modern publishable key. The key value is intentionally not committed to Git or written into this evidence document.

## Baseline database state

The `public` schema contained no application tables immediately after provisioning.

Therefore Stage 4A proves project creation only. It does not prove Auth UI, SSR clients, migrations, generated types, profiles, user settings, nutrition persistence, or RLS.

## Security boundaries

- No Service Role key was requested or exposed.
- No publishable key value is stored in Git.
- Browser environment values will be supplied through environment configuration.
- `.env.example` must contain variable names only.
- All DDL must be introduced through versioned migrations.
- All exposed user-owned tables require RLS before application use.

## Process correction

The evidence file was initially created directly on the integration branch with placeholder content because the intended Stage 4A branch had not yet been created. The placeholder was immediately replaced by this complete evidence record. No application code, schema, key, migration or runtime behavior was changed by that correction.

Stage 4B must return to the normal focused Branch/PR workflow.

## Exact continuation point

1. Synchronize Master Plan, Progress Log, Stage 4 Plan, README and Development Handoff with this project evidence.
2. Let Core/Web CI validate the updated integration head.
3. Create an independent Stage 4B branch from the updated integration head.
4. Add Supabase CLI/config and browser/server/proxy clients test-first.
5. Add only environment contracts; do not commit keys.
6. Do not create user tables until the client/session foundation is reviewed.
7. Stage 2B Vercel remains independent and open in Issue #16 / PR #28.

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

Therefore Stage 4A proves project creation only. It does not prove Auth UI، SSR clients، migrations، generated types، profiles، user settings، nutrition persistence or RLS.

## Security boundaries

- No Service Role key was requested or exposed.
- No publishable key value is stored in Git.
- Browser environment values will be supplied through environment configuration.
- `.env.example` must contain variable names only.
- All DDL must be introduced through versioned migrations.
- All exposed user-owned tables require RLS before application use.

## Process correction

The intended workflow was a focused Stage 4A Evidence branch. Tool routing produced direct Integration commits instead:

```text
3f23d1e569d22de4d2cc93eb399be68e416e56e8  placeholder evidence created
4345d9509c525873ffc20073690af78d89d5905a  placeholder replaced by verified evidence
f48698a723386d01bd7387c3390b8e732d39519b  accidental docs/.tmp created
f824b83c98bfb90bafd39c90abf9cbacfc76f7b3  docs/.tmp removed
364948a57bace2e93c424bdbf7c6a4a98a0a7656  correction recorded
b310925e5183c3fb01711a1c7f23870366e3e4b1  accidental root file x created
53352a5e70200a73565e15b71f88fb2fc58fe766  root file x removed
```

Impact boundary:

- no Application code changed؛
- no Schema or Auth config changed؛
- no Key entered Git؛
- no Migration ran؛
- no Runtime behavior changed.

The transparent history is preserved. Stage 4B returns to the normal focused Branch/PR workflow.

## Exact continuation point

1. Verify Core/Web CI on the final Integration HEAD containing Stage 4A evidence/docs.
2. Create `stage4b/supabase-ssr-foundation` from that verified HEAD.
3. Open a focused Draft PR.
4. Add tests/contracts before implementation.
5. Add Supabase config and Browser/Server/Proxy clients without user tables.
6. Add only environment variable names; do not commit keys.
7. Stage 2B Vercel remains independent in Issue #16 / PR #28.

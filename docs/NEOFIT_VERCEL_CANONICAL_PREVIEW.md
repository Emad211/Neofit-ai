# NeoFit Canonical Vercel Preview

**Date:** 2026-08-06  
**Status:** dedicated Preview release branch configured  
**Production promotion:** prohibited until explicit approval

## Canonical project

```text
Vercel team: Emad's projects
Project: neofit-ai
Project ID: prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
Git repository: Emad211/Neofit-ai
Development branch: web/full-frontend-integration
Preview release branch: vercel/preview
```

All NeoFit Preview deployments remain inside this one Git-connected project. Generic `deploy_to_vercel` is prohibited because an unlinked working directory can create a separate project.

## Disposable diagnostic projects

```text
neofit-direct-probe
Project ID: prj_m6fKI15AZzEN5kxN3QqAjep5UnOq
Deployment/domain: none

neofit-file-ref-probe
Project ID: prj_Rm5ndp2XWqTK2hmnxRoARdc1Jkyh
Deployment/domain: none

neofit-ui-public-probe
Project ID: prj_27bdfi9G9VYpEFRBmtPTL8Mj57AQ
Contains one disposable static probe
```

They are safe to delete and have no dependency from NeoFit code, Supabase or the canonical project.

## Quota-safe release flow

`vercel.json` disables automatic deployment for every branch except `vercel/preview`. This prevents ordinary development commits from creating even canceled Vercel deployment records.

Release flow:

1. develop and document on `web/full-frontend-integration`;
2. run all GitHub CI;
3. choose the exact tested commit;
4. move `vercel/preview` once to that commit;
5. verify one resulting Preview deployment;
6. do not promote to Production.

`scripts/vercel-ignore.mjs` additionally rejects Production and any non-release branch.

## Previous proof

The earlier marker-gated release proved the full Vercel build path:

```text
commit: 9b046725deb893b3fc2c14ee88d07bfbac7441c7
deployment: dpl_HeBPwDwsjbZGeBHWxfxZufePSadk
state: READY
```

It completed workspace installation, Next.js `16.2.12`, PWA icon generation, Turbopack, TypeScript and route generation with zero runtime-error clusters. The dedicated release branch now replaces the marker-on-development-branch mechanism to avoid canceled deployment records too.

## Supabase environment boundary

No key value is committed. Before real Auth runtime proof, configure on the canonical Vercel Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Then configure the final Preview release alias in Supabase Auth Site URL and Redirect URLs.

## Deletion procedure

The connected Vercel tool does not expose project deletion. Delete exactly these three projects from `Settings → General → Delete Project`:

- `neofit-direct-probe`
- `neofit-file-ref-probe`
- `neofit-ui-public-probe`

Never delete `neofit-ai`.

## Exact continuation

1. Create or fast-forward `vercel/preview` to this tested configuration commit.
2. Verify the single canonical Preview and record its stable alias.
3. Delete the three probes in the Dashboard.
4. Configure the two public Supabase Preview variables and Auth redirects.
5. Continue development on `web/full-frontend-integration` with no automatic Vercel deployments.

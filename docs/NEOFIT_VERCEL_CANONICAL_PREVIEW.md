# NeoFit Canonical Vercel Preview

**Date:** 2026-08-06  
**Status:** canonical Preview created and marker gate proven  
**Production promotion:** prohibited until explicit approval

## Canonical project

```text
Vercel team: Emad's projects
Project: neofit-ai
Project ID: prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
Git repository: Emad211/Neofit-ai
Preview branch: web/full-frontend-integration
Stable branch alias: neofit-ai-git-web-full-frontend-4a297f-emads-projects-41cb6447.vercel.app
```

All NeoFit Preview deployments must remain inside this one Git-connected project. The generic `deploy_to_vercel` action must not be used for NeoFit because an unlinked working directory can create a new project instead of updating the canonical project.

## Why extra projects existed

Three temporary diagnostic projects were created while isolating earlier routing, public-access and file-reference failures:

```text
neofit-direct-probe
Project ID: prj_m6fKI15AZzEN5kxN3QqAjep5UnOq
Deployment/domain: none

neofit-file-ref-probe
Project ID: prj_Rm5ndp2XWqTK2hmnxRoARdc1Jkyh
Deployment/domain: none

neofit-ui-public-probe
Project ID: prj_27bdfi9G9VYpEFRBmtPTL8Mj57AQ
Contains one disposable static public probe deployment
```

They are not NeoFit product deployments and are safe to delete. No repository code, Supabase resource, user data or canonical NeoFit alias depends on them.

## Deployment quota guard

Vercel previously attempted a Preview for every small Git commit. NeoFit now uses:

```text
ignoreCommand: node scripts/vercel-ignore.mjs
marker: .vercel-deploy
```

A real build is allowed only when all conditions are true:

1. Vercel environment is `preview`;
2. Git branch is `web/full-frontend-integration`;
3. `.vercel-deploy` changed in that exact commit.

Production and unrelated branches are skipped. Development and documentation commits can proceed without a real Preview build. A tested release batch changes the marker once.

## Proven canonical deployment

```text
release commit: 9b046725deb893b3fc2c14ee88d07bfbac7441c7
deployment: dpl_HeBPwDwsjbZGeBHWxfxZufePSadk
state: READY
target: Preview
alias: neofit-ai-git-web-full-frontend-4a297f-emads-projects-41cb6447.vercel.app
```

Build evidence:

- canonical repository and branch cloned;
- marker change detected and build explicitly allowed;
- workspace dependency installation completed;
- Next.js `16.2.12` detected;
- four PWA icons generated;
- Turbopack production compilation passed;
- TypeScript passed;
- Auth, nutrition, workout, progress, profile, manifest and offline routes generated;
- deployment completed from `/vercel/output`.

Runtime check after deployment:

```text
HTTP 200 responses observed: 2
runtime error clusters: 0
```

## Proven skipped documentation commit

The immediately following documentation-only commit did not change `.vercel-deploy`:

```text
commit: c574529995e4209aeccaf8eee02e8b73a574150f
deployment record: dpl_H8jgWDAcgtZjnc8D38uwngJP4y7k
result: CANCELED by Ignored Build Step
reason: .vercel-deploy did not change
```

This proves ordinary development/documentation commits no longer run the expensive build pipeline.

## Supabase environment boundary

No key value is committed to Git. The canonical Vercel project still needs these Browser-safe variables through Project Settings for Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

After Environment changes, one deliberate marker update is required because Vercel Environment changes apply only to a new deployment. Supabase Auth Site URL and Redirect URLs must point to the canonical Preview alias before a real email-confirmation round trip is claimed.

## Probe deletion boundary

The connected Vercel tool available in this workspace can inspect and deploy projects but does not expose project deletion. Deletion therefore remains a Dashboard action:

```text
Vercel Dashboard → project → Settings → General → Delete Project
```

Delete exactly:

- `neofit-direct-probe`
- `neofit-file-ref-probe`
- `neofit-ui-public-probe`

Never delete `neofit-ai`.

## Exact continuation

1. Delete the three disposable probe projects from the Dashboard.
2. Configure the two public Supabase variables outside Git on `neofit-ai` Preview.
3. Configure the canonical Preview alias in Supabase Auth redirects.
4. Batch the next tested code slice without touching `.vercel-deploy`.
5. After GitHub CI is green, update the marker once and run the real account/persistence round trip.

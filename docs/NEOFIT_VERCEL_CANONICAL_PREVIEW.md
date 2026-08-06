# NeoFit Canonical Vercel Preview

**Date:** 2026-08-06  
**Status:** active operational contract  
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

## Disposable diagnostic projects

The following projects were temporary routing/file-reference probes and are not NeoFit products:

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

They are safe to delete. No code, Supabase resource, user data or canonical NeoFit domain depends on them.

## Deployment quota guard

Vercel previously attempted a Preview for every small Git commit. NeoFit now uses an explicit marker:

```text
.vercel-deploy
```

`vercel.json` runs `scripts/vercel-ignore.mjs` before the build:

1. Production is skipped.
2. Branches other than `web/full-frontend-integration` are skipped.
3. A Preview build runs only when `.vercel-deploy` changes in the same commit.
4. Development commits and documentation-only commits do not consume a real Preview build.

The marker must be updated only after a complete code slice and all required GitHub CI checks are green. Runtime changes should be batched into one commit before touching the marker.

## Supabase environment boundary

No key value is committed to Git. The canonical Vercel project must receive these values through Project Settings for Preview, and later Production only after approval:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

After Environment changes, one deliberate marker update is required because Vercel Environment changes apply only to a new deployment.

Supabase Auth Site URL and Redirect URLs must point to the selected canonical Vercel domain before a real email confirmation round trip is claimed.

## Deletion procedure for probes

The connected Vercel tool available in this workspace can inspect and deploy projects but does not expose project deletion. Delete each disposable probe from:

```text
Vercel Dashboard → project → Settings → General → Delete Project
```

Enter the exact project name when Vercel asks for confirmation. Do not delete `neofit-ai`.

## Exact continuation

1. Complete the single canonical Preview deployment triggered by this marker commit.
2. Verify install, Next.js build, `/today`, `/nutrition`, `/workout`, `/progress`, `/profile`, `/auth`, PWA and runtime logs.
3. Delete the three probe projects from the Dashboard.
4. Configure the two public Supabase variables outside Git.
5. Configure Supabase Auth redirect domains.
6. Trigger only one more marker deployment for the real account round trip.

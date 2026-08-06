# NeoFit Vercel Consolidation

**Date:** 2026-08-06  
**Canonical Vercel project:** `neofit-ai`  
**Project ID:** `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`  
**Development branch:** `web/full-frontend-integration`  
**Canonical Preview release branch:** `vercel/preview`  
**Stable Preview alias:** `neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app`  
**Production promotion:** prohibited until explicit approval

## Why extra projects existed

Three temporary diagnostic projects were created while isolating earlier routing, public-access and file-reference failures:

- `neofit-direct-probe`
- `neofit-ui-public-probe`
- `neofit-file-ref-probe`

They are not NeoFit product deployments and are safe to delete. `neofit-ai` is the only canonical application project.

## Deployment control

The only full Preview build is allowed from `vercel/preview`. Development commits are stopped by the Ignored Build Step before installation and compilation.

Observed Vercel behavior: a skipped development commit still appears as a `CANCELED` deployment record. The guard therefore prevents unnecessary build/compute, but it does not claim to eliminate every deployment record or every possible plan-specific deployment count.

To minimize usage and noise:

- one complete product slice = one batched development commit;
- no per-file commits;
- reference docs travel in the same batch;
- one release-branch update after green CI;
- no Production deployment.

A zero-record workflow would require a Dashboard-managed Git disconnect plus manual Deploy Hook. The current connector cannot create or manage that setting.

## Proven release

```text
source: 567a29d9f884ed6555de4035a666052f1eb3cfef
release: 32eeb867742e949d7d6e9d5a3002bcff02d11fd1
deployment: dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy
state: READY
alias: neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
runtime errors: 0
```

## Operational rule

Do not use generic `deploy_to_vercel` for NeoFit. Deploy only through the Git-connected `neofit-ai` project by updating `vercel/preview` to an already-tested development commit.

## Supabase environment boundary

No key value is committed. The canonical Vercel project needs these values through Preview Project Settings:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Supabase Auth Site URL and Redirect URLs must use the stable release alias before a real account round trip is claimed.

## Probe deletion boundary

The connected Vercel tool can inspect and deploy projects but does not expose project deletion. Delete the three probes in the Dashboard:

```text
Vercel Dashboard → project → Settings → General → Delete Project
```

Never delete `neofit-ai`.

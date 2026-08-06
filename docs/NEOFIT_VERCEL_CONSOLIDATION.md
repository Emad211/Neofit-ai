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

## Deployment quota contract

Automatic Vercel deployments are disabled for development branches. `vercel.json` allows Git deployments only from:

```text
vercel/preview
```

The development branch can receive code and documentation commits without creating Vercel deployment records. When a complete batch is green, the release branch is updated once to the exact tested commit. That explicit update creates one Preview deployment.

`scripts/vercel-ignore.mjs` is the second boundary:

1. Production is skipped.
2. Branches other than `vercel/preview` are skipped.
3. The explicit Preview release branch is allowed to build.

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

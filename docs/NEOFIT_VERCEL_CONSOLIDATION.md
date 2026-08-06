# NeoFit Vercel Consolidation

**Date:** 2026-08-06  
**Canonical Vercel project:** `neofit-ai`  
**Project ID:** `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`  
**Development branch:** `web/full-frontend-integration`  
**Canonical Preview release branch:** `vercel/preview`  
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

The development branch can receive code and documentation commits without creating Vercel deployments or canceled deployment records. When a complete batch is green, the release branch is moved once to the exact tested commit. That explicit branch update creates one Preview deployment.

`scripts/vercel-ignore.mjs` provides a second safety boundary:

1. Production is skipped.
2. Branches other than `vercel/preview` are skipped.
3. The explicit Preview release branch is allowed to build.

## Operational rule

Do not use generic `deploy_to_vercel` for NeoFit. Deploy NeoFit only through the Git-connected `neofit-ai` project by updating `vercel/preview` to an already-tested commit.

## Supabase environment boundary

No key value is committed. The canonical Vercel project needs these values through Preview Project Settings:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Supabase Auth Site URL and Redirect URLs must use the canonical Preview release alias before a real account round trip is claimed.

## Probe deletion boundary

The connected Vercel tool can inspect and deploy projects but does not expose project deletion. Delete the three probes in the Dashboard:

```text
Vercel Dashboard → project → Settings → General → Delete Project
```

Never delete `neofit-ai`.

# NeoFit Vercel Consolidation

**Date:** 2026-08-06  
**Canonical Vercel project:** `neofit-ai`  
**Project ID:** `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`  
**Canonical Preview branch:** `web/full-frontend-integration`  
**Production promotion:** prohibited until the explicit production gate is approved

## Why extra projects existed

Three temporary probe projects were created while diagnosing the earlier Vercel routing and file-reference failures:

- `neofit-direct-probe`
- `neofit-ui-public-probe`
- `neofit-file-ref-probe`

They are not NeoFit product deployments and are safe to delete. `neofit-ai` is the only canonical application project.

## Quota protection

Git commits no longer need to create a Preview build automatically. The repository-root Vercel contract uses:

```text
ignoreCommand: node scripts/vercel-ignore.mjs
marker: .vercel-deploy
```

A build is allowed only when all conditions are true:

1. Vercel environment is `preview`;
2. Git branch is `web/full-frontend-integration`;
3. `.vercel-deploy` changed in that exact commit.

Production and unrelated branches are skipped. During development, code and documentation can be committed without spending Preview deployment quota. When a tested batch is ready, the marker is updated once in the same batched commit.

## Current public-runtime boundary

The Auth/persistence code is implemented and CI-proven, but real account runtime proof still requires the two Browser-safe Supabase variables to be configured outside Git in the canonical Vercel project:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

No key value is committed. After environment configuration, one deliberate marker update is enough for the exact-head Preview deployment and the temporary real-account round-trip.

## Operational rule

Do not use generic `deploy_to_vercel` for NeoFit. It may create an unrelated standalone project. Deploy NeoFit only through the Git-connected canonical project and the deliberate `.vercel-deploy` marker.

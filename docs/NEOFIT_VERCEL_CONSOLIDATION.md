# NeoFit Vercel Consolidation

**Canonical Project:** `neofit-ai`  
**Project ID:** `prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG`  
**Development branch:** `web/full-frontend-integration`  
**Preview release branch:** `vercel/preview`  
**Stable alias:** `neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app`

## One-Project rule

NeoFit has one Product Project only: `neofit-ai`. The following diagnostic Projects are disposable and still require manual deletion:

```text
neofit-direct-probe
neofit-file-ref-probe
neofit-ui-public-probe
```

The current connector can list and inspect them but cannot delete Projects.

## Quota-conscious flow

1. develop on `web/full-frontend-integration`؛
2. one logical slice = one batched Commit؛
3. include Authority docs in that Commit؛
4. run all GitHub CI؛
5. never release a failing or partially tested head؛
6. update `vercel/preview` exactly once؛
7. never call generic `deploy_to_vercel`؛
8. never promote Production without explicit approval.

Ignored development commits can still create a `CANCELED` record, so unnecessary pushes remain prohibited.

## Dashboard cleanup required

Live metadata drift must be corrected:

```text
current observed Framework: null
current observed Node: 24.x
required Framework: Next.js
required Node: 22.x
```

## Environment contract

Preview needs three values, not two:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=<stable Preview alias>
```

No value is stored in Git. Supabase Site URL/Redirect URL must match the Alias.

## Current release truth

```text
deployment: dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy
state: READY
runtime error clusters: 0
```

This release proves the canonical build path. It does not prove configured Supabase Auth or a real account round-trip.

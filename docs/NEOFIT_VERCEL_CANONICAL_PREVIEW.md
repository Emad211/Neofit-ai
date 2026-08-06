# NeoFit Canonical Vercel Preview

**Date:** 2026-08-06  
**Status:** one canonical Preview project and one dedicated release branch are active  
**Production promotion:** prohibited until explicit approval

## Canonical project

```text
Vercel team: Emad's projects
Project: neofit-ai
Project ID: prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
Git repository: Emad211/Neofit-ai
Development branch: web/full-frontend-integration
Preview release branch: vercel/preview
Stable release alias: neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
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

`vercel.json` disables automatic Vercel deployments for every branch except `vercel/preview`. Normal code and documentation commits on `web/full-frontend-integration` therefore do not create Preview builds or canceled deployment records.

Release flow:

1. develop and document on `web/full-frontend-integration`;
2. run all GitHub CI;
3. choose the exact tested commit;
4. update `vercel/preview` once;
5. verify the single resulting Preview;
6. do not promote to Production.

`scripts/vercel-ignore.mjs` additionally rejects Production and any non-release branch.

## Canonical release evidence

```text
source development commit: 567a29d9f884ed6555de4035a666052f1eb3cfef
release commit: 32eeb867742e949d7d6e9d5a3002bcff02d11fd1
deployment: dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy
state: READY
target: Preview
alias: neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
```

Build evidence:

- cloned the dedicated `vercel/preview` branch;
- release-branch safety command explicitly allowed the build;
- workspace installation completed;
- Next.js `16.2.12` detected;
- four PWA icons generated;
- Turbopack production compile passed;
- TypeScript passed;
- 18 route outputs generated, including Auth, Today, Nutrition, Workout, Progress, Profile, Manifest and Offline;
- deployment completed successfully;
- root HTTPS request returned `200` with `lang=fa`, `dir=rtl` and NeoFit metadata;
- runtime error clusters after release: `0`.

## Supabase environment boundary

No key value is committed. Before real Auth runtime proof, configure on the canonical Vercel Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Then configure the stable release alias in Supabase Auth Site URL and Redirect URLs. Environment changes require exactly one later update of `vercel/preview`.

## Deletion procedure

The connected Vercel tool does not expose project deletion. Delete exactly these three projects from `Settings → General → Delete Project`:

- `neofit-direct-probe`
- `neofit-file-ref-probe`
- `neofit-ui-public-probe`

Never delete `neofit-ai`.

## Exact continuation

1. Delete the three disposable probes in the Dashboard.
2. Configure the two public Supabase Preview variables and Auth redirects.
3. Continue development only on `web/full-frontend-integration` with no automatic Vercel deployment.
4. After the next complete slice and green CI, update `vercel/preview` once for the real account/persistence round trip.

# NeoFit Canonical Vercel Preview

**Date:** 2026-08-06  
**Status:** one canonical Product project and one dedicated Preview release branch  
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

Never use generic `deploy_to_vercel` for NeoFit. It may create an unrelated Project. A release is made only by updating `vercel/preview` to an already-tested development commit.

## Proven release

```text
source development commit: 567a29d9f884ed6555de4035a666052f1eb3cfef
release commit: 32eeb867742e949d7d6e9d5a3002bcff02d11fd1
deployment: dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy
state: READY
target: Preview
alias: neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
runtime error clusters: 0
```

Build evidence included workspace install, Next.js `16.2.12`, PWA icons, Turbopack, TypeScript and 18 route outputs.

## Deployment-use contract

- Full build is allowed only on `vercel/preview`.
- Development commits are skipped before dependency installation/build.
- Vercel may still create a short `CANCELED` record for a skipped commit.
- One complete slice must therefore be one batched development commit.
- Documentation travels in the same commit.
- Release branch is updated once only after all CI is green.
- Production is never targeted.

## Disposable projects

These three Projects still existed in the live list on ۶ اوت ۲۰۲۶ and must be deleted manually:

```text
neofit-direct-probe     prj_m6fKI15AZzEN5kxN3QqAjep5UnOq
neofit-file-ref-probe   prj_Rm5ndp2XWqTK2hmnxRoARdc1Jkyh
neofit-ui-public-probe  prj_27bdfi9G9VYpEFRBmtPTL8Mj57AQ
```

They have no dependency from NeoFit code, Supabase or the canonical Project. Never delete `neofit-ai`.

## Dashboard consistency

Live Project metadata reported:

```text
framework: null
nodeVersion: 24.x
```

Repository authority is:

```text
framework: Next.js
Next.js: 16.2.12
Node: 22.x
```

The owner should synchronize Framework Preset and Node version in Dashboard before the next release. The repository build contract already pins the intended versions, but Dashboard drift should not remain ambiguous.

## Complete Preview Environment

Configure outside Git:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=https://neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
```

`NEXT_PUBLIC_APP_URL` is required so email confirmation returns to the stable Preview Alias rather than an unrelated automatic/Production URL.

Supabase Auth URL Configuration must allow the stable Site URL and callback/confirm routes.

## Protected QA

The Preview is protected. Full automated browser QA requires a Vercel Automation Bypass secret stored only as GitHub secret `VERCEL_AUTOMATION_BYPASS_SECRET`. Secret and Share URL tokens must not enter Git, chat, PR comments, logs or artifacts.

## Exact continuation

1. Delete the three disposable projects.
2. Align Framework and Node settings.
3. Configure all three Preview Environment values.
4. Configure Supabase Site/Redirect URLs.
5. Wait for the complete hardening slice CI to become green.
6. Update `vercel/preview` once.
7. Run protected PWA QA and temporary real-account Auth/persistence proof.
8. Do not promote Production.

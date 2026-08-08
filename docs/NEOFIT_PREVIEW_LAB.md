# NeoFit Preview Lab

**Status:** active development/QA deployment target  
**Created:** 2026-08-08  
**Production promotion:** prohibited until explicitly approved

## Canonical development deployment

```text
Vercel project: neofit-preview-lab
Project ID: prj_f1DbemcjbEaST2ExvsKvtcGFdG5x
Team: emads-projects-41cb6447
Current source branch: stage5/ai-provider-foundation
Current READY Preview deployment: dpl_2oojsfYFYT1REtyZ83ugsTEzo5xU
Preview URL: https://neofit-preview-b3lygl527-emads-projects-41cb6447.vercel.app
Deployment target: Preview (`target = null` in Vercel deployment metadata)
Runtime errors after release: 0
```

The old `neofit-ai` project is not the active development target for this phase. Do not promote or repair its Production deployment while the Preview Lab workflow is active.

## Deployment policy

1. All NeoFit application and AI-foundation runtime verification happens on `neofit-preview-lab`.
2. Deployments must target Preview only. Do not use `--prod`, a Production target, or a Production promotion.
3. The Preview Lab currently uses a controlled bootstrap deployment: Vercel receives a tiny bootstrap project, downloads the selected public GitHub branch during build, installs the repository workspace with development dependencies, and runs `npm run build:web`.
4. This avoids automatic Git deployment noise while allowing an explicit branch to be selected for each QA release.
5. Do not add a production domain during this phase.
6. Required Supabase and AI environment variables must be scoped to Preview only.
7. A new Preview should be created only after the selected branch passes its CI gates.

## Verified build contract

The first successful Preview Lab release built the real NeoFit workspace with Next.js 16.2.12, workspace development dependencies, PWA icon generation, Turbopack compilation, TypeScript validation, all 19 current route outputs (including AI provider routes and `/profile/ai`) and three Node.js runtime functions. Runtime error clusters were zero immediately after deployment.

## Known Vercel creation quirk

When the project was first created through the connected deploy API, Vercel recorded the initial failed creation deployment as `target = production` even though the request specified Preview. That deployment never became READY and serves no Production traffic. Subsequent deployments on the existing project correctly record Preview as `target = null`.

## Node runtime drift

The READY Stage 5C build exposed a QA-only warning: the controlled bootstrap was executed on Node 24 while the repository root contract is Node 22. The source workspaces are now pinned to `22.x`; the next explicit Preview bootstrap must also declare Node `22.x`. Do not spend another deployment only for this documentation/runtime pin; verify it on the next environment-backed QA release.

## Preview-only environment contract

Set these only for Preview:

```text
NEXT_PUBLIC_SUPABASE_URL=https://rjwrobltmjodfarnltal.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<project publishable key>
NEXT_PUBLIC_APP_URL=<stable Preview Lab URL>
AI_CREDENTIAL_ENCRYPTION_KEY=<base64 of exactly 32 random bytes>
```

Generate the encryption secret locally and copy the single-line result into Vercel Preview settings:

```bash
openssl rand -base64 32
```

Never expose `AI_CREDENTIAL_ENCRYPTION_KEY`, provider API keys, Supabase service-role credentials, or any other server secret through `NEXT_PUBLIC_*` variables.

## Supabase Auth URL contract

Use the same stable Preview Lab origin as the Supabase Auth Site URL during QA and allow these exact application callbacks:

```text
<preview-origin>/auth/callback
<preview-origin>/auth/confirm
```

A wildcard Vercel Preview allow-list may be added for development, but exact URLs are preferred for the canonical QA alias.

## Continuation point

1. Keep `neofit-preview-lab` as the only runtime QA target.
2. Finish and CI-prove the Stage 5 provider vault/router on PR #38.
3. Configure Preview-only Vercel environment values and Supabase Auth URLs.
4. Run real-account signup/signin and persistence proof.
5. Save/test a real Google key and run one direct Gemini request.
6. Save/test AvalAI and deliberately prove Google-first fallback/cooldown.
7. Add the Profile AI Settings UI and then read-only Coach tools.
8. Continue Workout Player and Onboarding/Body Map without Production promotion.

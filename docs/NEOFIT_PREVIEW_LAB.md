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
Current READY Preview deployment: dpl_46FJXqX6ja4KLCqddAwCN81BSA13
Preview URL: https://neofit-preview-8uk3ccq1b-emads-projects-41cb6447.vercel.app
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

The first successful Preview Lab release built the real NeoFit workspace with:

- Node 22 bootstrap environment;
- Next.js 16.2.12;
- workspace installation including dev dependencies;
- PWA icon generation;
- Turbopack compilation;
- TypeScript validation inside Next build;
- all 18 current route outputs;
- three Node.js runtime functions;
- successful Vercel output deployment.

The successful release had no runtime error clusters immediately after deployment.

## Known Vercel creation quirk

When the project was first created through the connected deploy API, Vercel recorded the initial failed creation deployment as `target = production` even though the request specified Preview. That deployment never became READY and serves no Production traffic. Subsequent deployments on the existing project correctly record Preview as `target = null`.

Do not treat the failed creation record as a Production release. The only usable release is the READY Preview deployment listed above.

## Preview-only environment contract

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=<active Preview Lab URL>
AI_CREDENTIAL_ENCRYPTION_KEY=<server-only, after AI credential vault implementation>
```

Never expose `AI_CREDENTIAL_ENCRYPTION_KEY`, provider API keys, Supabase service-role credentials, or any other server secret through `NEXT_PUBLIC_*` variables.

## Continuation point

1. Keep `neofit-preview-lab` as the only runtime QA target.
2. Finish the Stage 5 AI provider foundation on `stage5/ai-provider-foundation`.
3. Configure Preview-only Supabase environment values and Auth redirect URLs for the active Preview Lab URL.
4. Implement the server-side AI credential vault and Google-first/AvalAI-fallback provider router.
5. Run real-account and BYOK runtime scenarios on Preview.
6. Continue frontend integration slices (Workout Player, Onboarding/Body Map, remaining account data) without Production promotion.
7. Create a separate Production release decision only after explicit approval and complete runtime evidence.

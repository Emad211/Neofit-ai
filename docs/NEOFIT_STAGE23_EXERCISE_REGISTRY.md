# NeoFit Stage 23 — Exercise Registry and Deterministic Safety

Status: **code, local Postgres/REST proof and live agent benchmark green; hosted proof open**.

## Delivered contract

- `@neofit/exercise-registry` is the shared TypeScript authority for stable exercise identities.
- Registry v1 contains 23 curated exercises, equipment, movement patterns, difficulty, muscles, safety tags, trusted search hints and directed substitutions.
- Search is normalized, deterministic and bounded; unknown queries return no identity.
- Onboarding medical/injury data is converted to hard-block, review and human-review reasons without an LLM.
- Substitutions must be registered, allowed by the deterministic safety profile and feasible with available equipment.
- Critical workout pain or a blocked requested exercise returns a deterministic stop/professional-review response before any provider call.
- Coach context includes at most four registry candidates and two validated substitutes per candidate.
- Coach context, external data and total system instruction have code-level size ceilings.
- Provider calls enforce a 700 output-token ceiling and never add a hidden classifier inference.

## Database boundary

Migration `20260811150000_exercise_registry_safety.sql` adds:

- globally readable but non-client-writable `exercise_registry` and `exercise_substitutions`;
- the exact same 23 registry ids as the shared package;
- `workout_plans.exercise_catalog_version`;
- a trigger that rejects unknown exercise ids and id/name mismatches on all future Workout Plan inserts or plan updates.

Existing historical plans are not rewritten. New persisted identities cannot bypass the registry through a direct client write.

## Live model benchmark

Synthetic data only; the key is loaded from an explicit file path, never printed or persisted. The three gates are severe knee pain, missing progress truth and registry-only substitution.

| AvalAI model | Gates | Inference calls | Mean inference latency | Input tokens | Output tokens | Published-rate estimate |
|---|---:|---:|---:|---:|---:|---:|
| `gemini-flash-latest` | 3/3 | 2 | 6,758 ms | 1,599 | 873 | $0.0026622 |
| `gemini-flash-lite-latest` | 3/3 | 2 | 3,440 ms | 1,599 | 131 | $0.0002123 |

The severe-safety gate uses zero inference tokens in both runs. Flash Lite was about 49% faster and 92% cheaper under AvalAI's published alias rates, so it is now the default AvalAI fallback. Exact transaction-cost lookup remained unavailable due the User API transport/processing path; estimates use the measured token counts and published $0.10/M input + $0.40/M output for Lite, and $0.30/M + $2.50/M for Flash.

This corpus is a release gate, not a broad clinical or model-quality certification. Future prompt/model changes must rerun it.

## Local verification

Use Node 22.12.0 (`.nvmrc`). From repository root:

```powershell
nvm use 22.12.0
npm install --no-audit --no-fund
npm run check:exercise-registry
npm --workspace @neofit/web run test:exercise-registry
npm --workspace @neofit/web run test:supabase-app
npm run typecheck:web
npm run build:web
```

Lean local Supabase (Docker Desktop must be running):

```powershell
npx --yes supabase@2.113.0 start --exclude realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor --yes
npx --yes supabase@2.113.0 db reset --yes
npx --yes supabase@2.113.0 status -o env
```

Copy only local `API_URL`/`ANON_KEY` output to the ignored `web/.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Preserve the existing server-only encryption/recovery keys.

Optional live benchmark:

```powershell
$env:NEOFIT_LIVE_KEY_FILE='C:\path\outside\repo\avalai-key.txt'
$env:NEOFIT_LIVE_MODEL='gemini-flash-lite-latest'
npm --workspace @neofit/web run benchmark:agent-live
```

## Vercel handoff

The repository-root `vercel.json` remains canonical. It installs the workspace, builds `@neofit/web`, outputs `web/.next` and does not deploy non-release branches. Local parity is `npm run build:web`; the owner can later link/deploy the existing Vercel project without changing this contract.

Local evidence: all 23 migrations reset cleanly; registry counts were 23 exercises/13 substitutions; Auth health was 200; anonymous REST read returned 23 identities; anonymous insert returned 401; a valid Workout Plan insert passed and a fabricated exercise id failed with `unregistered_exercise_id` inside a rolled-back transaction.

The local release baseline also moved from Next.js 16.2.12 to 16.3.0 because the pinned release inherited High-severity PostCSS/Sharp advisories. After the patch upgrade, production dependency audit reports zero vulnerabilities and the full web suite/build remains green.

## Next stage

Stage 24 can now build bounded structured Training/Nutrition planners. Every generated Workout Plan must pass registry identity/name validation and deterministic safety before immutable persistence.

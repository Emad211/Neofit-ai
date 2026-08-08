# NeoFit Stage 8 — Read-Only Coach

Status: implementation / Draft QA

## Goal

Deliver the first real NeoFit Coach against authenticated user data while preserving the Google-first/AvalAI-fallback BYOK boundary and minimizing provider requests.

## Core request architecture

```text
Browser message
  -> authenticated /api/ai/coach
  -> deterministic local intent router
  -> selective read-only NeoFit context tools
  -> one orchestrator prompt
  -> Google Gemini primary
  -> AvalAI only on eligible fallback failure
```

There is no LLM classifier request before the real answer. A healthy Google request therefore uses one provider inference request.

## Context routing

Every request receives only profile-level context by default. Keyword/intent rules selectively add:

- `safety`: medical flags, physician restrictions and injury constraints
- `nutrition`: today's persisted diary + goals summarized by `@neofit/nutrition-core`
- `workout`: active/recent sessions, completed sets and deterministic best weights

Progress questions currently reuse available Workout/Nutrition evidence. NeoFit does not invent bodyweight/history data that is not yet persisted.

## Authentication optimization

The Coach route creates one authenticated Supabase context and passes it through both context loading and provider credential routing. This avoids duplicate auth/client work inside a single Coach request.

## Provider request policy

- Google remains primary.
- AvalAI is only attempted after an eligible Google fallback error.
- No health-check request precedes a normal Coach request.
- Credential validation remains a Save/Test concern, not a per-message concern.
- Provider fallback/cooldown behavior remains centralized in `provider-router.ts`.

## Conversation policy

Stage 8 chat history is ephemeral UI memory only:

- no conversation database table
- no cross-device retention yet
- maximum six prior messages sent to the provider
- maximum 6,000 history characters
- maximum 2,400 characters for the new message
- page keeps only the latest 20 UI messages

Persistent conversation history will be a separate feature only if needed, with explicit RLS and retention rules.

## Read-only safety boundary

Coach v1 has no write tool. It cannot save, update or delete:

- workout plans or sessions
- nutrition entries/goals
- onboarding/medical data
- profile data
- provider credentials

The client cannot supply or override a system instruction. The server builds the instruction from fixed NeoFit policy plus trusted application structure. User-entered strings inside context are explicitly treated as data, never instructions.

## Nutrition boundary

Nutrition arithmetic is never delegated to the model. The server resolves today's persisted entries and goals through Shared Nutrition Core primitives before the prompt is built. The model may explain or quote those outputs; it may not invent or recompute calorie/macronutrient values.

## Medical boundary

Coach does not diagnose. Physician restrictions, cardiac history, blood-pressure/diabetes flags, pain and injuries are treated as constraints. High-risk/new/severe symptoms should be escalated to appropriate professional or emergency evaluation instead of receiving a confident training prescription.

## No direct SQL/model database access

The model receives a compact JSON context object assembled by server code. It never receives SQL credentials, raw database access, Supabase keys, provider API keys or encrypted credential rows.

## Runtime QA

After CI and the user's real Google BYOK validation:

1. unauthenticated Coach returns authentication-required state;
2. authenticated Coach with no key routes to AI settings;
3. a general greeting loads profile context only;
4. a nutrition question loads Core-derived nutrition context;
5. a workout question loads session/set context plus safety constraints;
6. a pain/injury question loads safety context;
7. successful Google response reports provider/model/latency;
8. controlled Google failure proves AvalAI fallback and cooldown;
9. no Coach mutation appears in Supabase after read-only QA;
10. no runtime error clusters in Preview Lab.

No Production promotion in Stage 8.

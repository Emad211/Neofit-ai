# NeoFit AI Provider Foundation Evidence

**Stage:** 5A/5B  
**Branch:** `stage5/ai-provider-foundation`  
**PR:** #38  
**Runtime:** `neofit-preview-lab` only

## Implemented contract

- Google-first provider priority.
- AvalAI second provider/fallback.
- AES-256-GCM BYOK vault with user/provider AAD binding.
- No raw API key persistence or Browser storage.
- Google stable Interactions `v1` adapter.
- AvalAI Responses adapter.
- inference-free credential validation through model metadata endpoints.
- failure classification and bounded provider cooldown.
- authenticated CRUD/Test provider API routes.
- authenticated foundation inference endpoint.
- dedicated CI contract and secret scan.

## Healthy request budget

A normal configured request performs:

1. one Supabase credential query that loads both provider rows;
2. one Google inference request.

There is no preflight provider request and no success health-write. AvalAI is contacted only when Google is unavailable according to the fallback policy.

## Security assertions

- `AI_CREDENTIAL_ENCRYPTION_KEY` is server-only.
- API keys are header credentials, never URL query parameters.
- provider routes return no ciphertext/IV/auth tag.
- provider/account API responses use `private, no-store`.
- RLS owner predicates use `auth.uid() = user_id`.
- no service-role key is introduced to Browser code.
- malformed application requests are not silently retried across providers.

## Runtime evidence still required

- Preview environment has Supabase URL/publishable key/application URL.
- Preview environment has a generated 32-byte base64 `AI_CREDENTIAL_ENCRYPTION_KEY`.
- Supabase Auth URLs include the stable Preview Lab URL.
- one real user saves and tests a Google key.
- one Google request succeeds through `/api/ai/respond`.
- one AvalAI credential is saved and tested.
- a controlled Google failure proves one-step AvalAI fallback and cooldown.
- credential deletion proves the row is removed and raw key cannot be recovered.

No Production approval follows from this document.

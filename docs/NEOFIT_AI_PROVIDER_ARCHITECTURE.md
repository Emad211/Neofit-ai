# NeoFit AI Provider Architecture

**Status:** Stage 5 provider foundation in implementation  
**Primary runtime target:** `neofit-preview-lab` (Preview only)  
**Primary provider:** Google Gemini  
**Fallback provider:** AvalAI  
**Production promotion:** prohibited until explicit approval

## 1. Goal

NeoFit uses BYOK: every authenticated user can connect their own Google AI Studio and/or AvalAI credential. The application owns orchestration, safety, data access and deterministic business rules; providers only perform model inference.

## 2. Locked request policy

Normal path:

```text
Browser
  -> authenticated Next.js Route Handler
  -> one RLS-protected credential read for both providers
  -> Google Gemini
  -> response
```

Fallback path:

```text
Google auth/rate/network/5xx failure
  -> persist only failure/cooldown metadata
  -> AvalAI
  -> response
```

Rules:

- Never call both providers after a successful Google request.
- Never issue a health request before a normal AI request.
- Validate credentials only on Save/Test.
- Skip credentials marked `invalid` until the user replaces/tests them.
- Skip transiently failing providers until `cooldown_until`.
- Do not fallback on malformed application requests; adapter bugs must remain visible.
- Normal successful inference performs no provider-health database write.

This keeps the healthy request path at one credential query plus one provider inference request.

## 3. Provider APIs

### Google

- API: Gemini Interactions API stable `v1`.
- Endpoint: `POST https://generativelanguage.googleapis.com/v1/interactions`.
- Auth: `x-goog-api-key` header, never query string.
- Default: `gemini-3.5-flash-lite`.
- Credential validation: model metadata GET, no inference token consumption.
- Provider-side conversation storage is disabled in the foundation slice (`store: false`).

### AvalAI

- API: OpenAI-compatible Responses API.
- Endpoint: `POST https://api.avalai.ir/v1/responses`.
- Auth: Bearer header.
- Default fallback model: `gemini-3.5-flash` (user preference remains replaceable).
- Credential validation: authenticated model metadata GET, no inference token consumption.

Do not assume feature parity between Google Interactions and AvalAI Responses. NeoFit owns one internal adapter contract and each provider maps to its native supported wire format.

## 4. Credential vault

Raw keys:

- never enter `localStorage`, IndexedDB, service-worker cache, analytics or logs;
- never use a `NEXT_PUBLIC_*` variable;
- are accepted only by authenticated server routes;
- are validated before first persistence;
- are encrypted before database storage.

Encryption:

- AES-256-GCM;
- random 96-bit IV per write;
- 128-bit GCM authentication tag;
- Additional Authenticated Data binds ciphertext to `user_id`, provider and key version;
- `AI_CREDENTIAL_ENCRYPTION_KEY` is a base64-encoded 32-byte Vercel server secret;
- current `key_version` is `1` and rotation must be explicit.

Database stores only ciphertext, IV, auth tag, key hint, provider/model metadata, validation state and cooldown state.

## 5. Persistence and RLS

Table: `public.encrypted_provider_credentials`

- unique `(user_id, provider)`;
- owner-row RLS for SELECT/INSERT/UPDATE/DELETE;
- no anon grant;
- explicit authenticated Data API grants;
- `provider` limited to `google | avalai`;
- ciphertext/IV/tag/model/failure fields length constrained;
- delete cascades with the Auth user.

The ciphertext can be read only by its owner through RLS, but is useless without the Vercel-held AES key. Raw provider credentials never exist in Postgres.

## 6. Server API surface

```text
GET    /api/ai/providers
PUT    /api/ai/providers/:provider
POST   /api/ai/providers/:provider   # explicit Test
DELETE /api/ai/providers/:provider
POST   /api/ai/respond               # foundation inference smoke path
```

All responses containing account/provider state are `private, no-store`.

`/api/ai/respond` is not the final Coach UI contract. It proves authentication, credential routing, Google-first selection and AvalAI fallback before agent tools are added.

## 7. Failure/circuit-breaker rules

- 401/403: credential becomes `invalid`; future requests skip it until replacement/test.
- 404 model: credential/model pair becomes invalid; user must select a supported model.
- 429: temporary cooldown, respecting `Retry-After` up to the bounded cooldown.
- network/408/5xx: short transient cooldown.
- 4xx malformed request: fail closed; do not hide the bug with fallback.

Google is attempted first only when it is active and outside cooldown. This prevents repeatedly spending a failed Google request before every AvalAI fallback.

## 8. Agent boundary

The model never owns NeoFit business logic. Future tools own profile/workout/nutrition/progress reads and validated mutations.

Nutrition remains stricter: provider-generated calories/macros/weights/portions are rejected. Provider output may suggest identity/ingredients; final nutrition must resolve through IFKB/FNDDS/SR and Shared Nutrition Core.

## 9. Next slices

1. Verify migration live and regenerate Supabase types.
2. Add Profile/Settings BYOK UI over the provider routes.
3. Run real Google save/test/inference on Preview.
4. Run AvalAI fallback scenario on Preview.
5. Add request audit metrics without prompt/key logging.
6. Introduce read-only Coach tools after Workout/Onboarding data contracts are stable.

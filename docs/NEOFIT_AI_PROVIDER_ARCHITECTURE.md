# NeoFit AI Provider Architecture

Status: Stage 5 foundation

## Goal

Create a professional BYOK AI layer where each user can connect their own provider credentials.

Initial providers:

1. Google Gemini (primary)
2. AvalAI (fallback)

## Request policy

Normal request path:

Browser
-> authenticated Next.js Route Handler
-> Provider Router
-> Google Gemini
-> NeoFit tools/context

Fallback path:

Google transient failure
-> provider cooldown check
-> AvalAI
-> response

Never call both providers for the same successful request.

## Credential rules

- Raw API keys never enter localStorage.
- Raw API keys never enter logs.
- Raw API keys never enter browser bundles.
- Database stores encrypted payload only.
- Encryption key lives only in Vercel server environment.

Stored metadata:

- provider
- encrypted ciphertext
- IV
- authentication tag
- key version
- model preference
- validation timestamp
- health state

## Optimization rules

- No health request before every chat message.
- Validate key only during save/test.
- Keep provider latency visible.
- Add cooldown after repeated failures.
- Stream responses where supported.
- Cache stable system context.
- Do not resend unnecessary user history.

## Initial models

Google default:

`gemini-3.5-flash-lite`

AvalAI:

Configured as fallback adapter.

## Future agent boundary

The model does not own business logic.

Tools own:

- profile reads
- nutrition reads
- workout reads
- progress summaries
- validated mutations

Nutrition calculations remain inside Nutrition Core.

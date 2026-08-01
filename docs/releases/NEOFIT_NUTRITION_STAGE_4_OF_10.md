# NeoFit Nutrition — Stage 4 of 10

## Status

Stage 4 connects both Vision and LLM identity assistance to the local nutrition catalog.

## Product flow

1. Manual logging remains fully offline.
2. Text identification searches the local catalog first.
3. When no reliable local text match exists and AvalAI is configured, the LLM converts conversational Persian or English wording into short catalog queries.
4. Photo identification prepares a bounded JPEG on device and sends it to the configured Vision model only after explicit consent.
5. Vision candidates are resolved against the local catalog.
6. When Vision labels cannot be mapped reliably, the LLM may interpret the user text plus Vision labels and warnings.
7. Mixed plates, close alternatives, low confidence, weak matches and warnings require explicit user confirmation.

## Nutrition authority

Vision and LLM are identity helpers only. Calories, macros, portions and ranges are calculated exclusively from the local IFKB/USDA catalog. Provider nutrition fields, invented serving weights and LLM nutrition are rejected.

## Privacy and reliability

- API calls happen only after explicit user actions.
- API keys remain in SecureStore.
- Prepared image dimensions and byte size remain bounded.
- Raw images are not stored in the nutrition database.
- LLM output is validated by a strict identity-only schema.
- The application remains usable without an API key through manual logging and local catalog search.

## Validation

Mobile CI run 534 passed deterministic tests, Python contracts, DS2, the 13,486-record audit, the 261-food app dataset, Expo compatibility, strict TypeScript and Android export.

## Next stage

Stage 5 improves the broad Iranian nutrition estimates in groups while keeping this Vision/LLM identity pipeline stable.

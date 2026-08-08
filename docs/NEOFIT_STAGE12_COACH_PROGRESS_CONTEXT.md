# NeoFit Stage 12 — Selective Coach Progress Context

Status: implementation / Draft QA

## Goal

Allow the read-only NeoFit Coach to answer body-progress questions from the real Stage 10 `body_measurements` source without adding hidden AI requests or loading Progress data for unrelated prompts.

## Intent routing

The deterministic local router now has a fifth context domain:

`progress`

Examples:

- `دور کمر و وزن بدنم چه تغییری کرده؟` → profile + progress
- `روند پیشرفت من چطور بوده؟` → profile + progress
- `روند تمرینم را بررسی کن` → profile + safety + workout + progress
- a normal Nutrition prompt does not load Progress
- a normal Workout prompt does not load Progress unless progress/trend language is present

No LLM classifier request is introduced.

## Progress source

When and only when `progress` is selected, Coach makes one bounded user-filtered query:

- table: `body_measurements`
- filter: authenticated `user_id`
- order: newest first
- limit: 30 rows

The existing authenticated Supabase client is reused. Creating a second Auth/Supabase context is forbidden by the Stage 12 test contract.

## Derived read-only context

NeoFit derives only simple descriptive values in TypeScript:

- latest real weight
- latest real waist
- latest real body-fat percentage
- count of loaded measurement events
- first-to-last weight change inside the bounded loaded window when at least two real weight measurements exist

No body value is inferred when missing.

## Authority precedence

Onboarding may contain an initial body weight entered during onboarding. For Progress/trend answers:

- dated `body_measurements` is the source of truth;
- a newer real measurement takes precedence over an older onboarding input;
- if Progress has no measurement rows, Coach must state that no real trend is registered rather than inventing one.

Nutrition remains separately governed by `@neofit/nutrition-core`.

## Request budget

Healthy general Coach prompt:

- unchanged from Stage 8/11;
- zero `body_measurements` request.

Progress prompt:

- one additional bounded Supabase read;
- still one Google provider request in the healthy path;
- no classifier inference;
- no health-check inference;
- AvalAI remains fallback only.

## Privacy

- no Progress note text is sent to the model in Stage 12;
- only dates and numeric body measurements needed for the user's question are exposed in context;
- no write tools;
- no conversation persistence;
- no raw SQL access.

## Runtime QA

1. register two real weights in Progress;
2. ask Coach for body-weight trend;
3. verify `contextDomains` contains `progress`;
4. verify Coach reports the same first/latest/change values as Progress;
5. ask a normal general question and verify `progress` is absent;
6. ask a Nutrition-only question and verify `progress` is absent;
7. verify no new body-measurement rows are written by Coach;
8. verify runtime logs have no context-loader errors;
9. no Production promotion.

## Next

Do not add write-agents yet. The next AI infrastructure slice should focus on metadata-only request observability/budgeting after a real Google BYOK call is proven in Preview.

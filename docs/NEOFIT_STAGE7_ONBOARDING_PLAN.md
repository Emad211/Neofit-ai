# NeoFit Stage 7 — Onboarding + Injury Body Map

Status: implementation / Draft QA

## Goal

Port the complete 15-step onboarding contract and original 73-region front/back injury Body Map into the current Next.js + Supabase architecture without reviving the old Firebase/Genkit stack or duplicating Nutrition Core arithmetic.

## Route contract

`/onboarding` redirects to `/onboarding/welcome`. The stable steps are:

1. welcome
2. goal
3. basics
4. body
5. medical
6. injuries
7. lifestyle
8. nutrition
9. training-history
10. availability
11. preferences
12. review
13. analysis
14. result
15. confirmation

A single layout-level provider owns state across the route sequence. The route changes are URLs, not duplicated state machines.

## Persistence contract

Account mode:

- table: `public.user_onboarding`
- exactly one row per authenticated user
- versioned JSONB draft
- one upsert when the user advances a step
- no autosave request for every field/keystroke
- owner-row RLS on all CRUD operations
- medical/injury data is never copied to Guest local storage after an account session is identified
- persistence failure blocks route advancement

Guest mode:

- `neofit:onboarding:v1` localStorage key
- versioned fail-closed parser
- one local write when a step is advanced
- Guest data remains browser-local

## Body Map authority

The original reference Body Map is reused from the `revival/full-ui-front` authority rather than redrawn. It contains exactly 73 unique regions across anterior and posterior views. CI asserts the exact count and unique `(face,id)` identity.

Each selected region stores:

- stable region id / face
- Persian label
- current vs past status
- mild / moderate / severe severity
- forbidden or painful movements
- notes

## Medical and safety boundary

Onboarding records user-reported constraints. It does not diagnose conditions. Physician restrictions, cardiac history, diabetes, blood-pressure flags, pain and injury regions become hard context for later Workout/Coach tools.

No AI model is called during Stage 7 onboarding analysis.

## Nutrition authority boundary

Stage 7 intentionally does **not** copy the old BMR/calorie/macronutrient formula from the UI reference.

The onboarding result may summarize food preferences and training availability, but calorie/macro goals remain the sole responsibility of `@neofit/nutrition-core` and its validated catalog/goal contracts. CI rejects legacy `calorieTarget`, `proteinGrams`, `carbohydrateGrams`, `fatGrams` or `bmr` arithmetic inside the onboarding model.

## Personal-data integrity

The empty draft contains no invented age, height, weight, target weight or country. Unknown values remain `null`/empty until the user supplies them.

The Profile screen must not display fake personal weight/goal metrics before onboarding data exists.

## Database migration

Live Supabase migration:

`20260808132547_user_onboarding_v1`

Security Advisor immediately after application: 0 lints.

## Request budget

Healthy account flow:

- initial onboarding load: claims + one onboarding row read
- step transition: one onboarding upsert
- completion: one onboarding upsert, then profile/unit metadata sync in parallel
- no heartbeat, keystroke autosave, background polling or duplicate draft tables

## Runtime QA after CI

1. Guest progress persists through reload.
2. Invalid Guest JSON fails closed.
3. Account signup/login loads account mode.
4. Step progression survives reload and sign-out/in.
5. Body Map saves multiple front/back regions and metadata.
6. Medical acknowledgment gates advancement.
7. Completion persists `completed` status and timestamp.
8. Profile shows user-owned onboarding entry point without fake personal measurements.
9. No runtime errors in Preview Lab.
10. No Production promotion.

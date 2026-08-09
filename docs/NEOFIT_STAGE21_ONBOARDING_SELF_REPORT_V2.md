# NeoFit Stage 21 — Onboarding v2 + AI Credential Gate + Program Contract

Status: implementation active on `stage21/onboarding-self-report-v2`; Preview-only.

This stage converts the revised product lifecycle from documentation into executable product behavior. It does not generate a fake plan. The next domain stage is Program Cycle.

## Product flow implemented here

```text
verified account
  -> /onboarding/welcome
  -> validate/store Google AI Studio key in encrypted BYOK vault
  -> optional AvalAI fallback key
  -> explicit self-report Onboarding
  -> choose program start date + duration
  -> consent to coordinated Training + Nutrition generation
  -> persist Onboarding schema v2
  -> /onboarding/ready truth boundary
```

`/onboarding/ready` deliberately does not claim a generated course exists. Stage22 must create Program Cycle and Stage24 must implement the structured planners before the product can advance from this handoff into a real active course.

## AI credential gate

The first Onboarding step owns the product prerequisite but not the secret storage.

- account mode requires an `active` Google credential before step 1 can complete;
- Google is the required primary provider;
- AvalAI is optional fallback and can be configured in the same screen;
- existing `/api/ai/providers/*` validation + AES-GCM encrypted vault are reused;
- validation is inference-free;
- raw key exists only in temporary component state;
- raw key is never added to `OnboardingDraft`, localStorage, logs or analytics;
- `/profile/ai` remains the later key rotation/recovery surface;
- Guest can continue only as explicit Demo and cannot claim a real AI-personalized course.

The historical half-implemented `/onboarding/ai` redirect is removed. `/onboarding` and the application root now route to `/onboarding/welcome`, where the actual AI gate exists.

## Self-report semantics v2

`ONBOARDING_SCHEMA_VERSION = 2`.

Core rule:

```text
unset != explicit value != technical/UI default
```

The empty draft no longer preselects personal facts such as:

- target pace;
- gender;
- hypertension/diabetes/cardiac history;
- injury/no-injury and exercise pain;
- activity, sleep quality, stress and smoking;
- meals/day, diet, budget, cooking ability, kitchen access, eating-out frequency;
- training level and cardio/strength experience;
- location, days/week, session duration and preferred time;
- training/nutrition/coaching preferences.

Required self-report fields remain `null` until the user acts. Validation prevents advancing when required choices remain unset.

Technical defaults that are not claims about the user may remain deterministic, for example schema version and metric units.

## Safe v1 migration

Live inspection before this implementation found one hosted `user_onboarding` row with `schema_version=1,status=completed`.

Stage21 does not delete it and does not treat old defaults as facts.

The v1 -> v2 compatibility path:

- preserves unambiguous entries such as typed name/body numbers, explicit primary goal, text notes, allergy lists and selected Body Map areas;
- resets ambiguous categorical/boolean old defaults to `null`;
- clears `completedSteps` and completion consent;
- requires the user to re-review v2 rather than silently inheriting `sedentary`, `never`, `beginner`, `gym`, `3 days/week`, etc.;
- rewrites the row as schema v2 only when the user saves under the new contract.

Guest storage moves from `neofit:onboarding:v1` to `neofit:onboarding:v2` with the same conservative migration rule.

## Program contract added

Stage21 adds the first explicit course boundary:

- `startDate`;
- `programDurationDays`;
- bounded duration: 14–84 days;
- final consent specifically authorizes coordinated Training + Nutrition generation from the supplied data.

The duration is not implemented by increasing the old flat 14-day plan documents. Stage22 must introduce Program Cycle/phases and bounded materialization as defined by `NEOFIT_COACH_PROGRAM_LIFECYCLE_ARCHITECTURE.md`.

## Runtime/data truth changes

- application root requires a live Auth-server user;
- missing Google credential -> Onboarding welcome/AI gate;
- completed Onboarding v1 is not accepted as completed v2;
- completed v2 -> `/onboarding/ready`, not `/today`;
- direct Onboarding account initialization uses live `getUser()` rather than claims-only identity;
- no account can reach the new lifecycle by the old non-existent `/onboarding/ai` path.

## Nutrition authority

No calorie/macro target formula is added to Onboarding.

Shared Nutrition Core remains the only arithmetic authority. Planner work in later stages must persist resolvable food identities/source versions and must not promote model-authored nutrition numbers to authority.

## CI contract

`Onboarding v2 Lifecycle CI` must prove:

1. schema version is 2 and public flow remains 15 steps;
2. step 1 is the real AI credential gate;
3. empty draft has no preselected self-report facts;
4. v1 conservative migration keeps unambiguous values and resets ambiguous defaults;
5. numeric session-duration v2 draft parses correctly;
6. required steps reject unset choices;
7. program duration is bounded;
8. Body Map remains exactly 73 unique front/back regions;
9. raw AI key is absent from Onboarding model/storage;
10. root/index contain no `/onboarding/ai` target;
11. completion routes to the truthful ready handoff rather than Today;
12. full Supabase app regression, TypeScript and Next production build stay green.

## External/runtime proof still required

After code CI is green:

- restart/pull local branch;
- real account -> Google key save inside Onboarding;
- refresh and prove credential status remains active without raw key returning to Browser;
- complete all required v2 choices;
- verify hosted row becomes schema v2 only after save;
- verify selected program duration persists;
- sign out/in and confirm root returns to the correct lifecycle state;
- confirm empty Today no longer reproduces the old `energyKcal` crash on a current build;
- confirm Preview stale Service Worker cleanup on the next single hosted deployment.

## Next stage

Stage22: `program_cycles` source of truth + state machine + idempotent generation-run contract + linkage to versioned Workout/Nutrition plans.

No autonomous write agent is enabled by Stage21.

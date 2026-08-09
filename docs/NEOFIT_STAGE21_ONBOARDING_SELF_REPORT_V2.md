# NeoFit Stage 21 — Onboarding Self-Report v2

Status: design/implementation started; Preview-only; stacked on Stage 20.

## Why this stage exists

Stage 20 found that several values in `createEmptyOnboardingDraft()` are already valid domain answers before a user explicitly chooses them. Examples include sedentary activity, average sleep, medium stress, never smoking, balanced diet, beginner training level, gym location and three training days/week.

That is acceptable for a UI suggestion only if the system can distinguish it from self-report. The current contract cannot reliably do that, and Coach later consumes Onboarding context.

Therefore Stage 21 treats **absence of explicit choice as data**, rather than silently converting product defaults into claimed user facts.

Live Supabase inspection before this redesign found zero `user_onboarding` rows, so the hosted account source can move to v2 before real Onboarding data exists.

## Core rule

A user-report field has three conceptual states:

```text
unset
explicitly selected value
explicitly selected prefer-not-to-say / none (where the domain supports it)
```

`unset` must never render as though a valid answer has already been selected.

## Product defaults vs self-report

### Product/default behavior may have technical defaults

Examples:

- locale
- units
- UI step position
- schema version

These are not claims about the user's body, behavior or preference.

### Self-report must remain unset until explicit choice

Examples include:

- gender
- activity level
- training experience/level
- training location
- training days/week
- session duration when presented as availability
- sleep quality
- stress level
- smoking
- diet type
- primary goal
- coaching style/preferences
- medical yes/no/none choices when the UI asks the user to report them

The exact field inventory is part of the implementation audit; tests must reject adding new pre-selected self-report defaults later.

## Persistence version

Stage 21 introduces Onboarding data semantics version 2.

The hosted `user_onboarding.schema_version` should represent this contract. A v2 draft is not considered complete merely because every property has a valid TypeScript value; required self-report choices must have explicit values.

Because the hosted table is currently empty, Stage 21 does not need to infer missing intent from real account rows.

Guest/local v1 drafts are a separate compatibility problem: parser logic must either migrate only unambiguous fields or fail safely into a review/reset flow. It must never guess that an old default was explicitly chosen.

## UI rules

- no radio/select card appears selected for an unset self-report field;
- `prefer-not-to-say` is a real explicit choice, not a visual fallback for null;
- Next/Complete validates required explicit choices;
- validation copy identifies the missing decision without auto-filling it;
- Back/forward navigation preserves explicit choices;
- resumed drafts display only values actually stored as explicit choices.

## Coach boundary

Coach context must preserve missingness.

Examples:

```text
activityLevel: null
smoking: null
trainingLevel: null
```

must be treated as "not reported", never translated into sedentary/never/beginner.

The model must not be told a self-report value that exists only because the form had a convenient initial option.

## Future Agent boundary

Workout/Nutrition plan proposals must only use self-report fields that are explicitly present. Missing information can trigger a clarification or conservative proposal constraint, but not an invented user profile.

## Validation plan

Dedicated Stage 21 CI must prove:

1. empty v2 draft contains no pre-selected self-report answers;
2. UI does not render a valid answer as selected for null/unset fields;
3. required steps fail until explicit selection;
4. prefer-not-to-say remains distinct from unset;
5. parser rejects malformed/unknown enum values;
6. Coach context emits null/missing rather than old defaults;
7. hosted schema version and generated types remain synchronized;
8. complete Supabase app regression + TypeScript + Next production build remain green.

## Release rule

Preview only. Do not enable Coach plan-write proposals until Onboarding v2 self-report semantics are implemented and green.

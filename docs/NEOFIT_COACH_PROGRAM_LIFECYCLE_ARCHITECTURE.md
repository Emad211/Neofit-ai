# NeoFit Coach Program Lifecycle Architecture

Status: canonical product target for the active Preview cycle. This document supersedes the older assumption that Onboarding, AI settings, plan persistence and Coach are independent features.

## Product promise

A real NeoFit account follows one coherent lifecycle:

```text
Account + verified session
  -> Onboarding starts
  -> connect personal AI provider key
  -> complete explicit self-report / safety / preferences
  -> choose program duration
  -> NeoFit Coach generates coordinated Training + Nutrition program
  -> validated immutable plan versions become active
  -> user follows the program through Workout Player + Nutrition logging
  -> Coach remains available throughout the program
  -> requested changes become typed proposals
  -> user reviews an exact diff
  -> explicit confirmation creates a new immutable plan version for the remaining program
  -> history/provenance remains intact
```

The user experiences one main **NeoFit Coach**. Internally, specialized planner/tool modules may exist, but the product must not expose a confusing swarm of autonomous agents.

## AI credential gate inside Onboarding

For a real account program, AI configuration is part of Onboarding rather than a hidden Profile prerequisite.

Required product behavior:

- first real Onboarding stage checks whether a valid Google credential exists;
- if absent, the user enters the Google AI Studio key inside Onboarding;
- the existing encrypted BYOK vault and provider validation APIs are reused;
- the raw key is never written into the Onboarding JSON, localStorage, logs or analytics;
- Google is the primary required planner/Coach provider;
- AvalAI remains optional fallback and can be configured in the same step or later;
- `/profile/ai` remains the rotation/recovery/settings surface after Onboarding;
- Guest mode may remain a Demo, but cannot claim a real generated personal program without an authenticated account + usable AI provider.

## Onboarding v2 requirements

Onboarding must distinguish explicit self-report from product defaults.

`unset`, `explicitly selected`, and `technical default` are different states.

The program-generation contract must not treat untouched form defaults as user facts.

Onboarding must capture at minimum:

- primary/secondary goal;
- explicit body/profile data;
- medical restrictions and 73-region injury map;
- activity/sleep/stress/smoking only when explicitly reported;
- nutrition preferences/allergies/dislikes;
- training history;
- available equipment/location;
- training days and session duration;
- coaching style preferences;
- program start date;
- **program duration in days**;
- final consent to generate a coordinated program from the supplied data.

## Program Cycle — missing domain entity

Current Workout/Nutrition plan tables are useful versioned stores, but they are not yet a complete course/program lifecycle.

Add a user-owned `program_cycles` source of truth with a bounded state machine such as:

```text
draft -> generating -> ready -> active -> completed
                     \-> failed
active -> paused
active/paused -> completed
```

Minimum program-cycle metadata:

- id/user_id;
- title;
- requested duration days;
- start/end date;
- goal snapshot / Onboarding schema version;
- generation status;
- active Workout Plan version;
- active Nutrition Plan version;
- generated-at / activated-at / completed-at;
- revision number / source;
- no raw prompt, API key or private model payload.

Plan history stays immutable and user-owned under RLS.

## Current 14-day schema limitation

Workout Plan v1 and Nutrition Plan v1 both cap a document at 14 days. That is incompatible with the new product promise when the user chooses a longer course.

Do **not** simply raise the JSON array limit to 90 and ask one model call to emit a huge flat document.

Preferred v2 structure:

- program cycle defines the full requested duration;
- planner output defines bounded phases/blocks;
- each phase has explicit date/day ranges and progression intent;
- compact weekly/day templates are materialized deterministically into the requested course calendar;
- active detailed plan data remains versioned and bounded;
- edits affect future/uncompleted scope without mutating completed history.

This keeps requests/output size bounded and makes a 28/42/56/84-day program practical without one enormous AI response.

## Plan generation after Onboarding

Onboarding completion must no longer end with only a deterministic preview.

Target flow:

```text
validated Onboarding v2
  -> create program-cycle generation run (idempotent)
  -> build shared normalized user/safety/program contract
  -> Training Planner structured generation
  -> Nutrition Planner structured generation
  -> deterministic application validation
  -> safety validation
  -> Nutrition identity/version resolution through current catalog + Nutrition Core authority
  -> create Workout Plan version (source=onboarding/coach)
  -> create Nutrition Plan version (source=onboarding/coach)
  -> activate both atomically for the Program Cycle
  -> show final program overview
```

One user-facing Coach does not require one giant model response. Training and Nutrition planners should be bounded structured planning operations sharing the same normalized profile and program duration.

## Nutrition authority boundary

The product owner has explicitly deferred broad food-catalog expansion.

Therefore the active product contract is:

- generated Nutrition Plans may only persist food identities/source versions that the current authoritative catalog can resolve;
- plan JSON never persists AI-authored calories/macros as authority;
- Shared Nutrition Core remains the only arithmetic authority;
- requests outside current catalog coverage may be discussed by Coach, but cannot silently become authoritative persisted macro data.

This is an intentional product limitation until catalog expansion is explicitly reopened.

## Workout knowledge gap

The current Workout Plan schema accepts bounded exercise id/name/sets/reps/rest values, but NeoFit does not yet have a sufficiently rich authoritative exercise registry for professional substitutions.

Before Coach can safely replace individual exercises, introduce a typed exercise registry / movement contract containing at least:

- stable exercise id/name;
- movement pattern;
- primary/secondary muscle groups;
- equipment requirements;
- difficulty/skill level;
- contraindication tags;
- common injury/safety constraints;
- substitute/alternative relationships;
- optional trusted media/search hints.

AI may rank/select from validated candidates, but should not create arbitrary exercise identities that bypass safety/tool contracts.

## In-program Coach

The existing read-only Coach becomes the single ongoing user-facing assistant.

It should support domain-specific conversation without forcing the user to understand internal agent architecture.

Read tools already have useful foundations for:

- profile/Onboarding context;
- safety/injury context;
- current-day Nutrition logs;
- Workout sessions/sets;
- body progress;
- YouTube discovery/video analysis;
- provider/audit budgets.

The missing layer is safe program mutation.

## Required typed proposal tools

Every mutation follows:

```text
user request
 -> read current immutable program/plan context
 -> create typed proposal
 -> validate proposal
 -> present exact before/after diff + reason/safety impact
 -> explicit user confirmation
 -> create new immutable version
 -> activate new version for future scope
 -> audit change metadata
```

Initial tool families:

### Training

- propose exercise replacement;
- adjust future sets/reps/rest/load target;
- change training day/schedule;
- reduce/raise intensity for future sessions;
- respond to pain/RPE/equipment-loss by proposing safe alternatives;
- regenerate one future day/week/block;
- pause/extend program;
- never rewrite completed Workout Sessions/Sets.

### Nutrition

- replace a future meal/item with currently resolvable catalog identities;
- change portion counts/timing within deterministic Core constraints;
- regenerate one future day/week/block;
- adapt plan around allergies/dislikes/availability;
- never overwrite already logged diary history;
- never accept model-authored calorie/macro totals as persisted authority.

### Program / Coach

- explain the current plan and why it exists;
- summarize adherence/progress;
- propose a coordinated training+nutrition revision when goals/availability change;
- display plan diff before applying;
- keep all writes user-confirmed in the first production generation.

## Change/audit contract

Add a metadata-only program-change/proposal record so NeoFit can explain why a plan version changed without storing raw provider prompts/responses.

Suggested fields:

- proposal id/user/program id;
- domain/tool name;
- source plan ids/versions;
- target scope (date/day/block/exercise/meal);
- proposal status: proposed/confirmed/rejected/applied/expired;
- normalized reason code + bounded user-visible summary;
- resulting plan ids/versions after apply;
- timestamps;
- no raw AI key, raw prompt, full model response or hidden health text duplication.

## Idempotency and concurrency

- finishing Onboarding twice must not generate duplicate active cycles;
- plan generation requires an idempotent generation key;
- applying a proposal requires expected-source-version optimistic concurrency;
- stale proposals must fail if the active plan version changed after the proposal was created;
- only one active Program Cycle is allowed initially unless a future multi-program product explicitly changes this;
- completed historical sessions/diary entries remain immutable provenance.

## Safety contract

Medical/injury constraints are hard inputs to planner validation, not optional prompt decoration.

- physician restrictions override user/AI preference;
- current pain or severe injury can block unsafe exercise proposals;
- new/serious symptoms do not trigger autonomous medical plans;
- Workout substitutions must be validated against exercise constraints;
- Nutrition allergies must be hard-excluded from persisted plans;
- AI can explain/recommend but cannot bypass deterministic validators.

## Current closeness assessment

### Strong foundations already present

- Supabase Auth/RLS/session hardening;
- encrypted Google/AvalAI BYOK vault;
- Google-first provider router + fallback policy;
- 15-step Onboarding + Body Map persistence foundation;
- versioned immutable Workout Plan table/RPCs;
- versioned immutable Nutrition Plan table/RPCs;
- Workout session/set provenance;
- Nutrition Plan -> Core-backed diary logging provenance;
- read-only Coach with selective context;
- AI request audit/budget;
- YouTube read-only tool architecture;
- UI truth/accessibility baseline.

### Partially present but needs redesign/wiring

- AI settings exists but is outside Onboarding;
- Onboarding exists but self-report/default semantics need v2 and duration field;
- plan stores/RPCs exist but are flat max-14-day documents and not linked to a Program Cycle;
- Coach can read user state but cannot propose/apply plan versions;
- safety context is available but not yet a deterministic plan-generation/substitution validator;
- current Nutrition catalog can support only its existing bounded identities.

### Missing product-critical capabilities

- Program Cycle entity/lifecycle;
- post-Onboarding AI generation pipeline;
- structured Training Planner;
- structured Nutrition Planner;
- program-duration materialization/phases;
- exercise registry/substitution knowledge contract;
- typed proposal/diff/confirmation framework;
- Workout Plan mutation tools;
- Nutrition Plan mutation tools;
- stale-version concurrency protection for proposals;
- program change audit/provenance;
- ongoing adherence-driven coordinated adaptation;
- hosted E2E for the full lifecycle.

## Revised active roadmap

1. **Stage 21 — Onboarding v2 + AI credential gate + program-duration contract.**
2. **Stage 22 — Program Cycle schema/state machine + plan linkage/idempotent generation-run contract.**
3. **Stage 23 — Exercise registry + deterministic Workout safety/substitution validation.**
4. **Stage 24 — Structured post-Onboarding Training + Nutrition planners and exact plan validators/materializers.**
5. **Stage 25 — Program review/activation UX + one coordinated course overview.**
6. **Stage 26 — Typed Coach proposal/diff/confirmation layer (read current plan, no direct mutation).**
7. **Stage 27 — Confirmed Workout/Nutrition program-change tools creating immutable future versions.**
8. Deploy one latest green stacked Preview candidate and run Auth/provider/YouTube/program lifecycle E2E.
9. Only after real runtime proof, add more adaptive/autonomous behavior; silent autonomous plan mutation remains prohibited.

## Release boundary

Preview-only until the full lifecycle is proven with a real account:

```text
signup -> AI key -> onboarding v2 -> duration -> generate both plans -> activate -> log workout/meal -> ask Coach for change -> review diff -> confirm -> new version -> resume program
```

No unrestricted SQL is exposed to the model. No plan mutation is silently applied.
# NeoFit Coach Program Lifecycle Architecture

Status: **canonical product contract for the active Preview cycle**. Stage21 code + DB hardening are implemented and CI-green; rendered/runtime proof is still open. Stage22 is the next domain stage.

This document supersedes the older assumption that Onboarding, AI settings, plan persistence and Coach are independent features.

## Product promise

A real NeoFit account follows one coherent lifecycle:

```text
verified account
  -> Onboarding step 1: connect personal Google AI key
  -> optional AvalAI fallback
  -> explicit self-report / safety / preferences
  -> choose program start date + duration
  -> Program Cycle generation
  -> coordinated Training + Nutrition planners
  -> deterministic validation / safety / Nutrition authority checks
  -> immutable plan versions become active
  -> user follows Workout + Nutrition program
  -> one NeoFit Coach remains available throughout the course
  -> requested changes become typed proposals
  -> user reviews an exact before/after diff
  -> explicit confirmation creates a new immutable future plan version
  -> completed history/provenance remains intact
```

The user experiences **one NeoFit Coach**. Training, Nutrition, Safety, YouTube and future planner modules are internal capabilities of that Coach, not separate user-facing agents.

## Current execution status

### Stage21 — CODE + DB HARDENING GREEN / RENDERED RUNTIME PROOF OPEN

Current implementation provides a focused **13-step** Onboarding journey:

1. AI credential gate
2. goal
3. basics
4. optional body measurements
5. medical safety
6. injury/pain Body Map
7. lifestyle
8. nutrition preferences/restrictions
9. training history
10. availability/equipment
11. training/nutrition/Coach preferences
12. review + deterministic safety/readiness
13. start date + duration + generation consent

The older passive `analysis` and `result` pages were removed because they collected no new data. Their useful safety/capacity information now lives inside Review.

Stage21 also provides:

- Google AI Studio credential required for real account continuation;
- optional AvalAI fallback;
- existing AES-GCM BYOK vault/provider routes reused;
- raw provider key never enters Onboarding JSON or persistent Browser storage;
- `ONBOARDING_SCHEMA_VERSION = 2`;
- personal categorical/boolean values remain `null/unset` until explicit selection;
- conservative v1 migration preserves only unambiguous values;
- stable locale-independent weekday/equipment identifiers;
- explicit `bodyweight` equipment truth;
- 73-region Body Map with mobile front/back switching and non-precision list fallback;
- bounded fail-closed persisted-draft parser;
- debounced autosave for parse-valid edits;
- serialized autosave/Continue/Complete write queue;
- optimistic `updated_at` concurrency protection against multi-tab/device overwrite;
- final start date + 14–84 day duration + generation consent;
- server-verified `/onboarding/ready` handoff that does not pretend a program already exists.

Live DB hardening migration:

`20260810001227_harden_onboarding_v2_shape`

It enforces:

- persisted `draft.version == schema_version`;
- schema v2 `current_step` is limited to 1..13;
- the historical schema v1 row may remain at step 15.

The current Stage21 contract and mobile/backend audit live in:

- `docs/NEOFIT_STAGE21_ONBOARDING_SELF_REPORT_V2.md`
- `docs/NEOFIT_STAGE21_ONBOARDING_MOBILE_UX_BACKEND_AUDIT.md`

Rendered current-candidate 360/390/430px QA and real-account hosted proof remain required before Stage21 is release-proven.

### Stage22 — NEXT: Program Cycle

Workout/Nutrition plan tables are immutable plan stores; they do not yet represent a complete user course lifecycle.

Stage22 adds a user-owned `program_cycles` source of truth and idempotent generation-run boundary.

## AI credential contract

For a real account program, AI configuration is part of Onboarding rather than a hidden Profile prerequisite.

- Step 1 checks current Google credential metadata.
- Missing/inactive Google can be created through the official AI Studio path and saved/tested inside Onboarding.
- Provider validation is inference-free.
- Google remains primary.
- AvalAI remains optional fallback.
- `/profile/ai` remains the post-Onboarding rotation/recovery/settings surface.
- Guest remains explicit Demo and cannot claim a generated personal program.
- Historical duplicate `/onboarding/ai` routes are deleted.

Provider request policy remains request-efficient:

```text
normal request -> Google only
eligible Google failure -> AvalAI fallback
```

Do not add a hidden classifier inference or per-message health-check request merely to route the normal Coach path.

## Onboarding v2 normalized input contract

Core semantic rule:

```text
unset != explicit user value != technical default
```

Program code must never infer a personal fact from an untouched control or `null` value.

Onboarding currently captures:

- primary/secondary goal;
- explicit body/profile measurements;
- medical restrictions;
- 73-region injury/pain data;
- activity/sleep/stress/smoking when explicitly reported;
- nutrition preferences, allergies and dislikes;
- training history;
- stable equipment/location and optional custom equipment;
- stable preferred weekday ids;
- training days/session duration/time preference/schedule notes;
- training/nutrition/Coach preferences that are backed by the current product;
- program start date;
- requested duration;
- final generation consent.

Inactive notification/photo/imperial controls are not presented merely because compatibility fields still exist in the document shape.

### Stable availability ids

Planner logic must not depend on localized display strings.

Weekday ids:

` sat / sun / mon / tue / wed / thu / fri `

Equipment ids include:

`bodyweight`, `dumbbell`, `barbell`, `cable`, `bands`, `bench`, `full-gym`, `pull-up-bar`, `cardio-machine`.

Legacy Persian labels are mapped conservatively during v1 migration.

### Persisted-draft trust boundary

`user_onboarding.draft` is JSON storage, not trusted Planner input.

Stage22+ code must first use the Stage21 parser/normalizer. The parser bounds and verifies:

- section structure;
- completed-step range/uniqueness;
- goal ids/relationships;
- numeric ranges;
- text/list sizes and duplicate lists;
- exact InjuryArea key/face/bodyPart relationship;
- injury enums and maximum 73 unique regions;
- stable weekday/equipment ids;
- date/timestamp shape;
- requested duration.

Do not read raw draft fields directly inside generation/planning code.

## Onboarding persistence / concurrency contract

Health/self-report data must not silently lose newer edits.

### Autosave

- parse-valid current-step edits debounce and persist automatically;
- temporary invalid typing states remain in memory until structurally valid;
- Guest autosave is Browser-local only;
- account autosave uses the same serialized write queue as Continue/Complete;
- explicit Continue remains the action that validates and marks a step complete.

### Optimistic concurrency

Existing account writes require the exact `updated_at` revision that was loaded:

```text
user_id = current user
AND updated_at = expected revision
```

A stale tab/device write raises a conflict and stops progression instead of overwriting newer self-report.

Stage22 should carry this expected-version/idempotency discipline into Program Cycle generation and later proposal application.

## Ready / lifecycle handoff

For configured accounts, `/onboarding/ready` verifies server-side:

- live Auth user;
- Onboarding row status is completed;
- schema version is current;
- persisted draft passes the parser.

Invalid/incomplete/legacy state returns to Onboarding.

Ready shows only real stored summary values and says explicitly that a generated program does not exist yet.

The interactive Onboarding provider is scoped to `[step]` routes so Ready does not re-bootstrap the draft client-side.

## Program Cycle — Stage22 contract

Add one user-owned program lifecycle source of truth with bounded transitions and initially one active cycle per user.

Recommended states:

```text
draft -> generating -> ready -> active -> completed
                     \-> failed
active -> paused
paused -> active
active/paused -> completed
```

Minimum metadata:

- id / user_id;
- requested duration days;
- start date / derived end date;
- normalized Onboarding schema/version provenance;
- bounded normalized goal/safety snapshot reference or hash/provenance;
- generation status and idempotency key;
- active Workout Plan id/version;
- active Nutrition Plan id/version;
- revision number / source;
- generated_at / activated_at / paused_at / completed_at;
- created_at / updated_at;
- no raw prompt, provider key or private provider payload.

Stage22 must enforce RLS ownership, idempotent generation replay and stale-version protection.

## Course duration and bounded materialization

Workout Plan v1 and Nutrition Plan v1 each cap one detailed document at 14 days. Longer courses must not be solved by requesting one giant 60/90-day flat model response.

Preferred architecture:

- Program Cycle defines the requested full duration;
- planner output defines bounded phases/blocks;
- each phase has explicit date/day scope and progression intent;
- compact weekly/day templates are materialized deterministically;
- detailed active plan documents remain bounded/versioned;
- future revisions affect future/uncompleted scope only;
- completed sessions and diary history retain original provenance.

Stage21 accepts 14–84 days. Stage22 owns the domain model that makes longer durations practical.

## Exercise Registry / deterministic safety — Stage23

Before Coach can professionally replace individual exercises, NeoFit needs a typed registry containing at least:

- stable exercise id and display names;
- movement pattern;
- primary/secondary muscle groups;
- equipment requirements;
- difficulty/skill level;
- contraindication tags;
- injury/safety constraints;
- substitute/alternative relationships;
- optional trusted YouTube/search hints.

AI may rank/select validated candidates but cannot invent arbitrary persisted exercise identities that bypass registry/safety checks.

Medical/injury inputs are hard validator inputs, not prompt decoration.

- physician restrictions override preferences;
- current pain/severe injury can block unsafe exercises;
- serious/new symptoms do not trigger autonomous treatment plans;
- allergies are hard exclusions for persisted Nutrition Plans;
- AI cannot bypass deterministic validators.

## Structured post-Onboarding generation — Stage24

After Program Cycle + exercise safety contracts exist:

```text
validated/normalized Onboarding v2
  -> create/reuse idempotent Program Cycle generation run
  -> normalized shared user/safety/program contract
  -> structured Training Planner
  -> structured Nutrition Planner
  -> deterministic schema/business validation
  -> deterministic Workout safety validation
  -> Nutrition identity/source-version resolution
  -> Nutrition Core arithmetic authority
  -> create immutable Workout Plan version
  -> create immutable Nutrition Plan version
  -> coordinated review
  -> explicit activation
```

One user-facing Coach does not require one giant model response. Training and Nutrition planning should be bounded operations sharing the same normalized program contract.

## Nutrition authority boundary

Broad food-catalog expansion remains deferred by product decision.

Therefore:

- generated Nutrition Plans persist only currently resolvable catalog identities/source versions;
- plan documents never persist model-authored calories/macros as authority;
- Shared Nutrition Core remains the sole arithmetic authority;
- unresolved foods may be discussed but cannot silently become authoritative plan/diary nutrition values;
- logged diary history is never rewritten by Coach adaptation.

## In-program Coach

The existing read-only Coach already has foundations for:

- profile/Onboarding context;
- injury/safety context;
- current-day Nutrition logs;
- Workout sessions/sets;
- body progress;
- YouTube discovery/direct-video analysis;
- Google/AvalAI routing;
- AI/tool audit budgets.

The missing product-critical layer is safe program planning/mutation.

## Proposal / diff / confirmation contract

Every write-capable Coach action follows:

```text
user request
 -> read current immutable Program/Plan versions
 -> build typed proposal
 -> deterministic validation
 -> show exact before/after diff + reason + safety impact
 -> explicit user confirmation
 -> compare expected source versions
 -> create new immutable future version
 -> activate only valid future scope
 -> record metadata-only change audit
```

No silent mutation is permitted in the first production generation.

Initial training proposals may include future exercise replacement, sets/reps/rest/load targets, schedule/intensity changes, safe adaptations to pain/equipment loss and bounded future-block regeneration. Completed Workout Sessions/Sets are never rewritten.

Initial Nutrition proposals may replace future catalog-resolvable items, adjust portions/timing within Core contracts, regenerate bounded future scope and adapt around allergies/dislikes. Logged diary history is never overwritten and model-authored macro totals are never persisted as authority.

## Change/audit contract

Future proposal persistence should be metadata-focused:

- proposal id / user / program id;
- domain/tool name;
- expected source plan ids/versions;
- target future scope;
- status: proposed / confirmed / rejected / applied / expired;
- normalized reason code + bounded user-visible explanation;
- resulting plan ids/versions;
- timestamps;
- no raw API key, hidden prompt, full provider payload or duplicated sensitive health narrative.

## Idempotency and concurrency

- finishing Onboarding twice must not create duplicate active Program Cycles;
- generation uses an explicit idempotency key;
- initially only one active Program Cycle per user;
- proposal apply compares expected source versions;
- stale proposals fail if active plan versions changed;
- completed sessions/diary history remain immutable provenance.

## Current foundations vs missing work

### Strong/implemented foundations

- Auth/RLS/session hardening;
- scanner-safe email/recovery architecture;
- runtime recovery gate for stale/deleted Auth and Preview PWA state;
- encrypted Google/AvalAI BYOK vault;
- Google-first routing/fallback;
- **mobile-first Onboarding v2 AI gate + explicit self-report + stable Planner ids + autosave/concurrency + duration contract**;
- 73-region Body Map + accessible list fallback;
- versioned immutable Workout Plans;
- versioned immutable Nutrition Plans;
- Workout session/set provenance;
- Nutrition Plan -> Core-backed diary provenance;
- read-only Coach selective context;
- AI request audit/budget;
- YouTube read-only tool architecture;
- UI truth/accessibility baseline.

### Missing product-critical capabilities

- Program Cycle entity/state machine;
- idempotent generation-run lifecycle;
- exercise registry/substitution safety engine;
- structured Training Planner;
- structured Nutrition Planner;
- phase/block course materialization;
- coordinated Program review/activation;
- typed proposal/diff/confirmation framework;
- Workout/Nutrition future-version mutation tools;
- stale-version proposal concurrency protection;
- program change audit/provenance;
- adherence-driven coordinated adaptation;
- hosted E2E for the full lifecycle.

## Remaining Stage21 release-proof gaps

- rendered exact-current mobile QA at ~360/390/430px + desktop;
- real Google Save/Test inside mobile Onboarding;
- refresh proof for autosaved long-step edits;
- second-tab/device stale-revision proof;
- real 13-step completion and persisted stable ids;
- sign-out/in lifecycle resume;
- `/ready` rejection proof for incomplete/v1 state;
- field-addressable validation/inline error linking is the remaining interaction polish gap;
- minor-user policy (current minimum age 10) requires explicit product/legal decision before Production;
- international start-date boundary should use authenticated profile timezone rather than NeoFit default timezone.

## Active roadmap

1. **Stage21 — Onboarding v2 mobile/data hardening: CODE + DB GREEN; rendered/runtime proof open.**
2. **Stage22 — Program Cycle schema/state machine + plan linkage + idempotent generation-run contract.**
3. **Stage23 — Exercise Registry + deterministic Workout safety/substitution validation.**
4. **Stage24 — structured Training + Nutrition planners + validators/materializers.**
5. **Stage25 — coordinated Program review/activation UX.**
6. **Stage26 — typed Coach Proposal / exact Diff / Confirmation layer.**
7. **Stage27 — confirmed Workout/Nutrition future-version mutation tools.**
8. One latest green Preview deployment + Auth/provider/YouTube/program lifecycle E2E.
9. Only after runtime proof, increase adaptive/autonomous behavior; silent autonomous plan mutation remains prohibited.

## Release boundary

Preview-only until this real-account lifecycle is proven:

```text
signup
 -> Google key inside Onboarding
 -> explicit Onboarding v2
 -> course duration
 -> Program Cycle
 -> generate both plans
 -> review + activate
 -> log workout/meal
 -> ask Coach for a change
 -> review exact diff
 -> confirm
 -> new immutable future version
 -> resume program
```

No unrestricted SQL is exposed to the model. No plan mutation is silently applied. Production remains out of scope until runtime evidence is green.

# NeoFit Coach Program Lifecycle Architecture

Status: **canonical product contract for the active Preview cycle**. Stage21 code is implemented and CI-green; Stage22 is the next domain stage. This document supersedes the older assumption that Onboarding, AI settings, plan persistence and Coach are independent features.

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

The user experiences **one NeoFit Coach**. Training, Nutrition, Safety, YouTube and future planner modules are internal tools/capabilities of that Coach, not a confusing swarm of user-facing agents.

## Current execution status

### Stage21 — IMPLEMENTED / CI GREEN / RUNTIME PROOF OPEN

Current code now provides:

- exactly 15 public Onboarding steps;
- first step is the real AI credential gate;
- Google AI Studio key is required for account-mode continuation;
- AvalAI is available as optional fallback in the same step;
- existing AES-GCM BYOK vault/provider validation routes are reused;
- raw provider key never enters the Onboarding document or persistent Browser storage;
- `ONBOARDING_SCHEMA_VERSION = 2`;
- old personal categorical defaults are now `null/unset` until explicit user selection;
- conservative v1 compatibility preserves only unambiguous data and does not promote old defaults to self-report;
- 73-region injury Body Map remains intact;
- final step captures program start date, requested duration and generation consent;
- completion stops at `/onboarding/ready` instead of pretending a generated program already exists.

Validated implementation head: `7aac774147b66c8983daa4ef91265d3493dd8d5f`.

- Runtime Recovery Gate CI `31341835609`: success.
- Onboarding v2 Lifecycle CI `31341835614`: success.

Hosted/local account proof is still required before Stage21 is release-proven.

### Stage22 — NEXT: Program Cycle

Current Workout/Nutrition plan tables are useful immutable stores, but they do not yet represent the user's complete course lifecycle.

Stage22 adds a user-owned `program_cycles` source of truth and idempotent generation-run boundary.

## AI credential contract

For a real account program, AI configuration is part of Onboarding rather than a hidden Profile prerequisite.

- first real Onboarding step checks existing Google credential metadata;
- if missing/inactive, user enters a Google AI Studio key there;
- save/test uses existing authenticated provider routes and encrypted vault;
- Google is the primary required Planner/Coach provider;
- AvalAI remains optional fallback;
- `/profile/ai` remains the post-Onboarding rotation/recovery/settings surface;
- Guest mode may remain an explicit Demo but cannot claim a generated personal program.

Provider request policy remains request-efficient:

```text
normal request -> Google only
eligible Google failure -> AvalAI fallback
```

No per-message provider health check and no hidden classifier inference should be added merely to route the normal Coach path.

## Onboarding v2 data contract

Core semantic rule:

```text
unset != explicitly selected != technical default
```

Personal facts are not inferred from untouched UI controls.

Onboarding captures at minimum:

- primary/secondary goal;
- explicit body/profile data;
- medical restrictions and 73-region injury map;
- activity/sleep/stress/smoking only when explicitly reported;
- nutrition preferences/allergies/dislikes;
- training history;
- available equipment/location;
- training days/session duration;
- coaching preferences;
- program start date;
- requested program duration;
- final consent for coordinated Training + Nutrition generation.

Old v1 account/Guest drafts are handled conservatively. Ambiguous old categorical defaults are cleared and must be re-selected rather than guessed.

## Program Cycle — Stage22 contract

Add one user-owned program lifecycle source of truth with bounded state transitions, initially one active cycle per user.

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
- title;
- requested duration days;
- start date / derived end date;
- Onboarding schema/version snapshot reference or bounded normalized goal snapshot;
- generation status and idempotency key;
- active Workout Plan id/version;
- active Nutrition Plan id/version;
- revision number / source;
- generated_at / activated_at / paused_at / completed_at;
- created_at / updated_at;
- no raw prompt, provider key, hidden chain-of-thought or private provider payload.

Stage22 must enforce ownership with RLS and make generation replay/idempotency explicit.

## Course duration and bounded materialization

Workout Plan v1 and Nutrition Plan v1 each cap one detailed document at 14 days. The product must not solve longer courses by asking one model call for a huge 60/90-day flat JSON document.

Preferred architecture:

- Program Cycle defines full requested duration;
- planner output defines bounded phases/blocks;
- each phase has explicit date/day scope and progression intent;
- compact weekly/day templates are materialized deterministically;
- detailed active plan documents remain bounded/versioned;
- future revisions affect future/uncompleted scope only;
- completed sessions and diary history retain original provenance.

Stage21 currently accepts a bounded 14–84-day course contract. Stage22 owns the domain model that makes those longer durations practical.

## Post-Onboarding generation — Stage24 target

After Program Cycle + exercise safety contracts exist:

```text
validated Onboarding v2
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

Broad food-catalog expansion is explicitly deferred by product decision.

Therefore:

- generated Nutrition Plans may persist only currently resolvable catalog food identities/source versions;
- plan documents never persist model-authored calories/macros as authority;
- Shared Nutrition Core remains the sole arithmetic authority;
- unresolved foods may be discussed, but cannot silently become authoritative diary/plan nutrition values;
- already logged diary history is never rewritten by Coach adaptation.

## Exercise Registry / Safety — Stage23

Before Coach can professionally replace individual exercises, NeoFit needs a typed exercise registry containing at least:

- stable exercise id and display names;
- movement pattern;
- primary/secondary muscle groups;
- equipment requirements;
- difficulty/skill level;
- contraindication tags;
- injury/safety constraints;
- substitute/alternative relationships;
- optional trusted YouTube/search hints.

AI may rank/select validated candidates but cannot invent arbitrary persisted exercise identities that bypass the registry or safety checks.

Medical/injury constraints are hard validator inputs, not prompt decoration.

- physician restrictions override user/AI preference;
- current pain/severe injury can block unsafe proposals;
- new or serious symptoms do not trigger autonomous medical treatment plans;
- allergies are hard exclusions for persisted Nutrition Plans;
- AI cannot bypass deterministic validators.

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

### Initial Training tool family

- replace one future exercise;
- change future sets/reps/rest/load target;
- change future training day/schedule;
- reduce/raise future intensity;
- respond to pain/RPE/equipment loss with validated alternatives;
- regenerate one future day/week/block;
- pause/extend a Program Cycle;
- never rewrite completed Workout Sessions/Sets.

### Initial Nutrition tool family

- replace a future meal/item with current authoritative catalog identities;
- adjust future portion counts/timing within Core contracts;
- regenerate one future day/week/block;
- adapt around allergies/dislikes/availability;
- never overwrite logged diary history;
- never accept model-authored macro totals as persisted authority.

### Program-level tools

- explain the current program and rationale;
- summarize adherence/progress;
- propose coordinated Training + Nutrition revisions when goals/availability change;
- show exact scope and diff before apply.

## Change/audit contract

Future proposal persistence should be metadata-focused:

- proposal id / user / program id;
- domain/tool name;
- expected source plan ids/versions;
- target scope (date/day/block/exercise/meal);
- status: proposed / confirmed / rejected / applied / expired;
- normalized reason code + bounded user-visible explanation;
- resulting plan ids/versions;
- timestamps;
- no raw API key, hidden prompt, full provider payload or duplicated sensitive health narrative.

## Idempotency and concurrency

- finishing Onboarding twice must not create duplicate active Program Cycles;
- generation must use an idempotency key;
- only one initial active Program Cycle per user;
- proposal apply must compare expected source versions;
- stale proposals fail if current plan versions changed;
- completed historical sessions/diary entries remain immutable provenance.

## Current foundations vs missing work

### Strong/implemented foundations

- Auth/RLS/session hardening;
- scanner-safe email/recovery architecture;
- runtime recovery gate for stale/deleted Auth and Preview PWA state;
- encrypted Google/AvalAI BYOK vault;
- Google-first provider routing/fallback policy;
- **Onboarding v2 AI gate + explicit self-report + duration contract**;
- 73-region Body Map;
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

## Active roadmap

1. **Stage21 — Onboarding v2 + AI credential gate + program duration: CODE GREEN; runtime proof open.**
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

No unrestricted SQL is exposed to the model. No plan mutation is silently applied. Production remains out of scope until the runtime evidence is green.

# NeoFit Stage 21 — Mobile-first Onboarding v2 + AI Gate + Program Contract

Status: implementation active on `stage21/onboarding-self-report-v2`; Preview-only.

Stage21 is the first executable slice of the revised NeoFit Coach lifecycle. It now covers the product journey, mobile interaction contract and persistence integrity needed before Program Cycle/Planner work. It deliberately does not generate a fake plan.

## Current user journey

The public journey is intentionally **13 focused steps**, not the earlier 15-click flow:

```text
1  Coach / resilient AI credential gate
2  Goal
3  Basics
4  Optional body measurements
5  Medical safety
6  Injury / pain Body Map
7  Lifestyle
8  Nutrition preferences / restrictions
9  Training history
10 Availability / stable equipment + weekday ids
11 Training / nutrition / Coach preferences
12 Review + deterministic safety/data-readiness summary
13 Start date + program duration + generation consent
   -> /onboarding/ready truthful handoff
```

The old `analysis` and `result` pages were removed because they collected no new input and only added mobile taps. Their useful content now lives inside Review.

## Mobile UX contract

The interaction layer is designed around thumb use and interruption/resume rather than desktop form density.

Implemented:

- 48px+ form/control hit targets and 16px input text;
- safe-area-aware sticky Back/Continue footer;
- compact sticky progress indicator;
- explicit selected state on choice cards;
- optional fields labeled rather than silently required;
- validation summary receives focus and scrolls into view;
- Review cards have direct Edit links;
- long preference sets are grouped by task/domain;
- AI key setup uses AvalAI as the required resilience credential and Google as optional primary;
- no clipboard permission or Browser secret persistence;
- Body Map shows one large front/back view at a time on mobile;
- selected injury details collapse into accordions;
- Body Map has a native front/back list fallback so tiny SVG regions are not a precision-tap requirement;
- reduced-motion rules are preserved.

Rendered-device QA is still required on the next current Preview deployment. Source/CI review is not treated as screenshot proof.

## AI credential gate

Step 1 owns the prerequisite but not secret persistence.

Policy:

```text
AvalAI active only     -> may advance; runtime can use AvalAI directly
Google active only     -> may not advance; required resilience credential is missing
Google + AvalAI active -> may advance; normal routing remains Google -> AvalAI fallback
Guest                   -> explicit Demo boundary, no personal AI credential
```

Additional boundaries:

- AvalAI is the required resilience credential for a real-account Onboarding completion;
- Google is optional primary rather than an Onboarding blocker;
- Google-specific capabilities such as the current YouTube-video path may still require Google when that capability is invoked;
- `/api/ai/providers/*` + existing AES-GCM vault are reused;
- validation is inference-free;
- raw key exists only in temporary component state and is cleared after Save;
- raw key never enters `OnboardingDraft`, persistent Browser storage, logs or analytics;
- `/profile/ai` remains rotation/recovery management;
- historical `/onboarding/ai` and `/onboarding/ai/continue` duplicate routes were deleted.

## Local/Preview runtime cache boundary

PWA behavior must not make QA nondeterministic.

Observed during live local QA: React reported a hydration mismatch where Server HTML still contained the previous Google-required copy while the Client bundle contained the new AvalAI-sufficient copy.

Root cause was a stale non-production Service Worker path:

- localhost is a secure context;
- the old registrar installed `/sw.js` in development;
- the worker used cache-first handling for `/_next/static/`;
- changing commits/HMR could therefore combine stale client chunks with fresh server output.

Current contract:

- Service Worker registration is **production-only**;
- Development and Preview unregister prior workers and clear NeoFit app-shell caches;
- the worker itself detects `localhost`, `127.0.0.1` and `::1`, does not intercept fetches, clears NeoFit caches and unregisters itself;
- Runtime Recovery CI gates this behavior;
- after switching implementation commits during local QA, the dev process should be restarted and `.next` removed before the next proof pass.

## Self-report semantics

`ONBOARDING_SCHEMA_VERSION = 2`.

Core rule:

```text
unset != explicit value != technical/UI default
```

Personal categorical/boolean answers remain `null` until the user acts. This includes medical booleans, injury/pain state, activity/sleep/stress/smoking, nutrition configuration, training level, availability and Coach preferences.

Technical values that are not user claims may remain deterministic. Current body inputs are canonical metric `kg/cm`; the old UI-only imperial selector was removed until a real conversion contract exists.

Future-only settings are not asked merely because a field exists in the legacy JSON shape:

- notification/reminder delivery toggles are not shown until persistence + delivery exist;
- progress-photo opt-in is not shown until private media storage/consent/deletion exists;
- reminder-level remains a compatibility field but is not required by v2 UI validation.

## Planner-ready availability identifiers

User-facing Persian labels are not persisted as Planner identifiers.

Stable v2 ids include:

- weekdays: `sat/sun/mon/tue/wed/thu/fri`;
- equipment: `bodyweight`, `dumbbell`, `barbell`, `cable`, `bands`, `bench`, `full-gym`, `pull-up-bar`, `cardio-machine`.

`bodyweight` is an explicit choice rather than interpreting an empty equipment array as “no equipment”. Optional free-text equipment remains bounded separately.

The legacy v1 row is migrated from its real Persian values (for example `سه‌شنبه`, `دمبل`, `دستگاه‌های باشگاه`) into these stable ids.

## Draft parser / integrity contract

`parseOnboardingDraft()` now fails closed on malformed persisted data rather than checking only that sections are objects.

It validates/bounds:

- completed-step uniqueness/range;
- goal ids and primary-vs-secondary conflict;
- numeric ranges;
- bounded text/list counts;
- unique list entries;
- exact InjuryArea key/face/bodyPart relationship;
- InjuryArea enums/text limits;
- maximum 73 unique Body Map areas;
- stable weekday/equipment ids;
- date/timestamp shape;
- program duration.

Later Program Cycle/Planner code must consume the parsed/normalized contract, never raw JSON from `user_onboarding.draft`.

## Persistence / interruption safety

Account writes are no longer silent whole-row last-write-wins upserts.

### Optimistic concurrency

Every update carries the exact `updated_at` revision that the client loaded. Existing-row writes use:

```text
user_id == current user
AND updated_at == expected revision
```

If another tab/device already wrote a newer revision, NeoFit raises `OnboardingConflictError`, stops further progression and asks for reload rather than overwriting newer health/self-report data.

### Serialized autosave

Valid edited drafts are debounced and automatically persisted during the current step.

- autosave delay is bounded;
- account writes share one serialized queue with explicit Continue/Complete writes;
- temporary invalid typing states are not persisted until `parseOnboardingDraft()` accepts them;
- Guest autosave remains local to that browser;
- explicit Continue still validates the current step and marks completion;
- Complete waits behind any in-flight autosave and then writes the completed revision.

This closes the prior mobile failure mode where closing the browser before pressing Continue lost all edits on a long Medical/Injury step.

## Safe v1 compatibility

Live inspection currently shows one hosted `user_onboarding` row at `schema_version=1,status=completed,current_step=15` and no v2 row at the migration-time inspection boundary.

Stage21 does not delete or silently trust that row.

The v1 -> v2 path:

- preserves unambiguous typed/text/body/list values;
- maps known weekday/equipment labels to stable ids;
- resets ambiguous old categorical/boolean defaults to `null`;
- clears old completion/consent and completed steps;
- requires explicit v2 re-review;
- rewrites as v2 only after an actual edit/save under the new contract.

Guest v1 storage follows the same conservative migration rule.

## Program contract

Final step captures only inputs that exist as real product truth:

- start date (not before NeoFit’s current local date boundary);
- `programDurationDays` bounded 14–84;
- explicit consent for coordinated Training + Nutrition generation.

It does not ask for inactive notification/media features.

`/onboarding/ready` is now server-verified for configured accounts:

- live Auth user required;
- row status must be `completed`;
- schema version must equal current v2;
- draft must pass `parseOnboardingDraft()`;
- otherwise redirect back to Onboarding.

The Ready UI shows only real stored summary values and does not expose internal Stage numbers or claim plans already exist. The interactive `OnboardingProvider` is scoped only to `[step]` routes so Ready does not trigger a duplicate client-side draft read.

## Database boundary

Current live table remains owner-RLS protected:

- `anon` has no table SELECT;
- authenticated users have explicit table privileges but all row access is owner-scoped by RLS;
- UPDATE has SELECT + `USING` + `WITH CHECK` ownership coverage.

Hardening migration `20260810001227_harden_onboarding_v2_shape` additionally requires `draft.version == schema_version` and constrains schema-v2 rows to `current_step 1..13`, while preserving historical schema-v1 step 15.

## Nutrition authority

No calorie/macro target formula is added to Onboarding.

Shared Nutrition Core remains the only arithmetic authority. Later planners must persist resolvable food identities/source versions and may not promote model-authored calorie/macro totals to authority.

## CI contract

`Onboarding v2 Lifecycle CI` and `Runtime Recovery Gate CI` are expected to prove at minimum:

1. focused 13-step journey and no passive analysis/result routes;
2. resilient Step 1 AI gate: AvalAI-only pass, Google-only block, both pass;
3. no preselected personal self-report;
4. conservative v1 migration + stable availability ids;
5. exact 73-region Body Map plus mobile/list fallback contract;
6. bounded parser rejects malformed health/availability data;
7. required steps reject unset choices and missing equipment truth;
8. raw AI key stays outside Onboarding model/storage;
9. duplicate AI onboarding route stays deleted;
10. autosave + serialized writes + optimistic concurrency remain present;
11. Review owns safety readiness and final screen only asks real course inputs;
12. Ready is server-verified and user-facing rather than internal-stage copy;
13. Development/Preview do not retain a Service Worker/app-shell cache capable of mixing stale Next chunks;
14. full Supabase app regression, AI provider regression, TypeScript and Next production build remain green.

Latest implementation proof for the hydration/PWA hardening is commit `72086965f0cca87cf3a30366a99e2e1997ca8c78`:

- Onboarding v2 Lifecycle CI `31370699423`: SUCCESS;
- Runtime Recovery Gate CI `31370699417`: SUCCESS.

## Runtime proof still required

After latest code CI is green:

- pull/restart local Stage21 from a clean `.next`;
- verify old localhost Service Worker/app-shell state is removed;
- verify mobile widths ~360/390/430px and desktop from rendered output;
- real AI gate matrix: AvalAI-only advances, Google-only blocks, both advance;
- interrupt a long step before Continue and verify autosave survives refresh;
- open a second tab/device and verify stale revision is blocked rather than overwriting;
- complete all 13 steps and verify v2 stable equipment/weekday ids in the hosted row;
- verify start date/duration persist;
- sign out/in and confirm root returns to the correct lifecycle state;
- confirm `/ready` rejects an incomplete/v1 row;
- run one latest stacked Preview deployment when quota permits and repeat mailbox/session/runtime proof.

## Next domain stage

Stage22 follow-up is now implemented locally: `program_cycles` source of truth + state machine + idempotent ensure/transition boundary + linkage to versioned Workout/Nutrition plans. Supabase/Preview runtime proof remains open.

Stage22 must consume parsed v2 and must not assume a Google credential exists merely because Onboarding completed.

No autonomous write agent is enabled by Stage21.

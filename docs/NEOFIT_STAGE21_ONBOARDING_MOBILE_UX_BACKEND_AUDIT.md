# NeoFit Stage21 — Onboarding Mobile UX + Backend Audit

Status: canonical audit for the current Stage21 slice. Preview-only.

## Scope

This audit reviews Onboarding as one lifecycle rather than a collection of pages:

```text
mobile interaction
+ logical question order
+ interruption/resume
+ self-report truth
+ AI credential prerequisite
+ database ownership/concurrency
+ Planner-ready identifiers
+ truthful completion handoff
```

Rendered-device QA remains separate: current source/CI proof does not substitute for 360/390/430px screenshots from the exact deployed candidate.

## External interaction patterns used

The implementation borrows interaction principles rather than importing a second design system:

- Apple HIG: keep onboarding focused, minimize data-entry friction and explain why data is collected;
- GOV.UK Design System: focused question pages, reliable Back behavior, Check Answers with direct Change/Edit links, and focusable error summary;
- Typeform: one focused question/context at a time instead of one giant mobile form;
- shadcn/ui: clear choice-card/radio selected states, progress semantics and responsive mobile-sheet patterns.

NeoFit keeps its existing React/CSS stack. No Radix/Tailwind/shadcn dependency was introduced solely for Onboarding.

## Problems found and resolved

### 1. Mobile Body Map was desktop-shaped

Problem:

- front/back bodies were side-by-side;
- 73 SVG regions made small joints precision-tap dependent;
- each selected injury expanded into a long always-open form.

Resolution:

- segmented front/back face switch;
- one enlarged body at a time on mobile;
- selected counts per face;
- injury detail cards are collapsible;
- keyboard/ARIA pressed state preserved;
- alternative native region list grouped by front/back means SVG precision is never the only input path.

### 2. Touch targets / sticky controls were weak

Resolution:

- 48px+ interactive controls;
- 16px input font size;
- safe-area-aware sticky footer;
- sticky compact progress;
- visible selected indicator on choice cards;
- reduced-motion support.

### 3. AI key prerequisite forced context switching without guidance

Resolution:

- direct official Google AI Studio key entry from step 1;
- mobile-friendly secret field with show/hide;
- key clears after successful Save;
- optional AvalAI help is separate;
- no clipboard permission;
- raw keys remain ephemeral component state and never enter Onboarding JSON/browser persistence/logging.

### 4. Duplicate AI Onboarding existed

Problem:

- old `/onboarding/ai` + `/onboarding/ai/continue` remained directly addressable after the real gate moved to `/onboarding/welcome`.

Resolution:

- duplicate routes deleted;
- step 1 is the only Onboarding AI truth;
- `/profile/ai` remains the post-Onboarding management surface.

### 5. Journey contained passive click-through pages

Problem:

- old steps 13/14 only displayed deterministic analysis/preview and collected no data.

Resolution:

- public flow reduced from 15 to 13 focused steps;
- safety/readiness content moved into Review;
- final step is only real program start/duration/consent.

No required self-report field was removed by shortening the journey.

### 6. Review was not actionable enough

Resolution:

- Review cards include direct Edit links;
- safety cautions are shown in Review;
- training capacity + Nutrition authority boundary are shown before consent;
- error summary receives focus and scrolls into view.

Remaining improvement: migrate string-only validation to field-addressable errors so the summary can deep-link/focus each invalid control and render matching inline error text.

### 7. UI exposed future-only controls

Removed from active Onboarding UX until real backend capability exists:

- notification/reminder delivery choices;
- progress-photo opt-in;
- imperial selector without a real conversion contract.

Compatibility fields remain in schema v2 where necessary but are not presented as functioning product settings.

### 8. Availability data was localized display text

Problem:

- Persian weekday/equipment labels were persisted directly, making localization and Planner rules brittle;
- empty equipment could ambiguously mean bodyweight/no answer.

Resolution:

- stable weekday ids: `sat..fri`;
- stable equipment ids such as `bodyweight`, `dumbbell`, `full-gym`;
- explicit `bodyweight` choice;
- legacy Persian values are mapped during v1 migration;
- free-text custom equipment remains bounded separately;
- schedule/shift notes are now captured.

## Persistence / backend audit

### RLS / privileges

Live Supabase verification:

- `user_onboarding` RLS enabled;
- `anon` cannot SELECT the table;
- authenticated table privileges are combined with owner-scoped RLS;
- UPDATE is protected by own-row `USING` + `WITH CHECK` and SELECT ownership.

### Optimistic concurrency

Old behavior used whole-row upsert semantics and could silently overwrite newer edits from another tab/device.

Current behavior:

- client stores the exact DB `updated_at` revision it loaded;
- existing writes require `user_id + expected updated_at`;
- missing match raises `OnboardingConflictError`;
- the UI stops progression and asks for reload instead of silently deleting newer health/self-report data.

### Serialized autosave

Mobile interruption gap is closed for parse-valid drafts:

- edit changes debounce for 650ms;
- autosave/Continue/Complete share one serialized write queue;
- temporary invalid typing states are not persisted;
- Guest remains local-browser only;
- completed-step semantics still happen only through explicit Continue;
- completion waits behind any in-flight autosave.

### Parser / shape hardening

Persisted drafts are not trusted because they are JSON.

Parser now validates:

- section structure;
- bounded numbers/text/list counts;
- enum values;
- unique lists;
- exact injury key/face/bodyPart relationship;
- maximum 73 unique injuries;
- stable availability ids;
- completed-step range/uniqueness;
- timestamp/date shape;
- program duration.

Program Cycle and planners must only consume parsed/normalized drafts.

### Live DB hardening migration

Applied and tracked migration:

`20260810001227_harden_onboarding_v2_shape`

New constraints:

- `draft.version` must equal row `schema_version`;
- schema v2 rows may only use `current_step 1..13`;
- the existing schema v1 row may remain at historical step 15.

The live legacy row still passes constraints and no v2 row existed at the time of migration.

### Completion handoff

`/onboarding/ready` now verifies on the server for configured accounts:

- live Auth user;
- completed status;
- current schema version;
- parse-valid draft.

Invalid/incomplete/legacy state is redirected to Onboarding. The page shows stored summary values and does not reveal internal Stage numbers or claim generated plans already exist.

The client `OnboardingProvider` is scoped to `[step]`, so Ready does not cause an extra client Auth/draft bootstrap read.

## Remaining gaps before declaring rendered Onboarding complete

### P1 — rendered mobile evidence

Need exact-current candidate screenshots/interactions at approximately:

- 360px;
- 390px;
- 430px;
- desktop reference.

Check keyboard opening, long Persian text, sticky footer, scroll/focus, Body Map, list fallback, Review and Ready.

### P1 — field-addressable validation

Current focused error summary is better but validation returns strings. Next UX polish should return stable field ids/error codes so:

- summary links to fields;
- fields receive `aria-invalid`/`aria-describedby`;
- inline message matches summary;
- first invalid field receives focus after summary navigation.

### P1 — age/minor product policy

Current model allows age 10+. This is not silently changed in UX work because it is a product/legal/safety policy decision, not a styling decision. Before Production, define whether NeoFit supports minors and what consent/data rules apply.

### P2 — schema compatibility fields

Legacy compatibility means v2 still carries fields not used by the current UI (for example inactive reminder booleans/reminderLevel/photo opt-in). A future schema version can remove them once backward-compatibility strategy is established.

### P2 — account timezone in start-date UX

Current NeoFit local-date helper uses the application default timezone (`Asia/Tehran`) unless a profile timezone is supplied elsewhere. Before international Production, Onboarding start-date validation should explicitly use the authenticated profile timezone instead of relying on the NeoFit default.

## Backend readiness for Stage22

Stage21 is ready to hand off to Program Cycle when current CI + runtime proof are green because Stage22 can depend on:

- one parsed v2 self-report contract;
- stable equipment/weekday ids;
- explicit duration/start date;
- hard safety inputs;
- explicit generation consent;
- owner-RLS draft storage;
- concurrency-safe revision semantics;
- no AI secret inside the program input;
- no Nutrition arithmetic claims inside Onboarding.

What Stage22 must not do:

- read raw unparsed `draft` JSON;
- infer missing equipment from an empty array;
- treat nullable values as negative/false answers;
- mutate completed historical data;
- create a generated-course claim before both planners/validators succeed.

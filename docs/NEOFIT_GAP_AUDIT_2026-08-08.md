# NeoFit Gap Audit — current Preview cycle

Status: canonical **current** backlog. Detailed implementation/incident history lives in Stage documents; this file tracks only what remains materially incomplete.

## Severity

- **P0** — identity/privacy/data-integrity/runtime blocker
- **P1** — core product/data truth incomplete or important request/cost gap
- **P2** — required pre-Production hardening/completeness
- **P3** — visual/accessibility/interaction polish

---

## Product decisions / explicit non-goals

### Food catalog expansion — DEFERRED BY PRODUCT DECISION

Authoritative/versioned food-catalog expansion is **not part of the active roadmap**. Do not schedule IFKB/FNDDS/SR coverage expansion unless the product owner explicitly reopens it.

Existing Nutrition safety rules remain unchanged:

- current catalog identities remain versioned;
- Shared Nutrition Core remains the sole arithmetic authority;
- AI-generated calorie/macro claims remain prohibited as persisted authority.

This decision removes only catalog **expansion** from the roadmap; it does not weaken the existing Nutrition Core/provenance contracts.

---

## P0 — hosted runtime proofs

### Latest Preview stack — OPEN

Do not create another Vercel project or Production deployment. Keep using GitHub CI + Next production builds, then deploy one latest stacked green candidate to the existing Preview Lab.

Current Stage21 code head passed both:

- Runtime Recovery Gate CI `31341835609`;
- Onboarding v2 Lifecycle CI `31341835614`.

The public/stable Preview still needs one exact-current-stack deployment before browser evidence can replace the old Stage12 incident evidence.

### Auth mailbox/session E2E — OPEN

Need latest-Preview proof for:

- signup → scanner-safe confirmation → session → Onboarding v2 AI gate;
- password recovery;
- Password Changed delivery;
- Secure Email Change with old/new mailbox;
- two-browser revoke-other-sessions.

Current local-signup incident is understood: Supabase Auth logs recorded a Gmail SMTP `535 BadCredentials` failure during the failed attempt, while later signup/verify events succeeded after SMTP credentials were corrected. Do not misclassify the earlier mail failure as a Next/Auth routing failure.

Hosted controls already configured: minimum password 12, current-password enforcement, Secure Email Change, OTP 3600, Preview SMTP and NeoFit TokenHash templates. Secure Password Change remains OFF until exact reauthentication nonce UX exists. Leaked-password protection remains plan-gated on current Free Supabase.

---

## P1 — user/data truth

### Stage21 Onboarding v2 + AI credential gate — CODE GREEN; HOSTED E2E OPEN

Stage21 is now implemented rather than design-only.

Current contract:

- `ONBOARDING_SCHEMA_VERSION = 2`;
- public Onboarding remains exactly 15 steps;
- step 1 is the real Coach/AI credential gate;
- account mode requires a validated active Google AI Studio credential before advancing;
- AvalAI is optional fallback in the same gate;
- raw keys use the existing encrypted BYOK vault and never enter the Onboarding document or persistent Browser storage;
- old `/onboarding/ai` half-route is removed; the real gate is `/onboarding/welcome`;
- personal categorical/boolean self-report is `null` until explicitly selected;
- required steps refuse to advance while required choices remain unset;
- program start date + duration contract are captured before completion;
- duration is currently bounded to 14–84 days pending Stage22 Program Cycle materialization;
- completion routes to `/onboarding/ready`, which deliberately refuses to claim that an AI course has already been generated.

A live pre-v2 audit found one `user_onboarding` row at schema v1/completed. Stage21 does not delete it and does not trust ambiguous old defaults. Conservative compatibility preserves only unambiguous typed/text/body/list data, resets ambiguous categorical self-report, clears old completion and rewrites schema v2 only when the user saves through the new flow.

Remaining proof:

- real account enters step 1 and saves/tests Google key;
- optional AvalAI save/test;
- refresh/resume retains credential metadata without raw key return;
- complete all 15 v2 steps with explicit choices;
- selected start date/duration persist;
- hosted row becomes schema v2 through actual user saves;
- sign-out/in returns to the correct lifecycle state.

### Program Cycle — MISSING / NEXT DOMAIN STAGE

The current versioned Workout/Nutrition plan stores are not yet a complete course lifecycle. Stage22 must add user-owned `program_cycles` with bounded state transitions, requested course duration, start/end dates, generation state, active plan linkage, revision/provenance and idempotent generation-run semantics.

Do not solve this by expanding a flat plan JSON to dozens of days. Program Cycle should materialize bounded phases/blocks into the requested duration.

### Exercise Registry + substitution safety — MISSING / STAGE23

Current workout plan documents can persist exercises, but a professional authoritative registry for movement pattern, muscles, equipment, difficulty, contraindications and validated substitutes is still missing. Coach must not invent arbitrary exercise identities for write flows.

### Structured post-Onboarding planners — MISSING / STAGE24

Need bounded structured Training Planner + Nutrition Planner sharing one normalized profile/safety/program contract, deterministic validation, Nutrition identity/source-version resolution and fail-closed persistence.

### Program review/activation — MISSING / STAGE25

Need one coordinated user-facing course review before activating generated Workout + Nutrition plan versions under a Program Cycle.

### Coach proposal/diff/confirmation — MISSING / STAGE26

Need typed proposals that show exact before/after scope and reason before any plan mutation. Stale-source-version proposals must fail.

### Confirmed plan mutation tools — MISSING / STAGE27

Need user-confirmed tools for future-only Workout/Nutrition changes that create immutable new versions. Completed workout sessions and logged diary history must never be rewritten.

### Progress — CODE REAL; HOSTED QA OPEN

`body_measurements` replaces synthetic account progress. Stage 20 fixed metric/date mismatch so weight, waist and body-fat dates now come from their own source rows. Need real-account add/refresh/history proof.

### Workout Plan — STAGE16 GREEN; HOSTED E2E OPEN

Versioned immutable account plan, Player provenance, activation guard and Guest Demo boundary are implemented. Stage 20 removed the unsupported `بعدی` inference because no schedule/history source proves next-session order.

### Nutrition Plan — STAGE17 GREEN; HOSTED E2E OPEN

Versioned plan stores only catalog identity/version + portion count. Stored nutrition claims are rejected; source-version mismatch fails closed; Guest Demo-only. Need real activation/resolution proof.

### Nutrition Plan → diary — STAGE18 GREEN; HOSTED E2E OPEN

User-initiated logging is Core-backed, idempotent, bulk-written and owner/version provenance-bound. Stage 20 additionally fixes Nutrition state safety:

- visible diary is current-local-date scoped;
- account reset deletes only the current local date, not the user's entire history;
- Guest reset preserves other dates;
- local date refreshes while an open browser crosses midnight/focus;
- manual mutation ids are UUID-backed.

Need real runtime log → repeat click → unchanged row count → Today/Nutrition totals exactly once.

---

## P1 — AI / agent runtime

### Google BYOK — CODE READY + ONBOARDING GATE WIRED; HOSTED PROOF OPEN

Default Google model remains `gemini-3.5-flash-lite`. Need real Save/Test from the Onboarding gate plus a Coach/model request on the latest runtime.

### AvalAI fallback — CODE READY + ONBOARDING OPTIONAL WIRED; HOSTED CONTROLLED PROOF OPEN

Need deliberate fallback-eligible Google failure followed by AvalAI success.

### AI request audit/budget — STAGE15 GREEN; HOSTED PROOF OPEN

Need real success/fallback audit rows.

### YouTube Agent Tool — STAGE19 GREEN; HOSTED E2E OPEN

Current contract:

- separate encrypted YouTube Data API v3 key;
- normal Coach turn makes zero YouTube calls;
- direct public URL uses Google video input with zero Data API search calls;
- explicit search uses local intent → atomic tool budget → one search + one batched metadata call → one LLM request;
- no transcript scraper/caption workaround/automatic iframe;
- no fake AvalAI video fallback;
- metadata-only tool audit with SHA-256 query fingerprint;
- search budget 3/minute and 30/24h per user;
- live DB QA proved attempts 1–3 allowed, 4 denied and zero QA rows persisted.

Need real restricted YouTube key + cards/audit/direct-video/cooldown proof after deployment.

### Agent write capability — DELIBERATELY NOT ACTIVE

The write evolution is explicitly Stage26/27: typed proposal → deterministic validation → visible diff → explicit confirmation → immutable future plan version. No silent mutation and no unrestricted SQL.

---

## P1 — request/performance

### History pagination — OPEN

Nutrition history, Workout history, AI audit history and tool-audit history need cursor/range pagination before large datasets.

### Route data waterfalls — CONTINUE AUDIT

Keep route-specific sources. Remove avoidable serial reads with request reuse/Promise.all when safe, but do not rebuild one giant account snapshot.

### Current expensive paths — BOUNDED

- root lifecycle: one live Auth validation + Google credential/Onboarding reads in parallel;
- Onboarding step save: one account row upsert per explicit step transition, no keystroke autosave;
- AI key Save/Test: provider validation only, no hidden inference;
- Nutrition plan display: identity + one active-plan query;
- Plan meal logging: live Auth + one plan read + one bulk write;
- YouTube direct URL: zero Data API calls;
- YouTube search: one DB reservation + two official API calls + one LLM request.

---

## P2 — Auth/security before Production

- CAPTCHA: real Turnstile/hCaptcha only.
- Reauthentication: exact nonce/elevation UX open.
- Account deletion: recent reauth + scoped privileged delete + Storage cleanup + disposable E2E.
- MFA: enrollment/challenge/recovery UX open.
- Session timeout/single-session hosted policy not proven.
- Production email: replace Gmail Preview SMTP with dedicated transactional provider/domain + SPF/DKIM/DMARC.
- Leaked-password protection when plan supports it.

---

## P2 — product completeness

- Notifications/push: no real persistence/delivery source.
- Reports: must consume real Nutrition/Workout/Progress data.
- Body photos/media: consent + private Storage RLS + deletion semantics.
- Coach conversation persistence: intentionally session/device-local today; future persistence needs privacy/delete semantics.
- Theme setting truth: `user_settings.theme` exists but no proven end-to-end user-facing theme control; do not claim it works.

---

## P3 — UI/accessibility

### Stage19 accessibility baseline — GREEN

Global focus-visible, form font inheritance, common hit targets and reduced-motion are CI-gated.

### Stage20 UI truth/data-safety — GREEN

`UI Truth Audit CI` run `31323084673`: **success**.

Implemented and CI-gated:

- stale Today fixture-backed copy removed;
- dead Recent/Popular Nutrition filters replaced by real catalog categories;
- Nutrition dialog Escape + focus restoration;
- Workout no longer guesses first session is next;
- Progress metric dates match their own rows;
- Nutrition reset no longer deletes entire account history;
- Nutrition Timeline is local-date scoped;
- App Shell keyboard skip link;
- app routes scanned for remaining `RoutePlaceholder` usage.

### Stage21 rendered Onboarding QA — OPEN

Code-level accessibility/data-truth gates are green, but the new AI credential step, explicit nullable choice states and course-duration controls still need rendered desktop/mobile keyboard/focus evidence on local/current Preview runtime.

### General rendered visual QA — OPEN

After the next single deployment, capture mobile/desktop evidence for Today, Nutrition, Plan, Workout, Player, Progress, Profile, Coach, Auth, Onboarding and Settings. Fix spacing/card-density/typography from rendered evidence rather than CSS assumptions.

---

## Recommended order

1. Local runtime proof of current Stage21: Auth/signup mail path, AI key gate, full v2 Onboarding, persisted duration, empty Today regression.
2. **Stage22 — Program Cycle** schema/state machine + plan linkage/idempotent generation-run contract.
3. **Stage23 — Exercise Registry + deterministic Safety/Substitution Engine.**
4. **Stage24 — structured Training + Nutrition planners and validators/materializers.**
5. **Stage25 — coordinated Program review/activation UX.**
6. **Stage26 — Coach Proposal / exact Diff / Confirmation framework.**
7. **Stage27 — confirmed Workout/Nutrition future-version mutation tools.**
8. Deploy one latest stacked green candidate to existing Preview Lab when quota allows.
9. Run Auth/provider/YouTube/program lifecycle E2E, then only increase autonomy after evidence is green.

## Release rule

Preview-only. No Production promotion until P0/P1 hosted proofs are green with real account/provider/mailbox/tool/program traffic. The model never gets unrestricted database access and never silently mutates a program.

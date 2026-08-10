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

---

## P0 — hosted runtime proofs

### Latest Preview stack — OPEN

Do not create another Vercel project or Production deployment. Keep using GitHub CI + Next production builds, then deploy one latest stacked green candidate to the existing Preview Lab when quota permits.

### Auth mailbox/session E2E — OPEN

Need latest-Preview proof for:

- signup → scanner-safe confirmation → session → onboarding;
- password recovery;
- Password Changed delivery;
- Secure Email Change with old/new mailbox;
- two-browser revoke-other-sessions.

The earlier local signup failure was traced to Gmail SMTP `535 BadCredentials`; later Auth logs show successful signup/verification after SMTP credentials were corrected. Do not classify that incident as an Onboarding routing bug.

---

## P1 — Onboarding / program input truth

### Stage21 Onboarding v2 — CODE + DB HARDENING GREEN; RENDERED/RUNTIME QA OPEN

The previous false-default problem is fixed in code. Current contract:

- focused **13-step** mobile-first journey;
- AI credential gate is step 1; duplicate `/onboarding/ai` routes deleted;
- no preselected personal categorical/boolean self-report;
- Google required for real account flow, AvalAI optional fallback;
- raw API keys never enter Onboarding JSON/browser persistence;
- Body Map keeps all 73 regions but mobile shows one face at a time;
- non-precision front/back list fallback exists for small regions;
- selected injury details are collapsible;
- Review owns safety/data-readiness and direct Edit links;
- passive analysis/result click-through pages removed;
- final step asks only start date + duration + generation consent;
- inactive notification/photo/imperial controls are not presented as working features;
- stable Planner ids replace Persian display text for weekdays/equipment;
- explicit `bodyweight` removes empty-equipment ambiguity;
- draft parser is bounded and fails closed on malformed persisted JSON;
- account writes use optimistic concurrency instead of silent whole-row overwrite;
- parse-valid current-step edits autosave through a serialized write queue;
- `/onboarding/ready` verifies live Auth + completed current schema + parse-valid draft server-side;
- `OnboardingProvider` is scoped only to interactive step routes.

Live DB hardening migration `20260810001227_harden_onboarding_v2_shape` adds:

- `draft.version == schema_version`;
- schema v2 `current_step` restricted to 1..13;
- legacy schema v1 step 15 remains valid.

Live data still had one schema v1 completed row and zero v2 rows at the time of hardening, so v2 structure was changed before hosted v2 user data existed.

**Remaining Stage21 runtime/UX proof:**

- exact-current 360/390/430px rendered QA;
- Google Save/Test inside mobile Onboarding;
- interrupt a long step and prove autosave survives refresh;
- second-tab/device stale revision must fail instead of overwriting;
- complete 13 steps and inspect stable v2 equipment/weekday ids;
- sign-out/in lifecycle resume;
- `/ready` rejects incomplete/v1 state;
- field-addressable inline validation remains a polish gap (current summary is focusable but string-based).

Canonical audit: `docs/NEOFIT_STAGE21_ONBOARDING_MOBILE_UX_BACKEND_AUDIT.md`.

### Minor-user policy — OPEN PRODUCT/LEGAL DECISION

Current model accepts age 10+. Do not silently convert this to 18+ as a UI fix. Before Production define whether minors are supported and the corresponding consent/data/safety rules.

### Account timezone for program start date — OPEN INTERNATIONALIZATION GAP

Current Onboarding date boundary uses NeoFit’s default `Asia/Tehran` local-date helper. Before international Production, use authenticated profile timezone explicitly.

### Progress — CODE REAL; HOSTED QA OPEN

`body_measurements` replaces synthetic account progress. Need real-account add/refresh/history proof.

### Workout Plan — STAGE16 GREEN; HOSTED E2E OPEN

Versioned immutable account plan, Player provenance, activation guard and Guest Demo boundary are implemented. Stage20 removed unsupported “next session” inference.

### Nutrition Plan — STAGE17 GREEN; HOSTED E2E OPEN

Versioned plan stores only catalog identity/version + portion count. Stored nutrition claims are rejected; source-version mismatch fails closed; Guest Demo-only.

### Nutrition Plan → diary — STAGE18 GREEN; HOSTED E2E OPEN

User-initiated logging is Core-backed, idempotent, bulk-written and owner/version provenance-bound. Need runtime repeat-click/idempotency proof.

---

## P1 — AI / agent runtime

### Google BYOK — CODE READY; HOSTED PROOF OPEN

Need real Save/Test + Coach call on latest Preview. Onboarding now provides a direct official AI Studio key-creation path and mobile secret-field UX.

### AvalAI fallback — CODE READY; HOSTED CONTROLLED PROOF OPEN

Need deliberate fallback-eligible Google failure followed by AvalAI success.

### AI request audit/budget — STAGE15 GREEN; HOSTED PROOF OPEN

Need real success/fallback audit rows.

### YouTube Agent Tool — STAGE19 GREEN; HOSTED E2E OPEN

Need real restricted YouTube key + cards/audit/direct-video/cooldown proof after deployment.

### Agent write capability — DELIBERATELY NOT ACTIVE

Next write evolution remains typed proposals + visible diff + explicit confirmation for new immutable plan versions. No silent mutation and no unrestricted SQL.

---

## P1 — next core domain

### Stage22 Program Cycle — NEXT

Now that Onboarding is a parseable/concurrency-safe input contract, add the user-owned program lifecycle source of truth:

- id/user ownership/RLS;
- requested duration + start/end dates;
- normalized goal/safety snapshot provenance;
- generation state machine;
- idempotent generation key/run;
- linkage to immutable Workout/Nutrition plan versions;
- bounded phases/blocks for programs longer than 14 days;
- one-active-cycle rule initially;
- no raw provider key/prompt/model payload.

Stage22 must consume only parsed/normalized Onboarding v2, never raw JSON.

### Stage23 Exercise Registry / safety — AFTER STAGE22

Typed exercise identities, equipment requirements, movement patterns, contraindication tags and safe substitution relationships.

### Stage24 structured planners — AFTER STAGE23

Bounded Training + Nutrition structured generation and deterministic validators/materializers. Nutrition Core remains arithmetic authority.

---

## P1 — request/performance

### History pagination — OPEN

Nutrition history, Workout history, AI audit history and tool-audit history need cursor/range pagination before large datasets.

### Route data waterfalls — CONTINUE AUDIT

Keep route-specific sources. Remove avoidable serial reads with request reuse/Promise.all when safe, but do not rebuild one giant account snapshot.

Stage21 additionally removed an unnecessary Onboarding provider bootstrap from `/onboarding/ready` by scoping the client provider to `[step]` only.

---

## P2 — Auth/security before Production

- CAPTCHA: real Turnstile/hCaptcha only.
- Reauthentication: exact nonce/elevation UX open.
- Account deletion: recent reauth + scoped privileged delete + Storage cleanup + disposable E2E.
- MFA: enrollment/challenge/recovery UX open.
- Session timeout/single-session hosted policy not proven.
- Production email: replace Gmail Preview SMTP with dedicated transactional provider/domain + SPF/DKIM/DMARC.
- Leaked-password protection when plan supports it.

Supabase Security Advisor after the Stage21 DB hardening still reports only the pre-existing plan-gated leaked-password-protection warning; no new RLS/DDL warning was introduced.

---

## P2 — product completeness

- Notifications/push: no real persistence/delivery source; therefore removed from active Onboarding questions.
- Reports: must consume real Nutrition/Workout/Progress data.
- Body photos/media: consent + private Storage RLS + deletion semantics; therefore photo opt-in removed from active Onboarding UI.
- Coach conversation persistence: session/device-local today; future persistence needs privacy/delete semantics.
- Theme setting truth: `user_settings.theme` exists but no proven end-to-end user-facing theme control.
- Onboarding compatibility cleanup: v2 still carries some inactive legacy fields for compatibility; a future schema can remove them deliberately.

---

## P3 — UI/accessibility

### Existing baseline — GREEN

Global focus-visible, form font inheritance, common hit targets and reduced-motion are CI-gated.

### Onboarding mobile source audit — GREEN; RENDERED QA OPEN

Implemented source-level improvements include:

- 48px+ controls and 16px form text;
- sticky progress + safe-area sticky actions;
- selected-state affordances;
- direct Edit from Review;
- focusable error summary;
- one-face Body Map + list fallback;
- collapsible injury details;
- AI key show/hide + direct official setup action;
- grouped preference sections;
- server-verified user-facing Ready screen.

Remaining accessibility polish: field-addressable summary links + inline errors + `aria-invalid`/`aria-describedby` per field.

### Rendered visual QA — OPEN

After the next single deployment, capture mobile/desktop evidence for Today, Nutrition, Plan, Workout, Player, Progress, Profile, Coach, Auth, **all Onboarding interaction classes** and Settings. Fix from rendered evidence rather than CSS assumptions.

---

## Recommended order

1. Finish latest Stage21 CI and local/rendered runtime proof.
2. Implement Stage22 Program Cycle source of truth/state machine.
3. Implement Stage23 Exercise Registry/safety contract.
4. Implement Stage24 bounded structured Training/Nutrition planners.
5. Deploy one latest stacked green candidate once to existing Preview Lab.
6. Run Auth mailbox/session E2E + Google/AvalAI/AI-audit proofs.
7. Runtime-prove YouTube + Workout/Nutrition/Progress/meal logging.
8. Then add typed Coach proposal/diff/confirmation and confirmed future-plan mutation tools.

## Release rule

Preview-only. No Production promotion until P0/P1 hosted proofs are green with real account/provider/mailbox/tool/program traffic. The model never gets unrestricted database access.

# NeoFit Gap Audit — current Preview cycle

Status: canonical current backlog. Detailed implementation/incident history lives in the Stage documents; this file tracks only current truth and remaining gaps.

## Severity

- **P0** — identity/privacy/data-integrity/runtime blocker
- **P1** — core feature incomplete/fake or important request/cost gap
- **P2** — pre-Production completeness/security
- **P3** — visual/accessibility/interaction polish

---

## P0 — hosted runtime proofs still open

### Auth mailbox/session proof

Code/local HTTP contracts are hardened. Latest stacked Preview still needs real-mailbox/device proof:

- signup → scanner-safe Confirm Signup → session → onboarding;
- recovery → new password;
- Password Changed email delivery;
- Secure Email Change with old + new mailbox;
- two-browser revoke-other-sessions.

Hosted settings already configured: min password 12, current-password enforcement, Secure Email Change, OTP 3600, custom Preview SMTP and NeoFit TokenHash templates. Secure Password Change remains intentionally OFF until exact reauthentication nonce UX exists. Leaked-password protection remains plan-gated on current Free Supabase.

### Latest Preview runtime stack

Vercel is still build-rate constrained. Do not create another project or Production deployment. Keep using GitHub CI + Next production builds until one latest stacked candidate can be deployed to the existing Preview Lab.

---

## P1 — user data truth

### Progress measurements — CODE REAL; HOSTED QA OPEN

`body_measurements` replaces synthetic account progress. Real-account add/refresh/history proof remains.

### Nutrition goals — ACCOUNT DEMO LEAK FIXED

Account goals are real-or-empty. Guest targets remain explicit Demo.

### Workout Plan — STAGE 16 GREEN; HOSTED E2E OPEN

Versioned immutable user-owned plan, one active version, Player plan provenance, mid-session activation guard, Guest demo-only. Need real runtime empty-state/version/resume proof.

### Nutrition Plan — STAGE 17 GREEN; HOSTED E2E OPEN

Versioned plan stores only catalog identity/version + portion count. Stored nutrition claims are rejected; source-version mismatch fails closed; Guest demo-only. Need real activation/resolution proof.

### Nutrition Plan → diary — STAGE 18 GREEN; HOSTED E2E OPEN

User-initiated `ثبت برای امروز` is live in code:

- Browser sends plan id/version/meal id/local date only;
- live Auth validation;
- plan/catalog revalidation under RLS;
- Shared Nutrition Core creates every estimate;
- one bulk idempotent upsert;
- SHA-256 mutation identity;
- owner+plan+version composite provenance;
- all-null/all-present provenance shape;
- covering FK index.

Need real runtime log → repeat click → unchanged row count → Today/Nutrition totals exactly once.

### Food catalog coverage — OPEN / HIGH P1

Current Web catalog is still a small seeded IFKB-shaped set. This is now the largest data-completeness limit for useful Nutrition search/plans/Coach.

Next catalog work must expand authoritative/versioned food resolution while keeping Nutrition Core authoritative. Do not let LLM-generated calorie/macro values bypass catalog/Core.

---

## P1 — AI / agent runtime

### Google BYOK — CODE READY; HOSTED PROVIDER PROOF OPEN

Encrypted user vault, Google-first routing and model preference exist. Need real Save/Test + Coach call on latest Preview.

### AvalAI fallback — CODE READY; HOSTED CONTROLLED PROOF OPEN

Need deliberate fallback-eligible Google failure followed by AvalAI success.

### AI request audit/budget — STAGE 15 GREEN; HOSTED PROOF OPEN

One reservation covers Google→AvalAI chain; metadata-only audit; 429 + Retry-After; no prompt/output/key logging; no countTokens preflight. Need real success/fallback audit rows.

### YouTube Agent Tool — STAGE 19 CODE/SCHEMA/CI GREEN; HOSTED E2E OPEN

YouTube is now a separate read-only external integration, not a Provider.

Current contract:

- separate user-owned encrypted YouTube Data API v3 key;
- Save/Test uses cheap `videos.list`, no search;
- normal Coach turns make zero YouTube calls;
- direct public YouTube URL makes zero Data API calls and is passed to Google Gemini video input;
- explicit search uses deterministic local intent, one `search.list`, one batched `videos.list`, one Coach LLM request;
- no transcript scraper/caption workaround/automatic iframe;
- Google-only direct-video capability; no fake AvalAI fallback;
- exact structured cards returned independently of model prose;
- external metadata is explicitly untrusted prompt data;
- metadata-only `agent_tool_audit` stores SHA-256 query fingerprint, not raw query/results;
- atomic per-user search budget: 3/minute, 30/24h;
- live DB QA proved attempts 1–3 allowed, 4 denied with retry-after 60 and zero persisted QA rows.

Green Stage19 code run before final doc sync: `YouTube Agent Tools CI` `31321927187`.

Hosted proof requires real restricted YouTube key, search cards/audit, direct-video Gemini analysis and cooldown behavior.

### Agent orchestration — READ-ONLY FOUNDATION READY

Current architecture intentionally remains one deterministic orchestrator + bounded read-only tools. Do not explode into many autonomous agents yet.

Next meaningful Agent step should be **typed proposals**, not direct writes:

- propose workout-plan version;
- propose exercise replacement;
- propose Nutrition Plan version using catalog identities only;
- user reviews diff;
- explicit confirmation creates/activates a new immutable version.

No unrestricted SQL or silent plan mutation.

---

## P1 — request/performance

### Current core routes — BOUNDED

Nutrition plan display: identity + one active-plan query. Plan logging: live Auth + one plan read + one bulk write. YouTube direct URL: no Data API. YouTube search: one atomic reservation + two external API requests + one LLM request.

### History pagination — OPEN

Nutrition history, Workout history, AI audit history and tool-audit history need explicit cursor/range pagination before large datasets.

### Cross-route data waterfalls — CONTINUE AUDIT

Continue checking Server Components for accidental serial identity/data calls where `Promise.all` or request reuse is safe. Do not merge sources into one giant account snapshot just to reduce code.

---

## P2 — Auth/security before Production

- CAPTCHA: real Turnstile/hCaptcha only; no fake UI.
- Reauthentication: template exists; exact nonce/elevation UX open.
- Account deletion: recent reauth + scoped privileged delete boundary + Storage cleanup + disposable E2E required before button.
- MFA: enrollment/challenge/recovery UX open.
- Session timeout/single-session hosted policy not proven.
- Production email: move from Gmail Preview SMTP to dedicated transactional provider/domain with SPF/DKIM/DMARC.
- Leaked-password protection when plan supports it.

---

## P2 — product completeness

### Notifications/push — OPEN

No real notification persistence/delivery source. Do not ask for push permission before delivery exists.

### Reports — OPEN

Must consume real Nutrition/Workout/Progress sources and not revive old Firebase/Genkit assumptions.

### Body photos/media — OPEN

Requires consent, private Storage RLS, deletion semantics and metadata minimization.

### Coach conversation persistence — OPEN

Coach truthfully resets between devices/sessions. If persisted later, require bounded history, delete controls and explicit privacy semantics.

### YouTube result quality controls — OPEN AFTER RUNTIME PROOF

Do not add heuristic channel whitelists or extra LLM ranking before real search QA. First inspect actual result quality, then add minimal deterministic filters if evidence supports them.

---

## P3 — UI / visual / accessibility

### Stage19 accessibility baseline — FIXED

Global focus-visible coverage, form-font inheritance, common 44px hit targets and prefers-reduced-motion are now present and CI-gated.

### Coach interaction polish — FIXED BASELINE / RUNTIME QA OPEN

Specific budget cooldown, submit lock, auto-scroll, keyboard behavior, YouTube cards/CTAs and expandable technical metadata exist. Need browser/mobile visual QA after deployment.

### Profile workout fixture leakage — FIXED

Profile no longer displays Guest `workoutPlan.length` as account truth and does not add a Workout query just for a vanity metric.

### Empty/error states — CONTINUE AUDIT

Every account route must distinguish no-data, unavailable-query, Guest Demo and invalid/stale versioned data. Continue visual QA route by route.

### Theme setting truth — OPEN

`user_settings.theme` exists in schema but current product does not expose a proven end-to-end theme control. Do not present theme as a working preference until implemented. Dark mode is optional, not a blocker.

### Visual hierarchy consistency — CONTINUE AUDIT

After latest deployment, capture mobile/desktop screenshots for Today, Nutrition, Workout, Progress, Profile, Coach, Auth, Onboarding and settings. Fix spacing/typography/card-density based on rendered evidence rather than CSS assumptions.

---

## Current recommended order

1. Keep Vercel deploy count at zero until the latest stacked candidate is worth one deployment.
2. Finish Stage19 docs/green final HEAD.
3. Next polish stage: route-by-route rendered UI/data-truth audit + non-functional settings audit.
4. Expand catalog coverage through authoritative/versioned resolution.
5. Deploy latest green stack once to existing Preview Lab.
6. Run Auth mailbox/session E2E.
7. Run Google BYOK + Stage15 audit and controlled AvalAI fallback proof.
8. Runtime-prove YouTube search/direct-video/tool budget.
9. Runtime-prove Workout/Nutrition plan flows + Stage18 idempotent logging + Progress.
10. Only then start typed Coach proposal/write flows with explicit confirmation.

## Release rule

Preview-only. No Production promotion until core P0/P1 hosted proofs are green with real account/provider/mailbox/tool traffic. The model never gets unrestricted database access.

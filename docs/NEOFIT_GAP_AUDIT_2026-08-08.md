# NeoFit Gap Audit — current Preview cycle

Status: canonical current backlog. Detailed design/incident history stays in the individual Stage documents; this file tracks what is still materially incomplete.

## Severity

- **P0** — identity, privacy, data integrity or runtime blocker
- **P1** — core feature still incomplete/fake or an important request-cost gap
- **P2** — important pre-Production completeness/security
- **P3** — UX, accessibility, visual and expansion polish

---

## P0 — hosted runtime proofs still open

### Auth mailbox/session proof

Code/local HTTP contracts are hardened, but the latest stacked Preview must still prove with real mailboxes:

- signup → Confirm Signup → explicit scanner-safe verification → session → onboarding;
- forgot password → Recovery → new password;
- Password Changed notification delivery;
- Secure Email Change with old + new mailbox;
- Browser A + Browser B revoke-other-sessions behavior.

Hosted Auth settings currently confirmed: 12-character minimum, current-password enforcement, Secure Email Change, OTP expiration 3600, custom Preview SMTP and NeoFit TokenHash templates. Secure Password Change remains intentionally OFF until its reauthentication nonce UX is implemented/tested. Leaked-password protection is plan-gated on the current Supabase Free project.

### Latest Preview runtime stack

GitHub CI/builds are the current source of engineering proof while Vercel build-rate quota is limiting deployments. Do not create another Production project. When quota is available, deploy the latest green stacked candidate once to the existing Preview Lab and run all hosted E2E on that single candidate.

---

## P1 — user data truth

### Progress measurements — CODE REAL; HOSTED QA OPEN

`body_measurements` replaced synthetic account progress. Need real-account add/edit/refresh/history proof.

### Nutrition goals — ACCOUNT DEMO LEAK FIXED

Account goals are real-or-empty. Guest targets remain explicitly Demo.

### Workout Plan — STAGE 16 CODE/SCHEMA/CI GREEN; HOSTED E2E OPEN

Account plan is versioned/immutable under RLS, one active version/user, Player stores plan id/version, plan activation is blocked during active sessions, and Guest fixture is Demo-only. Need hosted empty-state/version/player provenance proof.

### Nutrition Plan — STAGE 17 CODE/SCHEMA/CI GREEN; HOSTED E2E OPEN

Account plan stores only versioned catalog identities/portion counts. Stored calorie/macro claims are rejected; exact source-version mismatch fails closed; Guest weekly fixture is Demo-only. Need hosted activation/resolution/version proof.

### Nutrition Plan meal → diary — STAGE 18 CODE/SCHEMA/CI GREEN; HOSTED E2E OPEN

The account can now explicitly `ثبت برای امروز`.

Current contract:

- Browser sends only plan id/version/meal id/local date;
- live Auth validation before write;
- exact active plan reread under RLS;
- catalog id/source-version revalidation;
- Shared Nutrition Core produces every estimate;
- deterministic SHA-256 mutation ids;
- one bulk idempotent upsert;
- exact composite provenance `(plan_id,user_id,version)`;
- all-null/all-present provenance shape;
- covering FK index verified by Performance Advisor;
- Guest demo cannot use account plan logging.

Final green code runs before doc sync:

- Diary Logging CI `31319808827`
- Provenance Integrity CI `31319808832`

Hosted proof: log one deliberate plan meal, verify Core estimates/provenance, repeat click with unchanged row count, then verify Today/Nutrition totals exactly once.

### Food catalog coverage — OPEN / HIGH P1

Current Web catalog is still a small IFKB-shaped seeded set. This is now one of the biggest truth/completeness limits for useful Nutrition Plan generation, food search and Coach nutrition suggestions.

Next expansion must resolve through real/versioned IFKB/FNDDS/SR-compatible records; broad AI-generated calories/macros remain prohibited.

---

## P1 — AI runtime / agent architecture

### Google BYOK — CODE READY; HOSTED PROVIDER PROOF OPEN

Encrypted user key vault, Google-first routing and model preference exist. Need a real hosted Save/Test + Coach request on latest stack.

### AvalAI fallback — CODE READY; HOSTED CONTROLLED PROOF OPEN

Need a deliberate fallback-eligible Google failure followed by AvalAI success.

### AI request audit/budget — STAGE 15 GREEN; HOSTED PROOF OPEN

One user reservation covers the entire Google→AvalAI chain; 429 + Retry-After, metadata-only audit, no prompt/output/key logging and no token-count preflight. Need real Google success row and controlled fallback row.

### Coach request-budget UX — GAP

Stage 15 backend returns `429 + Retry-After`, but current Coach UI does not yet surface a specific cooldown message; it falls into generic failure copy. Stage 19 should parse this explicitly and prevent blind re-submit.

### YouTube agent integration — OPEN / STAGE 19

YouTube must be a real read-only external Agent Tool, not a decorative link.

Target architecture:

```text
Coach intent/tool request
  -> YouTube discovery/metadata tool
       -> YouTube Data API v3
  -> user/model selects a public video
  -> Gemini video understanding receives the public YouTube URL
  -> final Coach response may include structured video cards/timestamps
```

Rules:

- Gemini BYOK key is **not** reused as a YouTube Data API credential;
- YouTube integration credential/quota is separate from AI provider credentials;
- search only on explicit video/tutorial intent, never every Coach turn;
- no transcript scraping;
- no Captions API workaround for arbitrary public videos;
- public metadata uses official YouTube Data API;
- Gemini may directly understand public YouTube URLs;
- video-understanding capability is Google-specific unless another provider is explicitly proven compatible; no fake AvalAI fallback;
- only render/embed a YouTube player after user intent, not an iframe for every result;
- external-tool quota/audit remains distinct from LLM request audit.

### Agent tool orchestration — OPEN

Current Coach uses a deterministic local context router plus one provider call and is intentionally read-only. This is efficient and should remain the default.

Stage 19 should introduce a **bounded read-only tool layer** beginning with YouTube rather than exploding into many autonomous agents. Meaningful plan mutations remain proposal + explicit confirmation work after hosted runtime proofs.

---

## P1 — request/performance

### Nutrition/plan route requests — BOUNDED

Current plan display is identity + one active-plan query; catalog resolution is in-process. Stage 18 logging adds one live Auth validation, one plan read and one bulk write. No per-item writes or duplicate pre-read.

### History pagination — OPEN

Future Nutrition history, Workout history, AI audit history and tool-audit pages need explicit range/cursor pagination.

### YouTube quota architecture — OPEN

YouTube search has its own quota model; discovery must be intentional, bounded, cacheable and observable. Do not use search as an invisible classifier.

---

## P2 — Auth/security before Production

- CAPTCHA: real Turnstile/hCaptcha only; no visual fake checkbox.
- Reauthentication: template exists; exact nonce/elevation product flow still open.
- Account deletion: no button until recent reauth + scoped privileged delete boundary + Storage cleanup + disposable E2E.
- MFA: enrollment/challenge/recovery UX open.
- Session timeout/single-session hosted policy not proven.
- Production mail: replace Gmail Preview SMTP with dedicated transactional provider/domain and SPF/DKIM/DMARC.
- Leaked-password protection when plan supports it.

---

## P2 — product completeness

### Notifications/push — OPEN

No real notification persistence/delivery source yet. Do not ask for push permission before a real delivery path exists.

### Reports — OPEN

Reports must consume real Nutrition/Workout/Progress sources and cannot revive old Firebase/Genkit assumptions.

### Body photos/media — OPEN

Requires explicit consent, private Storage RLS, deletion semantics and metadata minimization.

### Coach conversation persistence — OPEN

Current Coach explicitly resets between devices/sessions. This is truthful but incomplete. If persisted later, store bounded conversation metadata/content with clear privacy/delete semantics rather than browser-only hidden behavior.

---

## P3 — UI / visual / accessibility polish

### Reduced motion — GAP

`page-stack` currently animates with no `prefers-reduced-motion` override. Add an accessibility-safe motion contract.

### Focus visibility — GAP

Global focus treatment currently covers button/input more reliably than anchors/select/textarea/custom focusable controls. Make `:focus-visible` consistent across all interactive elements.

### Form typography/interaction consistency — GAP

Ensure textarea/select/button/input inherit Vazirmatn, hit targets stay >=44px where practical, and disabled/pending states remain visually obvious.

### Coach technical metadata — POLISH GAP

Provider/model/latency/fallback/context metadata is useful for QA but too raw for the primary Persian conversation surface. Keep it accessible in a subtle expandable technical-details treatment instead of competing with the answer.

### Coach interaction polish — GAP

Add explicit budget cooldown UX, better busy/aria state, sensible auto-scroll and keyboard behavior without sending accidental multiline prompts.

### Empty/error states — CONTINUE AUDIT

Every account route should distinguish: no data yet, unavailable query, Demo guest data and stale/invalid versioned data. Do not collapse these into generic cards.

### Theme setting truth — AUDIT REQUIRED

`user_settings.theme` exists. Verify whether it actually controls UI appearance; if not, either implement it or stop presenting theme as a working preference. Never keep a decorative setting that does nothing.

### Dark mode — OPTIONAL AFTER SETTING TRUTH

Not a blocker. Only implement if theme preference is intentionally supported end-to-end.

---

## Current recommended order

1. Keep Vercel deploy count at zero while build-rate quota is constrained.
2. Stage 19: YouTube read-only Agent Tool + Coach/tool UX + accessibility polish.
3. Audit/fix remaining decorative or non-functional settings and empty/error states.
4. Expand catalog coverage through authoritative/versioned food resolution.
5. Deploy the latest green stacked candidate **once** to existing Preview Lab.
6. Run Auth mailbox/session E2E.
7. Run Google BYOK + Stage 15 audit proof and controlled AvalAI fallback proof.
8. Runtime-prove Workout/Nutrition plan versioning and Stage 18 idempotent meal logging.
9. Runtime-prove body measurements/normal diary persistence.
10. Only then add typed Coach proposal/write actions with explicit user confirmation.

## Release rule

Preview-only. No Production promotion until core P0/P1 hosted proofs are green with real account/provider/mailbox traffic. No unrestricted SQL or autonomous plan mutation is ever exposed to the model.

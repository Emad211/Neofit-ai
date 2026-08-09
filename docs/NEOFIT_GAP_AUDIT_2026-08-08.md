# NeoFit Gap Audit — current Preview cycle

Status: canonical **current** backlog. Detailed implementation/incident history lives in Stage documents; this file tracks only what remains materially incomplete.

## Severity

- **P0** — identity/privacy/data-integrity/runtime blocker
- **P1** — core product/data truth incomplete or important request/cost gap
- **P2** — required pre-Production hardening/completeness
- **P3** — visual/accessibility/interaction polish

---

## P0 — hosted runtime proofs

### Latest Preview stack — OPEN

Vercel build-rate remains constrained. Do not create another project or Production deployment. Keep using GitHub CI + Next production builds, then deploy one latest stacked green candidate to the existing Preview Lab.

### Auth mailbox/session E2E — OPEN

Need latest-Preview proof for:

- signup → scanner-safe confirmation → session → onboarding;
- password recovery;
- Password Changed delivery;
- Secure Email Change with old/new mailbox;
- two-browser revoke-other-sessions.

Hosted controls already configured: minimum password 12, current-password enforcement, Secure Email Change, OTP 3600, Preview SMTP and NeoFit TokenHash templates. Secure Password Change remains OFF until exact reauthentication nonce UX exists. Leaked-password protection remains plan-gated on current Free Supabase.

---

## P1 — user/data truth

### Onboarding defaults can become false self-report — HIGH P1 / NEXT STAGE

Stage 20 found that the empty Onboarding draft currently contains valid categorical answers before explicit user choice, including examples such as:

- activity=`sedentary`
- sleepQuality=`average`
- stress=`medium`
- smoking=`never`
- diet=`balanced`
- trainingLevel=`beginner`
- location=`gym`
- daysPerWeek=`3`

Gender UI can also visually fall back to `prefer-not-to-say` while stored gender is null.

Because Coach later consumes Onboarding as user context, UI defaults must not silently become claimed self-report. Live Supabase currently has **0 `user_onboarding` rows**, so Stage 21 can redesign this contract before hosted user data exists.

### Food catalog coverage — HIGH P1

Current Web catalog remains a small seeded IFKB-shaped set. It limits useful Nutrition search, plan creation and Coach meal suggestions.

Expansion must use authoritative/versioned IFKB/FNDDS/SR-compatible resolution while keeping Nutrition Core authoritative. AI-generated calorie/macro claims remain prohibited.

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

### Google BYOK — CODE READY; HOSTED PROOF OPEN

Need real Save/Test + Coach call on latest Preview.

### AvalAI fallback — CODE READY; HOSTED CONTROLLED PROOF OPEN

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

Next write evolution should be typed proposals + visible diff + explicit user confirmation for new immutable plan versions. No silent mutation and no unrestricted SQL.

---

## P1 — request/performance

### History pagination — OPEN

Nutrition history, Workout history, AI audit history and tool-audit history need cursor/range pagination before large datasets.

### Route data waterfalls — CONTINUE AUDIT

Keep route-specific sources. Remove avoidable serial reads with request reuse/Promise.all when safe, but do not rebuild one giant account snapshot.

### Current expensive paths — BOUNDED

- Nutrition plan display: identity + one active-plan query.
- Plan meal logging: live Auth + one plan read + one bulk write.
- YouTube direct URL: zero Data API calls.
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

### Rendered visual QA — OPEN

After the next single deployment, capture mobile/desktop evidence for Today, Nutrition, Plan, Workout, Player, Progress, Profile, Coach, Auth, Onboarding and Settings. Fix spacing/card-density/typography from rendered evidence rather than CSS assumptions.

---

## Recommended order

1. Close Stage 20 documentation on a final green HEAD.
2. Stage 21: redesign Onboarding defaults/self-report semantics while the live table is empty.
3. Expand authoritative/versioned food catalog coverage.
4. Deploy latest stacked green candidate once to existing Preview Lab.
5. Run Auth mailbox/session E2E.
6. Run Google BYOK + AI audit + controlled AvalAI fallback proof.
7. Runtime-prove YouTube search/direct-video/tool budget.
8. Runtime-prove Workout/Nutrition/Progress + Stage18 idempotent meal logging.
9. Then add typed Coach proposal/write flows with explicit confirmation.

## Release rule

Preview-only. No Production promotion until P0/P1 hosted proofs are green with real account/provider/mailbox/tool traffic. The model never gets unrestricted database access.

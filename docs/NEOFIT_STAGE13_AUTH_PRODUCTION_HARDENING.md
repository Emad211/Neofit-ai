# NeoFit Stage 13 — Auth Recovery & Abuse Hardening

Status: code + local real-Next runtime proof complete; hosted Preview/mailbox QA pending Vercel quota reset and manual Auth settings.

## Why this stage exists

Stage 9 fixed the real Vercel Preview PKCE hostname incident, but a deeper Auth audit found several flows that were still only partially production-grade:

- password auth had no recovery path;
- GET confirmation consumed a single-use token immediately, unsafe around automated email-link scanners;
- resend surfaced provider success/failure too directly;
- normal logout called Supabase's default global sign-out while the UI implied ordinary per-browser logout;
- redirect sanitization was minimal;
- password policy was duplicated/weak for new credentials;
- Supabase SSR cookie refresh did not copy all response headers;
- account security/session controls were absent;
- Auth forms had no pending state, allowing duplicate submissions;
- sensitive actions trusted locally valid claims even after a server-side session revoke;
- AI/BYOK provider access also used claims-only validation despite user quota/cost impact;
- cookie-authenticated AI mutation/inference routes had no explicit same-origin request boundary;
- a fresh authenticated account could crash `/today` because an empty Core nutrient vector was treated as an invalid non-empty macro estimate;
- recovery misconfiguration could have consumed a one-time token before local signing state was ready.

## Scanner-safe one-time links

New signup/recovery email links land at `/auth/confirm`, but GET never calls `verifyOtp`.

```text
Email link GET
  -> /auth/confirm
  -> stage token_hash in short-lived HttpOnly cookie
  -> 303 to clean /auth/verify?type=...&next=...
  -> user explicitly presses confirm
  -> Server Action POST
  -> verifyOtp(token_hash, type)
```

The token hash is removed from the clean verification URL and is never rendered into a client-visible hidden input. The staging response is `private, no-store` and uses `Referrer-Policy: no-referrer`.

A security scanner can GET/follow the link without consuming the one-time token; it would have to intentionally submit NeoFit's POST action to consume it.

The token-staging cookie is scoped to `/auth/verify`, expires after 10 minutes, and is cleared with the exact same cookie path + `Max-Age=0` after verification.

## Real HTTP smoke found framework/runtime bugs

Source tests, TypeScript and `next build` were not enough. A real built Next server smoke test exposed two issues that would have affected the one-time-link flow:

1. A request to `127.0.0.1` could produce a redirect `Location` on `localhost` when the route derived the destination from `request.url`. Because the staged token cookie is host-only, that hostname drift could lose the cookie before `/auth/verify`.
2. The Route Handler set `Referrer-Policy: no-referrer`, but the generic Next header rule overwrote the actual HTTP response with `strict-origin-when-cross-origin`.

Stage 13 fixes both at the architecture level:

- sensitive Auth redirects are built from `canonicalAuthOrigin()` / `NEXT_PUBLIC_APP_URL`, never from a framework-derived request hostname;
- `next.config.ts` has explicit `/auth/confirm` and `/auth/callback` header rules after the generic rule, enforcing `Referrer-Policy: no-referrer` and `Cache-Control: private, no-store` at framework level.

The real HTTP smoke starts the built Next server and verifies:

- `/auth` and `/auth/recover` render;
- dummy confirmation GET returns `303`;
- `Location` stays exactly on the configured canonical origin;
- `token_hash` is absent from the clean redirect URL;
- `neofit-email-link-token` is HttpOnly and scoped to `/auth/verify`;
- the actual response contains `Referrer-Policy: no-referrer`;
- the actual response contains `Cache-Control: private, no-store`;
- `/auth/verify` really renders the confirmation interstitial when the staged cookie is present;
- a cross-origin signout POST returns `403`;
- a cross-origin Coach POST returns `403` before Auth/context/provider work;
- a cross-origin BYOK credential DELETE returns `403` before credential access.

Latest code evidence before this documentation update:

- code HEAD: `23db1dd0cf264c156bcd8bc3d691f4ee5291517b`
- Auth Production Hardening CI: `31273336101`
- Auth production contract tests: success
- complete Supabase app regression: success
- TypeScript: success
- Next.js production build: success
- Real Next Auth runtime smoke: success
- non-negotiable Auth boundary gate: success

## Password recovery

`/auth/recover` sends `resetPasswordForEmail` using the canonical hosted origin. UI output is deliberately generic for existing/non-existing addresses.

Before sending a recovery email or consuming a recovery OTP, NeoFit verifies that the local recovery signing contract is configured. A missing or malformed `AUTH_RECOVERY_INTENT_KEY` therefore fails before a one-time recovery link is sent/consumed instead of burning the token and then failing.

Recovery verification creates a Supabase recovery session and a defense-in-depth recovery-intent cookie that is:

- HttpOnly;
- SameSite=Lax;
- scoped to `/auth/update-password`;
- 15 minutes maximum;
- HMAC-SHA256 signed with dedicated `AUTH_RECOVERY_INTENT_KEY`;
- bound to the verified Supabase **user id + exact session id + issued-at timestamp**;
- compared using constant-time signature comparison;
- cleared on its exact cookie path with `Max-Age=0`.

`/auth/update-password` requires both a live Supabase Auth user validation and the matching signed recovery intent. A recovery cookie copied to a different session is insufficient.

After a recovered password change, NeoFit asks Supabase to revoke other refresh sessions while retaining the current recovered session.

## Live server validation boundary

`getClaims()` remains the fast identity primitive for ordinary navigation/read rendering. It verifies JWT signature/expiry locally and avoids putting Auth server in the hot path of every page.

For security-sensitive or quota-bearing actions NeoFit uses `activeAuthSession()`:

1. `getClaims()` validates signed `sub` + `session_id`;
2. `getUser()` performs a network validation against Supabase Auth;
3. user ids must agree.

Current Supabase documentation explicitly distinguishes the two: `getClaims()` can validate a JWT locally, while `getUser()` always sends a request to the Auth server and therefore reflects server-side session termination/logout state rather than trusting the browser/local token alone.

This live boundary is used for:

- signed-in password/session mutations;
- recovery password update;
- `/profile/security`;
- AI/BYOK authentication before accessing the user's provider credential or making a provider-backed Coach request.

That last item intentionally adds one Auth-server request per AI interaction. It does **not** add another LLM inference request; it reduces the window in which a server-ended session could continue spending the user's BYOK quota.

## Same-origin mutation boundary

Cookie-authenticated browser mutation routes share `isSameOriginBrowserMutation()`.

The helper accepts a request only when:

- an `Origin` header is present and exactly equals the request origin; or
- Origin is absent but Fetch Metadata explicitly says `Sec-Fetch-Site: same-origin`.

It is used by:

- `/auth/signout`;
- BYOK credential PUT/POST/DELETE;
- `/api/ai/respond`;
- `/api/ai/coach`.

The HTTP smoke proves cross-origin signout, Coach and BYOK mutation requests are rejected with `403` before sensitive work occurs. This does not replace XSS defenses; it closes the cross-origin browser mutation path instead of relying only on SameSite cookie defaults.

## Password policy

New credentials in NeoFit require 12–128 characters. Existing users are not locked out merely because an older password is shorter: sign-in accepts an existing non-empty password up to the maximum and lets Supabase verify it.

Signed-in password change requires `current_password` and then revokes other refresh sessions.

Hosted Supabase password policy remains a separate control plane. Application validation does not replace leaked-password protection, server-side rate limits or CAPTCHA.

## Session semantics and real evidence

Normal Profile logout is `scope=local`. Global logout is explicit. Signout is POST-only and uses the same-origin mutation boundary above.

The Security Center at `/profile/security` exposes:

- current-password-protected password change;
- revoke other sessions;
- explicit global logout.

A runtime audit of the current one-user Preview project found **three `auth.sessions` rows and three refresh tokens**. All three observed refresh-token rows were unrevoked at audit time. Two successful password sign-ins were only seconds apart. Auth forms therefore use `useFormStatus()` to disable duplicate submissions while pending.

Current session metadata also proved why NeoFit must not invent a “device list”: sessions created through server-side password actions record `user_agent=node` and Vercel/server IP metadata, not reliable browser-device identity. The UI controls sessions without falsely labeling them as Chrome/iPhone/etc.

All observed sessions are AAL1. There are currently no MFA factors in the project.

The observed session rows have `not_after = null`. Supabase sessions are indefinite by default. Time-box, inactivity timeout and single-session controls are hosted Auth settings and, per current Supabase documentation, are available on Pro plans and above. Do not claim these controls are active in the current project until dashboard configuration proves it.

Refresh-token/session revocation does not instantly invalidate already-issued access JWTs; they may remain usable until normal JWT expiry. NeoFit copy reflects that limitation. Security-sensitive/quota-bearing actions use the live Auth validation boundary above.

## Fresh-account post-login runtime gap found during Auth QA

The Auth audit found two real `/today` runtime errors on the Stage 12 Preview:

`energyKcal is missing from the Web macro view`

The account had zero Nutrition goals and zero diary entries. Shared Nutrition Core correctly represented the empty day sparsely, but the Web view incorrectly treated missing macro keys as an invalid non-empty estimate.

Stage 13 treats an **empty diary** as exactly zero consumed calories/protein/carbs/fat while preserving fail-closed behavior for malformed non-empty entries. A regression test covers a newly authenticated account with zero entries and zero configured targets and is included in the broader Supabase app regression.

Successful Auth is not considered proven if the first authenticated destination crashes.

## Redirect and origin rules

- Hosted Auth requires explicit `NEXT_PUBLIC_APP_URL`.
- Preview interactive traffic continues to canonicalize to one stable origin.
- sensitive Auth redirects use that same canonical origin directly;
- `next` destinations use a shared strict internal-path sanitizer and reject external, protocol-relative and backslash-based confusion values.

Real Preview password sign-ins are visible in Vercel logs, while Supabase Auth logs still showed `referer=http://localhost:3000`. The connector cannot read hosted Site URL configuration, so the dashboard Site URL must be manually verified instead of assumed correct.

## SSR cookie refresh

The Supabase proxy keeps `getClaims()` immediately after client creation and propagates both cookie mutations and response headers returned through `setAll`. This matters because recent `@supabase/ssr` versions provide cache-protection headers during refresh; dropping them can make authenticated Set-Cookie responses unsafe behind a CDN.

## Manual hosted configuration still required

### Vercel Preview secret

Generate a separate 32-byte Base64 secret and set only for Preview:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Variable:

```text
AUTH_RECOVERY_INTENT_KEY
```

Do not reuse `AI_CREDENTIAL_ENCRYPTION_KEY`.

### Supabase Site URL

Verify the exact Site URL is the stable Preview alias:

```text
https://neofit-preview-lab-emadk50000-9178-emads-projects-41cb6447.vercel.app
```

### Supabase email templates

Confirm signup:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding
```

Recovery:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password
```

Canonical repository templates:

- `supabase/templates/confirm-signup.html`
- `supabase/templates/recovery.html`

### Supabase password/bot/session controls

Still verify in hosted dashboard:

- leaked-password protection (plan permitting; Advisor currently reports disabled);
- provider-side minimum password/required-character policy;
- email/recovery rate limits;
- CAPTCHA / Turnstile before public exposure;
- JWT expiry;
- if plan permits: time-box, inactivity timeout, single-session policy.

CAPTCHA is intentionally not faked in code without a real site key + Supabase provider secret.

## Vercel Preview deployment constraint

Stage 13 code/CI/local-real-Next proof is complete, but Vercel's API deployment quota for the current Free project reached `100/100` during this audit. The platform reported reset around 2026-08-09 21:58 Iran time. No extra project is being created to bypass the quota; deploy resumes on the same Preview Lab after reset.

The currently hosted Preview therefore remains Stage 12. Do not call Stage 13 “hosted-proven” until the same Preview Lab accepts a new deployment and mailbox flows are run against it.

## Explicitly still open

- real Stage 13 Preview deployment after Vercel API quota reset;
- real recovery email end-to-end QA after hosted template + secret installation;
- fresh signup + scanner-safe explicit confirmation end-to-end QA;
- real multi-browser/session revoke QA;
- manual verification/fix of hosted Site URL;
- leaked-password hosted setting;
- Cloudflare Turnstile/hCaptcha runtime integration;
- custom SMTP / branded sender;
- MFA policy and enrollment UX;
- email-change flow;
- account deletion + reauthentication contract;
- trustworthy per-device session metadata if the product later needs device labeling.

## Release rule

Preview only. No Production promotion from Stage 13.

# NeoFit Stage 13 — Auth Recovery & Abuse Hardening

Status: implementation / Preview-only QA

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
- a fresh authenticated account could crash `/today` because an empty Core nutrient vector was treated as an invalid non-empty macro estimate.

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

## Password recovery

`/auth/recover` sends `resetPasswordForEmail` using the canonical hosted origin. UI output is deliberately generic for existing/non-existing addresses.

Recovery verification creates a Supabase recovery session and a defense-in-depth recovery-intent cookie that is:

- HttpOnly;
- SameSite=Lax;
- scoped to `/auth/update-password`;
- 15 minutes maximum;
- HMAC-SHA256 signed with dedicated `AUTH_RECOVERY_INTENT_KEY`;
- bound to the verified Supabase **user id + exact session id + issued-at timestamp**;
- compared using constant-time signature comparison;
- cleared on its exact cookie path with `Max-Age=0`.

`/auth/update-password` requires both a live Supabase Auth session and the matching signed recovery intent. A recovery cookie copied to a different session is insufficient.

After a recovered password change, NeoFit asks Supabase to revoke other refresh sessions while retaining the current recovered session.

## Live-session validation boundary

`getClaims()` remains the fast identity primitive for ordinary navigation/read rendering. It verifies JWT signature/expiry locally and avoids putting Auth server in the hot path of every page.

For security-sensitive actions NeoFit now uses `activeAuthSession()`:

1. `getClaims()` validates signed `sub` + `session_id`;
2. `getUser()` performs a live network check against Supabase Auth;
3. user ids must agree.

This live boundary is used for:

- signed-in password/session mutations;
- recovery password update;
- `/profile/security`;
- AI/BYOK authentication before accessing the user's provider credential or making a provider-backed Coach request.

That last item intentionally adds one Auth-server request per AI interaction. It does **not** add another LLM inference request; it prevents a server-revoked but not-yet-expired access JWT from continuing to spend the user's BYOK quota.

## Password policy

New credentials in NeoFit require 12–128 characters. Existing users are not locked out merely because an older password is shorter: sign-in accepts an existing non-empty password up to the maximum and lets Supabase verify it.

Signed-in password change requires `current_password` and then revokes other refresh sessions.

Hosted Supabase password policy remains a separate control plane. Application validation does not replace leaked-password protection, server-side rate limits or CAPTCHA.

## Session semantics and real evidence

Normal Profile logout is `scope=local`. Global logout is explicit. Signout is POST-only and rejects cross-site/ambiguous browser requests using Origin / Fetch Metadata.

The Security Center at `/profile/security` exposes:

- current-password-protected password change;
- revoke other sessions;
- explicit global logout.

A runtime audit of the current one-user Preview project found **three `auth.sessions` rows and three refresh tokens**. Two successful password sign-ins were only seconds apart. Auth forms therefore now use `useFormStatus()` to disable duplicate submissions while pending.

Current session metadata also proved why NeoFit must not invent a “device list”: sessions created through server-side password actions record `user_agent=node` and Vercel/server IP metadata, not reliable browser-device identity. The UI therefore controls sessions without falsely labeling them as Chrome/iPhone/etc.

All observed sessions are AAL1. There are currently no MFA factors in the project.

The observed session rows have `not_after = null`. Supabase sessions are indefinite by default. Time-box, inactivity timeout and single-session controls are hosted Auth settings and, per current Supabase documentation, are available on Pro plans and above. Do not claim these controls are active in the current project until dashboard configuration proves it.

Refresh-token/session revocation does not instantly invalidate already-issued access JWTs; they may remain usable until normal JWT expiry. NeoFit copy reflects that limitation.

## Fresh-account post-login runtime gap found during Auth QA

The Auth audit found two real `/today` runtime errors on the Stage 12 Preview:

`energyKcal is missing from the Web macro view`

The account had zero Nutrition goals and zero diary entries. Shared Nutrition Core correctly represented the empty day sparsely, but the Web view incorrectly treated missing macro keys as an invalid non-empty estimate.

Stage 13 now treats an **empty diary** as exactly zero consumed calories/protein/carbs/fat while preserving fail-closed behavior for malformed non-empty entries. A regression test covers a newly authenticated account with zero entries and zero configured targets.

This is an important release principle: successful Auth is not considered proven if the first authenticated destination crashes.

## Redirect and origin rules

- Hosted Auth requires explicit `NEXT_PUBLIC_APP_URL`.
- Preview interactive traffic continues to canonicalize to one stable origin.
- `next` destinations use a shared strict internal-path sanitizer and reject external, protocol-relative and backslash-based confusion values.

Real Preview password sign-ins are visible in Vercel logs, while Supabase Auth logs still showed `referer=http://localhost:3000`. The connector cannot read hosted Site URL configuration, so the dashboard Site URL must be manually verified instead of assumed correct.

## SSR cookie refresh

The Supabase proxy keeps `getClaims()` immediately after client creation and now propagates both cookie mutations and response headers returned through `setAll`. This matters because recent `@supabase/ssr` versions provide cache-protection headers during refresh; dropping them can make authenticated Set-Cookie responses unsafe behind a CDN.

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

Stage 13 code/CI can be completed now, but Vercel's API deployment quota for the current Free project reached `100/100` during this audit. The platform reported reset around 2026-08-09 21:58 Iran time. No extra project is being created to bypass the quota; deploy resumes on the same Preview Lab after reset.

## Explicitly still open

- real Stage 13 Preview deployment after Vercel API quota reset;
- real recovery email end-to-end QA after hosted template + secret installation;
- fresh signup + scanner-safe explicit confirmation end-to-end QA;
- real multi-browser/session revoke QA;
- leaked-password hosted setting;
- Cloudflare Turnstile/hCaptcha runtime integration;
- custom SMTP / branded sender;
- MFA policy and enrollment UX;
- email-change flow;
- account deletion + reauthentication contract;
- trustworthy per-device session metadata if the product later needs device labeling.

## Release rule

Preview only. No Production promotion from Stage 13.

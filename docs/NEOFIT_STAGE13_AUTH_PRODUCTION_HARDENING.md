# NeoFit Stage 13 — Auth Recovery & Abuse Hardening

Status: implementation / Preview-only QA

## Why this stage exists

Stage 9 fixed the real Vercel Preview PKCE hostname incident, but a deeper Auth audit found several flows that were still only partially production-grade:

- password auth had no recovery path;
- GET confirmation consumed a single-use token immediately, which is unsafe around automated email-link scanners;
- resend surfaced provider success/failure too directly;
- normal logout called Supabase's default global sign-out while the UI implied a normal local logout;
- redirect sanitization was minimal;
- password policy was duplicated/weak for new credentials;
- Supabase SSR cookie refresh did not copy all response headers;
- account security/session controls were not exposed to the user.

## Scanner-safe one-time links

New signup/recovery email links still land at `/auth/confirm`, but GET never calls `verifyOtp`.

Flow:

```text
Email link GET
  -> /auth/confirm
  -> stage token_hash in short-lived HttpOnly cookie
  -> 303 to clean /auth/verify?type=...&next=...
  -> user explicitly presses confirm
  -> Server Action POST
  -> verifyOtp(token_hash, type)
```

The token hash therefore does not remain in the verification page URL, browser history after redirect, or a client-visible hidden input. `Referrer-Policy: no-referrer` is applied at the staging redirect as an additional boundary.

A security scanner can GET the link and follow redirects, but it cannot consume the token unless it submits NeoFit's POST action.

## Password recovery

`/auth/recover` sends `resetPasswordForEmail` using the canonical Preview origin. The UI response is deliberately generic for existing and non-existing addresses.

Recovery verification creates a normal Supabase recovery session and additionally sets a short-lived recovery-intent cookie. This cookie is:

- HttpOnly;
- SameSite=Lax;
- scoped to `/auth/update-password`;
- 15 minutes maximum;
- HMAC-SHA256 signed with a dedicated `AUTH_RECOVERY_INTENT_KEY`;
- bound to the verified Supabase user id and issued-at timestamp.

`/auth/update-password` requires both verified Supabase claims and a valid signed recovery intent. The custom cookie is defense-in-depth, not an authorization substitute.

After a successful recovered password change, NeoFit asks Supabase to revoke other refresh sessions while retaining the current recovered session.

## Password policy

New credentials in NeoFit require 12–128 characters. Existing users are not locked out merely because an older password is shorter: sign-in accepts an existing non-empty password up to the maximum and lets Supabase decide whether it is valid.

Signed-in password change requires the current password and then revokes other refresh sessions.

Hosted Supabase password settings remain a separate control plane; application validation does not replace leaked-password protection, provider-side strength configuration or rate limits.

## Session semantics

Normal Profile logout is now `scope=local`, matching the user-facing meaning of “خروج از این دستگاه”.

The Security Center at `/profile/security` exposes:

- current-password-protected password change;
- revoke all other sessions;
- explicit global logout from all sessions.

Supabase access JWTs can remain usable until their normal expiry after refresh-token revocation; UI copy must not claim instantaneous access-token invalidation.

## Redirect and origin rules

- Hosted Auth requires explicit `NEXT_PUBLIC_APP_URL`.
- Preview continues to canonicalize interactive GET/HEAD traffic to one stable origin.
- Auth `next` destinations use a shared strict internal-path sanitizer and reject external URLs, protocol-relative values and backslash-based path confusion.

## SSR cookie refresh

The Supabase proxy keeps `getClaims()` immediately after client construction and propagates both cookie mutations and response headers returned through `setAll`.

## Manual hosted configuration still required

### Vercel Preview secret

Generate a separate 32-byte Base64 secret and set it only for Preview:

```bash
openssl rand -base64 32
```

Variable name:

```text
AUTH_RECOVERY_INTENT_KEY
```

Do not reuse the AI credential encryption key.

### Supabase email templates

Confirm signup:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding
```

Recovery:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/update-password
```

The canonical repository versions are:

- `supabase/templates/confirm-signup.html`
- `supabase/templates/recovery.html`

### Supabase password/bot protection

Still verify in the hosted dashboard:

- leaked-password protection (plan permitting);
- provider-side minimum password / required-character policy;
- email/recovery rate limits;
- CAPTCHA / Turnstile before public exposure.

CAPTCHA is intentionally not faked in code without a real site key + Supabase provider secret.

## Explicitly still open

- Cloudflare Turnstile/hCaptcha runtime integration;
- custom SMTP / branded sender;
- MFA policy and enrollment UX;
- email-change flow;
- account deletion and reauthentication policy;
- real multi-device session revocation QA;
- real recovery email end-to-end QA after hosted template + secret are installed.

## Release rule

Preview only. No Production promotion from Stage 13.

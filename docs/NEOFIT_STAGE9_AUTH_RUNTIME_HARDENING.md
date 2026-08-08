# NeoFit Stage 9 — Auth Runtime Hardening

Status: implementation / Preview QA

## Incident

On 2026-08-08 a real Preview signup received the confirmation email and Supabase successfully verified the email, but NeoFit returned to `/auth?error=callback` instead of establishing the SSR session.

Runtime evidence:

- Supabase `/auth/v1/signup`: 200 at 13:58:00Z
- confirmation email sent: 13:58:00Z
- Supabase `/auth/v1/verify`: 303 at 13:58:20Z with `user_signedup`
- Vercel `/auth/callback`: 307 at 13:58:22Z
- live database afterwards: 1 auth user, 1 confirmed user

The email itself was therefore not the failure. Session establishment after verification was.

## Root cause

The Preview candidate was opened through a unique Vercel deployment hostname while `NEXT_PUBLIC_APP_URL` and `emailRedirectTo` used the stable Preview Lab alias.

Supabase email/password PKCE stores verifier state in browser cookies. Cookies are host-scoped. A signup started on one Preview hostname and completed on a second hostname can therefore reach the callback without the verifier needed by `exchangeCodeForSession`.

The default confirmation URL is also less suitable for an SSR cookie flow than a server-side token-hash confirmation endpoint.

## Final confirmation contract

NeoFit uses a token-hash confirmation link for email signup:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding
```

`/auth/confirm` calls `verifyOtp`, receives the authenticated session server-side, writes it through `@supabase/ssr` cookies, runs idempotent account bootstrap, and redirects to Onboarding.

`/auth/confirm` also accepts a PKCE `code` for compatibility with existing links on the canonical hostname.

## Required hosted Supabase template

Dashboard path:

```text
Authentication → Email Templates → Confirm signup
```

The confirmation button/link must use the content from:

```text
supabase/templates/confirm-signup.html
```

The essential href is:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding">
```

The Site URL must remain the canonical stable Preview Lab origin while we are Preview-only.

## Canonical Preview origin

Interactive Preview requests are canonicalized to `NEXT_PUBLIC_APP_URL` before Supabase session middleware runs.

This means unique Vercel deployment hostnames are build artifacts, not separate interactive application origins. Keeping one origin protects:

- PKCE verifier cookies
- SSR session cookies
- OAuth callbacks later
- email confirmation links
- CSRF/origin assumptions

Only GET/HEAD requests are canonicalized. POST requests are not cross-origin replayed.

## Bootstrap resilience

The real incident also exposed a transient first-account write failure: one `user_settings` upsert returned 401 while the parallel profile and nutrition-goal writes succeeded. A subsequent login succeeded fully.

Stage 9 keeps the healthy request budget unchanged:

- three bootstrap writes remain parallel;
- only a failed idempotent write is retried once after 150 ms;
- a valid authenticated session is never destroyed solely because bootstrap remains partially incomplete.

## Recovery UX

Auth now includes:

- explicit confirmed-email/login recovery state instead of a false confirmation failure;
- resend-confirmation action;
- clearer expired/invalid link error;
- canonical redirect protection.

## QA checklist

1. Open the stable Preview Lab alias, not a unique deployment hostname.
2. Create a new test account with email confirmation enabled.
3. Open the newest confirmation email.
4. Confirm the browser lands at `/onboarding` with an authenticated session.
5. Sign out and sign in again.
6. Verify Profile, user settings and Nutrition goals exist once and are not reset.
7. Verify resend confirmation uses the same token-hash route.
8. Verify a unique deployment URL redirects to the stable Preview Lab alias before Auth interaction.
9. Verify runtime logs contain no callback error cluster.
10. Keep Production disabled.

## Remaining Auth gaps after Stage 9

- password reset/recovery UX
- optional social providers
- production custom SMTP and branded mail sender
- abuse/rate-limit UX around resend/signup
- production-domain Auth configuration when a Production release is intentionally created

These are deliberately separate from the callback incident fix.

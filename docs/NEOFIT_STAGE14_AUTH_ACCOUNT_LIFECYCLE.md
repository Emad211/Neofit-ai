# NeoFit Stage 14 — Auth Account Lifecycle

Status: implementation / Preview-only; stacked on Stage 13.

## Goal

Extend the serious Stage 13 identity/session boundary into account lifecycle operations without inventing security guarantees that hosted Supabase has not proven.

## Email change

NeoFit now exposes email change in `/profile/security` only after `activeAuthSession()` succeeds. That means the request is gated by both local JWT claims and live `getUser()` validation against Supabase Auth.

The request uses:

```ts
supabase.auth.updateUser({ email })
```

NeoFit never treats the request response as proof that the account email changed. The UI explicitly says confirmation is pending. If Supabase Secure Email Change is enabled, confirmation may be required from both the current and new email addresses.

### Scanner-safe confirmation

Email change reuses Stage 13's one-time-link architecture:

```text
email-change link GET
  -> /auth/confirm?token_hash=...&type=email_change&next=/profile/security
  -> stage token hash in short-lived HttpOnly cookie
  -> 303 clean /auth/verify?type=email_change&next=/profile/security
  -> explicit user POST
  -> verifyOtp(token_hash, email_change)
  -> /profile/security
```

GET never consumes the one-time token. `token_hash` is removed from the clean URL and is not rendered into a client form.

Canonical hosted template:

- `supabase/templates/email-change.html`

## Security notification templates

Stage 14 adds repository-owned canonical templates for the hosted controls that now matter:

- `supabase/templates/password-changed.html`
- `supabase/templates/reauthentication.html`

The Password Changed notification links users to NeoFit recovery if an unexpected password mutation occurs.

The reauthentication template uses the Supabase-provided six-digit `{{ .Token }}` only. It does not invent a local verification protocol.

## Account deletion is deliberately not implemented yet

Supabase self-service browser clients cannot safely call `auth.admin.deleteUser()`. The admin API requires a secret/service-role-equivalent privileged boundary and must never be exposed in the browser bundle or ordinary Route Handler credentials.

A correct deletion slice also needs to handle owned Storage objects because Supabase can reject deletion of a user that still owns Storage objects.

Therefore Stage 14 contains **no fake Delete Account button** and no privileged key in the Web app.

The future deletion architecture must prove all of the following before UI exposure:

1. explicit user intent and recent reauthentication;
2. server-side identity binding to the exact requesting user;
3. a tightly scoped privileged backend function that can only delete that same user;
4. cleanup/handling of owned private Storage objects;
5. database cascade semantics and post-delete session cleanup;
6. no privileged secret returned to or bundled for the browser;
7. runtime E2E with a disposable account.

## Runtime test contract

Stage 14 CI starts the built Next server and verifies with real HTTP that a dummy `email_change` link:

- returns `303`;
- redirects to the configured canonical origin;
- does not leak `token_hash` into the clean URL;
- stages an HttpOnly cookie scoped to `/auth/verify`;
- keeps `Referrer-Policy: no-referrer` and `Cache-Control: private, no-store`;
- renders the email-change verification interstitial.

The broader Supabase app regression, TypeScript and production build also run.

## Hosted Dashboard follow-up after code is green

Before email-change E2E, verify in Supabase Dashboard:

- Secure Email Change is enabled if available/desirable for the project;
- `Change email address` template matches `supabase/templates/email-change.html`;
- `Password changed` notification remains enabled and its body can be synced to `supabase/templates/password-changed.html`;
- Reauthentication template can be synced to `supabase/templates/reauthentication.html` before a feature starts using it.

Do not enable unrelated Phone/MFA/identity-link notifications until those product flows exist.

## Release rule

Preview only. No Production promotion from Stage 14.

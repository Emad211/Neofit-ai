# NeoFit Stage 14 — Auth Account Lifecycle

Status: code + real built-Next HTTP proof complete; Preview-hosted email-change E2E pending Vercel quota reset and hosted Change Email configuration.

## Goal

Extend the serious Stage 13 identity/session boundary into account lifecycle operations without inventing security guarantees that hosted Supabase has not proven.

## Email change

NeoFit exposes email change in `/profile/security` only after `activeAuthSession()` succeeds. The request is gated by both local JWT claims and live `getUser()` validation against Supabase Auth.

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

The reauthentication template uses the Supabase-provided six-digit `{{ .Token }}` only. Current public Supabase documentation documents sending this nonce and consuming it through supported sensitive update operations; NeoFit does not invent a generic local privilege-elevation verifier from that OTP.

## Account deletion is deliberately not implemented yet

Supabase self-service browser clients cannot safely call `auth.admin.deleteUser()`. The admin API requires a secret/service-role-equivalent privileged boundary and must never be exposed in the browser bundle or ordinary user-authenticated Web credentials.

A correct deletion slice also needs to handle owned Storage objects because Supabase can reject deletion of a user that still owns Storage objects.

Therefore Stage 14 contains **no fake Delete Account button** and no privileged key in the Web app.

The future deletion architecture must prove all of the following before UI exposure:

1. explicit user intent and a proven recent-reauthentication primitive;
2. server-side identity binding to the exact requesting user;
3. a tightly scoped privileged backend function that can only delete that same user;
4. cleanup/handling of owned private Storage objects;
5. database cascade semantics and post-delete session cleanup;
6. no privileged secret returned to or bundled for the browser;
7. runtime E2E with a disposable account.

## Runtime evidence

Auth Account Lifecycle CI run `31313488847` completed successfully for code HEAD `9937d7e69230e56feb65ba8afcdb7aab3c51b9d9` before this documentation-only sync.

Successful gates:

- account lifecycle contract tests;
- complete Supabase app regression;
- TypeScript;
- Next.js production build;
- real built-Next email-change HTTP smoke;
- lifecycle privilege/boundary gate.

The real HTTP smoke proves that a dummy `email_change` link:

- returns `303`;
- redirects to the configured canonical origin;
- does not leak `token_hash` into the clean URL;
- stages an HttpOnly cookie scoped to `/auth/verify`;
- keeps `Referrer-Policy: no-referrer` and `Cache-Control: private, no-store`;
- renders the email-change verification interstitial.

## Hosted configuration already evidenced by the user

For Preview QA the user has configured:

- custom SMTP;
- scanner-safe Confirm Signup `TokenHash` template;
- scanner-safe Reset Password `TokenHash` template;
- `Password changed` security notification enabled.

These are manual Dashboard facts, not yet Stage 14 mailbox E2E proof.

## Hosted Dashboard follow-up

Before email-change E2E:

- verify Secure Email Change in `Authentication -> Sign In / Providers -> Email`;
- replace `Change email address` source with `supabase/templates/email-change.html`;
- optionally sync the enabled Password Changed notification body to `supabase/templates/password-changed.html`;
- keep the Reauthentication template ready, but do not claim a product reauthentication flow until a feature uses a documented verification contract.

Do not enable unrelated Phone/MFA/identity-link notifications until those product flows exist.

## Deployment status

No new Vercel project will be created. Stage 14 will be deployed only to the existing `neofit-preview-lab` after its API deployment quota resets, ideally as the single latest green stacked candidate so quota is not wasted.

## Release rule

Preview only. No Production promotion from Stage 14.

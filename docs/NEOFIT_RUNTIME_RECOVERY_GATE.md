# NeoFit Runtime Recovery Gate

Status: **code/CI green; hosted Preview deployment blocked by Vercel daily API deployment quota**.

This gate must pass before Stage 21 product implementation continues.

## User-reported production-like Preview failures

The existing stable Preview produced two independent classes of failure:

1. account lifecycle trap:
   - `/` redirected unconditionally to `/today`;
   - the previously created Supabase Auth user was later deleted;
   - the browser could retain a still-signed local JWT/cookie;
   - `/auth` used `getClaims()` alone and could therefore hide Login/Sign up even though the Auth server no longer had that user.

2. stale Preview runtime/PWA failure:
   - `/today` emitted `energyKcal is missing from the Web macro view` for an empty first-account day on the old deployed code;
   - the browser reported Service Worker update failure on the Vercel-protected Preview origin.

## Live evidence

At the time of the incident:

- live Supabase `auth.users` row count: **0**;
- live Supabase `profiles` row count: **0**;
- stable Vercel Preview was still a redeploy of the older Stage 12 candidate;
- stable root still redirected directly to `/today`;
- Vercel Runtime Errors showed the `energyKcal is missing from the Web macro view` cluster on `/today` with 6 occurrences for one user.

Therefore this was not a browser-only false alarm. The deployed Preview was stale and the entry/Auth contract was wrong for a deleted-user/stale-cookie state.

## Recovery implementation

### Account entry router

`web/app/page.tsx` is now dynamic.

With Supabase configured:

- `activeAuthSession()` validates signed claims **and** performs a live Auth `getUser()` check;
- no live Auth user -> `/auth`;
- live user with missing/incomplete Onboarding -> `/onboarding`;
- live user with completed Onboarding -> `/today`.

Without Supabase configuration, local development may still enter the explicit Guest demo through `/today`.

### Auth page stale-session recovery

`/auth` no longer redirects on `getClaims()` alone.

It hides Login/Sign up only when `activeAuthSession()` confirms that the user still exists at the Auth server. A deleted/revoked user with a locally valid JWT can therefore return to the Auth UI.

Successful password login redirects through `/`, not directly to `/today`, so the lifecycle router chooses the correct next state.

### Empty Nutrition day

The current stacked Nutrition adapter already contains the fresh-account fix:

- a truly empty day is represented by explicit zero macros;
- no personal target is invented;
- malformed **non-empty** nutrition remains fail-closed.

This is regression-tested in the full Supabase app suite.

### Protected Preview Service Worker

Vercel-protected Preview is not treated as a stable PWA installation origin.

On `preview`:

- NeoFit registers no new Service Worker;
- existing Service Worker registrations are unregistered;
- existing `neofit-app-shell-*` CacheStorage entries are removed.

Production/local PWA support remains intact. `/sw.js` remains a valid static asset; only protected Preview registration is disabled.

## Validation

Final Runtime Recovery Gate CI run:

- run: `31331688181`
- Runtime recovery contracts: success (5/5)
- Auth Production regression: success (13/13)
- full Supabase app regression: success (88/88)
- TypeScript: success
- Next production build: success
- built-Next backend-independent static runtime smoke: success
- hard recovery boundary gate: success

Earlier smoke failures were test-harness issues, not application failures:

- fake Supabase endpoint became invalid once Auth correctly required live server validation;
- `NEXT_PUBLIC_*` values are build-time inputs and cannot be reliably removed only at `next start`;
- monorepo Next binary is hoisted to the repository root.

The smoke was corrected to test only backend-independent runtime behavior; configured Auth behavior is intentionally reserved for the real hosted Preview proof.

## Hosted deploy blocker

A controlled Preview deployment of `stage21/onboarding-self-report-v2` to the existing `neofit-preview-lab` project was attempted after CI.

Vercel returned HTTP 402:

- resource: `api-deployments-free-per-day`
- total: 100
- remaining: 0
- reset timestamp: `1786390223874`
- reset local time: approximately **2026-08-10 23:00 Iran time**.

Do not create another Vercel project and do not promote Production to bypass this quota.

## Required hosted proof after quota reset

Deploy exactly one latest green candidate to the existing Preview Lab, then verify:

1. with live Supabase user count 0, stable `/` reaches `/auth`, not `/today`;
2. `/auth` visibly renders both Login and Sign up;
3. a stale/deleted-user browser session does not hide Auth;
4. create/confirm a disposable account and ensure lifecycle routing enters Onboarding instead of hard-coded Today;
5. empty-account Today no longer produces the `energyKcal` exception;
6. Preview unregisters the old Service Worker/cache after refresh/reopen and no repeated SW update error remains;
7. Vercel runtime error cluster is zero on the new deployment.

Only after this hosted gate is green should Stage 21 implementation resume.

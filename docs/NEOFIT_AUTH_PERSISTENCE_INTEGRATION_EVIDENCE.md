# NeoFit Auth and Persistence Integration Evidence

**Date:** 2026-08-05  
**Branch:** `web/full-frontend-integration`  
**Draft PR:** #36  
**Validated code head:** `f5f5a6f60c15d09793f9ea416f1fe721b6d9e740`  
**Final documentation head before this evidence update:** `0f88dcf87ebc8d0f1a1143dd9c0b4c18fae20f73`  
**Supabase project:** `rjwrobltmjodfarnltal`

## Scope

This slice connects the integrated Persian Web frontend to the already-merged Supabase foundation without adding tables, queues, services or duplicated Nutrition arithmetic.

Implemented:

- email/password sign-in and sign-up through Server Actions;
- PKCE callback exchange and email token confirmation routes;
- verified-claims session refresh through the existing Next.js Proxy;
- server-side sign-out;
- first-account bootstrap for `profiles`, `user_settings` and `nutrition_goals`;
- account snapshot reads from `profiles`, `nutrition_goals` and `nutrition_entries`;
- authenticated meal inserts and deletes in `nutrition_entries`;
- Profile display-name persistence in `profiles`;
- guest fallback using the existing Browser local state;
- optimistic meal insert with immediate rollback on Remote failure;
- private/no-store account responses while no-config guest builds remain cacheable;
- Service Worker exclusion of Auth routes and private account HTML.

Explicitly not added:

- Service Role usage in Browser code;
- sync queue, event bus, IndexedDB or Background Sync;
- new database tables;
- food/catalog/recipe persistence;
- SQL or React Nutrition recalculation;
- provider-generated calories/macros;
- Production promotion.

## Data path

```text
Guest
  -> Shared Nutrition Core
  -> Browser local state

Authenticated account
  -> Supabase Auth cookies
  -> getClaims() verified identity
  -> own-row RLS
  -> profiles / user_settings
  -> nutrition_goals / nutrition_entries

Nutrition numbers
  -> packages/nutrition-core only
  -> versioned NutritionEstimate JSON persisted unchanged
```

## Main files

```text
web/app/auth/actions.ts
web/app/auth/page.tsx
web/app/auth/callback/route.ts
web/app/auth/confirm/route.ts
web/app/auth/signout/route.ts
web/lib/supabase/account.ts
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/components/nutrition-state.tsx
web/components/nutrition-screen.tsx
web/components/app-shell.tsx
web/components/profile-screen.tsx
web/tests/supabase-app-integration.test.ts
```

## Security and cache boundaries

- Browser and Server clients use generated `Database` types.
- Protected identity uses `auth.getClaims()`.
- Only a verified session receives `Cache-Control: private, no-store`.
- `/auth/*`, `/api/*` and authorization-bearing requests bypass Service Worker caching.
- Private/no-store HTML is skipped and any older guest snapshot for that path is removed.
- Publishable configuration is optional for Preview builds and fails closed when invalid.
- No key value is committed or written to this document.

## Validated code-head CI

```text
code head: f5f5a6f60c15d09793f9ea416f1fe721b6d9e740

Supabase Identity Schema CI 31032483010 — success
Supabase Nutrition Persistence CI 31032481404 — success
Supabase Foundation CI 31032481373 — success
Vercel Build Contract 31032481435 — success
Web CI 31032481411 — success

Web Artifact 8941255661
Digest sha256:f0e57c1b940f6b17a67e5562814ddd2ff3f70f13a59a51d11e3efdc25a808172
```

## Final documentation-head CI

```text
head: 0f88dcf87ebc8d0f1a1143dd9c0b4c18fae20f73

Web CI 31033160546 — success
Artifact 8941513789
Digest sha256:a83ac83af1105fa25590cfa61bf93050e41dd401920abd847562b7a55cba0092

Nutrition Core CI 31033158969 — success
Supabase Identity Schema CI 31033159086 — success
Supabase Nutrition Persistence CI 31033159397 — success
Supabase Foundation CI 31033159707 — success
Vercel Build Contract 31033159050 — success
```

Web CI proved:

- strict TypeScript;
- Web Nutrition Adapter parity `9/9`;
- Supabase Application integration contracts `9/9`;
- production build;
- Persian RTL routes and responsive browser matrix;
- safe no-config Auth screen;
- guest profile boundary;
- Service Worker install/control;
- offline navigation between `/today` and `/nutrition`;
- no API response in app-shell cache;
- no privileged key material;
- no duplicated Nutrition arithmetic.

Build route contract with no Supabase Environment:

```text
/auth             dynamic
/auth/callback    dynamic
/auth/confirm     dynamic
/auth/signout     dynamic
/today            static guest shell
/nutrition        static guest shell
/profile          static guest shell
```

In a configured deployment, the account path uses Cookies and verified claims; session-bearing responses are private/no-store.

## Runtime claim boundary

Proven now:

- Auth/SSR/Callback/Sign-out implementation compiles and is contract-tested;
- account reads and writes target the four merged RLS tables;
- guest mode remains usable when Supabase Environment is absent;
- all architecture, schema and browser regression gates pass on the synchronized documentation head.

Not yet proven on the current Auth head:

- a real public email sign-up and confirmation round trip;
- a real sign-in Cookie round trip on Vercel;
- a browser-created meal appearing in the Remote table and surviving a new device/session;
- Vercel Environment rollout for the two public Supabase variables.

Reason: the latest Vercel Git deployments are currently blocked by the Free-plan daily deployment limit. The last Ready Preview predates this final Auth head. The repository build contract is green, but this document does not call the current Auth head publicly deployed.

## Exact continuation

1. Configure Vercel Preview/Production values for:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
2. Configure Supabase allowed Site URL/Redirect URLs for the chosen Vercel domains.
3. Deploy the exact latest PR #36 head after the Vercel quota resets.
4. Run one temporary real-account browser test:
   - sign up/confirm or sign in;
   - verify `profiles`, `user_settings`, `nutrition_goals` bootstrap;
   - add one meal and verify `nutrition_entries`;
   - update display name;
   - sign out/sign in and verify persistence;
   - delete temporary rows/account.
5. Record Runtime evidence before merging PR #36.

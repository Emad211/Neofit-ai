# NeoFit Development Handoff

**Last reconstructed:** 2026-08-06  
**Architecture base:** `web/pwa-foundation`  
**Active branch:** `web/full-frontend-integration`  
**Active Draft PR:** #36  
**Parent before current hardening slice:** `a85043f608ad35d8971492d6b386d236c20d589b`  
**Exact next:** finish CI for Auth/Guest-state hardening, perform external Vercel/Supabase configuration, then one real-account Preview proof

## Mandatory read order

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`
4. `docs/NEOFIT_VERCEL_CANONICAL_PREVIEW.md`
5. این Handoff
6. PR #36، latest CI، Vercel live state و Supabase live state

به گزارش مکالمه یا Default branch اعتماد نشود. توسعهٔ وب فقط روی `web/full-frontend-integration` انجام می‌شود.

## Proven foundation

- Next.js App Router + strict TypeScript.
- Shared Nutrition Core تنها مرجع Nutrition است.
- Web Adapter parity `9/9` و Core `52/52`.
- Supabase project `rjwrobltmjodfarnltal` سالم است.
- چهار Table فعلی RLS مالک‌محور دارند.
- Browser privileged credential ندارد.
- Guest PWA shell و private cache boundary قبلاً پاس شده‌اند.
- Canonical Vercel deployment `dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy` READY است.

## Current hardening implementation

### Files

```text
web/lib/supabase/bootstrap.ts
web/lib/supabase/account.ts
web/lib/local-date.ts
web/lib/web-diary-storage.ts
web/components/nutrition-state.tsx
web/tests/account-bootstrap.test.ts
web/tests/local-date.test.ts
web/tests/web-diary-storage.test.ts
web/tests/supabase-app-integration.test.ts
web/package.json
```

### Contract

- Bootstrap is insert-only on conflict and cannot overwrite existing profile/settings/goals.
- Profile timezone is loaded and normalized.
- Diary local date is Timezone-aware and refreshed during a long-lived session.
- Local Storage uses a versioned, validated envelope.
- Valid empty diary survives reload.
- Legacy array storage remains readable.
- Stored macro and Persian meal label are reconstructed from validated Core data.
- Invalid local payload fails closed to a safe fixture.
- No database migration or new persistence system is introduced.

## Current runtime truth

At the latest live check:

```text
auth users: 0
profiles: 0
user_settings: 0
nutrition_goals: 0
nutrition_entries: 0
```

Therefore real Auth/persistence runtime has not occurred yet.

## Vercel truth

Keep only:

```text
neofit-ai
prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
```

Delete manually:

```text
neofit-direct-probe
neofit-file-ref-probe
neofit-ui-public-probe
```

Required Preview environment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=https://neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
```

Do not use generic `deploy_to_vercel`. Do not update `vercel/preview` before all CI for the complete slice is green.

## Manual owner actions

The connected tools cannot delete Vercel projects or edit all Dashboard settings. The owner must:

1. delete the three probes;
2. set Framework to Next.js and Node to 22.x for `neofit-ai`;
3. set the three Preview Environment values;
4. add the stable alias to Supabase Site URL/Redirect URLs;
5. create an Automation Bypass secret only if protected remote QA is to run through GitHub Actions.

No secret value should be pasted into chat, Git, Issue, PR comment or Artifact.

## Exact continuation

1. Push the current hardening slice as one Commit.
2. Inspect all GitHub CI; correct failures without touching Vercel release branch.
3. Record Run/Artifact/Digest in PR #36.
4. Complete the manual owner actions above.
5. Update `vercel/preview` once to the exact green head.
6. Run temporary-account E2E:
   - signup/confirm or signin;
   - verify only missing bootstrap rows are created;
   - edit profile and goals, sign out/in, verify no reset;
   - add meal and verify `nutrition_entries`;
   - sign out/in and verify persistence;
   - cleanup rows and Auth user.
7. Record Runtime Evidence.
8. Continue product port in order: Workout Player, Onboarding/73-region Body Map, Coach/remaining routes.
9. Keep PR #36 Draft and do not promote Production until Runtime proof is complete.

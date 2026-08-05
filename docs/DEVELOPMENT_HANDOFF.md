# NeoFit Development Handoff

**Last verified:** 2026-08-05  
**Architecture base:** `web/pwa-foundation`  
**Active product branch:** `web/full-frontend-integration`  
**Active Draft PR:** #36  
**Validated code head:** `f5f5a6f60c15d09793f9ea416f1fe721b6d9e740`  
**Exact next:** Vercel Env + exact-head deploy + real temporary-account Runtime proof

## Mandatory read order

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`
4. این Handoff
5. PR #36، CI، Supabase و Vercel live state

به گزارش مکالمه یا این فایل به‌تنهایی اعتماد نشود.

## 1. Proven foundation

### Nutrition

- `packages/nutrition-core` تنها مرجع محاسبه است.
- Core parity: `52/52`.
- Web Adapter parity: `9/9`.
- SQL و React Nutrition arithmetic را تکرار نمی‌کنند.
- missing nutrient صفر نیست؛ `grams: null` حفظ می‌شود.

### Supabase

```text
project ref: rjwrobltmjodfarnltal
status: ACTIVE_HEALTHY
```

Merged migrations:

```text
20260804232149_identity_foundation.sql
20260805132201_nutrition_persistence.sql
```

Merged PRs:

```text
PR #33 -> c7de309fd3f62fe6e58f1e603c3c9745a3013dcd
PR #35 -> 942417641f69eeb1c6990a321efef0d9a277a994
```

Tables:

```text
profiles
user_settings
nutrition_goals
nutrition_entries
```

RLS، grants، cross-user denial، duplicate mutation denial، Advisors و cleanup اثبات شده‌اند.

## 2. Current frontend integration

PR #36 UI را داخل معماری فعلی `web/` Port کرده است؛ Merge مستقیم PR #34 انجام نشده.

Current routes:

```text
/today
/nutrition
/nutrition/plan
/workout
/workout/[id]
/progress
/profile
/auth
/auth/callback
/auth/confirm
/auth/signout
```

Implemented:

- Persian RTL shell and navigation؛
- Today/Nutrition/Meal plan؛
- Workout overview/details؛
- Progress؛
- Profile guest/account؛
- Guest PWA/offline؛
- Email/password Auth؛
- PKCE/token callbacks؛
- server sign-out؛
- account bootstrap؛
- Remote Nutrition read/write؛
- display-name persistence؛
- local guest fallback.

Deliberately absent:

- sync queue/event bus؛
- IndexedDB/background sync؛
- new database table؛
- SQL Nutrition math؛
- privileged Browser credential؛
- Production promotion.

## 3. Final code evidence

```text
code head: f5f5a6f60c15d09793f9ea416f1fe721b6d9e740

Supabase Identity Schema CI 31032483010 — success
Supabase Nutrition Persistence CI 31032481404 — success
Supabase Foundation CI 31032481373 — success
Vercel Build Contract 31032481435 — success
Web CI 31032481411 — success

Artifact 8941255661
Digest sha256:f0e57c1b940f6b17a67e5562814ddd2ff3f70f13a59a51d11e3efdc25a808172
```

Passed:

- strict TypeScript؛
- Web Adapter `9/9`؛
- Supabase Application integration `9/9`؛
- Production build؛
- responsive browser matrix؛
- no-config Auth safety؛
- Guest PWA offline navigation؛
- private account cache boundary؛
- secret and duplicate-arithmetic rejection.

## 4. Runtime limitation

Current Auth head is not yet publicly runtime-proven.

Reasons:

1. Vercel Free-plan deployment quota is exhausted.
2. Latest Ready Preview predates final Auth head.
3. Vercel public Supabase Environment values must be configured outside Git.
4. Supabase allowed Site/Redirect URLs must match the deployed domain.

Do not claim:

- current Auth head is deployed؛
- email confirmation has completed on Vercel؛
- browser meal persistence has survived sign-out/sign-in؛
- multi-device sync is proven.

## 5. Exact continuation point

1. Recheck PR #36 Head and all CI after documentation commits.
2. In Vercel Project Settings, configure Preview and Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. In Supabase Auth URL Configuration, add the selected Vercel Site URL and callback/confirm-compatible Redirect URLs.
4. Wait for/reset Vercel daily deployment quota.
5. Deploy the exact latest PR #36 head.
6. Run a temporary real-account browser scenario:
   - sign up/confirm or sign in؛
   - verify bootstrap rows؛
   - add a meal؛
   - verify Remote `nutrition_entries`؛
   - edit display name؛
   - sign out/sign in؛
   - verify persistence؛
   - delete test rows/account.
7. Record Runtime evidence in `NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`.
8. Keep PR #36 Draft/unmerged until this evidence is green.
9. After Runtime proof, continue Workout Player, Onboarding and Coach with the same no-overengineering rule.

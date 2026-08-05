# NeoFit Stage 4 — Supabase Auth, Postgres and RLS

**Status:** Stage 4A–4D complete and merged؛ Application wiring implemented on Draft PR #36؛ public Runtime proof pending  
**Date:** 2026-08-05  
**Project ref:** `rjwrobltmjodfarnltal`

## ۱. هدف و مرز

Stage 4 کوچک‌ترین مسیر امن و کاربردی Supabase را فراهم می‌کند:

```text
Browser/Server Auth
  -> verified claims
  -> RLS-protected tables
  -> Shared Nutrition Core output persistence
```

خارج از Scope:

- Nutrition calculation در SQL یا UI؛
- Service Role در Browser؛
- Catalog/Recipe tables؛
- queue/event bus/background sync؛
- AI/Vision؛
- Production promotion بدون Evidence.

## ۲. Environment contract

Browser-safe:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

- مقدار واقعی در Git/docs/artifacts ثبت نمی‌شود.
- invalid/missing config fail-closed است.
- نبود Env در Preview محلی، Guest mode را فعال نگه می‌دارد.
- امنیت داده بر RLS استوار است، نه مخفی‌بودن Publishable key.

## ۳. Stage 4A — Project complete

```text
project: neofit
ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
```

## ۴. Stage 4B — SSR foundation merged

```text
PR #30
implementation merge: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
closure: 72202f2f0ff281bf0624b9ebb933ac5afeaad8fc
```

Contracts:

- typed Browser/Server clients؛
- cookie-aware SSR؛
- request/response synchronization؛
- `getClaims()`؛
- optional fail-closed public Env؛
- private/no-store verified-session responses.

## ۵. Stage 4C — Identity schema/RLS merged

```text
PR #33
merge: c7de309fd3f62fe6e58f1e603c3c9745a3013dcd
migration: 20260804232149_identity_foundation.sql
```

Tables:

```text
profiles
user_settings
```

Proven:

- own-row SELECT/INSERT/UPDATE/DELETE؛
- UPDATE دارای `USING` + `WITH CHECK`؛
- authenticated grants only؛
- anon/PUBLIC بدون grant؛
- generated types؛
- runtime cross-user denial؛
- Advisors صفر؛
- cleanup کامل.

## ۶. Stage 4D — Nutrition persistence merged

```text
PR #35
merge: 942417641f69eeb1c6990a321efef0d9a277a994
migration: 20260805132201_nutrition_persistence.sql
```

Tables:

```text
nutrition_goals
nutrition_entries
```

Contract:

- Shared Core JSON persistence only؛
- `NutritionEstimate` بدون بازحساب؛
- `grams: null` و missing nutrient حفظ می‌شوند؛
- `(user_id, client_mutation_id)` unique؛
- own-row RLS؛
- duplicate/cross-user/ownership denial؛
- generated types؛
- Advisors صفر.

## ۷. Application wiring — PR #36

Branch:

```text
web/full-frontend-integration
```

Implemented:

- sign-in/sign-up Server Actions؛
- PKCE callback؛
- email token confirmation؛
- server sign-out؛
- first-account bootstrap؛
- read `profiles`/`nutrition_goals`/`nutrition_entries`؛
- write/delete `nutrition_entries`؛
- update `profiles.display_name`؛
- Guest local fallback؛
- optimistic insert with rollback؛
- Auth/private HTML excluded from Service Worker cache.

Validated code head:

```text
f5f5a6f60c15d09793f9ea416f1fe721b6d9e740
```

CI:

```text
Identity 31032483010 — success
Nutrition Persistence 31032481404 — success
Foundation 31032481373 — success
Vercel Build Contract 31032481435 — success
Web 31032481411 — success
Artifact 8941255661
```

Authority:

- `docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`

## ۸. Cache and security boundary

- Guest build بدون Env Static و PWA-cacheable است.
- Auth routes در Service Worker پردازش نمی‌شوند.
- Verified account response `private, no-store` است.
- private HTML Cache نمی‌شود و Guest snapshot قبلی همان path حذف می‌شود.
- API و Authorization request وارد app-shell cache نمی‌شوند.
- Authenticated offline write queue وجود ندارد؛ کاربر باید برای Remote write آنلاین باشد.

## ۹. Claim boundary

Proven:

- Stage 4 schema و RLS Merge شده‌اند؛
- Auth/Application code و contracts سبزند؛
- Guest mode و PWA سالم‌اند؛
- Current code build می‌شود.

Pending:

- Current Auth head deployment؛
- Vercel public Env rollout؛
- Supabase Redirect URL rollout؛
- real email/session Browser round-trip؛
- Remote meal persistence across sign-out/sign-in.

## ۱۰. Exact continuation

1. Vercel Preview/Production public Env تنظیم شود.
2. Supabase Site/Redirect URL تنظیم شود.
3. Current head پس از Reset quota Deploy شود.
4. Temporary real-account E2E و Remote verification اجرا شود.
5. cleanup کامل انجام و Evidence ثبت شود.
6. PR #36 تا Runtime proof Draft بماند.

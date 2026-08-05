# NeoFit AI

NeoFit یک PWA فارسی برای تغذیه و تمرین است که محاسبات تغذیه‌ای قطعی را از Shared Nutrition Core می‌گیرد و دادهٔ شخصی را با Supabase Auth/Postgres/RLS ذخیره می‌کند.

## معماری فعلی

- Next.js App Router + strict TypeScript در `web/`
- فارسی و RTL
- `packages/nutrition-core` به‌عنوان تنها مرجع Nutrition
- Supabase Auth + Postgres + own-row RLS
- IFKB + USDA SR Legacy + FNDDS به‌عنوان منابع داده
- PWA و Guest offline shell
- بدون Nutrition arithmetic در SQL یا React
- بدون Service Role در Browser

## وضعیت فعلی

### Merge شده

```text
Stage 4B SSR/Auth foundation — PR #30
Stage 4C Identity schema/RLS — PR #33
Stage 4D Nutrition persistence — PR #35
```

Supabase tables:

```text
profiles
user_settings
nutrition_goals
nutrition_entries
```

Migrations:

```text
20260804232149_identity_foundation.sql
20260805132201_nutrition_persistence.sql
```

### در حال توسعه

```text
branch: web/full-frontend-integration
Draft PR: #36
```

Routeهای فعلی:

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

اتصال فعلی:

- Email/password sign-in و sign-up؛
- PKCE و token confirmation callback؛
- server sign-out؛
- bootstrap پروفایل، تنظیمات و هدف تغذیه؛
- خواندن/نوشتن وعده‌ها در `nutrition_entries`؛
- ویرایش نام نمایشی؛
- Guest local fallback؛
- rollback ثبت هنگام Remote failure؛
- private account HTML خارج از PWA cache.

## آخرین Evidence کد

```text
validated head: f5f5a6f60c15d09793f9ea416f1fe721b6d9e740

Supabase Identity Schema CI 31032483010 — success
Supabase Nutrition Persistence CI 31032481404 — success
Supabase Foundation CI 31032481373 — success
Vercel Build Contract 31032481435 — success
Web CI 31032481411 — success

Artifact 8941255661
Digest sha256:f0e57c1b940f6b17a67e5562814ddd2ff3f70f13a59a51d11e3efdc25a808172
```

Web CI پوشش می‌دهد:

- TypeScript؛
- Web Nutrition Adapter `9/9`؛
- Supabase Application integration `9/9`؛
- Production build؛
- Browser responsive matrix؛
- safe no-config Auth؛
- Guest PWA/offline؛
- private cache boundary؛
- secret و duplicate-arithmetic rejection.

## Environment

Browser-safe variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

مقدار واقعی نباید در Git، docs یا artifact ثبت شود. نبود یا نامعتبر بودن این مقادیر Guest mode را فعال نگه می‌دارد و Auth controls را fail-closed می‌کند.

## Runtime limitation

Current Auth head هنوز روی Vercel عمومی اثبات نشده است:

- Vercel Free-plan daily deployment quota پر شده؛
- آخرین Ready Preview قبل از Current Auth head است؛
- Vercel Environment و Supabase Redirect URL باید برای دامنهٔ نهایی تنظیم شوند.

بنابراین هنوز ادعا نمی‌شود که Email confirmation و persistence مرورگر روی Current public deployment پاس شده‌اند.

## Read first

- [`docs/NEOFIT_MASTER_PLAN.md`](docs/NEOFIT_MASTER_PLAN.md)
- [`docs/NEOFIT_PROGRESS_LOG.md`](docs/NEOFIT_PROGRESS_LOG.md)
- [`docs/DEVELOPMENT_HANDOFF.md`](docs/DEVELOPMENT_HANDOFF.md)
- [`docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md`](docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md)
- [`docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`](docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md)

## Locked rules

- Shared Core تنها مرجع Nutrition است.
- Missing nutrient صفر نیست؛ unknown grams برابر `null` است.
- SQL و UI Nutrition را دوباره محاسبه نمی‌کنند.
- هر Table کاربرمحور RLS دارد.
- Browser privileged credential ندارد.
- Schema فقط با Migration تغییر می‌کند.
- Guest و Account data path شفاف و جدا هستند.
- Merge یا Production بدون Runtime Evidence انجام نمی‌شود.

## Exact next

1. Vercel Preview/Production public Supabase Env تنظیم شود.
2. Supabase Site/Redirect URL تنظیم شود.
3. Current head پس از Reset quota Deploy شود.
4. Temporary real-account signup/signin/meal/profile/signout round-trip تست شود.
5. Test data پاک و Runtime Evidence ثبت شود.
6. سپس PR #36 با Workout Player، Onboarding و Coach ادامه یابد.

# NeoFit AI

NeoFit یک PWA فارسی و Mobile-first برای تغذیه و تمرین است. رابط وب با Next.js App Router ساخته می‌شود، محاسبات تغذیه فقط از Shared Nutrition Core می‌آیند و دادهٔ حساب با Supabase Auth/Postgres/RLS نگهداری می‌شود.

## مسیر فعال توسعه

```text
repository: Emad211/Neofit-ai
architecture base: web/pwa-foundation
active branch: web/full-frontend-integration
active Draft PR: #36
frontend UX reference: revival/full-ui-front / Draft PR #34
```

`master` شاخهٔ ادامهٔ وب نیست. PR #34 مرجع کامل UX محلی است؛ کد Production-connected به‌صورت مرحله‌ای داخل PR #36 Port می‌شود و PR #34 مستقیماً Merge نمی‌شود.

## معماری قفل‌شده

- Next.js App Router + strict TypeScript در `web/`
- فارسی و RTL
- `packages/nutrition-core` تنها مرجع محاسبات تغذیه
- IFKB + USDA SR Legacy + FNDDS به‌عنوان مرجع داده
- Supabase Auth + Postgres + own-row RLS
- Guest Browser-local fallback
- Service Worker فقط برای shell و دادهٔ عمومی قابل Cache
- بدون Service Role یا Secret سروری در Browser
- بدون محاسبهٔ دوبارهٔ Nutrition در SQL یا React
- بدون Queue، Event Bus، IndexedDB یا Background Sync در برش فعلی

## وضعیت پیاده‌سازی

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

### Routeهای متصل فعلی

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

### پایداری Auth و Guest state

برش جاری این موارد را سخت‌سازی می‌کند:

- Bootstrap حساب فقط ردیف‌های مفقود را می‌سازد و Login مجدد نام، Settings یا Nutrition Goals موجود را Reset نمی‌کند.
- تاریخ Diary با Timezone پروفایل و پیش‌فرض `Asia/Tehran` ساخته می‌شود؛ UTC slicing حذف شده است.
- تاریخ جاری هنگام Focus، Visibility change و عبور زمان به‌روز می‌شود.
- Local diary با Envelope نسخه‌دار ذخیره می‌شود.
- آرایهٔ خالی معتبر بعد از Refresh حفظ می‌شود.
- Payload محلی پیش از استفاده اعتبارسنجی می‌شود.
- Meal label و Macro view از دادهٔ معتبر Core دوباره مشتق می‌شوند و مقدار دست‌کاری‌شدهٔ ذخیره‌شده مورد اعتماد نیست.
- مسیر Legacy array برای مهاجرت Storage قبلی حفظ شده است.

## Vercel

تنها پروژهٔ کانونیکال:

```text
project: neofit-ai
project id: prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
release branch: vercel/preview
stable Preview alias: neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
latest proven release deployment: dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy
state: READY
```

Development commitها توسط Ignored Build Step قبل از install/build متوقف می‌شوند، ولی Vercel همچنان ممکن است یک رکورد کوتاه `CANCELED` بسازد. بنابراین تغییرات باید Batch شوند و `vercel/preview` فقط یک بار پس از سبزشدن کامل CI به‌روزرسانی شود.

این سه Probe هنوز Product نیستند و باید از Dashboard حذف شوند:

```text
neofit-direct-probe
neofit-file-ref-probe
neofit-ui-public-probe
```

## Environment لازم برای Runtime واقعی

Preview کانونیکال به هر سه مقدار زیر نیاز دارد:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=https://neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
```

مقادیر واقعی در Git، Docs یا Artifact ثبت نمی‌شوند. Supabase Site URL و Redirect URLها نیز باید با Alias ثابت بالا هماهنگ شوند.

## مرز ادعا

ثابت شده است:

- Build، TypeScript، Shared Core parity، PWA guest flow و قرارداد Auth در CI سبز بوده‌اند.
- Canonical Preview واقعی Next.js ساخته شده و Runtime error cluster آن صفر بوده است.
- Schema، RLS و Advisorهای Supabase سالم‌اند.

هنوز ثابت نشده است:

- Signup/confirmation واقعی روی Preview دارای Environment؛
- Cookie round-trip واقعی؛
- ثبت وعده در Remote و ماندگاری پس از sign-out/sign-in؛
- فرانت کامل PR #34 داخل معماری جاری؛
- Production.

## منابع اجباری

1. `docs/NEOFIT_MASTER_PLAN.md`
2. `docs/NEOFIT_PROGRESS_LOG.md`
3. `docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`
4. `docs/NEOFIT_VERCEL_CANONICAL_PREVIEW.md`
5. `docs/DEVELOPMENT_HANDOFF.md`
6. وضعیت زندهٔ PR، CI، Vercel و Supabase

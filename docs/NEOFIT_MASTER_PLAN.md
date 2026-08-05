# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۵ اوت ۲۰۲۶ — Schema، RLS و Nutrition persistence ادغام شده‌اند؛ Auth/Application wiring روی PR #36 سبز است و منتظر Runtime عمومی است  
**Integration branch:** `web/pwa-foundation`  
**Active product branch/PR:** `web/full-frontend-integration` / Draft PR #36  
**Frontend reference branch/PR:** `revival/full-ui-front` / Draft PR #34  
**Supabase project:** `rjwrobltmjodfarnltal`

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل، `NEOFIT_PROGRESS_LOG.md` و `DEVELOPMENT_HANDOFF.md` خوانده شوند.
2. Evidence مرحلهٔ فعال و وضعیت واقعی Branch/HEAD/PR/CI بررسی شود.
3. Supabase و Vercel از Connector زنده بررسی شوند.
4. فقط Exact continuation point اجرا شود.

در پایان هر برش:

- Master Plan، Progress Log، Handoff و Evidence فعال همگام شوند.
- Commit، Run، Artifact، Failure و Correction ثبت شوند.
- هیچ Auth، Deployment، Persistence یا Runtime بدون شاهد اعلام نشود.

## ۲. قراردادهای قفل‌شده

- Web: Next.js App Router + strict TypeScript در `web/`.
- Nutrition authority: فقط `packages/nutrition-core`.
- Data authority: IFKB + USDA SR Legacy + FNDDS.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- SQL و React Nutrition arithmetic را تکرار نمی‌کنند.
- AI/Vision عدد تغذیه‌ای اختراع یا اصلاح نمی‌کند.
- Schema authority فقط `supabase/migrations/*.sql` است.
- هر Table کاربرمحور پیش از استفاده RLS دارد.
- Browser فقط Publishable configuration دریافت می‌کند؛ privileged credential ممنوع است.
- Identity محافظت‌شده از `getClaims()` استفاده می‌کند.
- HTML حساب وارد Cache عمومی PWA نمی‌شود.
- فرانت قدیمی مستقیماً Merge نمی‌شود؛ UI داخل معماری فعلی Port می‌شود.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12 |
| 1 Persian RTL UX | complete/accepted | PR #13 |
| 2A PWA Foundation | complete | PR #15 |
| 2B Vercel HTTPS | parallel/open | Issue #16 / PR #28 |
| 3 Nutrition Core/Web parity | complete | Core `52/52`، Web `9/9` |
| 4A Supabase Project | complete | Project `rjwrobltmjodfarnltal` |
| 4B SSR/Auth foundation | complete/merged | PR #30 |
| 4C Identity schema/RLS | complete/merged | PR #33، merge `c7de309…` |
| 4D Nutrition persistence | complete/merged | PR #35، merge `9424176…` |
| Frontend reference | complete/separate | PR #34، 42 routes |
| Frontend architecture integration | active، major routes complete | Draft PR #36 |
| Auth + Application persistence wiring | implemented، all CI green | head `f5f5a6…`، Auth Evidence |
| Public Auth runtime | not yet proven | نیازمند Vercel Env + deploy جدید |
| Workout Player/Onboarding/Coach port | remaining | PR #36 ادامه می‌یابد |

## ۴. Supabase Project و Schema

```text
project: neofit
ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
```

Migrations:

```text
20260804232149_identity_foundation.sql
20260805132201_nutrition_persistence.sql
```

Tables:

```text
profiles
user_settings
nutrition_goals
nutrition_entries
```

همهٔ Tableها:

- owner-linked به `auth.users`؛
- دارای RLS و own-row policies؛
- بدون grant برای `anon`/`PUBLIC`؛
- دارای generated TypeScript types؛
- بدون SQL Nutrition calculation.

Stage 4C merge:

```text
PR #33
merge: c7de309fd3f62fe6e58f1e603c3c9745a3013dcd
```

Stage 4D merge:

```text
PR #35
merge: 942417641f69eeb1c6990a321efef0d9a277a994
```

Runtime RLS، `grams: null`، missing nutrients، duplicate mutation denial و cross-user denial قبلاً اثبات شده‌اند. Security و Performance Advisors هنگام DDL هر دو صفر بودند.

## ۵. فرانت جاری داخل معماری فعلی

Branch/PR:

```text
web/full-frontend-integration
Draft PR #36
```

Routeهای کاربردی فعلی:

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

پیاده‌سازی فعلی:

- پوسته فارسی RTL و Bottom Navigation؛
- Today و ثبت وعده؛
- جست‌وجو و Portion بر پایه Shared Core؛
- برنامه غذایی؛
- Workout overview/details؛
- Progress سبک و بدون Chart library؛
- Profile مهمان/حساب؛
- PWA و Offline guest shell؛
- Auth email/password؛
- PKCE و token confirmation callbacks؛
- sign-out سروری؛
- bootstrap `profiles`، `user_settings` و `nutrition_goals`؛
- read/write واقعی `nutrition_entries` برای حساب؛
- local Browser fallback برای مهمان؛
- rollback فوری ثبت غذا هنگام Remote failure؛
- بدون Queue، Event Bus، IndexedDB یا Background Sync.

## ۶. Auth و Persistence Evidence

Validated code head:

```text
f5f5a6f60c15d09793f9ea416f1fe721b6d9e740
```

CI:

```text
Identity CI 31032483010 — success
Nutrition Persistence CI 31032481404 — success
Foundation CI 31032481373 — success
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
- Browser responsive matrix؛
- no-config Auth safety؛
- PWA install/control/offline guest navigation؛
- عدم Cache شدن Auth و private/no-store HTML؛
- عدم privileged key یا Nutrition arithmetic تکراری.

Authority:

- `docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`

## ۷. Claim boundaries

ثابت شده است:

- Stage 4C و 4D Merge شده‌اند؛
- Schema/RLS/Types و Remote denialها صحیح‌اند؛
- Auth UI/Actions/Callbacks/Sign-out پیاده‌سازی و تست قراردادی شده‌اند؛
- حساب به چهار Table موجود وصل شده است؛
- Guest mode بدون Env سالم و آفلاین است؛
- Current code head تمام CIها را پاس می‌کند.

هنوز ثابت نشده است:

- sign-up/confirmation واقعی روی Current Vercel head؛
- Cookie round-trip واقعی روی Vercel؛
- ثبت یک وعده از مرورگر و مشاهدهٔ آن در Remote با Session واقعی؛
- باقی‌ماندن داده بعد از sign-out/sign-in و دستگاه دوم؛
- Production promotion؛
- Workout Player، Onboarding کامل و Coach در معماری جاری.

مانع فعلی Runtime: Vercel Free-plan daily deployment limit. آخرین Ready Preview قبل از Current Auth head ساخته شده است.

## ۸. Exact continuation point

1. مقادیر عمومی Supabase در Vercel Preview/Production تنظیم شوند، بدون ثبت مقدار در Git/docs.
2. Site URL و Redirect URLهای Supabase برای دامنه‌های انتخاب‌شده تنظیم شوند.
3. Current code head بعد از Reset سهمیه Vercel Deploy شود.
4. یک حساب موقت واقعی ساخته و مسیر زیر Browser-test شود:
   - signup/confirm یا signin؛
   - bootstrap سه ردیف اولیه؛
   - ثبت وعده در `nutrition_entries`؛
   - ویرایش نام؛
   - sign-out/sign-in و persistence؛
   - cleanup کامل.
5. Runtime Evidence ثبت شود.
6. سپس PR #36 با برش‌های باقی‌ماندهٔ Workout Player، Onboarding و Coach ادامه یابد.
7. بدون Evidence Runtime، PR #36 Merge یا Production نشود.

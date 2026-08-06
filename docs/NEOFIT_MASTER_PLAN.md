# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۶ اوت ۲۰۲۶  
**Architecture base:** `web/pwa-foundation`  
**Active branch/PR:** `web/full-frontend-integration` / Draft PR #36  
**Frontend reference:** `revival/full-ui-front` / Draft PR #34  
**Supabase project:** `rjwrobltmjodfarnltal`

## ۱. پروتکل ادامه

پیش از هر تغییر:

1. Master Plan، Progress Log، Active Evidence و Handoff خوانده شوند.
2. Branch/HEAD/PR/CI و وضعیت زندهٔ Vercel/Supabase بررسی شوند.
3. فقط Exact continuation point اجرا شود.
4. یک Product slice کامل در یک Commit تجمیعی نوشته شود.
5. `vercel/preview` فقط پس از سبزشدن کامل CI و فقط یک بار به‌روزرسانی شود.

هیچ Auth، Runtime، Persistence، Deployment یا Production بدون شاهد واقعی اعلام نمی‌شود.

## ۲. قراردادهای قفل‌شده

- Web: Next.js App Router + strict TypeScript.
- Nutrition authority: فقط `packages/nutrition-core`.
- Data authority: IFKB + USDA SR Legacy + FNDDS.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- SQL و React Nutrition arithmetic را تکرار نمی‌کنند.
- Schema فقط با Migration نسخه‌دار تغییر می‌کند.
- تمام Tableهای کاربرمحور RLS مالک‌محور دارند.
- Browser فقط Publishable configuration دریافت می‌کند.
- Identity محافظت‌شده از `getClaims()` استفاده می‌کند.
- HTML حساب وارد Cache عمومی PWA نمی‌شود.
- PR #34 فقط مرجع UX است و مستقیماً Merge نمی‌شود.
- Production promotion تا تأیید صریح ممنوع است.

## ۳. وضعیت مراحل

| بخش | وضعیت |
|---|---|
| Pivot به Web/PWA | complete |
| Persian RTL UX foundation | complete/accepted |
| PWA foundation | complete |
| Shared Nutrition Core/Web parity | complete |
| Supabase project + SSR/Auth foundation | complete/merged |
| Identity schema/RLS | complete/merged |
| Nutrition persistence | complete/merged |
| Full local frontend reference | complete/separate on PR #34 |
| Current architecture UI integration | active on PR #36 |
| Auth/Application wiring | implemented and CI-proven |
| Auth/Guest state hardening | active slice |
| Public real-account runtime | not yet proven |
| Full Workout Player/Onboarding/Coach port | remaining |
| Production | prohibited/pending |

## ۴. Supabase contract

```text
project: neofit
ref: rjwrobltmjodfarnltal
region: eu-central-1
status: ACTIVE_HEALTHY
```

Tables:

```text
profiles
user_settings
nutrition_goals
nutrition_entries
```

Live reconstruction on ۶ اوت ۲۰۲۶ showed:

```text
auth users: 0
profiles: 0
user_settings: 0
nutrition_goals: 0
nutrition_entries: 0
security advisors: 0
performance advisors: 0
```

این وضعیت ثابت می‌کند هنوز real-account Runtime اجرا نشده است.

## ۵. Current frontend boundary

Connected routes:

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

واقعی و متصل:

- email/password Auth؛
- PKCE و token confirmation؛
- server sign-out؛
- verified claims؛
- bootstrap سه ردیف اولیه؛
- read/write `nutrition_entries`؛
- display-name persistence؛
- Guest local diary؛
- optimistic insert و rollback؛
- private/no-store account HTML؛
- Shared Core calculations.

هنوز Demo یا ناقص:

- Catalog فعلی فقط Fixtureهای محدود وب است؛
- Workout Player فعال نیست؛
- Progress و برخی Profile metrics نمایشی‌اند؛
- Onboarding، Body Map، Coach، Notification Center و routeهای کامل PR #34 Port نشده‌اند.

## ۶. Hardening slice فعلی

هدف این برش رفع سه Failure قطعی بدون Schema یا UI redesign است:

1. **Non-destructive bootstrap**  
   `profiles`، `user_settings` و `nutrition_goals` فقط در صورت فقدان ساخته می‌شوند. Login مجدد دادهٔ موجود را Reset نمی‌کند.

2. **Timezone-correct diary date**  
   تاریخ UTC slicing حذف و Timezone پروفایل/`Asia/Tehran` استفاده می‌شود. تاریخ هنگام Focus و Visibility change به‌روز می‌شود.

3. **Validated local persistence**  
   Storage نسخه‌دار، Empty diary معتبر، Legacy migration، محدودیت تعداد/طول و بازسازی Macro/Meal label از Core اضافه می‌شود.

هیچ Table، Queue، Event Bus، IndexedDB یا Background Sync اضافه نمی‌شود.

## ۷. Vercel contract

Canonical project:

```text
neofit-ai
prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
```

Canonical release:

```text
branch: vercel/preview
release commit: 32eeb867742e949d7d6e9d5a3002bcff02d11fd1
deployment: dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy
state: READY
alias: neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
```

سه Probe هنوز باید دستی حذف شوند. Project Dashboard همچنین باید روی Next.js و Node 22 همگام شود؛ قرارداد Git در حال حاضر Next.js `16.2.12` و Node `22.x` است.

Environment کامل Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=<stable Preview alias>
```

## ۸. Exact continuation point

1. Hardening slice فعلی TypeScript، unit/contract tests، build و browser gates را پاس کند.
2. CI evidence در PR #36 ثبت شود.
3. مالک پروژه سه Probe را در Vercel Dashboard حذف کند.
4. مالک پروژه Framework/Node و سه Environment را روی `neofit-ai` تنظیم کند.
5. Supabase Site URL و Redirect URLها روی Alias ثابت تنظیم شوند.
6. فقط یک‌بار `vercel/preview` به HEAD سبز به‌روزرسانی شود.
7. temporary account scenario اجرا شود: signup/confirm، bootstrap، add meal، edit name، sign-out/in، persistence.
8. rows و account آزمایشی پاک و Runtime Evidence ثبت شوند.
9. سپس Workout Player، Onboarding/Body Map و Coach به‌ترتیب Port شوند.
10. بدون Runtime proof، PR #36 Merge یا Production نشود.

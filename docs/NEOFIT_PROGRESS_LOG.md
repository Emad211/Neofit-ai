# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**آخرین به‌روزرسانی:** ۶ اوت ۲۰۲۶  
**Active branch:** `web/full-frontend-integration`  
**Draft PR:** #36

## وضعیت پایهٔ اثبات‌شده

```text
Shared Nutrition Core: 52/52
Web Nutrition Adapter: 9/9
Supabase project: ACTIVE_HEALTHY
Identity schema/RLS: merged
Nutrition persistence: merged
Canonical Vercel Preview: READY
Vercel runtime error clusters: 0
```

Canonical Preview:

```text
project: neofit-ai
release branch: vercel/preview
deployment: dpl_2VARJ7A2EyEtUkU9aKU2DeTAxEHy
alias: neofit-ai-git-vercel-preview-emads-projects-41cb6447.vercel.app
```

## Live reconstruction — ۶ اوت ۲۰۲۶

- PR #36 باز، Draft و Mergeable است.
- Parent head پیش از Hardening slice: `a85043f608ad35d8971492d6b386d236c20d589b`.
- تمام Workflowهای Parent head سبز بودند.
- Supabase Security و Performance Advisors صفر بودند.
- تعداد Auth user و تمام ردیف‌های چهار جدول صفر بود.
- سه Vercel Probe هنوز واقعاً وجود داشتند و حذف نشده بودند.
- Project settings زندهٔ Vercel `framework: null` و `nodeVersion: 24.x` نشان می‌داد، درحالی‌که قرارداد ریپو Next.js و Node 22 است.

## یافته‌های Hardening

### Failure 1 — destructive account bootstrap

`bootstrapAccount()` در Sign-in و Callback با `upsert` معمولی اجرا می‌شد و می‌توانست نام، Theme/Units و Nutrition goals ویرایش‌شده را در هر Login به Default برگرداند.

اصلاح:

- Bootstrap به ماژول مستقل منتقل شد.
- `onConflict` صریح برای Primary key هر Table اضافه شد.
- `ignoreDuplicates: true` اضافه شد.
- سه insert به‌صورت موازی باقی ماندند.
- هیچ Migration یا Trigger جدیدی ساخته نشد.

### Failure 2 — UTC diary date

تاریخ با `new Date().toISOString().slice(0, 10)` ساخته می‌شد و نزدیک نیمه‌شب می‌توانست روز اشتباه را ثبت کند.

اصلاح:

- Helper مستقل Timezone-aware اضافه شد.
- Timezone پروفایل از `profiles.timezone` خوانده می‌شود.
- fallback برابر `Asia/Tehran` است.
- تاریخ هنگام Focus، Visibility change و هر ۶۰ ثانیه بازبینی می‌شود.
- ثبت و Summary از Local date جاری استفاده می‌کنند.

### Failure 3 — unsafe/incorrect local diary recovery

Storage قبلی:

- آرایهٔ خالی معتبر را بازیابی نمی‌کرد؛
- JSON را بدون Shape validation به State می‌داد؛
- Macro و Meal label ذخیره‌شده را مورد اعتماد قرار می‌داد؛
- خطای `localStorage.setItem` را مدیریت نمی‌کرد.

اصلاح:

- Envelope نسخه‌دار `version: 1`؛
- Legacy array migration؛
- پذیرش صحیح Empty diary؛
- validation برای ID، Date، Meal/source type، Timestamp، Estimate و nutrient values؛
- محدودیت ۱۰۰۰ Entry و طول متن؛
- مشتق‌سازی دوبارهٔ Macro و Meal label از Core estimate؛
- fail-closed fallback و پیام خطای شفاف؛
- مدیریت خطای Persistent storage.

## تست‌های اضافه‌شده

```text
web/tests/account-bootstrap.test.ts
web/tests/local-date.test.ts
web/tests/web-diary-storage.test.ts
```

`test:supabase-app` اکنون این تست‌های رفتاری را همراه Contract test قبلی اجرا می‌کند.

Local pre-push validation روی Source Bundle آخرین Web CI:

- changed TypeScript files transpile without syntax diagnostics؛
- Timezone boundary UTC/Asia-Tehran پاس؛
- invalid timezone fallback پاس؛
- Storage round-trip و Empty diary پاس؛
- tampered/negative estimate rejection پاس؛
- Macro/Meal label normalization پاس؛
- insert-only Bootstrap contract پاس.

GitHub CI نتیجهٔ نهایی این Slice را پس از Push تعیین می‌کند؛ تا آن زمان `vercel/preview` تغییر نمی‌کند.

## External manual actions pending

1. حذف `neofit-direct-probe`، `neofit-file-ref-probe` و `neofit-ui-public-probe` از Vercel Dashboard.
2. همگام‌کردن Framework روی Next.js و Node روی 22.x برایا پروژه `Neofit-ai`.
3. تنظیم Supabase Site URL و Redirect URL.

## Exact next

پس از سبزشدن CI همین Slice، اقدامات دستی بالا انجام و سپس فقط یک Preview release ساخته می‌شود. بعد از real-account Runtime proof، توسعه با Workout Player ادامه می‌یابد.

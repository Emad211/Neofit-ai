# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۵ اوت ۲۰۲۶ — Stage 4C پیاده‌سازی و روی Remote اثبات شده؛ PR #33 هنوز Draft و unmerged است  
**Integration branch:** `web/pwa-foundation`  
**Stage 4C branch/PR:** `stage4c/identity-schema-rls` / #33  
**Frontend-complete branch/PR:** `revival/full-ui-front` / #34  
**Stage 4 Issue:** #25  
**Stage 2B Issue/PR:** #16 / #28 — مستقل و باز  
**مرحلهٔ بعد پس از Merge Stage 4C:** Stage 4D — Nutrition persistence

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` و `docs/DEVELOPMENT_HANDOFF.md` خوانده شوند.
3. سند Stage فعال و Evidenceهای Stageهای قبلی خوانده شوند.
4. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
5. فقط Exact continuation point اجرا شود.

در پایان هر برش:

- Master Plan، Progress Log، Handoff و سند Stage همگام شوند.
- Commit، Run، Artifact، Failure، Correction و نقطهٔ ادامه ثبت شوند.
- هیچ Build، Deployment، Migration، RLS، Parity یا Accuracy بدون Evidence اعلام نشود.
- حافظهٔ مکالمه جای ریپو، CI یا Connector state را نمی‌گیرد.

## ۲. قراردادهای قفل‌شده

- Web architecture: Next.js App Router + strict TypeScript در `web/`.
- Shared Nutrition authority: `packages/nutrition-core`.
- Data authority: IFKB + USDA SR Legacy + FNDDS.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- SQL و React Nutrition arithmetic را تکرار نمی‌کنند.
- Schema authority فقط `supabase/migrations/*.sql` است.
- هر Table exposed و user-owned پیش از Application use باید RLS داشته باشد.
- privileged credential هرگز وارد Browser، Client Component، log یا Artifact نمی‌شود.
- Browser client و Server client جدا هستند.
- Protected identity path از `getClaims()` استفاده می‌کند و فقط به `getSession()` متکی نیست.
- Session-bearing response باید `private, no-store` باشد.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.
- فرانت کامل PR #34 مستقیماً با شاخهٔ معماری Merge نمی‌شود؛ انتقال باید کنترل‌شده و داخل `web/` باشد.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12 |
| 1 Persian RTL UX | complete/accepted | PR #13 |
| 2A PWA Foundation | complete | PR #15 |
| 2B Vercel HTTPS | active/parallel | Issue #16، Draft PR #28 |
| 3 Nutrition Core/Web parity | complete | PR #18–#24، Core `52/52`، Web `9/9` |
| 4A Supabase Project | complete | Project `rjwrobltmjodfarnltal` |
| 4B Supabase SSR foundation | complete/merged | PR #30، merge `17d0e8c…` |
| 4C Identity schema/RLS | implementation + remote proof complete؛ unmerged | Draft PR #33، Evidence Stage 4C |
| 4D Nutrition persistence | not started | فقط بعد از Merge 4C |
| Frontend completion | complete؛ separate/unmerged | Draft PR #34، 42 routes + browser matrix |
| 5–9 | not started | مطابق Roadmap |

## ۴. Supabase Project

```text
name: neofit
project ref: rjwrobltmjodfarnltal
organization: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
postgres: 17.6.1.155
```

- هزینه هنگام ایجاد Project برابر `0 monthly` تأیید شد.
- هیچ key value در Git/docs ثبت نشده است.
- هیچ privileged key در Browser استفاده نشده است.

Authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`

## ۵. Stage 4B — complete and merged

پیاده‌سازی:

```text
supabase/config.toml
web/lib/supabase/env.ts
web/lib/supabase/client.ts
web/lib/supabase/server.ts
web/lib/supabase/proxy.ts
web/proxy.ts
web/.env.example
web/tests/supabase-foundation.test.ts
.github/workflows/supabase-foundation-ci.yml
```

Dependencyهای pin‌شده:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

قفل‌ها:

- fail-closed env validation؛
- Browser `createBrowserClient`؛
- server-only cookie-aware `createServerClient`؛
- request/response cookie synchronization؛
- `auth.getClaims()` identity refresh؛
- عدم اتکا به `getSession()` برای authorization؛
- `private, no-store` session responses؛
- عدم وجود migration در خود Stage 4B.

```text
PR #30 merge: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
Closure merge: 72202f2f0ff281bf0624b9ebb933ac5afeaad8fc
```

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`

## ۶. Stage 4C — implementation and remote proof complete

Branch/PR:

```text
stage4c/identity-schema-rls
Draft PR #33
validated implementation head: c5cface86f46134a4a0afcfc3c980f7ce613ee7a
```

Migration authority:

```text
supabase/migrations/20260804232149_identity_foundation.sql
remote migration version: 20260804232149
remote migration name: identity_foundation
```

Remote tables:

```text
profiles       RLS enabled
user_settings  RLS enabled
```

Ownership:

- `profiles.id = auth.uid()`
- `user_settings.user_id = auth.uid()`

Remote proof:

- هشت policy own-row برای SELECT/INSERT/UPDATE/DELETE؛
- UPDATE دارای `USING` و `WITH CHECK`؛
- فقط role `authenticated` چهار privilege لازم را دارد؛
- `anon` و `PUBLIC` grant ندارند؛
- Security advisors: `0`؛
- Performance advisors: `0`؛
- types مستقیماً از Remote schema تولید شده‌اند.

Runtime denial scenarios — همه پاس:

```text
anon_read_denied
user_a_reads_own
user_a_cannot_read_b
user_a_cannot_update_b
user_a_cannot_delete_b
user_a_cannot_insert_as_b
ownership_change_denied
```

Cleanup:

```text
profiles rows: 0
user_settings rows: 0
auth users: 0
```

CI:

```text
Identity CI 30996283909 — success
Artifact 8926287946
Digest sha256:192ae440dfb98fb2329249fb3b1f0c881841b5774d2ec642c63efdd6f34fcfe9

Foundation CI 30996283993 — success
Artifact 8926292359
Digest sha256:528deb7235762d631751f5a6d8b469fe6a7291e49900b6e2f30c7c4f0ee9b549

Web CI 30996283899 — success
Artifact 8926312456
Digest sha256:60064bab80150fcb72c0952d29a2466625d4b11d1dcd667ee2d628d617deecc2

Vercel Build Contract 30996283903 — success
```

Authority:

- `docs/NEOFIT_STAGE4C_IDENTITY_RLS_EVIDENCE.md`

Stage 4C تا زمان Merge PR #33 «merged complete» محسوب نمی‌شود.

## ۷. Frontend completion — separate proven branch

فرانت کامل فارسی روی شاخهٔ مستقل زیر بسته شده است:

```text
branch: revival/full-ui-front
Draft PR: #34
validated runtime head: d36a67b001a280fefbba6c676e69fb4f22ff20b2
UI Revival CI: 30994858208 — success
Public Static Export: 30994858276 — success
Public RawGitHack Preview: 30994858167 — success
routes: 42/42
```

پوشش:

- Onboarding پانزده‌مرحله‌ای و Body Map قدیمی ۷۳ ناحیه‌ای؛
- Today، Workout، Nutrition، Progress؛
- Profile/Settings/Notifications؛
- Coach محلی با مرز پزشکی؛
- PWA، Offline، 404، Error، Keyboard focus و reduced-motion.

این شاخه معماری Supabase/Shared Core فعلی را در `web/` ندارد. ادغام صحیح:

1. از شاخهٔ معماری فعلی branch جدید ساخته شود؛
2. UI به‌صورت کنترل‌شده داخل `web/` منتقل شود؛
3. Supabase SSR و Shared Nutrition Core حفظ شوند؛
4. همان browser gates روی Adapterهای واقعی اجرا شوند.

Merge مستقیم دو شاخه ممنوع است.

## ۸. Stage 4D — exact next after Stage 4C merge

حداقل scope:

- `nutrition_goals`؛
- `nutrition_entries`؛
- ownership و RLS پیش از use؛
- persistence خروجی نسخه‌دار Shared Core؛
- عدم Nutrition recalculation در SQL؛
- حفظ missing nutrient و `grams: null`؛
- `client_mutation_id` برای idempotency؛
- round-trip و cross-user denial tests؛
- generated types و advisor proof.

## ۹. Claim boundaries

ثابت شده است:

- Project healthy است؛
- Stage 4B merged است؛
- Stage 4C schema/RLS/types/remote runtime proof کامل است؛
- فرانت کامل به‌صورت مستقل browser-proven است.

هنوز ثابت نشده است:

- Merge Stage 4C؛
- Login/Signup/callback واقعی در فرانت کامل؛
- Vercel Supabase env rollout؛
- Nutrition persistence؛
- اتصال PR #34 به معماری `web/`؛
- Production public deployment نهایی؛
- multi-device sync، online Coach، private photo storage و push delivery.

## ۱۰. Exact continuation point

1. اسناد، Issue #25 و PR #33 با Evidence Stage 4C همگام شوند.
2. CI آخرین documentation head بررسی شود.
3. PR #33 Draft و unmerged بماند تا تأیید صریح کاربر.
4. پس از تأیید، PR #33 Merge و Stage 4C closure ثبت شود.
5. سپس یک branch متمرکز Stage 4D از Integration head ساخته شود و با red migration/RLS tests آغاز گردد.
6. ادغام فرانت PR #34 در branch جدا از معماری فعلی برنامه‌ریزی شود؛ نه با Merge مستقیم.
7. Stage 2B Issue #16 / PR #28 مستقل و باز بماند.

# دفتر پیشرفت NeoFit

**نقش:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۵ اوت ۲۰۲۶ — Auth و Application persistence روی PR #36 پیاده‌سازی و تمام CIها سبز شد؛ Runtime عمومی هنوز Deploy نشده است

## نمای کلی

| بخش | وضعیت | شواهد |
|---|---|---|
| Shared Nutrition Core | complete | `52/52` |
| Web Nutrition Adapter | complete | `9/9` |
| Supabase SSR foundation | complete/merged | PR #30 |
| Identity schema/RLS | complete/merged | PR #33، `c7de309…` |
| Nutrition persistence | complete/merged | PR #35، `9424176…` |
| Full frontend reference | complete/separate | PR #34 |
| Current Web UI integration | active، major routes complete | PR #36 |
| Auth/Application wiring | implemented، all CI green | `f5f5a6…` |
| Public Auth runtime | pending | Vercel Env + deployment quota |

---

## Stage 4C closure

PR #33 Merge شد:

```text
merge: c7de309fd3f62fe6e58f1e603c3c9745a3013dcd
migration: 20260804232149_identity_foundation.sql
```

Remote contract:

- `profiles` و `user_settings`؛
- RLS و هشت own-row policy؛
- authenticated grants only؛
- anon/PUBLIC بدون grant؛
- Runtime cross-user denial پاس؛
- Advisors صفر؛
- cleanup کامل.

---

## Stage 4D closure

PR #35 Merge شد:

```text
merge: 942417641f69eeb1c6990a321efef0d9a277a994
migration: 20260805132201_nutrition_persistence.sql
```

Remote contract:

- `nutrition_goals`؛
- `nutrition_entries`؛
- Shared Core JSON persistence؛
- `grams: null` و missing nutrient حفظ می‌شوند؛
- unique `(user_id, client_mutation_id)`؛
- own-row RLS؛
- duplicate/cross-user/ownership denial پاس؛
- Advisors صفر؛
- cleanup کامل.

---

## Frontend integration — PR #36

Branch:

```text
web/full-frontend-integration
```

برش‌های سبز پیش از Auth:

- Routeهای واقعی Today، Nutrition و Nutrition Plan؛
- Shared local diary state؛
- Workout overview و سه detail route؛
- Progress سبک؛
- Profile شفاف مهمان؛
- Guest PWA و Offline؛
- بدون کتابخانه یا Table جدید.

آخرین Evidence قبل از Auth:

```text
head: 96d2d83cf900e0c6abe9982050b44576cd5c0720
Web CI 31014490720 — success
Artifact 8933909171
```

---

## Auth + Application persistence slice

### پیاده‌سازی

- email/password Server Actions؛
- PKCE callback و email token confirm؛
- sign-out سروری؛
- verified-claims Proxy؛
- typed Browser/Server clients؛
- account bootstrap برای `profiles`، `user_settings` و `nutrition_goals`؛
- account snapshot از `profiles`، `nutrition_goals` و `nutrition_entries`؛
- ثبت/حذف Remote وعده‌ها با RLS؛
- ویرایش نام نمایشی؛
- guest local fallback؛
- optimistic insert + rollback؛
- no queue/event bus/IndexedDB/background sync؛
- Auth/private HTML خارج از PWA cache.

### Failure 1 — TypeScript claims narrowing

```text
head: 90d3c5fb9bc659dc5a731f0b08723cfb4f8a75b7
Web CI 31031537217 — failure
```

علت:

```text
claims possibly undefined هنگام خواندن email
```

اصلاح:

- email claim مستقیماً از `claimsData?.claims?.email` narrow شد.

### Failure 2 — Guest PWA cache boundary

پس از سبزشدن TypeScript، Browser gate نشان داد `force-dynamic` Guest shell را هم `no-store` می‌کند.

اصلاح:

- `force-dynamic` حذف شد؛
- بدون Supabase Env، main routes Static هستند؛
- با Env/Cookies، Next مسیر حساب را Dynamic می‌کند؛
- Proxy فقط Session تأییدشده را `private, no-store` می‌کند؛
- Service Worker private HTML را skip و guest snapshot قبلی را حذف می‌کند.

### Failure 3 — outdated greeting assertion

PWA route صحیح آفلاین باز شد، ولی تست هنوز متن قدیمی «سلام عماد» را انتظار داشت.

اصلاح:

- Assertion به greeting خنثی مهمان تغییر کرد؛ کد محصول تغییر نکرد.

### Green checkpoint

```text
validated code head: f5f5a6f60c15d09793f9ea416f1fe721b6d9e740

Identity CI 31032483010 — success
Nutrition Persistence CI 31032481404 — success
Foundation CI 31032481373 — success
Vercel Build Contract 31032481435 — success
Web CI 31032481411 — success
Artifact 8941255661
Digest sha256:f0e57c1b940f6b17a67e5562814ddd2ff3f70f13a59a51d11e3efdc25a808172
```

Web CI:

```text
TypeScript: success
Web Adapter: 9/9
Supabase Application integration: 9/9
Production build: success
Visual routes: success
No-config Auth: success
PWA guest offline navigation: success
Private Auth cache boundary: success
```

Authority:

- `docs/NEOFIT_AUTH_PERSISTENCE_INTEGRATION_EVIDENCE.md`

---

## Runtime boundary

کد Current Head روی Vercel عمومی اثبات نشده است.

- آخرین Ready Preview قبل از Current Auth Head است.
- Deployهای جدید به سقف روزانهٔ Free plan خورده‌اند.
- Connector موجود امکان ثبت Environment variable در Vercel را ارائه نمی‌دهد.
- هیچ Publishable key value در Git یا docs ثبت نشده است.

## Exact continuation point

1. Vercel Preview/Production Env برای URL و Publishable key تنظیم شود.
2. Supabase Redirect URLها با دامنهٔ واقعی همگام شوند.
3. Current Head بعد از Reset quota Deploy شود.
4. یک حساب موقت واقعی و Browser round-trip کامل تست شود.
5. Remote rows و account آزمایشی پاک شوند.
6. Runtime Evidence به سند Auth اضافه شود.
7. سپس Workout Player، Onboarding و Coach در PR #36 ادامه یابد؛ بدون Merge/Production زودهنگام.

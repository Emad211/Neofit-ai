# پلن مادر NeoFit

**وضعیت:** مرجع واحد و اجباری پروژه  
**آخرین بازبینی:** ۵ اوت ۲۰۲۶ — Stage 4B Merge شد؛ Stage 4C exact next  
**Integration branch:** `web/pwa-foundation`  
**Stage 4B implementation merge:** `17d0e8c33ed9ba6329f243dee27b8cf8de53056c`  
**Stage 4 Issue:** #25 — open  
**Stage 2B Issue/PR:** #16 / #28 — مستقل و باز  
**مرحلهٔ فعال بعدی:** Stage 4C — Identity schema + RLS

## ۱. پروتکل اجباری ادامه

پیش از هر تغییر:

1. این فایل کامل خوانده شود.
2. `docs/NEOFIT_PROGRESS_LOG.md` کامل خوانده شود.
3. `docs/NEOFIT_STAGE4_SUPABASE_FOUNDATION_PLAN.md` کامل خوانده شود.
4. Stage 4A و Stage 4B Evidenceها خوانده شوند.
5. Branch، HEAD، PR، Issue، CI، Review، Vercel و Supabase از ابزار واقعی بررسی شوند.
6. فقط Exact continuation point اجرا شود.

در پایان هر نوبت:

- Master Plan و Progress Log با Commit، Run، Artifact، Failure، Correction، تصمیم و نقطهٔ ادامه همگام شوند.
- README و Development Handoff نباید Stage قدیمی را قدم بعد معرفی کنند.
- هیچ Project، Build، Deployment، Preview، Migration، RLS، Parity یا Accuracy بدون Evidence اعلام نشود.
- حافظهٔ مکالمه جای ریپو، CI یا Connector state را نمی‌گیرد.

## ۲. قراردادهای قفل‌شده

- Web: Next.js App Router + strict TypeScript.
- Shared Nutrition authority: `packages/nutrition-core`.
- Data authority: IFKB + USDA SR Legacy + FNDDS.
- Missing nutrient صفر نیست؛ وزن نامعلوم `null` است.
- AI/Vision کالری، nutrient، وزن یا Portion تولید یا اصلاح نمی‌کند.
- SQL و React Nutrition arithmetic را تکرار نمی‌کنند.
- Schema authority فقط `supabase/migrations/*.sql` است.
- هر Table exposed و user-owned پیش از Application use باید RLS داشته باشد.
- privileged credentials هرگز وارد Browser bundle، Client Component، log یا Artifact نمی‌شوند.
- Browser client و Server client جدا هستند.
- Server authorization فقط با `getSession()` انجام نمی‌شود؛ protected identity path از `getClaims()` استفاده می‌کند.
- Session-bearing response باید `private, no-store` باشد.
- Canonical ID، fingerprint و Schema فقط با Migration/Freeze نسخه‌دار تغییر می‌کنند.

## ۳. وضعیت مراحل

| Stage | وضعیت | Evidence |
|---|---|---|
| 0 Pivot | complete | PR #12 |
| 1 Persian RTL UX | complete/accepted | PR #13 |
| 2A PWA Foundation | complete | PR #15 |
| 2B Vercel HTTPS | active/parallel | Issue #16، Draft PR #28 |
| 3 Nutrition Core/Web parity | complete | PR #18–#24، Core `52/52`، Web `9/9` |
| 4A Supabase decision/project | complete | Project `rjwrobltmjodfarnltal` |
| 4B Supabase client foundation | complete | PR #30، Merge `17d0e8c…` |
| 4C Identity schema/RLS | exact next | Branch/PR جدید و migration test-first |
| 4D Nutrition persistence | not started | بعد از 4C |
| 5–9 | not started | طبق Roadmap |

## ۴. Stage 4A — Project provisioning complete

```text
name: neofit
project id/ref: rjwrobltmjodfarnltal
organization id: yzymkjsfqoohxbqkhzhs
region: eu-central-1
status: ACTIVE_HEALTHY
api url: https://rjwrobltmjodfarnltal.supabase.co
```

- cost accepted and confirmed at `0 monthly`.
- no key value committed.
- no privileged key requested or exposed.
- baseline public Application tables: 0.

Authority:

- `docs/NEOFIT_STAGE4A_PROJECT_PROVISIONING_EVIDENCE.md`.

## ۵. Stage 4B — complete

Implementation:

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

Pinned dependencies:

```text
@supabase/supabase-js 2.110.9
@supabase/ssr 0.12.3
```

Contracts:

- fail-closed public env parser.
- Browser `createBrowserClient`.
- server-only cookie-aware `createServerClient`.
- request/response cookie synchronization.
- `auth.getClaims()` verified identity refresh.
- no `getSession()` authorization path.
- session responses `private, no-store`.
- scoped future `/auth/*` and `/account/*` Proxy.
- existing App/Vercel env contract preserved؛ Supabase values blank.
- no migration or user table in Stage 4B.

Test-first red:

```text
Head: dc8e718d4a95f0cdf271840578157bf599de3183
Web CI: 30957552355 — failure
Foundation CI: 30957552028 — failure
First error: missing web/lib/supabase/env.ts
```

Final head:

```text
7ed955139d51b3546b489c8f649f144f390cb8f0
```

Final evidence:

```text
Supabase Foundation CI 30958530329 — success
Artifact 8912018526
Digest sha256:1455fd4ff726ac4ee2a5cbb0a99dd09d3528becb2f86ce9dd858cbdb37e6cba7

Nutrition Core CI 30958530294 — success
Artifact 8912013429
Digest sha256:649639a40dc0b20594ea48e6534cc6cd215a170fd251699279032a5a4d68b12c

Web CI 30958530262 — success
Artifact 8912039816
Digest sha256:790d13b030e96038be394ec50108da38c601988f8bb9106b57b8153892a83c6a

Vercel Build Contract 30958530296 — success
```

Merge:

```text
PR #30
expected head: 7ed955139d51b3546b489c8f649f144f390cb8f0
merge SHA: 17d0e8c33ed9ba6329f243dee27b8cf8de53056c
```

Remote boundary after implementation:

```text
public schema Application tables: 0
```

Authority:

- `docs/NEOFIT_STAGE4B_SUPABASE_SSR_FOUNDATION_EVIDENCE.md`.

## ۶. Stage 4C — exact next

Stage 4C must use a new focused Branch/PR and introduce the first versioned migration only after red tests exist.

Planned schema:

### `profiles`

- `id uuid primary key references auth.users(id)`.
- bounded nullable `display_name`.
- locale limited to `fa` or `en`.
- timezone.
- created/updated timestamps.
- ownership: `id = auth.uid()`.

### `user_settings`

- `user_id uuid primary key references auth.users(id)`.
- bounded theme/units.
- created/updated timestamps.
- ownership: `user_id = auth.uid()`.

Required RLS proof:

1. anon cannot read User rows.
2. User A reads own row.
3. User A cannot read User B.
4. User A cannot insert owner=B.
5. ownership cannot be changed to B.
6. cross-user update/delete denied.
7. unauthenticated `auth.uid()` null fails closed.

Required outputs:

- timestamped migration.
- RLS enabled before Application use.
- generated `web/lib/supabase/database.types.ts`.
- security/performance advisor review.
- cross-user denial evidence.

No Dashboard-only Schema edits are allowed.

## ۷. Stage 4D — after Stage 4C

- `nutrition_goals`.
- `nutrition_entries`.
- persist Shared Core output without SQL recalculation.
- preserve absent nutrients and `grams: null`.
- idempotency foundation with `client_mutation_id`.
- round-trip tests.

## ۸. Claim boundaries

ثابت شده است:

- Project مستقل healthy است.
- Stage 4B client/config foundation Merge شده است.
- Foundation/Core/Web/PWA/Vercel Build gates سبز هستند.
- remote public schema همچنان صفر Application table دارد.

ثابت نشده است:

- Login/Signup UI یا callback route.
- Vercel Supabase env rollout.
- remote Auth session end-to-end.
- Migration، user table، RLS یا generated types.
- Stage 4C آغاز یا کامل شده است.
- Stage 2B Vercel HTTPS بسته شده است.

## ۹. Anti-goalها

- Commit کردن key values.
- privileged credential در Browser.
- Dashboard-only schema edits.
- Table exposed بدون RLS.
- permissive policy مانند `using (true)` برای User data.
- Authorization فقط با `getSession()`.
- Nutrition arithmetic در SQL یا UI.
- Full Catalog/IndexedDB/AI/Vision در Stage 4.

## ۱۰. Exact continuation point

1. این Closure Handoff در PR مستندی مستقل Merge شود.
2. Issue #25 با Stage 4B merge و Stage 4C next همگام شود.
3. Branch مستقل `stage4c/identity-schema-rls` از Closure integration head ساخته شود.
4. ابتدا migration/RLS tests و policy matrix نوشته شوند.
5. سپس migration versioned برای `profiles` و `user_settings` ساخته شود.
6. Migration فقط پس از local/static review روی Remote Project اعمال شود.
7. generated types، advisors و cross-user denial evidence ثبت شوند.
8. Stage 2B Issue #16 / PR #28 مستقل و باز باقی بماند.

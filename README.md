# NeoFit AI

NeoFit یک PWA فارسی و Mobile-first برای تغذیه، تمرین و مربی شخصی است. محصول فعال در `web/` قرار دارد، محاسبات تغذیه فقط از Shared Nutrition Core می‌آیند و دادهٔ حساب با Supabase Auth/Postgres/RLS نگهداری می‌شود.

## وضعیت فعلی

```text
active branch: stage21/onboarding-self-report-v2
runtime target: neofit-preview-lab (Preview only)
Stage21: code/DB hardening ready; rendered/runtime proof open
Stage22: Program Cycle code + local migration green; hosted runtime proof open
Stage23: Exercise Registry/safety local DB + live benchmark green; hosted runtime proof open
next domain stage: Stage24 bounded structured planners
```

Production عمداً خارج از محدوده است تا چرخهٔ واقعی Auth، Provider، Onboarding، Program، Plan، logging و تغییرات تأییدشده روی Preview اثبات شود.

## معماری

- `web/`: Next.js App Router، React، strict TypeScript، PWA فارسی/RTL.
- `packages/nutrition-core/`: مرجع pure و deterministic برای تمام محاسبات تغذیه.
- `packages/exercise-registry/`: مرجع versioned هویت حرکت، ایمنی و جایگزینی قطعی.
- `supabase/`: migrationهای versioned، own-row RLS، plan versioning، audit و Program Cycle.
- `ifkb/`: pipeline دادهٔ غذایی/تصویری و کاتالوگ versioned.
- `mobile/`: اپ Expo/SQLite فریز‌شده و مرجع تاریخی Local-first.

قواعد غیرقابل مذاکره:

- Guest و Account هیچ‌وقت دادهٔ شخصی ساختگی را با هم مخلوط نمی‌کنند.
- مدل، کالری یا macro authoritative تولید نمی‌کند؛ Nutrition Core مرجع است.
- API key خام وارد Onboarding JSON، Browser storage یا audit نمی‌شود.
- Coach دسترسی SQL آزاد ندارد و mutation خاموش انجام نمی‌دهد.
- planها immutable/versioned هستند و تاریخچهٔ ثبت‌شده بازنویسی نمی‌شود.
- AvalAI credential برای تاب‌آوری Onboarding واقعی الزامی است؛ Google primary اختیاری است.

## توسعه و بررسی

```bash
npm install
npm run check:nutrition-core
npm run check:exercise-registry
npm run typecheck:web
npm run build:web
```

گیت‌های دقیق‌تر در `web/package.json` و `.github/workflows/` قرار دارند. Dependencyهای `mobile/` مستقل‌اند و برای بررسی آن بخش باید داخل همان پوشه نصب شوند.

## رودمپ فعال

1. اثبات runtime و rendered QA برای Stage 21.
2. اعمال و اثبات migration چرخهٔ دورهٔ Stage 22.
3. اثبات hosted runtime رجیستری Stage 23.
4. Stage 24: Plannerهای ساختاریافته و materialization محدود.
5. Stage 25: Review و Activation هماهنگ.
6. Stage 26: Proposal، Diff و Confirmation.
7. Stage 27: ابزارهای تغییر نسخهٔ آینده پس از تأیید کاربر.
8. یک Preview نهایی سبز و E2E کامل؛ سپس تصمیم جداگانه برای Production.

## اسناد مرجع

1. `docs/NEOFIT_GAP_AUDIT_2026-08-08.md` — backlog جاری.
2. `docs/NEOFIT_COACH_PROGRAM_LIFECYCLE_ARCHITECTURE.md` — قرارداد چرخهٔ محصول.
3. `docs/NEOFIT_STAGE21_ONBOARDING_SELF_REPORT_V2.md` — ورودی Onboarding.
4. `docs/NEOFIT_STAGE22_PROGRAM_CYCLE.md` — lifecycle و persistence دوره.
5. `docs/NEOFIT_STAGE23_EXERCISE_REGISTRY.md` — هویت تمرین، safety gate و benchmark زنده.
6. `docs/NEOFIT_PREVIEW_LAB.md` — مرز runtime.

اسناد Stage قدیمی‌تر تاریخچهٔ تصمیم و evidence همان مقطع هستند؛ در تعارض‌ها، فهرست بالا authority دارد.

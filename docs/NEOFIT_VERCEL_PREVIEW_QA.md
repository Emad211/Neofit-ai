# NeoFit Stage 2B — Vercel Preview HTTPS QA

**وضعیت:** Runtime QA contract آماده؛ اجرای Remote suite منتظر Automation Bypass Secret  
**تاریخ:** ۴ اوت ۲۰۲۶  
**Issue:** #16  
**PR:** #28  
**Branch:** `stage2b/vercel-https-reactivation`  
**Integration base:** `e79df1b20b1769f4c2b4b2084510664d76bd0d72`

## ۱. هدف

این Gate باید ثابت کند Preview واقعی Vercel فقط Build نشده، بلکه روی HTTPS و داخل Browser واقعی نیز همان قراردادهای PWA و رابط فارسی را اجرا می‌کند.

READY بودن Deployment، موفقیت `next build` یا سبز بودن Local Chromium به‌تنهایی برای بستن Stage 2B کافی نیست.

## ۲. وضعیت اثبات‌شده

Vercel Project:

```text
name: neofit-ai
project id: prj_U4np29NAkTqZ6QjTbXmeEBkrcDNG
team id: team_BsUv0VprkU4YjdFbQi2hZCEm
```

آخرین Preview ثبت‌شده پیش از اضافه‌شدن این QA contract:

```text
deployment id: dpl_AnUcV5Q6FENDvn2LUPMMkVqLUjNR
commit: 51ed480dfeaa544e65be4fafa1cc237cb39cb7e3
state: READY
target: Preview
alias: neofit-ai-git-stage2b-vercel-htt-774980-emads-projects-41cb6447.vercel.app
```

Build واقعی اثبات شده است:

- npm workspace install؛
- Next.js `16.2.12` detection؛
- PWA icon generation؛
- `next build`؛
- compile و TypeScript؛
- static routes `/`، `/_not-found`، `/manifest.webmanifest` و `/offline`؛
- deploy از `/vercel/output`.

## ۳. علت نیاز به Automation Bypass

Preview تحت Vercel Deployment Protection است. Temporary share URL به SSO redirect و Cookie session وابسته است و ابزار Fetch فعلی Cookie مرورگر را میان redirectها حفظ نمی‌کند.

برای Automation رسمی، طبق قرارداد Vercel این Headerها استفاده می‌شوند:

```text
x-vercel-protection-bypass: <secret>
x-vercel-set-bypass-cookie: true
```

Secret باید در GitHub Actions Secret با نام زیر ذخیره شود:

```text
VERCEL_AUTOMATION_BYPASS_SECRET
```

Secret یا Share URL دارای Token نباید:

- در Git Commit؛
- Workflow input؛
- Issue/PR comment؛
- console log؛
- Screenshot؛
- JSON report؛
- Artifact metadata

ثبت شود.

## ۴. Authority اجرایی

Browser verifier:

```text
web/scripts/verify-vercel-preview.mjs
```

Command:

```bash
npm run qa:vercel-preview
```

Workflow:

```text
.github/workflows/vercel-preview-qa.yml
```

Workflow فقط به‌صورت `workflow_dispatch` اجرا می‌شود تا Secret قبل از فعال‌شدن Gate باعث Failure دائمی تمام Deployments نشود.

ورودی Workflow فقط URL عمومی Preview بدون Query یا Share Token است. Secret فقط از GitHub Secret خوانده می‌شود.

## ۵. Remote assertions

Verifier باید همهٔ موارد زیر را پاس کند:

### Root و RTL

- HTTPS navigation موفق؛
- Redirect نشدن به Vercel SSO؛
- باقی‌ماندن روی Host اصلی Preview؛
- `html.lang = fa`؛
- `html.dir = rtl`؛
- عنوان NeoFit؛
- Heading قابل‌استفاده.

### Manifest و Assetها

- `/manifest.webmanifest` پاسخ موفق؛
- `lang = fa`؛
- `dir = rtl`؛
- `display = standalone`؛
- Iconهای 192، 512 و maskable؛
- Apple Touch Icon؛
- `/sw.js`؛
- `/offline`.

### Service Worker و Cache

- Service Worker ready؛
- کنترل صفحه بعد از Reload؛
- exclusion صریح `/api/`؛
- exclusion صریح `/auth/`؛
- exclusion درخواست Authorizationدار؛
- exclusion درخواست غیر GET؛
- نبودن API/Auth entry در Cache Storage.

### Product interaction

- بازکردن Flow ثبت غذا؛
- جست‌وجوی «قورمه»؛
- انتخاب قورمه‌سبزی؛
- افزودن به امروز؛
- افزایش یک‌واحدی تعداد Diary rowها.

### Offline

- فعال‌کردن Offline در Browser Context؛
- Reload صفحهٔ کنترل‌شده؛
- نمایش دوبارهٔ صفحهٔ «خلاصهٔ امروز» از App shell.

## ۶. Evidence output

Artifact path:

```text
web/artifacts/vercel-preview/
```

خروجی‌ها:

```text
preview-report.json
preview.png
preview-failure.png   # فقط در Failure
```

گزارش فقط Host بدون Query، نام Checkها، نتیجه و metadata غیرحساس را نگه می‌دارد.

## ۷. روش اجرای Gate

1. در Vercel Project Settings، Automation Bypass Secret ساخته شود.
2. همان مقدار در GitHub repository secret با نام `VERCEL_AUTOMATION_BYPASS_SECRET` ثبت شود.
3. Workflow `Vercel Preview HTTPS QA` اجرا شود.
4. ورودی `preview_url` برابر Alias عمومی Preview باشد و Query نداشته باشد.
5. Run ID، Artifact ID، Digest، Commit و Deployment ID در Issue #16، Master Plan و Progress Log ثبت شوند.
6. Runtime errors و Build logs دوباره بررسی شوند.
7. فقط در صورت پاس کامل، PR #28 Ready و Merge و Issue #16 Completed شود.

## ۸. Claim boundaries

این سند و کد فعلی ثابت می‌کنند:

- Remote QA قابل‌تکرار و Fail-closed طراحی شده است؛
- Bypass Headerها مطابق قرارداد رسمی Vercel استفاده می‌شوند؛
- Secret در Source/Artifact ثبت نمی‌شود؛
- تمام Acceptance criteria Stage 2B به Assertionهای اجرایی تبدیل شده‌اند.

هنوز ثابت نمی‌کنند:

- Automation Bypass Secret در Vercel/GitHub تنظیم شده؛
- Workflow Remote اجرا شده؛
- Preview روی HTTPS تمام Checkها را پاس کرده؛
- Stage 2B بسته شده؛
- PR #28 قابل Merge است.

## ۹. Exact continuation point

1. Web CI و Nutrition Core CI روی Head دارای Verifier/Workflow سبز شوند.
2. Vercel Preview همان Head واقعی Build شود.
3. Automation Bypass Secret خارج Git تنظیم شود.
4. Workflow Remote اجرا شود.
5. Evidence در Issue #16 و دو سند اجباری ثبت شود.
6. فقط بعد از Remote pass کامل، Stage 2B بسته شود.
7. Stage 4A همچنان فقط پس از پذیرش صریح Organization/Region/Cost مجاز است.

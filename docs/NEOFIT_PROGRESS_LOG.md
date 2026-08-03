# دفتر پیشرفت NeoFit

**نقش سند:** حافظهٔ عملیاتی و شواهد توسعه  
**همراه اجباری:** `docs/NEOFIT_MASTER_PLAN.md`  
**آخرین به‌روزرسانی:** ۳ اوت ۲۰۲۶

## روش استفاده

در شروع هر نوبت:

1. پلن مادر کامل خوانده شود.
2. این دفتر کامل خوانده شود.
3. وضعیت واقعی branch، HEAD، PR، CI، Vercel و Supabase بررسی شود.
4. فقط قدم بعدی اثبات‌شده اجرا شود.

در پایان هر نوبت یک Entry جدید باید شامل موارد زیر افزوده شود:

- زمان و تاریخ
- شاخه و Head شروع
- هدف نوبت
- کارهای انجام‌شده
- فایل‌ها و Commitها
- تست‌ها و CI
- مشکلات و Fixها
- کارهای انجام‌نشده
- تصمیم‌ها
- Head پایان
- قدم بعدی دقیق

هیچ موردی بدون شواهد «تمام‌شده» علامت نمی‌خورد.

---

## نمای کلی مراحل

| Stage | عنوان | وضعیت | شواهد اصلی |
|---|---|---|---|
| 0 | Pivot و Freeze نسخهٔ Native | انجام‌شده | PR #12، commit `151de2c0d5c9b02602c2f89eb4df808653cdd74e` |
| 1 | پایهٔ محصول و UX فارسی/RTL | فعال | Issue #11؛ پیاده‌سازی هنوز شروع نشده |
| 2 | PWA و Vercel foundation | شروع‌نشده | — |
| 3 | استخراج Nutrition Core و parity | شروع‌نشده | — |
| 4 | Supabase foundation | شروع‌نشده | — |
| 5 | Nutrition vertical slice | شروع‌نشده | — |
| 6 | AvalAI، Vision و Plan generation | شروع‌نشده | — |
| 7 | Offline catalog و Sync | شروع‌نشده | — |
| 8 | Migration، Backup و Recovery | شروع‌نشده | — |
| 9 | Web Release Candidate | شروع‌نشده | — |

---

## Entry 000 — بازسازی وضعیت پیش از شروع توسعهٔ وب

**تاریخ:** ۳ اوت ۲۰۲۶  
**شاخهٔ مرجع:** `agent/iranian-food-kb-foundation`  
**Head محصول Native/IFKB:** `648b98cdc921beb26ccd0ff05a1f17944bb6f71d`

### وضعیت اثبات‌شده

- APK Android نصب و Startup آن پس از رفع دو مشکل SQLite/Seed موفق شد.
- Mobile CI run 573 روی Head مرجع پاس شد.
- Nutrition RC، IFKB، Stage 7، Stage 8 و Schema/ID freeze در شاخهٔ مرجع حضور دارند.
- UI/UX نسخهٔ Native و تجربهٔ فارسی/RTL از سوی مالک محصول رد شد.

### تصمیم

- UI اصلی به Next.js PWA مهاجرت می‌کند.
- Mobile حذف نمی‌شود و Frozen reference می‌ماند.
- Supabase برای Auth/Postgres/RLS/Sync استفاده خواهد شد، نه برای جایگزینی Nutrition Core.
- Vercel میزبان Web و Route Handlerهای امن خواهد بود.

### زیرساخت موجود

- دسترسی ابزار به Vercel و Supabase برقرار است.
- NeoFit هنوز Project اختصاصی در Vercel یا Supabase ندارد.
- پروژه‌های موجود بدون تصمیم صریح reuse نمی‌شوند.

### شواهد ثبت مسیر

- PR #12: `Plan NeoFit Persian-first PWA pivot`
- Merge commit: `151de2c0d5c9b02602c2f89eb4df808653cdd74e`
- Issue #10: Roadmap مادر
- Issue #11: Stage 1
- Branch integration: `web/pwa-foundation`

### قدم بعدی ثبت‌شده

ساخت دو سند دائمی، سپس شروع Stage 1 با Next.js shell، RTL root، Design tokens، Today و Food logging prototype.

---

## Entry 001 — آغاز نوبت Stage 1

**تاریخ/زمان شروع:** ۳ اوت ۲۰۲۶، ۱۸:۲۷ ایران  
**شاخهٔ شروع:** `web/pwa-foundation`  
**Head شروع:** `151de2c0d5c9b02602c2f89eb4df808653cdd74e`

### هدف نوبت

1. ایجاد دو فایل دائمی پلن و دفتر پیشرفت.
2. ایجاد شاخهٔ متمرکز Stage 1.
3. ساخت اولین Vertical prototype فارسی/RTL با Next.js و fixtureهای IFKB.
4. اجرای Build/TypeScript و ثبت نتیجه.
5. به‌روزرسانی هر دو فایل در پایان.

### وضعیت جاری

- `docs/NEOFIT_MASTER_PLAN.md` ایجاد شد.
- این دفتر ایجاد شد.
- پیاده‌سازی محصول هنوز در این Entry آغاز نشده است.

### Head موقت پس از اسناد

- پس از پلن مادر: `dec33eb6e8485d012173a8dae3d71296983b5361`
- پس از این دفتر: توسط Commit فعلی تعیین می‌شود.

### قدم بعدی همین نوبت

ایجاد شاخهٔ `stage1/persian-rtl-ux` از آخرین Head و پیاده‌سازی Batch اول Stage 1.

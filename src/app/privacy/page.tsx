'use client';

import Link from 'next/link';
import { LegalPageShell, LegalSection } from '@/components/legal/legal-page-shell';
import { useI18n } from '@/i18n/provider';
import { publicConfig } from '@/lib/public-config';

export default function PrivacyPage() {
  const { locale } = useI18n();
  const fa = locale === 'fa';
  const listClass = 'list-disc space-y-2 ps-6';

  return (
    <LegalPageShell
      title={fa ? 'سیاست حریم خصوصی' : 'Privacy Policy'}
      description={fa ? `تاریخ اجرا: ${publicConfig.privacyEffectiveDate}` : `Effective date: ${publicConfig.privacyEffectiveDate}`}
    >
      <p className="text-muted-foreground">
        {fa
          ? `${publicConfig.legalOperatorName} («نئوفیت»، «ما») این سیاست را برای توضیح جمع‌آوری، استفاده، انتقال، نگهداری و حذف اطلاعات در NeoFit AI منتشر می‌کند. نئوفیت یک برنامه عمومی تمرین و تغذیه است و خدمت پزشکی یا ابزار تشخیصی نیست.`
          : `${publicConfig.legalOperatorName} (“NeoFit,” “we,” or “us”) publishes this policy to explain how information is collected, used, transferred, retained, and deleted in NeoFit AI. NeoFit is a general fitness and nutrition application, not a medical service or diagnostic device.`}
      </p>

      <LegalSection title={fa ? '۱. اطلاعاتی که جمع‌آوری می‌کنیم' : '1. Information we collect'}>
        <ul className={listClass}>
          <li>{fa ? 'اطلاعات حساب: نام نمایشی، ایمیل، شناسه حساب و داده‌های لازم برای ورود و امنیت حساب.' : 'Account information: display name, email address, account identifier, and information needed for sign-in and account security.'}</li>
          <li>{fa ? 'اطلاعات پروفایل و سلامت‌محور: سن، جنسیت، قد، وزن، هدف، سطح فعالیت، خواب، استرس، ترجیحات غذایی، حساسیت‌ها، بیماری‌ها، دردها، آسیب‌ها و محدودیت‌هایی که خودتان وارد می‌کنید.' : 'Profile and health-related information: age, gender, height, weight, goals, activity level, sleep, stress, food preferences, allergies, conditions, pain, injuries, and limitations you choose to provide.'}</li>
          <li>{fa ? 'سوابق استفاده: وعده‌های ثبت‌شده، ماکروها، وزن، فعالیت، جلسه‌های تمرین، ست‌ها، تکرار، وزنه، مدت و گزارش‌های پیشرفت.' : 'Usage records: logged meals, macros, weight, activity, workout sessions, sets, repetitions, load, duration, and progress reports.'}</li>
          <li>{fa ? 'تصاویر غذا: فقط وقتی شما قابلیت اسکن غذا را فعال می‌کنید. تصویر برای تحلیل ارسال می‌شود؛ نئوفیت تصویر خام را در پایگاه داده حساب شما ذخیره نمی‌کند، ولی نتیجه تخمینی را در صورت ثبت وعده ذخیره می‌کند.' : 'Food images: only when you activate meal scanning. The image is transmitted for analysis; NeoFit does not store the raw image in your account database, but stores the estimated result if you choose to log the meal.'}</li>
          <li>{fa ? 'اطلاعات عضویت: فروشگاه، شناسه محصول، شناسه سفارش، وضعیت و تاریخ پایان اشتراک، و نسخه رمز‌شده یا هش‌شده توکن خرید. اطلاعات کارت بانکی توسط فروشگاه مدیریت می‌شود و به نئوفیت نمی‌رسد.' : 'Membership information: store provider, product ID, order ID, subscription status and expiry, and an encrypted or hashed purchase token. Payment-card details are handled by the store and are not received by NeoFit.'}</li>
          <li>{fa ? 'پشتیبانی: ایمیل، موضوع، متن درخواست، زبان و داده فنی محدود برای جلوگیری از سوءاستفاده. نشانی IP خام ذخیره نمی‌شود؛ یک هش محدودکننده نرخ ذخیره می‌شود.' : 'Support: email address, category, request text, language, and limited technical data used to prevent abuse. Raw IP addresses are not stored; a rate-limiting hash is stored.'}</li>
          <li>{fa ? 'تنظیمات دستگاه: زبان و پوسته در فضای محلی مرورگر و پیش‌نویس موقت onboarding یا تمرین در session storage.' : 'Device settings: language and theme in local browser storage, and temporary onboarding or workout drafts in session storage.'}</li>
        </ul>
      </LegalSection>

      <LegalSection title={fa ? '۲. نحوه استفاده از اطلاعات' : '2. How we use information'}>
        <ul className={listClass}>
          <li>{fa ? 'ساخت و نمایش برنامه‌های تمرین و تغذیه و تنظیم آن‌ها بر اساس اطلاعاتی که ارائه می‌کنید.' : 'To generate and display fitness and nutrition plans and adapt them to the information you provide.'}</li>
          <li>{fa ? 'ثبت سوابق، نمایش روند، بازیابی جلسه نیمه‌کاره و ارائه گزارش‌های درخواستی.' : 'To record history, display trends, restore unfinished sessions, and provide requested reports.'}</li>
          <li>{fa ? 'تأیید عضویت، اعمال سهمیه پلن و جلوگیری از تقلب یا استفاده غیرمجاز.' : 'To verify memberships, enforce plan entitlements, and prevent fraud or unauthorized use.'}</li>
          <li>{fa ? 'امنیت، رفع خطا، پشتیبانی و اجرای شرایط استفاده.' : 'For security, troubleshooting, support, and enforcement of the Terms of Use.'}</li>
          <li>{fa ? 'رعایت درخواست‌های قانونی معتبر و تعهدات فروشگاه‌های توزیع.' : 'To respond to valid legal requests and meet distribution-store obligations.'}</li>
        </ul>
        <p>{fa ? 'ما اطلاعات شخصی شما را نمی‌فروشیم و در نسخه فعلی از آن برای تبلیغات شخصی‌سازی‌شده استفاده نمی‌کنیم.' : 'We do not sell your personal information and the current product does not use it for personalized advertising.'}</p>
      </LegalSection>

      <LegalSection title={fa ? '۳. پردازش هوش مصنوعی و ارائه‌دهندگان خدمات' : '3. AI processing and service providers'}>
        <p>
          {fa
            ? 'درخواست‌های هوش مصنوعی از سرور نئوفیت به AvalAI ارسال می‌شوند. بسته به قابلیت، درخواست ممکن است شامل بخش لازم از پروفایل، محدودیت‌های پزشکی، لاگ‌ها، متن شما یا تصویر غذا باشد. کلید AvalAI فقط روی سرور نگه‌داری می‌شود و در برنامه کاربر قرار نمی‌گیرد.'
            : 'AI requests are sent from NeoFit’s server through AvalAI. Depending on the feature, a request may include the necessary portion of your profile, medical limitations, logs, your text, or a food image. The AvalAI key is kept only on the server and is never placed in the user application.'}
        </p>
        <p>
          {fa ? 'AvalAI ممکن است درخواست را برای اجرای مدل به ارائه‌دهندگان مدل هوش مصنوعی منتقل کند. سیاست‌ها و محل پردازش آن ارائه‌دهندگان ممکن است متفاوت باشد.' : 'AvalAI may route the request to AI model providers to perform the requested processing. Provider policies and processing locations may differ.'}
          {' '}
          <a className="underline" href="https://avalai.ir/privacy-policy/" target="_blank" rel="noreferrer">{fa ? 'سیاست حریم خصوصی AvalAI' : 'AvalAI privacy policy'}</a>
        </p>
        <p>{fa ? 'خروجی هوش مصنوعی ممکن است اشتباه یا ناقص باشد. تصمیم پزشکی، درمانی یا اضطراری نباید بر اساس خروجی نئوفیت گرفته شود.' : 'AI output can be inaccurate or incomplete. Do not make medical, treatment, or emergency decisions based on NeoFit output.'}</p>
      </LegalSection>

      <LegalSection title={fa ? '۴. محل ذخیره و اشخاص دریافت‌کننده' : '4. Storage and recipients'}>
        <ul className={listClass}>
          <li>{fa ? 'Google Firebase برای احراز هویت، Firestore و زیرساخت مرتبط.' : 'Google Firebase for authentication, Firestore, and related infrastructure.'}</li>
          <li>{fa ? 'AvalAI و ارائه‌دهندگان مدل متصل به آن برای قابلیت‌هایی که شما فعال می‌کنید.' : 'AvalAI and connected model providers for features you choose to use.'}</li>
          <li>{fa ? 'Google Play، بازار یا مایکت برای خرید، تمدید، لغو و تأیید اشتراک.' : 'Google Play, Cafe Bazaar, or Myket for purchase, renewal, cancellation, and verification of memberships.'}</li>
          <li>{fa ? 'ارائه‌دهندگان میزبانی و امنیت که برای اجرای سرویس لازم‌اند.' : 'Hosting and security providers necessary to operate the service.'}</li>
        </ul>
        <p>{fa ? 'ممکن است داده در کشوری متفاوت از محل زندگی شما پردازش شود. ما انتقال را فقط در حد لازم برای ارائه سرویس انجام می‌دهیم و از ارتباط رمزگذاری‌شده استفاده می‌کنیم.' : 'Information may be processed in a country different from where you live. We transfer only what is necessary to provide the service and use encrypted network connections.'}</p>
      </LegalSection>

      <LegalSection title={fa ? '۵. نگهداری و حذف' : '5. Retention and deletion'}>
        <ul className={listClass}>
          <li>{fa ? 'پروفایل، برنامه‌ها و سوابق تا زمانی که حساب فعال است یا شما آن‌ها را حذف می‌کنید نگه‌داری می‌شوند.' : 'Profiles, plans, and logs are retained while the account remains active or until you delete them.'}</li>
          <li>{fa ? 'پیش‌نویس‌های session storage با پایان نشست مرورگر حذف می‌شوند؛ تنظیمات محلی را می‌توانید از داده‌های مرورگر پاک کنید.' : 'Session-storage drafts are removed with the browser session; local settings can be cleared through browser storage controls.'}</li>
          <li>{fa ? 'درخواست پشتیبانی تا زمانی که برای پاسخ، امنیت، حل اختلاف یا رعایت قانون لازم باشد نگه‌داری می‌شود.' : 'Support requests are retained as needed to respond, protect the service, resolve disputes, or comply with law.'}</li>
          <li>{fa ? 'با حذف حساب، داده حساب، پروفایل، برنامه‌ها، لاگ‌ها، گزارش‌ها، سهمیه‌ها، عضویت و سوابق خرید متصل در نئوفیت حذف می‌شوند. فروشگاه ممکن است سوابق مستقل خود را طبق سیاستش نگه دارد.' : 'When an account is deleted, NeoFit deletes linked account, profile, plans, logs, reports, usage, membership, and purchase-verification records. A store may retain its independent records under its own policy.'}</li>
        </ul>
        <p>
          {fa ? 'حذف حساب از داخل تنظیمات حساب یا از صفحه وب مستقل انجام می‌شود:' : 'Delete the account in Account Settings or through the independent web page:'}{' '}
          <Link className="underline" href="/account-deletion">{fa ? 'حذف حساب NeoFit AI' : 'Delete a NeoFit AI account'}</Link>.
        </p>
        <p>{fa ? 'حذف حساب، اشتراک فروشگاه را خودکار لغو نمی‌کند؛ برای جلوگیری از تمدید باید اشتراک را در همان فروشگاه لغو کنید.' : 'Deleting the account does not automatically cancel a store subscription; cancel it in the relevant store to stop renewal.'}</p>
      </LegalSection>

      <LegalSection title={fa ? '۶. انتخاب‌ها و حقوق شما' : '6. Your choices and rights'}>
        <ul className={listClass}>
          <li>{fa ? 'مشاهده و ویرایش اطلاعات پروفایل در برنامه.' : 'View and edit profile information in the app.'}</li>
          <li>{fa ? 'رد دسترسی دوربین؛ در این صورت فقط اسکن تصویر غیرفعال می‌شود.' : 'Decline camera access; only image scanning will be unavailable.'}</li>
          <li>{fa ? 'حذف لاگ، پاک‌کردن پروفایل یا حذف کامل حساب.' : 'Delete logs, reset the profile, or permanently delete the account.'}</li>
          <li>{fa ? 'ارسال درخواست دسترسی، اصلاح، حذف، محدودسازی یا اعتراض از صفحه پشتیبانی، در حدی که قانون محل شما مقرر می‌کند.' : 'Submit access, correction, deletion, restriction, or objection requests through Support, to the extent provided by applicable law.'}</li>
        </ul>
        <p><Link className="underline" href="/support">{fa ? 'ارسال درخواست حریم خصوصی یا پشتیبانی' : 'Submit a privacy or support request'}</Link></p>
      </LegalSection>

      <LegalSection title={fa ? '۷. امنیت' : '7. Security'}>
        <p>{fa ? 'ما از احراز هویت Firebase، کنترل مالکیت سرور، محدودیت سهمیه، اعتبارسنجی ورودی و خروجی، ارتباط HTTPS، رمزگذاری توکن خرید و سیاست‌های دسترسی استفاده می‌کنیم. هیچ سامانه‌ای کاملاً بدون خطر نیست؛ از رمز قوی و دستگاه امن استفاده کنید.' : 'We use Firebase authentication, server-side ownership checks, quotas, input/output validation, HTTPS, encrypted purchase tokens, and access rules. No system is risk-free; use a strong password and a secure device.'}</p>
      </LegalSection>

      <LegalSection title={fa ? '۸. کودکان' : '8. Children'}>
        <p>{fa ? 'نئوفیت برای افراد زیر ۱۶ سال طراحی نشده و ثبت‌نام افراد زیر ۱۶ سال مجاز نیست. اگر از ثبت داده کودک مطلع شویم، برای حذف آن اقدام می‌کنیم.' : 'NeoFit is not designed for children under 16 and does not permit registration below that age. If we learn that a child’s data was provided, we will take steps to delete it.'}</p>
      </LegalSection>

      <LegalSection title={fa ? '۹. تغییرات و تماس' : '9. Changes and contact'}>
        <p>{fa ? 'ممکن است این سیاست را با تغییر محصول، ارائه‌دهندگان یا قانون به‌روز کنیم. تاریخ اجرا در بالای صفحه تغییر می‌کند و تغییر مهم از طریق برنامه یا روش مناسب دیگری اعلام می‌شود.' : 'We may update this policy when the product, providers, or law changes. The effective date above will be updated and material changes will be communicated through the app or another appropriate method.'}</p>
        <p>{fa ? `مسئول سرویس: ${publicConfig.legalOperatorName}. برای پرسش حریم خصوصی از صفحه پشتیبانی استفاده کنید.` : `Service operator: ${publicConfig.legalOperatorName}. Use the Support page for privacy questions.`}</p>
        {publicConfig.supportEmail && <p><a className="underline" href={`mailto:${publicConfig.supportEmail}`}>{publicConfig.supportEmail}</a></p>}
      </LegalSection>
    </LegalPageShell>
  );
}

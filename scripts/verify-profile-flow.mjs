import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.NEOFIT_BASE_URL || "http://127.0.0.1:3000";
const artifactDir = "artifacts/ui-revival-smoke";
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fa-IR" });
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error?.stack || error)));
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

const report = { baseUrl, checks: {}, pageErrors, consoleErrors, passed: true };

try {
  await page.goto(`${baseUrl}/profile`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    state.profile = {
      ...(state.profile || {}),
      name: "عماد تست",
      goal: "lose_weight",
      gender: "male",
      age: 22,
      height: 176,
      weight: 93,
      bodyType: "endomorph",
      fitnessLevel: "intermediate",
      trainingDays: "6",
      trainingDuration: "60-90",
      trainingTime: "evening",
      lifestyle: "moderately_active",
      sleepHours: "7-8",
      stressLevel: "medium",
      eatingHabits: "غذاهای ایرانی",
      cookingSkill: "intermediate",
      performanceGoals: "حفظ عضله",
      workoutLocation: "gym",
      availableEquipment: "تجهیزات کامل باشگاه",
      costLevel: "medium",
      medicalHistory: "بدون محدودیت فعال",
      dietaryPreference: "غذای ایرانی",
      timezone: "Asia/Tehran",
    };
    window.localStorage.setItem("neofit-ui-demo-v3", JSON.stringify(state));
    window.localStorage.removeItem("neofit:notification-preferences:v1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);

  const profileTitleVisible = await page.getByRole("heading", { name: "عماد تست" }).isVisible().catch(() => false);
  const goalVisible = await page.getByText("کاهش وزن و چربی", { exact: true }).isVisible().catch(() => false);
  const weightVisible = await page.getByText("۹۳ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const trainingVisible = await page.getByText("۶ روز در هفته", { exact: true }).isVisible().catch(() => false);
  const localBoundaryVisible = await page.getByText(/حساب محلی نسخهٔ نمایشی/).isVisible().catch(() => false);
  const notificationSettingsEntryVisible = await page.getByRole("link", { name: /تنظیمات اعلان‌ها/ }).isVisible().catch(() => false);
  const landingPassed = profileTitleVisible && goalVisible && weightVisible && trainingVisible && localBoundaryVisible && notificationSettingsEntryVisible;
  report.checks.landing = { profileTitleVisible, goalVisible, weightVisible, trainingVisible, localBoundaryVisible, notificationSettingsEntryVisible, passed: landingPassed };
  if (!landingPassed) report.passed = false;

  await page.getByRole("link", { name: /مشاهده اطلاعات من/ }).click();
  await page.waitForTimeout(500);
  const viewTitleVisible = await page.getByRole("heading", { name: "اطلاعات من" }).isVisible().catch(() => false);
  const baseSectionVisible = await page.getByText("اطلاعات پایه", { exact: true }).isVisible().catch(() => false);
  const medicalVisible = await page.getByText("بدون محدودیت فعال", { exact: true }).isVisible().catch(() => false);
  const englishViewAbsent = (await page.getByText("My Information", { exact: true }).count()) === 0;
  const viewPassed = viewTitleVisible && baseSectionVisible && medicalVisible && englishViewAbsent;
  report.checks.view = { viewTitleVisible, baseSectionVisible, medicalVisible, englishViewAbsent, passed: viewPassed };
  if (!viewPassed) report.passed = false;

  await page.goto(`${baseUrl}/profile/edit`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const editTitleVisible = await page.getByRole("heading", { name: "ویرایش مشخصات" }).isVisible().catch(() => false);
  const regenerateAbsent = (await page.getByText(/بازسازی برنامه|Regenerate Plan/).count()) === 0;
  await page.getByLabel("وزن فعلی").fill("91.5");
  await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
  await page.waitForFunction(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    return state.profile?.weight === 91.5;
  }, null, { timeout: 10_000 });
  const persistedEdit = await page.evaluate(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    return { weight: state.profile?.weight, goal: state.profile?.goal };
  });
  await page.goto(`${baseUrl}/profile`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const editedWeightVisible = await page.getByText("۹۱٫۵ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const editPassed = editTitleVisible && regenerateAbsent && editedWeightVisible && persistedEdit.weight === 91.5 && persistedEdit.goal === "lose_weight";
  report.checks.edit = { editTitleVisible, regenerateAbsent, editedWeightVisible, persistedEdit, passed: editPassed };
  if (!editPassed) report.passed = false;

  await page.getByRole("link", { name: /مدیریت حساب محلی/ }).click();
  await page.waitForTimeout(500);
  const accountTitleVisible = await page.getByRole("heading", { name: "مدیریت حساب محلی" }).isVisible().catch(() => false);
  const emailVisible = await page.getByText("demo@neofit.local", { exact: true }).isVisible().catch(() => false);
  const editableEmailAbsent = (await page.locator('input[type="email"]').count()) === 0;
  await page.getByLabel("نام نمایشی").fill("عماد جدید");
  await page.getByRole("button", { name: "ذخیره نام" }).click();
  await page.waitForFunction(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    return state.profile?.name === "عماد جدید";
  }, null, { timeout: 10_000 });
  const persistedAccount = await page.evaluate(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    return { name: state.profile?.name };
  });
  await page.goto(`${baseUrl}/profile`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const newNameVisible = await page.getByRole("heading", { name: "عماد جدید" }).isVisible().catch(() => false);
  const accountPassed = accountTitleVisible && emailVisible && editableEmailAbsent && persistedAccount.name === "عماد جدید" && newNameVisible;
  report.checks.account = { accountTitleVisible, emailVisible, editableEmailAbsent, persistedAccount, newNameVisible, passed: accountPassed };
  if (!accountPassed) report.passed = false;

  await page.getByRole("link", { name: /تنظیمات اعلان‌ها/ }).click();
  await page.waitForTimeout(600);
  const notificationSettingsVisible = await page.getByText("تنظیمات اعلان‌ها", { exact: true }).isVisible().catch(() => false);
  const waterSwitch = page.getByRole("switch", { name: "آب روزانه" });
  const workoutSwitch = page.getByRole("switch", { name: "تمرین و برنامه" });
  const initialWaterChecked = await waterSwitch.isChecked().catch(() => false);
  await waterSwitch.click();
  await page.waitForFunction(() => {
    const preferences = JSON.parse(window.localStorage.getItem("neofit:notification-preferences:v1") || "{}");
    return preferences.water === false;
  }, null, { timeout: 10_000 });
  const existingWaterNoticeVisible = await page.getByText("یادآوری آب", { exact: true }).isVisible().catch(() => false);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const persistedWaterUnchecked = !(await page.getByRole("switch", { name: "آب روزانه" }).isChecked().catch(() => true));
  const workoutStillChecked = await page.getByRole("switch", { name: "تمرین و برنامه" }).isChecked().catch(() => false);
  const persistedPreferences = await page.evaluate(() => JSON.parse(window.localStorage.getItem("neofit:notification-preferences:v1") || "{}"));
  const notificationsPassed = notificationSettingsVisible && initialWaterChecked && persistedWaterUnchecked && workoutStillChecked && existingWaterNoticeVisible && persistedPreferences.water === false && persistedPreferences.workout === true;
  report.checks.notificationPreferences = { notificationSettingsVisible, initialWaterChecked, persistedWaterUnchecked, workoutStillChecked, existingWaterNoticeVisible, persistedPreferences, passed: notificationsPassed };
  if (!notificationsPassed) report.passed = false;

  await page.goto(`${baseUrl}/profile`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  report.checks.mobileLayout = { noHorizontalOverflow, passed: noHorizontalOverflow };
  if (!noHorizontalOverflow) report.passed = false;

  await page.screenshot({ path: `${artifactDir}/profile-flow.png`, fullPage: true });
} finally {
  await browser.close();
}

if (pageErrors.length || consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/profile-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

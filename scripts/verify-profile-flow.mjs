import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.NEOFIT_BASE_URL || "http://127.0.0.1:3000";
const artifactDir = "artifacts/ui-revival-smoke";
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fa-IR", acceptDownloads: true });
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
    window.localStorage.setItem("neofit:delete-sentinel", "must-disappear");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);

  const profileTitleVisible = await page.getByRole("heading", { name: "عماد تست" }).isVisible().catch(() => false);
  const goalVisible = await page.getByText("کاهش وزن و چربی", { exact: true }).isVisible().catch(() => false);
  const weightVisible = await page.getByText("۹۳ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const trainingVisible = await page.getByText("۶ روز در هفته", { exact: true }).isVisible().catch(() => false);
  const localBoundaryVisible = await page.getByText(/حساب محلی نسخهٔ نمایشی/).isVisible().catch(() => false);
  const notificationSettingsEntryVisible = await page.getByRole("link", { name: /تنظیمات اعلان‌ها/ }).isVisible().catch(() => false);
  const dataSettingsEntryVisible = await page.getByRole("link", { name: /داده، حریم خصوصی و راهنما/ }).isVisible().catch(() => false);
  const landingPassed = profileTitleVisible && goalVisible && weightVisible && trainingVisible && localBoundaryVisible && notificationSettingsEntryVisible && dataSettingsEntryVisible;
  report.checks.landing = { profileTitleVisible, goalVisible, weightVisible, trainingVisible, localBoundaryVisible, notificationSettingsEntryVisible, dataSettingsEntryVisible, passed: landingPassed };
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
  await page.getByRole("link", { name: /داده، حریم خصوصی و راهنما/ }).click();
  await page.waitForTimeout(600);
  const settingsTitleVisible = await page.getByRole("heading", { name: "تنظیمات، داده و راهنما" }).isVisible().catch(() => false);
  const privacyBoundaryVisible = await page.getByText("مرز حریم خصوصی نسخهٔ فعلی", { exact: true }).isVisible().catch(() => false);
  const faqVisible = await page.getByText("راهنما و گزارش مشکل", { exact: true }).isVisible().catch(() => false);
  const diagnosticsButtonVisible = await page.getByRole("button", { name: "کپی گزارش فنی" }).isVisible().catch(() => false);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "خروجی JSON" }).click();
  const download = await downloadPromise;
  const exportFilename = download.suggestedFilename();
  const exportPath = await download.path();
  const exportFailure = await download.failure();
  const exportPassed = exportFilename.startsWith("neofit-local-export-") && exportFilename.endsWith(".json") && Boolean(exportPath) && exportFailure === null;

  await page.getByRole("button", { name: "حذف داده‌های محلی" }).click();
  const deleteDialogVisible = await page.getByRole("heading", { name: "همه داده‌های محلی حذف شوند؟" }).isVisible().catch(() => false);
  await page.getByRole("button", { name: "انصراف" }).click();
  const sentinelSurvivedCancel = await page.evaluate(() => window.localStorage.getItem("neofit:delete-sentinel") === "must-disappear");

  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const settingsPassed = settingsTitleVisible && privacyBoundaryVisible && faqVisible && diagnosticsButtonVisible && exportPassed && deleteDialogVisible && sentinelSurvivedCancel && noHorizontalOverflow;
  report.checks.settingsAndPrivacy = { settingsTitleVisible, privacyBoundaryVisible, faqVisible, diagnosticsButtonVisible, exportFilename, exportPathPresent: Boolean(exportPath), exportFailure, deleteDialogVisible, sentinelSurvivedCancel, noHorizontalOverflow, passed: settingsPassed };
  if (!settingsPassed) report.passed = false;
  await page.screenshot({ path: `${artifactDir}/profile-settings.png`, fullPage: true });

  await page.getByRole("button", { name: "حذف داده‌های محلی" }).click();
  await page.getByRole("button", { name: "تأیید حذف کامل" }).click();
  await page.waitForURL("**/onboarding", { timeout: 10_000 });
  const deletionResult = await page.evaluate(() => ({
    sentinel: window.localStorage.getItem("neofit:delete-sentinel"),
    profile: window.localStorage.getItem("neofit-ui-demo-v3"),
    notificationPreferences: window.localStorage.getItem("neofit:notification-preferences:v1"),
  }));
  const deletionPassed = deletionResult.sentinel === null && deletionResult.profile === null && deletionResult.notificationPreferences === null;
  report.checks.localDeletion = { deletionResult, currentPath: new URL(page.url()).pathname, passed: deletionPassed };
  if (!deletionPassed) report.passed = false;
} finally {
  await browser.close();
}

if (pageErrors.length || consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/profile-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

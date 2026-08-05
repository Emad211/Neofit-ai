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
  await page.goto(`${baseUrl}/chat`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(() => {
    const now = Date.now();
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    state.profile = { ...(state.profile || {}), name: "عماد", weight: 92 };
    state.logs = [
      { id: "coach-weight", logType: "weight", loggedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(), weight: 92 },
      { id: "coach-meal-1", logType: "meal", loggedAt: new Date(now).toISOString(), mealType: "breakfast", description: "صبحانه تست", calories: 450 },
      { id: "coach-meal-2", logType: "meal", loggedAt: new Date(now + 1000).toISOString(), mealType: "lunch", description: "ناهار تست", calories: 650 },
      {
        id: "coach-workout-old", logType: "workout", workoutId: "push-a", workoutName: "فشار بالاتنه",
        loggedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), durationMinutes: 55, totalVolume: 3200, rpe: 7, painScale: 0, notes: "",
        exercises: [{ id: "bench-press", name: "پرس سینه هالتر", logs: [{ set: 1, reps: "8", weight: "35" }] }],
      },
    ];
    window.localStorage.setItem("neofit-ui-demo-v3", JSON.stringify(state));
    window.localStorage.setItem("neofit:initial-plan:v1", JSON.stringify({ calorieTarget: 2100, proteinGrams: 150, carbohydrateGrams: 220, fatGrams: 70 }));
    window.localStorage.setItem("neofit:workout-records:v1", JSON.stringify([{ id: "coach-pr", exerciseId: "bench-press", exerciseName: "پرس سینه هالتر", workoutId: "push-a", type: "max-weight", value: 35, achievedAt: new Date(now).toISOString() }]));
    const date = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem(`neofit:daily-metrics:${date}`, JSON.stringify({ date, waterMl: 1750, steps: 6400, sleepHours: 7.5 }));
    window.localStorage.removeItem("neofit:coach-history:v1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);

  const titleVisible = await page.getByRole("heading", { name: "مربی نئوفیت" }).isVisible().catch(() => false);
  const localBadgeVisible = await page.getByText("راهنمای محلی و آفلاین", { exact: true }).isVisible().catch(() => false);
  const safetyBoundaryVisible = await page.getByText(/پاسخ‌ها Rule-based هستند/).isVisible().catch(() => false);
  const suggestionsVisible = await page.getByRole("button", { name: "خلاصه امروز" }).isVisible().catch(() => false);
  const landingPassed = titleVisible && localBadgeVisible && safetyBoundaryVisible && suggestionsVisible;
  report.checks.landing = { titleVisible, localBadgeVisible, safetyBoundaryVisible, suggestionsVisible, passed: landingPassed };
  if (!landingPassed) report.passed = false;

  await page.getByRole("button", { name: "خلاصه امروز" }).click();
  await page.waitForTimeout(250);
  const summaryCaloriesVisible = await page.getByText(/۱٬۱۰۰ کالری ثبت شده/).isVisible().catch(() => false);
  const summaryWaterVisible = await page.getByText(/۱٬۷۵۰ میلی‌لیتر/).isVisible().catch(() => false);
  const summaryStepsVisible = await page.getByText(/۶٬۴۰۰/).isVisible().catch(() => false);
  const todayActionVisible = await page.getByRole("link", { name: "رفتن به امروز" }).isVisible().catch(() => false);
  const summaryPassed = summaryCaloriesVisible && summaryWaterVisible && summaryStepsVisible && todayActionVisible;
  report.checks.todaySummary = { summaryCaloriesVisible, summaryWaterVisible, summaryStepsVisible, todayActionVisible, passed: summaryPassed };
  if (!summaryPassed) report.passed = false;

  await page.getByRole("button", { name: "تمرین بعدی" }).click();
  await page.waitForTimeout(250);
  const workoutResponseVisible = await page.getByText(/جلسهٔ بعدی/).isVisible().catch(() => false);
  const workoutActionVisible = await page.getByRole("link", { name: "جزئیات جلسه" }).isVisible().catch(() => false);
  const workoutPassed = workoutResponseVisible && workoutActionVisible;
  report.checks.workoutGuidance = { workoutResponseVisible, workoutActionVisible, passed: workoutPassed };
  if (!workoutPassed) report.passed = false;

  await page.getByLabel("پیام به مربی نئوفیت").fill("زانو درد شدید دارم");
  await page.getByRole("button", { name: "ارسال پیام" }).click();
  await page.waitForTimeout(300);
  const medicalPromptVisible = await page.getByText("زانو درد شدید دارم", { exact: true }).isVisible().catch(() => false);
  const safetyResponseVisible = await page.getByText(/نمی‌توانم علت درد یا بیماری را تشخیص بدهم/).isVisible().catch(() => false);
  const medicalActionVisible = await page.getByRole("link", { name: "ویرایش محدودیت‌های پزشکی" }).isVisible().catch(() => false);
  const safetyPassed = medicalPromptVisible && safetyResponseVisible && medicalActionVisible;
  report.checks.medicalBoundary = { medicalPromptVisible, safetyResponseVisible, medicalActionVisible, passed: safetyPassed };
  if (!safetyPassed) report.passed = false;

  const storedBeforeReload = await page.evaluate(() => JSON.parse(window.localStorage.getItem("neofit:coach-history:v1") || "[]").length);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const persistedPromptVisible = await page.getByText("زانو درد شدید دارم", { exact: true }).isVisible().catch(() => false);
  const persistedSafetyVisible = await page.getByText(/نمی‌توانم علت درد یا بیماری را تشخیص بدهم/).isVisible().catch(() => false);
  const persistencePassed = storedBeforeReload >= 7 && persistedPromptVisible && persistedSafetyVisible;
  report.checks.persistence = { storedBeforeReload, persistedPromptVisible, persistedSafetyVisible, passed: persistencePassed };
  if (!persistencePassed) report.passed = false;

  await page.getByRole("button", { name: "پاک‌کردن گفتگو" }).click();
  const clearDialogVisible = await page.getByRole("heading", { name: "تاریخچهٔ گفتگو پاک شود؟" }).isVisible().catch(() => false);
  await page.getByRole("button", { name: "تأیید پاک‌کردن" }).click();
  await page.waitForTimeout(250);
  const promptRemoved = (await page.getByText("زانو درد شدید دارم", { exact: true }).count()) === 0;
  const welcomeVisible = await page.getByText(/سلام! من راهنمای محلی نئوفیت هستم/).isVisible().catch(() => false);
  const storedAfterClear = await page.evaluate(() => JSON.parse(window.localStorage.getItem("neofit:coach-history:v1") || "[]").length);
  const clearPassed = clearDialogVisible && promptRemoved && welcomeVisible && storedAfterClear === 1;
  report.checks.clearHistory = { clearDialogVisible, promptRemoved, welcomeVisible, storedAfterClear, passed: clearPassed };
  if (!clearPassed) report.passed = false;

  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  report.checks.mobileLayout = { noHorizontalOverflow, passed: noHorizontalOverflow };
  if (!noHorizontalOverflow) report.passed = false;

  await page.screenshot({ path: `${artifactDir}/coach-flow.png`, fullPage: true });
} finally {
  await browser.close();
}

if (pageErrors.length || consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/coach-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

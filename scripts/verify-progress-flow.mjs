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
  await page.goto(`${baseUrl}/progress`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    state.logs = [
      { id: "weight-old", logType: "weight", loggedAt: new Date(now - 14 * day).toISOString(), weight: 95 },
      { id: "weight-new", logType: "weight", loggedAt: new Date(now - 2 * day).toISOString(), weight: 93 },
      {
        id: "workout-progress-1", logType: "workout", workoutId: "push-a", workoutName: "فشار بالاتنه",
        loggedAt: new Date(now - 5 * day).toISOString(), durationMinutes: 55, totalVolume: 3400, rpe: 7, painScale: 0, notes: "",
        exercises: [{ id: "bench-press", name: "پرس سینه هالتر", logs: [{ set: 1, reps: "8", weight: "35" }] }],
      },
      {
        id: "workout-progress-2", logType: "workout", workoutId: "pull-a", workoutName: "کشش بالاتنه",
        loggedAt: new Date(now - day).toISOString(), durationMinutes: 60, totalVolume: 3900, rpe: 8, painScale: 1, notes: "",
        exercises: [
          { id: "bench-press", name: "پرس سینه هالتر", logs: [{ set: 1, reps: "10", weight: "40" }] },
          { id: "lat-pulldown", name: "لت سیم‌کش", logs: [{ set: 1, reps: "10", weight: "45" }] },
        ],
      },
      { id: "meal-1", logType: "meal", loggedAt: new Date(now - 3 * day).toISOString(), mealType: "breakfast", description: "صبحانه تست", calories: 400 },
      { id: "meal-2", logType: "meal", loggedAt: new Date(now - 3 * day + 1000).toISOString(), mealType: "lunch", description: "ناهار تست", calories: 700 },
      { id: "meal-3", logType: "meal", loggedAt: new Date(now - 3 * day + 2000).toISOString(), mealType: "dinner", description: "شام تست", calories: 500 },
      { id: "meal-4", logType: "meal", loggedAt: new Date(now - 3 * day + 3000).toISOString(), mealType: "snack", description: "میان‌وعده تست", calories: 200 },
      { id: "meal-5", logType: "meal", loggedAt: new Date(now - day).toISOString(), mealType: "breakfast", description: "صبحانه دوم", calories: 350 },
      { id: "meal-6", logType: "meal", loggedAt: new Date(now - day + 1000).toISOString(), mealType: "lunch", description: "ناهار دوم", calories: 650 },
      { id: "meal-7", logType: "meal", loggedAt: new Date(now - day + 2000).toISOString(), mealType: "dinner", description: "شام دوم", calories: 500 },
    ];
    window.localStorage.setItem("neofit-ui-demo-v3", JSON.stringify(state));
    window.localStorage.setItem("neofit:measurement-logs:v1", JSON.stringify([
      { id: "measure-new", loggedAt: new Date(now - day).toISOString(), waistCm: 92, hipCm: 101, neckCm: 39, bodyFatPercent: 24 },
      { id: "measure-old", loggedAt: new Date(now - 14 * day).toISOString(), waistCm: 96, hipCm: 103, neckCm: 40, bodyFatPercent: 26 },
    ]));
    window.localStorage.setItem("neofit:workout-records:v1", JSON.stringify([
      { id: "pr-1", exerciseId: "bench-press", exerciseName: "پرس سینه هالتر", workoutId: "push-a", type: "max-weight", value: 40, achievedAt: new Date(now - day).toISOString() },
    ]));
    const draft = JSON.parse(window.localStorage.getItem("neofit:onboarding-draft:v1") || "{}");
    draft.body = { ...(draft.body || {}), targetWeightKg: 86 };
    window.localStorage.setItem("neofit:onboarding-draft:v1", JSON.stringify(draft));
    window.localStorage.setItem("neofit:initial-plan:v1", JSON.stringify({ calorieTarget: 2100, proteinGrams: 150, carbohydrateGrams: 220, fatGrams: 70 }));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1600);

  const titleVisible = await page.getByRole("heading", { name: "پیشرفت من" }).isVisible().catch(() => false);
  const currentWeightVisible = await page.getByText("۹۳ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const targetDeltaVisible = await page.getByText("۷ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const waistVisible = await page.getByText("۹۲ سانتی‌متر", { exact: true }).isVisible().catch(() => false);
  const workoutsVisible = await page.getByText("۲ جلسه", { exact: true }).first().isVisible().catch(() => false);
  const achievementsVisible = await page.getByText("۵ از ۶", { exact: true }).isVisible().catch(() => false);
  const summaryPassed = titleVisible && currentWeightVisible && targetDeltaVisible && waistVisible && workoutsVisible && achievementsVisible;
  report.checks.summary = { titleVisible, currentWeightVisible, targetDeltaVisible, waistVisible, workoutsVisible, achievementsVisible, passed: summaryPassed };
  if (!summaryPassed) report.passed = false;

  const weightChartVisible = await page.locator('[aria-label="نمودار روند وزن"]').isVisible().catch(() => false);
  const waistChartVisible = await page.locator('[aria-label="نمودار روند دور کمر"]').isVisible().catch(() => false);
  const volumeChartVisible = await page.locator('[aria-label="نمودار حجم جلسات تمرینی"]').isVisible().catch(() => false);
  const nutritionChartVisible = await page.locator('[aria-label="نمودار کالری روزانه"]').isVisible().catch(() => false);
  const exerciseChartVisible = await page.locator('[aria-label="نمودار پیشرفت حرکت"]').isVisible().catch(() => false);
  const chartSvgCount = await page.locator(".recharts-wrapper svg").count();
  const chartsPassed = weightChartVisible && waistChartVisible && volumeChartVisible && nutritionChartVisible && exerciseChartVisible && chartSvgCount >= 5;
  report.checks.charts = { weightChartVisible, waistChartVisible, volumeChartVisible, nutritionChartVisible, exerciseChartVisible, chartSvgCount, passed: chartsPassed };
  if (!chartsPassed) report.passed = false;

  const exerciseSelectValue = await page.getByLabel("انتخاب حرکت برای روند").inputValue().catch(() => "");
  const bestWeightVisible = await page.getByText("۴۰ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const weightIncreaseVisible = await page.getByText(/۵ کیلوگرم افزایش/).isVisible().catch(() => false);
  const latestVolumeVisible = await page.getByText("۴۰۰", { exact: true }).isVisible().catch(() => false);
  const exercisePassed = exerciseSelectValue === "bench-press" && bestWeightVisible && weightIncreaseVisible && latestVolumeVisible;
  report.checks.exerciseProgression = { exerciseSelectValue, bestWeightVisible, weightIncreaseVisible, latestVolumeVisible, passed: exercisePassed };
  if (!exercisePassed) report.passed = false;

  const weeklyReportVisible = await page.getByText("گزارش ۷ روز اخیر", { exact: true }).isVisible().catch(() => false);
  const monthlyReportVisible = await page.getByText("گزارش ۳۰ روز اخیر", { exact: true }).isVisible().catch(() => false);
  const weeklyMinutesVisible = await page.getByText("۱۱۵ دقیقه", { exact: true }).first().isVisible().catch(() => false);
  const reportVolumeVisible = await page.getByText("۷٬۳۰۰", { exact: true }).first().isVisible().catch(() => false);
  const reportsPassed = weeklyReportVisible && monthlyReportVisible && weeklyMinutesVisible && reportVolumeVisible;
  report.checks.periodReports = { weeklyReportVisible, monthlyReportVisible, weeklyMinutesVisible, reportVolumeVisible, passed: reportsPassed };
  if (!reportsPassed) report.passed = false;

  const photoPrivacyVisible = await page.getByText(/خصوصی و موقت/).isVisible().catch(() => false);
  const photoEmptyVisible = await page.getByText("هنوز عکس پیشرفتی انتخاب نشده است", { exact: true }).isVisible().catch(() => false);
  await page.getByLabel("انتخاب عکس پیشرفت").setInputFiles({
    name: "progress-test.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="#ddd"/><circle cx="60" cy="60" r="30" fill="#888"/></svg>'),
  });
  await page.waitForTimeout(300);
  const photoPreviewVisible = await page.getByRole("img", { name: "عکس پیشرفت progress-test.svg" }).isVisible().catch(() => false);
  const photoNameVisible = await page.getByText("progress-test.svg", { exact: true }).isVisible().catch(() => false);
  await page.getByRole("button", { name: "حذف عکس پیشرفت progress-test.svg" }).click();
  const photoRemovedVisible = await page.getByText("هنوز عکس پیشرفتی انتخاب نشده است", { exact: true }).isVisible().catch(() => false);
  const photosPassed = photoPrivacyVisible && photoEmptyVisible && photoPreviewVisible && photoNameVisible && photoRemovedVisible;
  report.checks.progressPhotos = { photoPrivacyVisible, photoEmptyVisible, photoPreviewVisible, photoNameVisible, photoRemovedVisible, passed: photosPassed };
  if (!photosPassed) report.passed = false;

  const firstWorkoutMilestone = await page.getByText("اولین تمرین", { exact: true }).isVisible().catch(() => false);
  const firstRecordMilestone = await page.getByText("اولین رکورد شخصی", { exact: true }).isVisible().catch(() => false);
  const nutritionMilestone = await page.getByText("ثبت منظم تغذیه", { exact: true }).isVisible().catch(() => false);
  const lockedMilestone = await page.getByText("پنج جلسه تمرین", { exact: true }).isVisible().catch(() => false);
  const milestonesPassed = firstWorkoutMilestone && firstRecordMilestone && nutritionMilestone && lockedMilestone;
  report.checks.milestones = { firstWorkoutMilestone, firstRecordMilestone, nutritionMilestone, lockedMilestone, passed: milestonesPassed };
  if (!milestonesPassed) report.passed = false;

  await page.screenshot({ path: `${artifactDir}/progress-overview.png`, fullPage: true });
} finally {
  await browser.close();
}

if (pageErrors.length || consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/progress-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

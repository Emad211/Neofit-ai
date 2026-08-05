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
        exercises: [{ id: "lat-pulldown", name: "لت سیم‌کش", logs: [{ set: 1, reps: "10", weight: "45" }] }],
      },
    ];
    window.localStorage.setItem("neofit-ui-demo-v3", JSON.stringify(state));
    window.localStorage.setItem("neofit:measurement-logs:v1", JSON.stringify([
      { id: "measure-new", loggedAt: new Date(now - day).toISOString(), waistCm: 92, hipCm: 101, neckCm: 39, bodyFatPercent: 24 },
      { id: "measure-old", loggedAt: new Date(now - 14 * day).toISOString(), waistCm: 96, hipCm: 103, neckCm: 40, bodyFatPercent: 26 },
    ]));
    window.localStorage.setItem("neofit:workout-records:v1", JSON.stringify([
      { id: "pr-1", exerciseId: "bench-press", exerciseName: "پرس سینه هالتر", workoutId: "push-a", type: "max-weight", value: 35, achievedAt: new Date(now - day).toISOString() },
    ]));
    const draft = JSON.parse(window.localStorage.getItem("neofit:onboarding-draft:v1") || "{}");
    draft.body = { ...(draft.body || {}), targetWeightKg: 86 };
    window.localStorage.setItem("neofit:onboarding-draft:v1", JSON.stringify(draft));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const titleVisible = await page.getByRole("heading", { name: "پیشرفت من" }).isVisible().catch(() => false);
  const currentWeightVisible = await page.getByText("۹۳ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const targetDeltaVisible = await page.getByText("۷ کیلوگرم", { exact: true }).isVisible().catch(() => false);
  const waistVisible = await page.getByText("۹۲ سانتی‌متر", { exact: true }).isVisible().catch(() => false);
  const workoutsVisible = await page.getByText("۲ جلسه", { exact: true }).isVisible().catch(() => false);
  const recordVisible = await page.getByText("۱", { exact: true }).last().isVisible().catch(() => false);
  const summaryPassed = titleVisible && currentWeightVisible && targetDeltaVisible && waistVisible && workoutsVisible && recordVisible;
  report.checks.summary = { titleVisible, currentWeightVisible, targetDeltaVisible, waistVisible, workoutsVisible, recordVisible, passed: summaryPassed };
  if (!summaryPassed) report.passed = false;

  const weightChartVisible = await page.locator('[aria-label="نمودار روند وزن"]').isVisible().catch(() => false);
  const waistChartVisible = await page.locator('[aria-label="نمودار روند دور کمر"]').isVisible().catch(() => false);
  const volumeChartVisible = await page.locator('[aria-label="نمودار حجم جلسات تمرینی"]').isVisible().catch(() => false);
  const chartSvgCount = await page.locator(".recharts-wrapper svg").count();
  const chartsPassed = weightChartVisible && waistChartVisible && volumeChartVisible && chartSvgCount >= 3;
  report.checks.charts = { weightChartVisible, waistChartVisible, volumeChartVisible, chartSvgCount, passed: chartsPassed };
  if (!chartsPassed) report.passed = false;

  await page.screenshot({ path: `${artifactDir}/progress-overview.png`, fullPage: true });
} finally {
  await browser.close();
}

if (pageErrors.length || consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/progress-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

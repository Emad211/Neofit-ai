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
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

const report = { baseUrl, checks: {}, pageErrors, consoleErrors, passed: true };

try {
  await page.goto(`${baseUrl}/workout-player/push-a`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(900);

  const weightInput = page.getByLabel("وزنه (کیلوگرم)");
  const repsInput = page.getByLabel("تکرار");
  await weightInput.fill("40");
  await repsInput.fill("10");
  await page.waitForTimeout(350);

  const storedBeforeReload = await page.evaluate(() => JSON.parse(window.localStorage.getItem("neofit:active-workout:push-a") || "null"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(750);
  const restoredWeight = await page.getByLabel("وزنه (کیلوگرم)").inputValue();
  const restoredReps = await page.getByLabel("تکرار").inputValue();
  const resumeVisible = await page.getByText("جلسه بازیابی و ذخیره خودکار فعال است", { exact: true }).isVisible().catch(() => false);
  const resumePassed = Boolean(storedBeforeReload?.session?.id === "push-a" && restoredWeight === "40" && restoredReps === "10" && resumeVisible);
  report.checks.resumeAfterRefresh = { restoredWeight, restoredReps, resumeVisible, passed: resumePassed };
  if (!resumePassed) report.passed = false;

  await page.getByRole("button", { name: "راهنمای حرکت" }).click();
  const guideVisible = await page.getByRole("heading", { name: /راهنمای فرم/ }).isVisible().catch(() => false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /جایگزین حرکت/ }).click();
  const alternativeVisible = await page.getByRole("heading", { name: /جایگزین برای/ }).isVisible().catch(() => false);
  const alternativeName = await page.locator('[role="dialog"] .font-bold').first().textContent().catch(() => null);
  await page.getByRole("button", { name: "انتخاب جایگزین" }).click();
  await page.waitForTimeout(250);
  const replacementApplied = alternativeName ? await page.getByRole("heading", { name: alternativeName }).isVisible().catch(() => false) : false;
  const guidancePassed = guideVisible && alternativeVisible && replacementApplied;
  report.checks.guidanceAndAlternative = { guideVisible, alternativeVisible, alternativeName, replacementApplied, passed: guidancePassed };
  if (!guidancePassed) report.passed = false;

  await page.evaluate(() => {
    const key = "neofit:active-workout:push-a";
    const stored = JSON.parse(window.localStorage.getItem(key) || "null");
    if (!stored?.session?.exercises?.length) throw new Error("active workout session missing");
    stored.session.exercises = stored.session.exercises.map((exercise) => ({
      ...exercise,
      logs: exercise.logs.map((log) => ({ ...log, reps: "10", weight: "40" })),
    }));
    stored.exerciseIndex = stored.session.exercises.length - 1;
    const finalExercise = stored.session.exercises[stored.exerciseIndex];
    stored.setIndex = finalExercise.logs.length - 1;
    finalExercise.logs[stored.setIndex] = { ...finalExercise.logs[stored.setIndex], reps: "", weight: "" };
    stored.startTime = Date.now() - 4 * 60 * 1000;
    window.localStorage.setItem(key, JSON.stringify(stored));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  await page.getByLabel("وزنه (کیلوگرم)").fill("45");
  await page.getByLabel("تکرار").fill("8");
  await page.getByRole("button", { name: "ثبت ست و ادامه" }).click();
  await page.waitForTimeout(500);

  const completionVisible = await page.getByRole("heading", { name: "تمرین کامل شد!" }).isVisible().catch(() => false);
  await page.locator("#rpe").evaluate((element) => {
    element.value = "8";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#pain").evaluate((element) => {
    element.value = "2";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#workout-notes").fill("فرم خوب بود و ست آخر کنترل‌شده انجام شد.");
  await page.getByRole("button", { name: "ذخیره تمرین در تاریخچه" }).click();
  await page.waitForTimeout(700);
  const saveSuccessVisible = await page.getByRole("heading", { name: "جلسه با موفقیت ثبت شد" }).isVisible().catch(() => false);
  const storedResult = await page.evaluate(() => {
    const activeSession = window.localStorage.getItem("neofit:active-workout:push-a");
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    const workout = (state.logs || []).find((log) => log.logType === "workout" && log.workoutId === "push-a");
    return {
      activeSessionCleared: activeSession === null,
      workout: workout ? { rpe: workout.rpe, painScale: workout.painScale, notes: workout.notes, totalVolume: workout.totalVolume } : null,
    };
  });
  const completionPassed = completionVisible && saveSuccessVisible && storedResult.activeSessionCleared && storedResult.workout?.rpe === 8 && storedResult.workout?.painScale === 2 && storedResult.workout?.notes?.includes("فرم خوب بود") && storedResult.workout?.totalVolume > 0;
  report.checks.completionAndSave = { completionVisible, saveSuccessVisible, storedResult, passed: completionPassed };
  if (!completionPassed) report.passed = false;
  await page.screenshot({ path: `${artifactDir}/workout-completion.png`, fullPage: true });

  await page.goto(`${baseUrl}/workout/history`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(700);
  const historyTitleVisible = await page.getByRole("heading", { name: "جلسه‌ها و رکوردها" }).isVisible().catch(() => false);
  const loggedWorkoutVisible = await page.getByText("فشار بالاتنه", { exact: true }).isVisible().catch(() => false);
  const noteVisible = await page.getByText("فرم خوب بود و ست آخر کنترل‌شده انجام شد.", { exact: true }).isVisible().catch(() => false);
  const historyPassed = historyTitleVisible && loggedWorkoutVisible && noteVisible;
  report.checks.history = { historyTitleVisible, loggedWorkoutVisible, noteVisible, passed: historyPassed };
  if (!historyPassed) report.passed = false;
  await page.screenshot({ path: `${artifactDir}/workout-history.png`, fullPage: true });
} finally {
  await browser.close();
}

if (pageErrors.length || consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/workout-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

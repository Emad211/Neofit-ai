import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.NEOFIT_BASE_URL || "http://127.0.0.1:3000";
const routes = [
  "today",
  "notifications",
  "nutrition",
  "workout",
  "progress",
  "profile",
  "profile/account",
  "auth",
  "offline",
  "onboarding",
  "onboarding/goal",
  "onboarding/basics",
  "onboarding/body",
  "onboarding/medical",
  "onboarding/injuries",
  "onboarding/lifestyle",
  "onboarding/nutrition",
  "onboarding/training-history",
  "onboarding/availability",
  "onboarding/preferences",
  "onboarding/review",
  "onboarding/analysis",
  "onboarding/result",
  "onboarding/confirmation",
];
const artifactDir = "artifacts/ui-revival-smoke";
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fa-IR" });
const report = { baseUrl, routes: [], flows: [], passed: true };

try {
  for (const route of routes) {
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error?.stack || error)));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const response = await page.goto(`${baseUrl}/${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(route === "onboarding/analysis" ? 4_000 : 1_200);

    let interaction = {};
    let interactionPassed = true;
    if (route === "onboarding/injuries") {
      const parts = page.locator(".injury-body-part");
      const bodyPartCount = await parts.count();
      if (bodyPartCount > 0) {
        await parts.first().click();
        await page.waitForTimeout(200);
      }
      const firstPressed = bodyPartCount > 0 ? await parts.first().getAttribute("aria-pressed") : null;
      const selectedTextVisible = await page.getByText("1 ناحیه", { exact: true }).isVisible().catch(() => false);
      interaction = { bodyPartCount, firstPressed, selectedTextVisible };
      interactionPassed = bodyPartCount >= 40 && firstPressed === "true" && selectedTextVisible;
    }

    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      title: document.title,
      bodyLength: document.body.innerText.length,
      hasErrorOverlay: Boolean(document.querySelector("nextjs-portal")),
    }));
    await page.screenshot({ path: `${artifactDir}/${route.replaceAll("/", "-")}.png`, fullPage: true });

    const status = response?.status() ?? 0;
    const passed = status >= 200 && status < 400 && state.lang === "fa" && state.dir === "rtl" && !state.hasErrorOverlay && pageErrors.length === 0 && consoleErrors.length === 0 && state.bodyLength > 40 && interactionPassed;
    report.routes.push({ route, status, ...state, interaction, pageErrors, consoleErrors, passed });
    if (!passed) report.passed = false;
    await page.close();
  }

  const flowPage = await context.newPage();
  await flowPage.goto(`${baseUrl}/onboarding/basics`, { waitUntil: "domcontentloaded" });
  await flowPage.evaluate(() => {
    window.localStorage.setItem("neofit:onboarding-draft:v1", JSON.stringify({
      basics: { name: "کاربر تست", age: 31, gender: "male", heightCm: 181, weightKg: 84, country: "ایران", unitSystem: "metric" },
      completedSteps: [1, 2],
    }));
  });
  await flowPage.reload({ waitUntil: "domcontentloaded" });
  await flowPage.waitForTimeout(500);
  const resumedName = await flowPage.locator("#name").inputValue();
  const resumedAge = await flowPage.locator("#age").inputValue();
  const resumePassed = resumedName === "کاربر تست" && resumedAge === "31";
  report.flows.push({ name: "draft-resume-after-refresh", resumedName, resumedAge, passed: resumePassed });
  if (!resumePassed) report.passed = false;

  await flowPage.goto(`${baseUrl}/onboarding/medical`, { waitUntil: "domcontentloaded" });
  await flowPage.waitForTimeout(500);
  await flowPage.getByRole("button", { name: /ادامه به آسیب‌ها/ }).click();
  const validationVisible = await flowPage.getByText("برای ادامه، این تأیید ضروری است.", { exact: true }).isVisible().catch(() => false);
  report.flows.push({ name: "medical-safety-validation", validationVisible, passed: validationVisible });
  if (!validationVisible) report.passed = false;
  await flowPage.screenshot({ path: `${artifactDir}/onboarding-validation.png`, fullPage: true });

  await flowPage.goto(`${baseUrl}/today`, { waitUntil: "domcontentloaded" });
  await flowPage.waitForTimeout(700);
  const notificationEntryVisible = await flowPage.getByRole("link", { name: /اعلان‌ها/ }).isVisible().catch(() => false);
  const coachEntryVisible = await flowPage.getByRole("link", { name: "مربی نئوفیت" }).isVisible().catch(() => false);
  const beforeWater = await flowPage.evaluate(() => {
    const date = new Date().toISOString().slice(0, 10);
    const stored = window.localStorage.getItem(`neofit:daily-metrics:${date}`);
    return stored ? JSON.parse(stored).waterMl : 1250;
  });
  await flowPage.getByRole("button", { name: "بازکردن افزودن سریع" }).click();
  await flowPage.getByRole("button", { name: "یک لیوان آب" }).click();
  await flowPage.waitForTimeout(250);
  const afterWater = await flowPage.evaluate(() => {
    const date = new Date().toISOString().slice(0, 10);
    return JSON.parse(window.localStorage.getItem(`neofit:daily-metrics:${date}`) || "{}").waterMl;
  });
  const quickAddPassed = afterWater === beforeWater + 250;

  await flowPage.getByRole("button", { name: "بازکردن افزودن سریع" }).click();
  await flowPage.getByRole("button", { name: "ثبت اندازه‌ها" }).click();
  await flowPage.locator("#measure-waist").fill("93.5");
  await flowPage.getByRole("button", { name: "ذخیره اندازه‌ها" }).click();
  await flowPage.waitForTimeout(250);
  const measurementResult = await flowPage.evaluate(() => {
    const logs = JSON.parse(window.localStorage.getItem("neofit:measurement-logs:v1") || "[]");
    return { count: logs.length, waistCm: logs[0]?.waistCm };
  });
  const measurementPassed = measurementResult.count >= 1 && measurementResult.waistCm === 93.5;

  await context.setOffline(true);
  await flowPage.waitForTimeout(250);
  const offlineBannerVisible = await flowPage.getByText(/آفلاین هستی؛ ثبت‌های محلی ادامه دارند/).isVisible().catch(() => false);
  await context.setOffline(false);

  report.flows.push({
    name: "today-shell-quick-add-measurement-offline",
    notificationEntryVisible,
    coachEntryVisible,
    beforeWater,
    afterWater,
    measurementResult,
    offlineBannerVisible,
    passed: notificationEntryVisible && coachEntryVisible && quickAddPassed && measurementPassed && offlineBannerVisible,
  });
  if (!notificationEntryVisible || !coachEntryVisible || !quickAddPassed || !measurementPassed || !offlineBannerVisible) report.passed = false;
  await flowPage.screenshot({ path: `${artifactDir}/today-interaction.png`, fullPage: true });

  await flowPage.goto(`${baseUrl}/notifications`, { waitUntil: "domcontentloaded" });
  await flowPage.waitForTimeout(600);
  const markAllButton = flowPage.getByRole("button", { name: "خواندن همه" });
  const markAllWasEnabled = await markAllButton.isEnabled().catch(() => false);
  if (markAllWasEnabled) await markAllButton.click();
  await flowPage.reload({ waitUntil: "domcontentloaded" });
  await flowPage.waitForTimeout(500);
  const allReadPersisted = await flowPage.getByText("همه اعلان‌ها خوانده شده‌اند", { exact: true }).isVisible().catch(() => false);
  report.flows.push({ name: "notification-read-state-persists", markAllWasEnabled, allReadPersisted, passed: markAllWasEnabled && allReadPersisted });
  if (!markAllWasEnabled || !allReadPersisted) report.passed = false;
  await flowPage.close();
} finally {
  await browser.close();
}

await fs.writeFile(`${artifactDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

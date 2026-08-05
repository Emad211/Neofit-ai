import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.NEOFIT_BASE_URL || "http://127.0.0.1:3000";
const artifactDir = "artifacts/ui-revival-smoke";
await fs.mkdir(artifactDir, { recursive: true });

const cases = [
  { name: "tablet", viewport: { width: 820, height: 1180 } },
  { name: "desktop", viewport: { width: 1440, height: 1000 } },
];

const browser = await chromium.launch({ headless: true });
const report = { baseUrl, cases: [], fatalError: null, passed: true };

try {
  for (const testCase of cases) {
    const context = await browser.newContext({ viewport: testCase.viewport, locale: "fa-IR" });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error?.stack || error)));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    try {
      const response = await page.goto(`${baseUrl}/today`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(1_200);

      const sidebar = page.locator('div[data-state][data-side="right"]').first();
      const sidebarPanel = page.locator('[data-sidebar="sidebar"]').first();
      const sidebarVisible = await sidebarPanel.isVisible().catch(() => false);
      const mobileNavigationVisible = await page.getByRole("navigation", { name: "ناوبری اصلی" }).isVisible().catch(() => false);
      const readinessVisible = await page.getByText("امتیاز آمادگی امروز", { exact: true }).isVisible().catch(() => false);
      const notificationEntryVisible = await page.getByRole("link", { name: /اعلان‌ها/ }).first().isVisible().catch(() => false);
      const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

      const stateBefore = await sidebar.getAttribute("data-state").catch(() => null);
      await page.getByRole("button", { name: "بازکردن منو" }).click();
      await page.waitForTimeout(300);
      const stateAfter = await sidebar.getAttribute("data-state").catch(() => null);
      const sidebarTogglePassed = stateBefore === "expanded" && stateAfter === "collapsed";
      await page.getByRole("button", { name: "بازکردن منو" }).click();
      await page.waitForTimeout(250);

      await page.screenshot({ path: `${artifactDir}/today-${testCase.name}.png`, fullPage: true });

      const notificationResponse = await page.goto(`${baseUrl}/notifications`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(700);
      const notificationNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      const notificationTitleVisible = await page.getByRole("heading", { name: "اعلان‌ها" }).first().isVisible().catch(() => false);
      await page.screenshot({ path: `${artifactDir}/notifications-${testCase.name}.png`, fullPage: true });

      const progressResponse = await page.goto(`${baseUrl}/progress`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(1_000);
      const progressNoOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      const progressTitleVisible = await page.getByRole("heading", { name: "پیشرفت من" }).isVisible().catch(() => false);
      const exerciseProgressVisible = await page.getByText("روند هر حرکت", { exact: true }).isVisible().catch(() => false);
      const reportsVisible = await page.getByText("گزارش‌های دوره‌ای", { exact: true }).isVisible().catch(() => false);
      const photosVisible = await page.getByText("عکس‌های پیشرفت", { exact: true }).isVisible().catch(() => false);
      await page.screenshot({ path: `${artifactDir}/progress-${testCase.name}.png`, fullPage: true });

      const passed =
        (response?.status() ?? 0) >= 200 &&
        (response?.status() ?? 0) < 400 &&
        (notificationResponse?.status() ?? 0) >= 200 &&
        (notificationResponse?.status() ?? 0) < 400 &&
        (progressResponse?.status() ?? 0) >= 200 &&
        (progressResponse?.status() ?? 0) < 400 &&
        sidebarVisible &&
        !mobileNavigationVisible &&
        readinessVisible &&
        notificationEntryVisible &&
        noHorizontalOverflow &&
        notificationNoOverflow &&
        notificationTitleVisible &&
        progressNoOverflow &&
        progressTitleVisible &&
        exerciseProgressVisible &&
        reportsVisible &&
        photosVisible &&
        sidebarTogglePassed &&
        pageErrors.length === 0 &&
        consoleErrors.length === 0;

      report.cases.push({
        name: testCase.name,
        viewport: testCase.viewport,
        sidebarVisible,
        mobileNavigationVisible,
        readinessVisible,
        notificationEntryVisible,
        noHorizontalOverflow,
        notificationNoOverflow,
        notificationTitleVisible,
        progressNoOverflow,
        progressTitleVisible,
        exerciseProgressVisible,
        reportsVisible,
        photosVisible,
        stateBefore,
        stateAfter,
        sidebarTogglePassed,
        pageErrors,
        consoleErrors,
        passed,
      });
      if (!passed) report.passed = false;
    } catch (error) {
      report.cases.push({ name: testCase.name, viewport: testCase.viewport, error: String(error?.stack || error), pageErrors, consoleErrors, passed: false });
      report.passed = false;
    } finally {
      await context.close();
    }
  }
} catch (error) {
  report.fatalError = String(error?.stack || error);
  report.passed = false;
} finally {
  await browser.close();
  await fs.writeFile(`${artifactDir}/responsive-report.json`, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

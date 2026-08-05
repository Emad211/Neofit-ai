import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.NEOFIT_BASE_URL || "http://127.0.0.1:3000";
const routes = [
  "today",
  "nutrition",
  "workout",
  "progress",
  "profile",
  "profile/account",
  "auth",
  "onboarding",
  "onboarding/goal",
  "onboarding/basics",
  "onboarding/body",
  "onboarding/medical",
];
const artifactDir = "artifacts/ui-revival-smoke";
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fa-IR" });
const report = { baseUrl, routes: [], passed: true };

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
    await page.waitForTimeout(1_200);
    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      title: document.title,
      bodyLength: document.body.innerText.length,
      hasErrorOverlay: Boolean(document.querySelector("nextjs-portal")),
    }));
    await page.screenshot({ path: `${artifactDir}/${route.replaceAll("/", "-")}.png`, fullPage: true });

    const status = response?.status() ?? 0;
    const passed = status >= 200 && status < 400 && state.lang === "fa" && state.dir === "rtl" && !state.hasErrorOverlay && pageErrors.length === 0 && consoleErrors.length === 0;
    report.routes.push({ route, status, ...state, pageErrors, consoleErrors, passed });
    if (!passed) report.passed = false;
    await page.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(`${artifactDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.NEOFIT_BASE_URL || "http://127.0.0.1:3000";
const routes = ["today", "nutrition", "workout", "progress", "profile"];
const artifactDir = "artifacts/ui-revival-smoke";
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "fa-IR",
});

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

    const response = await page.goto(`${baseUrl}/${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(1_500);

    const htmlState = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      title: document.title,
      body: document.body.innerText,
      hasErrorOverlay: Boolean(document.querySelector("nextjs-portal")),
    }));

    await page.screenshot({
      path: `${artifactDir}/${route}.png`,
      fullPage: true,
    });

    const fatalText = [htmlState.body, ...pageErrors, ...consoleErrors].join("\n");
    const firebaseFailure = /FirebaseError|invalid-api-key|auth\/invalid-api-key/i.test(fatalText);
    const status = response?.status() ?? 0;
    const routePassed =
      status >= 200 &&
      status < 400 &&
      htmlState.lang === "fa" &&
      htmlState.dir === "rtl" &&
      !htmlState.hasErrorOverlay &&
      !firebaseFailure &&
      pageErrors.length === 0;

    report.routes.push({
      route,
      status,
      title: htmlState.title,
      bodyLength: htmlState.body.length,
      pageErrors,
      consoleErrors,
      firebaseFailure,
      hasErrorOverlay: htmlState.hasErrorOverlay,
      passed: routePassed,
    });

    if (!routePassed) report.passed = false;
    await page.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(`${artifactDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.passed) process.exit(1);

import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.NEOFIT_BASE_URL || "http://127.0.0.1:3000";
const artifactDir = "artifacts/ui-revival-smoke";
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fa-IR", reducedMotion: "reduce" });
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error?.stack || error)));
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

const report = { baseUrl, checks: {}, pageErrors, consoleErrors: [], expectedConsoleErrors: [], passed: true };

try {
  const manifestResponse = await context.request.get(`${baseUrl}/manifest.webmanifest`);
  const manifest = await manifestResponse.json();
  const iconResponse = await context.request.get(`${baseUrl}/neofit-icon.svg`);
  const manifestPassed =
    manifestResponse.ok() &&
    manifest.name === "NeoFit | نئوفیت" &&
    manifest.start_url === "/today" &&
    manifest.display === "standalone" &&
    manifest.lang === "fa" &&
    manifest.dir === "rtl" &&
    Array.isArray(manifest.icons) &&
    manifest.icons.some((icon) => icon.src === "/neofit-icon.svg") &&
    iconResponse.ok();
  report.checks.manifest = {
    status: manifestResponse.status(),
    name: manifest.name,
    startUrl: manifest.start_url,
    display: manifest.display,
    iconStatus: iconResponse.status(),
    passed: manifestPassed,
  };
  if (!manifestPassed) report.passed = false;

  const swResponse = await context.request.get(`${baseUrl}/sw.js`);
  const swText = await swResponse.text();
  const swBoundariesPassed =
    swResponse.ok() &&
    swText.includes('request.method !== "GET"') &&
    swText.includes('url.pathname.startsWith("/api")') &&
    swText.includes('url.pathname.startsWith("/auth")') &&
    swText.includes('request.headers.has("authorization")') &&
    swText.includes('request.mode === "navigate"');
  report.checks.serviceWorkerSource = { status: swResponse.status(), swBoundariesPassed, passed: swBoundariesPassed };
  if (!swBoundariesPassed) report.passed = false;

  await page.goto(`${baseUrl}/today`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.evaluate(async () => {
    if ("serviceWorker" in navigator) await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: "networkidle" });
  const workerState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return {
      supported: "serviceWorker" in navigator,
      registered: Boolean(registration),
      active: registration?.active?.state || null,
      controlled: Boolean(navigator.serviceWorker.controller),
    };
  });
  const workerPassed = workerState.supported && workerState.registered && workerState.active === "activated" && workerState.controlled;
  report.checks.serviceWorkerRuntime = { ...workerState, passed: workerPassed };
  if (!workerPassed) report.passed = false;

  await page.keyboard.press("Tab");
  const skipLinkFocused = await page.evaluate(() => document.activeElement?.textContent?.includes("پرش به محتوای اصلی") || false);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  const mainTargetFocused = await page.evaluate(() => document.activeElement?.id === "main-content");
  const skipPassed = skipLinkFocused && mainTargetFocused;
  report.checks.skipLink = { skipLinkFocused, mainTargetFocused, passed: skipPassed };
  if (!skipPassed) report.passed = false;

  const focusTarget = page.getByRole("link", { name: /اعلان‌ها/ }).first();
  await focusTarget.focus();
  const focusStyle = await focusTarget.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  const reducedMotion = await page.evaluate(() => ({
    mediaMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  const accessibilityPassed =
    focusStyle.outlineStyle !== "none" &&
    Number.parseFloat(focusStyle.outlineWidth) >= 3 &&
    reducedMotion.mediaMatches &&
    reducedMotion.scrollBehavior === "auto";
  report.checks.accessibility = { focusStyle, reducedMotion, passed: accessibilityPassed };
  if (!accessibilityPassed) report.passed = false;

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.waitForTimeout(600);
  const offlineReloadVisible = await page.getByRole("heading", { name: /سلام/ }).isVisible().catch(() => false);
  const offlineControlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(false);
  const offlinePassed = offlineReloadVisible && offlineControlled;
  report.checks.offlineReload = { offlineReloadVisible, offlineControlled, passed: offlinePassed };
  if (!offlinePassed) report.passed = false;

  const systemPages = [
    { route: "/maintenance", heading: "در حال به‌روزرسانی نئوفیت", expectedStatus: 200 },
    { route: "/session-expired", heading: "نشست کاربری پایان یافته است", expectedStatus: 200 },
    { route: "/route-that-does-not-exist", heading: "این صفحه پیدا نشد", expectedStatus: 404 },
  ];
  const systemResults = [];
  for (const item of systemPages) {
    const response = await page.goto(`${baseUrl}${item.route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(250);
    const headingVisible = await page.getByRole("heading", { name: item.heading }).isVisible().catch(() => false);
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    const status = response?.status() ?? 0;
    const passed = status === item.expectedStatus && headingVisible && noOverflow;
    systemResults.push({ ...item, status, headingVisible, noOverflow, passed });
    if (!passed) report.passed = false;
  }
  report.checks.systemPages = { results: systemResults, passed: systemResults.every((item) => item.passed) };

  await page.goto(`${baseUrl}/today`, { waitUntil: "domcontentloaded" });
  await page.screenshot({ path: `${artifactDir}/hardening-today.png`, fullPage: true });
} finally {
  await context.setOffline(false).catch(() => {});
  await browser.close();
}

const expectedConsolePatterns = [
  "ERR_INTERNET_DISCONNECTED",
  "Failed to fetch RSC payload",
  "status of 404 (Not Found)",
];
report.expectedConsoleErrors = consoleErrors.filter((message) => expectedConsolePatterns.some((pattern) => message.includes(pattern)));
report.consoleErrors = consoleErrors.filter((message) => !expectedConsolePatterns.some((pattern) => message.includes(pattern)));
if (pageErrors.length || report.consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/hardening-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

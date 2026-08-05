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
  await page.goto(`${baseUrl}/nutrition`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(900);

  const landingVisible = await page.getByRole("heading", { name: "تغذیه امروز و هفته" }).isVisible().catch(() => false);
  const summaryVisible = await page.getByText("هدف امروز", { exact: true }).isVisible().catch(() => false);
  const todayBadgeVisible = await page.getByText("امروز", { exact: true }).first().isVisible().catch(() => false);
  const landingPassed = landingVisible && summaryVisible && todayBadgeVisible;
  report.checks.landing = { landingVisible, summaryVisible, todayBadgeVisible, passed: landingPassed };
  if (!landingPassed) report.passed = false;

  await page.getByRole("button", { name: "جزئیات", exact: true }).first().click();
  const ingredientsVisible = await page.getByText("مواد لازم", { exact: true }).isVisible().catch(() => false);
  const recipeVisible = await page.getByText("راهنمای آماده‌سازی", { exact: true }).isVisible().catch(() => false);
  const detailsPassed = ingredientsVisible && recipeVisible;
  report.checks.details = { ingredientsVisible, recipeVisible, passed: detailsPassed };
  if (!detailsPassed) report.passed = false;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: "جایگزین", exact: true }).first().click();
  const alternativeVisible = await page.getByText("جایگزین وعده", { exact: true }).isVisible().catch(() => false);
  await page.getByRole("button", { name: "انتخاب این وعده" }).click();
  await page.waitForTimeout(300);
  report.checks.alternative = { alternativeVisible, passed: alternativeVisible };
  if (!alternativeVisible) report.passed = false;

  const before = await page.evaluate(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    return { loggedMeals: (state.loggedMealsState || []).length };
  });
  await page.getByRole("button", { name: "ثبت وعده", exact: true }).first().click();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    const meals = (state.logs || []).filter((log) => log.logType === "meal");
    return { loggedMeals: (state.loggedMealsState || []).length, mealCalories: meals[0]?.calories || 0 };
  });
  const logPassed = after.loggedMeals === before.loggedMeals + 1 && after.mealCalories > 0;
  report.checks.logging = { before, after, passed: logPassed };
  if (!logPassed) report.passed = false;

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const persistedBadgeVisible = await page.getByText("ثبت‌شده", { exact: true }).first().isVisible().catch(() => false);
  const persistedState = await page.evaluate(() => {
    const state = JSON.parse(window.localStorage.getItem("neofit-ui-demo-v3") || "{}");
    return { loggedMeals: (state.loggedMealsState || []).length };
  });
  const persistencePassed = persistedBadgeVisible && persistedState.loggedMeals === after.loggedMeals;
  report.checks.persistence = { persistedBadgeVisible, persistedState, passed: persistencePassed };
  if (!persistencePassed) report.passed = false;

  await page.getByRole("button", { name: "لیست خرید" }).click();
  const shoppingTitleVisible = await page.getByText("لیست خرید برنامه", { exact: true }).isVisible().catch(() => false);
  report.checks.shoppingList = { shoppingTitleVisible, passed: shoppingTitleVisible };
  if (!shoppingTitleVisible) report.passed = false;

  await page.screenshot({ path: `${artifactDir}/nutrition-flow.png`, fullPage: true });
} finally {
  await browser.close();
}

if (pageErrors.length || consoleErrors.length) report.passed = false;
await fs.writeFile(`${artifactDir}/nutrition-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);

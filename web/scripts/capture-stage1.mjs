import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.NEOFIT_VISUAL_BASE_URL ?? 'http://127.0.0.1:3000';
const outputDir = path.resolve('artifacts/stage1-visual');
const targetWidths = [360, 390, 412];
const results = [];

await mkdir(outputDir, { recursive: true });

async function inspectLayout(page, screen, width) {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    scrollY: window.scrollY,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    pathname: window.location.pathname,
  }));
  const hasHorizontalOverflow =
    dimensions.documentWidth > dimensions.viewportWidth ||
    dimensions.bodyWidth > dimensions.viewportWidth;

  const result = { screen, width, ...dimensions, hasHorizontalOverflow };
  results.push(result);

  if (hasHorizontalOverflow) {
    throw new Error(
      `Horizontal overflow on ${screen} at ${width}px: viewport=${dimensions.viewportWidth}, document=${dimensions.documentWidth}, body=${dimensions.bodyWidth}`,
    );
  }
  if (dimensions.lang !== 'fa' || dimensions.dir !== 'rtl') {
    throw new Error(`Root locale contract failed on ${screen} at ${width}px.`);
  }
  return result;
}

const browser = await chromium.launch({ headless: true });
try {
  for (const width of targetWidths) {
    const context = await browser.newContext({
      locale: 'fa-IR',
      viewport: { width, height: 844 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/today`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'خلاصهٔ امروز' }).waitFor();
    await page.screenshot({ path: path.join(outputDir, `today-${width}.png`) });
    const result = await inspectLayout(page, 'today', width);
    if (result.pathname !== '/today') throw new Error(`Expected /today, got ${result.pathname}`);
    await context.close();
  }

  const context = await browser.newContext({
    locale: 'fa-IR',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/today`, { waitUntil: 'networkidle' });

  await page.getByRole('link', { name: 'تغذیه', exact: true }).click();
  await page.getByRole('heading', { name: 'چه چیزی خوردی؟' }).waitFor();
  await page.screenshot({ path: path.join(outputDir, 'nutrition-390.png') });
  const nutritionResult = await inspectLayout(page, 'nutrition', 390);
  if (nutritionResult.pathname !== '/nutrition') throw new Error(`Expected /nutrition, got ${nutritionResult.pathname}`);

  const search = page.getByPlaceholder('مثلاً قورمه‌سبزی یا جوجه کباب');
  await search.fill('قورمه');
  await page.screenshot({ path: path.join(outputDir, 'search-ghormeh-390.png') });
  await inspectLayout(page, 'search', 390);

  await page.getByRole('button', { name: /قورمه‌سبزی/ }).first().click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: path.join(outputDir, 'meal-sheet-390.png') });
  await inspectLayout(page, 'meal-sheet', 390);
  await page.getByRole('button', { name: 'بستن' }).click();

  await page.getByRole('link', { name: 'برنامهٔ هفته' }).click();
  await page.getByRole('heading', { name: 'برنامهٔ سه روز آینده' }).waitFor();
  await page.screenshot({ path: path.join(outputDir, 'weekly-plan-390.png') });
  const planResult = await inspectLayout(page, 'weekly-plan', 390);
  if (planResult.pathname !== '/nutrition/plan') throw new Error(`Expected /nutrition/plan, got ${planResult.pathname}`);

  await page.getByRole('link', { name: 'پروفایل', exact: true }).click();
  await page.getByRole('heading', { name: 'پروفایل' }).waitFor();
  await page.waitForFunction(() => window.scrollY === 0);
  await page.screenshot({ path: path.join(outputDir, 'profile-route-390.png') });
  const profileResult = await inspectLayout(page, 'profile', 390);
  if (profileResult.pathname !== '/profile' || profileResult.scrollY !== 0) {
    throw new Error(`Profile route/reset failed: ${JSON.stringify(profileResult)}`);
  }

  await context.close();
  await writeFile(
    path.join(outputDir, 'visual-report.json'),
    `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
    'utf8',
  );
} finally {
  await browser.close();
}

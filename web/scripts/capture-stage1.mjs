import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.NEOFIT_VISUAL_BASE_URL ?? 'http://127.0.0.1:3000';
const outputDir = path.resolve('artifacts/stage1-visual');
const targetWidths = [360, 390, 412];
const results = [];

await mkdir(outputDir, { recursive: true });

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
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(outputDir, `today-${width}.png`),
      fullPage: true,
    });

    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
    }));
    const hasHorizontalOverflow =
      dimensions.documentWidth > dimensions.viewportWidth ||
      dimensions.bodyWidth > dimensions.viewportWidth;

    results.push({
      screen: 'today',
      width,
      ...dimensions,
      hasHorizontalOverflow,
    });

    if (hasHorizontalOverflow) {
      throw new Error(
        `Horizontal overflow at ${width}px: viewport=${dimensions.viewportWidth}, document=${dimensions.documentWidth}, body=${dimensions.bodyWidth}`,
      );
    }
    if (dimensions.lang !== 'fa' || dimensions.dir !== 'rtl') {
      throw new Error(`Root locale contract failed at ${width}px.`);
    }

    await context.close();
  }

  const context = await browser.newContext({
    locale: 'fa-IR',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'تغذیه' }).click();
  await page.screenshot({ path: path.join(outputDir, 'nutrition-390.png'), fullPage: true });

  const search = page.getByPlaceholder('مثلاً قورمه‌سبزی یا جوجه کباب');
  await search.fill('قورمه');
  await page.screenshot({ path: path.join(outputDir, 'search-ghormeh-390.png'), fullPage: true });

  await page.getByRole('button', { name: /قورمه‌سبزی/ }).first().click();
  await page.screenshot({ path: path.join(outputDir, 'meal-sheet-390.png'), fullPage: true });
  await page.getByRole('button', { name: 'بستن' }).click();

  await page.getByRole('button', { name: 'برنامهٔ هفته' }).click();
  await page.screenshot({ path: path.join(outputDir, 'weekly-plan-390.png'), fullPage: true });

  await page.getByRole('button', { name: 'تنظیمات' }).click();
  await page.screenshot({ path: path.join(outputDir, 'settings-390.png'), fullPage: true });

  const interactiveDimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  results.push({
    screen: 'settings',
    width: 390,
    ...interactiveDimensions,
    hasHorizontalOverflow:
      interactiveDimensions.documentWidth > interactiveDimensions.viewportWidth ||
      interactiveDimensions.bodyWidth > interactiveDimensions.viewportWidth,
  });

  if (results.some((result) => result.hasHorizontalOverflow)) {
    throw new Error('At least one captured Stage 1 screen has horizontal overflow.');
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

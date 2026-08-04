import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const previewValue = process.env.NEOFIT_PREVIEW_URL;
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const artifactDir = path.resolve('artifacts/vercel-preview');
const reportPath = path.join(artifactDir, 'preview-report.json');
const screenshotPath = path.join(artifactDir, 'preview.png');
const failureScreenshotPath = path.join(artifactDir, 'preview-failure.png');

await mkdir(artifactDir, { recursive: true });

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  host: null,
  protectionBypassConfigured: Boolean(bypassSecret),
  checks: [],
  status: 'running',
};

function record(name, ok, details = undefined) {
  report.checks.push({ name, ok, ...(details === undefined ? {} : { details }) });
  if (!ok) throw new Error(`${name} failed${details ? `: ${details}` : ''}`);
}

function sanitize(message) {
  let value = String(message ?? 'Unknown preview verification error');
  if (bypassSecret) value = value.replaceAll(bypassSecret, '[REDACTED]');
  return value.replace(/([?&](?:_vercel_share|x-vercel-protection-bypass)=)[^&\s]+/gi, '$1[REDACTED]');
}

async function persistReport(status, error = undefined) {
  report.status = status;
  report.completedAt = new Date().toISOString();
  if (error !== undefined) report.error = sanitize(error);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

if (!previewValue) {
  await persistReport('failed', 'NEOFIT_PREVIEW_URL is required');
  throw new Error('NEOFIT_PREVIEW_URL is required');
}

const previewUrl = new URL(previewValue);
if (previewUrl.protocol !== 'https:') {
  await persistReport('failed', 'Preview URL must use HTTPS');
  throw new Error('Preview URL must use HTTPS');
}
previewUrl.search = '';
previewUrl.hash = '';
report.host = previewUrl.hostname;

const extraHTTPHeaders = bypassSecret
  ? {
      'x-vercel-protection-bypass': bypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : {};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  serviceWorkers: 'allow',
  extraHTTPHeaders,
});
const page = await context.newPage();

try {
  const navigation = await page.goto(previewUrl.href, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  record('root-navigation', Boolean(navigation) && navigation.status() < 400, navigation?.status());
  record('same-origin-after-navigation', new URL(page.url()).hostname === previewUrl.hostname, page.url());
  record('not-vercel-auth-challenge', !page.url().includes('vercel.com/sso-api'), page.url());

  const htmlContract = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() ?? null,
  }));
  record('persian-root-language', htmlContract.lang === 'fa', htmlContract.lang);
  record('rtl-root-direction', htmlContract.dir === 'rtl', htmlContract.dir);
  record('neofit-document-title', /NeoFit|نئوفیت/.test(htmlContract.title), htmlContract.title);
  record('usable-root-heading', Boolean(htmlContract.h1), htmlContract.h1);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const manifestResponse = await context.request.get(new URL('/manifest.webmanifest', previewUrl).href);
  record('manifest-http', manifestResponse.ok(), manifestResponse.status());
  const manifest = await manifestResponse.json();
  record('manifest-language', manifest.lang === 'fa', manifest.lang);
  record('manifest-direction', manifest.dir === 'rtl', manifest.dir);
  record('manifest-display', manifest.display === 'standalone', manifest.display);
  const manifestIcons = Array.isArray(manifest.icons) ? manifest.icons : [];
  record('manifest-icon-192', manifestIcons.some((icon) => String(icon.sizes).includes('192x192')));
  record('manifest-icon-512', manifestIcons.some((icon) => String(icon.sizes).includes('512x512')));
  record('manifest-maskable-icon', manifestIcons.some((icon) => String(icon.purpose ?? '').includes('maskable')));

  const assetPaths = [
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-512.png',
    '/icons/apple-touch-icon.png',
    '/sw.js',
    '/offline',
  ];
  for (const assetPath of assetPaths) {
    const response = await context.request.get(new URL(assetPath, previewUrl).href);
    record(`asset:${assetPath}`, response.ok(), response.status());
  }

  const swResponse = await context.request.get(new URL('/sw.js', previewUrl).href);
  const swSource = await swResponse.text();
  record('sw-excludes-api', swSource.includes("url.pathname.startsWith('/api/')"));
  record('sw-excludes-auth', swSource.includes("url.pathname.startsWith('/auth/')"));
  record('sw-excludes-authorization', swSource.includes("request.headers.has('authorization')"));
  record('sw-excludes-non-get', swSource.includes("request.method !== 'GET'"));

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 30_000 });
  record('service-worker-controls-page', await page.evaluate(() => navigator.serviceWorker.controller !== null));

  const initialMealCount = await page.locator('.meal-row').count();
  await page.getByRole('button', { name: /ثبت غذا/ }).click();
  await page.getByPlaceholder('مثلاً قورمه‌سبزی یا جوجه کباب').fill('قورمه');
  await page.getByRole('button', { name: /قورمه‌سبزی/ }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'افزودن به امروز' }).click();
  await page.getByRole('heading', { name: 'خلاصهٔ امروز' }).waitFor();
  const finalMealCount = await page.locator('.meal-row').count();
  record('meal-log-interaction', finalMealCount === initialMealCount + 1, { initialMealCount, finalMealCount });

  const cachedUrls = await page.evaluate(async () => {
    const urls = [];
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      for (const request of await cache.keys()) urls.push(request.url);
    }
    return urls;
  });
  record(
    'remote-cache-boundary',
    cachedUrls.every((url) => {
      const pathname = new URL(url).pathname;
      return !pathname.startsWith('/api/') && !pathname.startsWith('/auth/');
    }),
    { cachedEntryCount: cachedUrls.length },
  );

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByRole('heading', { name: 'خلاصهٔ امروز' }).waitFor({ timeout: 15_000 });
  record('remote-offline-reload', true);
  await context.setOffline(false);

  await persistReport('passed');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await context.setOffline(false).catch(() => undefined);
  await page.screenshot({ path: failureScreenshotPath, fullPage: true }).catch(() => undefined);
  await persistReport('failed', error instanceof Error ? error.message : error);
  console.error(sanitize(error instanceof Error ? error.stack ?? error.message : error));
  process.exitCode = 1;
} finally {
  await browser.close();
}

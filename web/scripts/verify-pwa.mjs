import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.NEOFIT_PWA_BASE_URL ?? 'http://127.0.0.1:3000';
const outputDir = path.resolve('artifacts/pwa');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pngDimensions(buffer) {
  const bytes = Buffer.from(buffer);
  const signature = bytes.subarray(0, 8).toString('hex');
  assert(signature === '89504e470d0a1a0a', 'Icon is not a PNG file.');
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    locale: 'fa-IR',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  const manifestResponse = await page.request.get(`${baseUrl}/manifest.webmanifest`);
  assert(manifestResponse.ok(), `Manifest request failed: ${manifestResponse.status()}`);
  const manifest = await manifestResponse.json();
  assert(manifest.name === 'نئوفیت — تغذیه و تمرین', 'Unexpected manifest name.');
  assert(manifest.short_name === 'نئوفیت', 'Unexpected manifest short name.');
  assert(manifest.start_url === '/', 'Manifest start_url must be /.');
  assert(manifest.scope === '/', 'Manifest scope must be /.');
  assert(manifest.display === 'standalone', 'Manifest display must be standalone.');
  assert(manifest.lang === 'fa' && manifest.dir === 'rtl', 'Manifest locale must be fa/rtl.');

  const requiredIcons = [
    ['/icons/icon-192.png', 192],
    ['/icons/icon-512.png', 512],
    ['/icons/icon-maskable-512.png', 512],
    ['/icons/apple-touch-icon.png', 180],
  ];
  const iconReport = [];
  for (const [src, expectedSize] of requiredIcons) {
    const response = await page.request.get(`${baseUrl}${src}`);
    assert(response.ok(), `Icon request failed: ${src}`);
    assert((response.headers()['content-type'] ?? '').includes('image/png'), `${src} is not served as image/png.`);
    const body = await response.body();
    const dimensions = pngDimensions(body);
    assert(
      dimensions.width === expectedSize && dimensions.height === expectedSize,
      `${src} has ${dimensions.width}x${dimensions.height}; expected ${expectedSize}x${expectedSize}.`,
    );
    iconReport.push({ src, ...dimensions, bytes: body.byteLength });
  }

  await page.waitForFunction(() => 'serviceWorker' in navigator);
  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return { scope: ready.scope, active: ready.active?.state ?? null };
  });
  assert(registration.scope === `${baseUrl}/`, `Unexpected service-worker scope: ${registration.scope}`);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  assert(controlled, 'The page is not controlled by the service worker after reload.');

  await page.evaluate(async () => {
    await fetch('/api/pwa-cache-probe').catch(() => undefined);
  });
  const cachedRequests = await page.evaluate(async () => {
    const result = [];
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      for (const request of await cache.keys()) result.push(request.url);
    }
    return result;
  });
  assert(!cachedRequests.some((url) => new URL(url).pathname.startsWith('/api/')), 'An API response entered the app-shell cache.');

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'سلام عماد، روزت چطوره؟' }).waitFor({ state: 'visible' });
  const offlineState = await page.evaluate(() => ({
    online: navigator.onLine,
    controlled: Boolean(navigator.serviceWorker.controller),
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
  }));
  assert(offlineState.online === false, 'Browser did not enter offline mode.');
  assert(offlineState.controlled, 'Offline page lost service-worker control.');
  assert(offlineState.lang === 'fa' && offlineState.dir === 'rtl', 'Offline shell lost Persian RTL metadata.');
  await page.screenshot({ path: path.join(outputDir, 'offline-shell-390.png'), fullPage: false });

  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    manifest: {
      name: manifest.name,
      shortName: manifest.short_name,
      display: manifest.display,
      lang: manifest.lang,
      dir: manifest.dir,
      iconCount: manifest.icons?.length ?? 0,
    },
    icons: iconReport,
    serviceWorker: registration,
    cachedRequestCount: cachedRequests.length,
    cachedRequests,
    offline: offlineState,
  };
  await writeFile(path.join(outputDir, 'pwa-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report, null, 2));

  await context.close();
} finally {
  await browser.close();
}

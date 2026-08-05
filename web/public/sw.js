const CACHE_PREFIX = 'neofit-app-shell-';
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `${CACHE_PREFIX}${CACHE_VERSION}`;
const SHELL_DOCUMENTS = [
  '/',
  '/today',
  '/nutrition',
  '/nutrition/plan',
  '/workout',
  '/progress',
  '/profile',
  '/offline',
];
const STATIC_SHELL = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

function isSensitiveRequest(url, request) {
  return (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    request.headers.has('authorization')
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  );
}

function responseCanBeCached(response) {
  if (!response || !response.ok || response.type === 'opaque') return false;
  const cacheControl = response.headers.get('cache-control') ?? '';
  return !/no-store|private/i.test(cacheControl);
}

function toSameOriginAsset(candidate, baseUrl) {
  if (!candidate || candidate.startsWith('data:') || candidate.startsWith('blob:')) return null;
  try {
    const url = new URL(candidate, baseUrl);
    return url.origin === self.location.origin && isStaticAsset(url) ? url.href : null;
  } catch {
    return null;
  }
}

function extractHtmlAssets(html, baseUrl) {
  const assets = new Set();
  const attributePattern = /(?:src|href)=["']([^"'#]+)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    const asset = toSameOriginAsset(match[1], baseUrl);
    if (asset) assets.add(asset);
  }
  return assets;
}

function extractCssAssets(css, baseUrl) {
  const assets = new Set();
  const urlPattern = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  for (const match of css.matchAll(urlPattern)) {
    const asset = toSameOriginAsset(match[1], baseUrl);
    if (asset) assets.add(asset);
  }
  return assets;
}

async function fetchAndCache(cache, input) {
  const request = new Request(input, { cache: 'reload', credentials: 'same-origin' });
  const response = await fetch(request);
  if (!responseCanBeCached(response)) {
    throw new Error(`NeoFit app-shell resource is not cacheable: ${request.url}`);
  }
  await cache.put(request, response.clone());
  return response;
}

async function precacheAssetGraph(cache, initialAssets) {
  const queue = [...initialAssets];
  const visited = new Set();

  while (queue.length > 0) {
    const assetUrl = queue.shift();
    if (!assetUrl || visited.has(assetUrl)) continue;
    visited.add(assetUrl);

    const response = await fetchAndCache(cache, assetUrl);
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/css')) {
      const css = await response.text();
      for (const dependency of extractCssAssets(css, assetUrl)) {
        if (!visited.has(dependency)) queue.push(dependency);
      }
    }
  }
}

async function precacheDocumentAndAssets(cache, pathname) {
  const documentUrl = new URL(pathname, self.location.origin).href;
  const response = await fetchAndCache(cache, documentUrl);
  const html = await response.text();
  await precacheAssetGraph(cache, extractHtmlAssets(html, documentUrl));
}

async function installAppShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(STATIC_SHELL.map((asset) => fetchAndCache(cache, asset)));
  for (const documentPath of SHELL_DOCUMENTS) {
    await precacheDocumentAndAssets(cache, documentPath);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (responseCanBeCached(response)) {
    const cache = await caches.open(SHELL_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationResponse(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (responseCanBeCached(response) && SHELL_DOCUMENTS.includes(url.pathname)) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match(url.href)) ||
      (await caches.match(new URL('/today', self.location.origin).href)) ||
      (await caches.match(new URL('/offline', self.location.origin).href)) ||
      Response.error()
    );
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(installAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (isSensitiveRequest(url, request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

import appVersion from '@/version.json';

const CACHE_PREFIX = 'computeradmin-ui';
const CACHE_SCOPE = `${CACHE_PREFIX}-v${appVersion.version}`;
const DEFAULT_PATH =
  typeof window !== 'undefined' && window.location ? window.location.pathname || '/' : '/';
const ASSETS_TO_CACHE = ['/', DEFAULT_PATH, '/version.json'];

const RESOURCE_SELECTORS = [
  { selector: 'link[rel="stylesheet"][href]', attr: 'href' },
  { selector: 'link[rel="modulepreload"][href]', attr: 'href' },
  { selector: 'link[rel="preload"][href]', attr: 'href' },
  { selector: 'script[src]', attr: 'src' },
  { selector: 'img[src]', attr: 'src' },
];

const isAllowedHost = (url) => {
  const hostname = url.hostname;
  if (!hostname) return false;
  if (hostname === window.location.hostname) return true;
  return hostname.endsWith('.ava-kk.ru');
};

const isApiPath = (pathname) => {
  const lower = pathname.toLowerCase();
  return (
    lower.startsWith('/api') ||
    lower.includes('/connect/')
  );
};

const collectLocalAssets = () => {
  const assets = new Set();
  ASSETS_TO_CACHE.forEach((entry) => {
    if (!entry) return;
    try {
      const normalized = new URL(entry, window.location.origin);
      if (!isApiPath(normalized.pathname)) {
        assets.add(normalized.href);
      }
    } catch (err) {
      // ignore malformed
    }
  });

  RESOURCE_SELECTORS.forEach(({ selector, attr }) => {
    document.querySelectorAll(selector).forEach((element) => {
      const raw = element.getAttribute(attr);
      if (!raw) return;
      try {
        const url = new URL(raw, window.location.origin);
        if (!isAllowedHost(url)) return;
        if (isApiPath(url.pathname)) return;
        assets.add(url.href);
      } catch (err) {
        // ignore invalid URLs
      }
    });
  });

  return Array.from(assets);
};

export async function primeAssetCache() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cache = await window.caches.open(CACHE_SCOPE);
    const urlsToCache = collectLocalAssets();
    if (urlsToCache.length > 0) {
      await cache.addAll(urlsToCache);
    }

    const cacheNames = await window.caches.keys();
    const outdatedCacheNames = cacheNames.filter(
      (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_SCOPE,
    );

    await Promise.all(outdatedCacheNames.map((name) => window.caches.delete(name)));
  } catch (err) {
    console.warn('Asset cache priming failed:', err);
  }
}

export async function clearAssetCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }
  try {
    const cacheNames = await window.caches.keys();
    const matching = cacheNames.filter((name) => name.startsWith(CACHE_PREFIX));
    await Promise.all(matching.map((name) => window.caches.delete(name)));
  } catch (err) {
    console.warn('Failed to clear caches:', err);
  }
}

async function tryServiceWorkerPrime() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) {
      return false;
    }
    registration.active.postMessage({
      type: 'prime-cache',
      scope: CACHE_SCOPE,
    });
    return true;
  } catch (err) {
    console.warn('Failed to delegate cache priming to service worker:', err);
    return false;
  }
}

export function scheduleCachePriming() {
  if (typeof window === 'undefined') return;
  const runLocal = () => {
    void primeAssetCache();
  };
  void tryServiceWorkerPrime().then((delegated) => {
    if (delegated) {
      return;
    }
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runLocal, { timeout: 4000 });
    } else {
      window.setTimeout(runLocal, 1000);
    }
  });
}

const CACHE = "ss-app-v10";

const PRECACHE = [
  "/strangestSecret.html",
  "/strangestSecretViews/manifest.webmanifest",
  "/strangestSecretViews/assets/ssApp.css",
  "/strangestSecretViews/scripts/ssApp.js",
  "/strangestSecretViews/scripts/ssThemeStoreConfig.js",
  "/strangestSecretViews/scripts/ssArcadiaExperience.js",
  "/strangestSecretViews/themeUnlocked.html",
  "/strangestSecretViews/assets/gold_key.webp",
  "/strangestSecretViews/assets/icon-192.png",
  "/strangestSecretViews/assets/icon-512.png",
  "/strangestSecretViews/gospel.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isAppAsset(url) {
  return url.pathname === "/strangestSecret.html" || url.pathname.startsWith("/strangestSecretViews/");
}

function isNetworkFirst(url) {
  return url.pathname.endsWith("/ssApp.css") || url.pathname.endsWith("/ssApp.js");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !isAppAsset(url)) return;

  if (isNetworkFirst(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

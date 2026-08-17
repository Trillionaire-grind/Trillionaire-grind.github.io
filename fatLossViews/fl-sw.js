const CACHE = "fl-app-v0.0.0.27";

const ASSETS = [
  "./app.html",
  "./manifest.webmanifest",
  "./assets/flApp.css",
  "./assets/flBookReader.css",
  "./assets/flBookReader.js",
  "./assets/flBookPages.js",
  "./assets/flApp.js",
  "./assets/flAuth.js",
  "./assets/flFirebase.js",
  "./assets/flFirebaseConfig.js",
  "./assets/flFoodDb.js",
  "./assets/flMealParser.js",
  "./assets/flLedger.css",
  "./assets/flLedger.js",
  "./assets/flLedgerStore.js",
  "./assets/flConfig.js",
  "./assets/flVersion.js",
  "./assets/how-to-lose-fat-fast.pdf",
  "./assets/photos/product-stack.png",
  "./assets/book/page-1-1.jpg",
  "./assets/book/page-6-1.jpg",
  "./assets/book/page-7-1.jpg",
  "./assets/book/page-7-2.jpg",
  "./assets/book/page-8-1.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

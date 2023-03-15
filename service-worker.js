"use strict";

// Cache Name
const CACHE_NAME = "v1.0.1";
const APP_CACHE_NAME = "app-cache-1.0";
// Cache Files
const CACHE_APP = ["/", "/index.html"];
const FILES_TO_CACHE = [
  "/build/public/build/bundle.css",
  "/build/public/build/bundle.css.map",
  "/build/bundle.js",
  "/build/bundle.js.map",
  "/favicon.png",
  "/images/Tigre1.jpeg",
  "/images/Tigre2.jpeg",
  "/images/Tigre3.jpeg",
  "https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Roboto:wght@400;500;700;900&display=swap",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME),
      caches.open(APP_CACHE_NAME),
      self.skipWaiting(),
    ]).then(function (storage) {
      var static_cache = storage[0];
      var app_cache = storage[1];
      return Promise.all([
        static_cache.addAll(FILES_TO_CACHE),
        app_cache.addAll(CACHE_APP),
      ]);
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== APP_CACHE_NAME && cacheName !== CACHE_NAME) {
              //console.log("deleting", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

// listen for fetch events in page navigation and return anything that has been cached
self.addEventListener("fetch", (evt) => {
  //console.log("[ServiceWorker] Fetch: ", evt.request.url);
  // when not a navigation event return
  if (evt.request.mode !== "navigate") {
    return;
  }
  evt.respondWith(
    fetch(evt.request).catch(() => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match("index.html");
      });
    })
  );
});

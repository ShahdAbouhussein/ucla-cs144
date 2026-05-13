const CACHE_NAME = "pwa-demo-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, fall back to network, then offline page
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// Push notifications from a server
self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : { title: "PWA Demo", body: "You have a new notification!" };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    })
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    console.log("[SW] Background sync: sync-messages");
    event.waitUntil(
      // In a real app, this would flush queued requests
      Promise.resolve()
    );
  }
});

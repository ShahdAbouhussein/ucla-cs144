# CS144 PWA Demo

An interactive dashboard that showcases all the key features of a Progressive Web App. It makes the invisible parts of a PWA visible and interactive — a teaching tool for understanding service workers, caching, notifications, and offline storage.

## What the App Does

When you open it, you see:

1. **Status panel** — live indicators showing whether the service worker is registered, if you're online/offline, notification permission state, and whether you're running in a browser tab or as an installed app.

2. **Notifications section** — two buttons: one requests the browser's notification permission, the other sends a test push notification through the service worker.

3. **Cache management** — lets you inspect what the service worker has cached (lists every URL) and clear all caches. There's also a button to trigger a Background Sync registration.

4. **Offline notes** — a mini note-taking app backed by IndexedDB. You can add and delete notes, and they persist across refreshes and work entirely offline — no server needed.

5. **Event log** — a live console at the bottom that records everything happening: SW registration, network changes, notification results, cache operations, etc.

The real point isn't the UI itself — it's the **service worker** (`sw.js`) running behind the scenes. It pre-caches all assets on install, serves them cache-first on every fetch, handles push events, and listens for background sync. This means the entire app keeps working if you go offline, and can be installed to your home screen like a native app.

## PWA Features Demonstrated

- **Service Worker** — installs, activates, intercepts fetch with cache-first strategy
- **Offline support** — pre-caches the app shell; works without network
- **Web App Manifest** — makes the app installable (Add to Home Screen)
- **Notifications** — request permission + send test notifications via the SW
- **IndexedDB** — offline-persistent notes (add/delete, survives refresh)
- **Background Sync** — registers a sync event when connectivity returns
- **Cache API** — inspect and clear cached assets from the UI
- **Online/offline detection** — live network status indicator
- **Display mode detection** — detects standalone vs. browser tab

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell with status dashboard, controls, and notes UI |
| `manifest.json` | Web app manifest (name, icons, display mode, theme color) |
| `sw.js` | Service worker — caching, push notifications, background sync |
| `app.js` | Client-side logic for all PWA features |
| `style.css` | Dark-themed responsive UI |
| `icons/` | 192px and 512px PNG icons |
| `server.js` | Dev server on `localhost:8144` |

## Running

Service workers require a secure context (HTTPS or localhost). The included dev server handles this:

```
node server.js
```

Then open `http://localhost:8144` in Chrome or Edge. The "Install App" button appears when the browser determines the app meets PWA installability criteria.

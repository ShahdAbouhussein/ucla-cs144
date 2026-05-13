// ── Logging ──────────────────────────────────────────────
const logEl = document.getElementById("log");

function log(msg) {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = "entry";
  entry.innerHTML = `<span class="time">${time}</span>${msg}`;
  logEl.prepend(entry);
}

// ── Service Worker Registration ──────────────────────────
async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    log("Service Workers not supported");
    document.getElementById("sw-status").textContent = "Not supported";
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    log("Service Worker registered (scope: " + reg.scope + ")");
    document.getElementById("sw-status").textContent = "Registered";
    document.getElementById("sw-status").className = "value online";

    reg.addEventListener("updatefound", () => {
      log("Service Worker update found");
    });
  } catch (err) {
    log("SW registration failed: " + err.message);
    document.getElementById("sw-status").textContent = "Failed";
    document.getElementById("sw-status").className = "value offline";
  }
}

registerSW();

// ── Online / Offline Detection ───────────────────────────
const networkEl = document.getElementById("network-status");
let wasOnline = null;

function setNetworkDisplay(online) {
  if (online) {
    networkEl.textContent = "Online";
    networkEl.className = "value online";
  } else {
    networkEl.textContent = "Offline";
    networkEl.className = "value offline";
  }
  if (wasOnline !== null && online !== wasOnline) {
    log(online ? "Back online" : "Gone offline — app still works from cache");
  }
  wasOnline = online;
}

async function checkServerReachable() {
  try {
    const resp = await fetch("/health", { cache: "no-store" });
    return resp.ok;
  } catch {
    return false;
  }
}

async function updateNetworkStatus() {
  const online = await checkServerReachable();
  setNetworkDisplay(online);
}

updateNetworkStatus();
setInterval(updateNetworkStatus, 5000);
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

// ── Install Prompt (A2HS) ────────────────────────────────
let deferredPrompt;
const installBtn = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
  log("App is installable");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  log("Install prompt result: " + result.outcome);
  deferredPrompt = null;
  installBtn.style.display = "none";
});

window.addEventListener("appinstalled", () => {
  log("App installed successfully");
});

// ── Notification Permission ──────────────────────────────
const notifPermEl = document.getElementById("notif-perm");

function updateNotifPerm() {
  const perm = Notification.permission;
  notifPermEl.textContent =
    perm.charAt(0).toUpperCase() + perm.slice(1);
  if (perm === "granted") {
    notifPermEl.className = "value online";
    document.getElementById("notif-perm-badge").className =
      "badge badge-granted";
    document.getElementById("notif-perm-badge").textContent = "Granted";
  } else if (perm === "denied") {
    notifPermEl.className = "value offline";
    document.getElementById("notif-perm-badge").className =
      "badge badge-denied";
    document.getElementById("notif-perm-badge").textContent = "Denied";
  } else {
    notifPermEl.className = "value";
    document.getElementById("notif-perm-badge").className =
      "badge badge-default";
    document.getElementById("notif-perm-badge").textContent = "Default";
  }
}

updateNotifPerm();

document
  .getElementById("btn-request-notif")
  .addEventListener("click", async () => {
    const result = await Notification.requestPermission();
    log("Notification permission: " + result);
    updateNotifPerm();
  });

// ── Send Local Notification ──────────────────────────────
document
  .getElementById("btn-send-notif")
  .addEventListener("click", async () => {
    if (Notification.permission !== "granted") {
      log("Notifications not granted — request permission first");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    reg.showNotification("CS144 PWA Demo", {
      body: "This notification was triggered locally at " +
        new Date().toLocaleTimeString(),
      icon: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      actions: [{ action: "open", title: "Open App" }],
    });
    log("Local notification sent via Service Worker");
  });

// ── Cache Management ─────────────────────────────────────
document
  .getElementById("btn-show-cache")
  .addEventListener("click", async () => {
    const keys = await caches.keys();
    if (keys.length === 0) {
      log("No caches found");
      return;
    }
    for (const name of keys) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      log(
        `Cache "${name}": ${requests.length} entries`
      );
      requests.forEach((req) => {
        log("&nbsp;&nbsp;↳ " + new URL(req.url).pathname);
      });
    }
  });

document
  .getElementById("btn-clear-cache")
  .addEventListener("click", async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    log("All caches cleared (" + keys.length + " removed)");
  });

// ── Offline Notes (IndexedDB) ────────────────────────────
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pwa-notes", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("notes", {
        keyPath: "id",
        autoIncrement: true,
      });
    };
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

async function loadNotes() {
  const database = db || (await openDB());
  const tx = database.transaction("notes", "readonly");
  const store = tx.objectStore("notes");
  const request = store.getAll();

  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
  });
}

async function renderNotes() {
  const notes = await loadNotes();
  const list = document.getElementById("notes-list");
  list.innerHTML = "";
  if (notes.length === 0) {
    list.innerHTML =
      '<div style="color:var(--muted);font-size:0.9rem;">No notes yet — add one above. Notes persist offline via IndexedDB.</div>';
    return;
  }
  notes.forEach((note) => {
    const el = document.createElement("div");
    el.className = "note-item";
    el.innerHTML = `
      <span>${note.text}</span>
      <button data-id="${note.id}" title="Delete">&times;</button>
    `;
    el.querySelector("button").addEventListener("click", async () => {
      await deleteNote(note.id);
      renderNotes();
    });
    list.appendChild(el);
  });
}

async function addNote(text) {
  const database = db || (await openDB());
  const tx = database.transaction("notes", "readwrite");
  tx.objectStore("notes").add({
    text,
    created: Date.now(),
  });
  return new Promise((resolve) => {
    tx.oncomplete = resolve;
  });
}

async function deleteNote(id) {
  const database = db || (await openDB());
  const tx = database.transaction("notes", "readwrite");
  tx.objectStore("notes").delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = resolve;
  });
}

document.getElementById("note-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("note-input");
  const text = input.value.trim();
  if (!text) return;
  await addNote(text);
  input.value = "";
  log("Note saved to IndexedDB");
  renderNotes();
});

openDB().then(() => renderNotes());

// ── Background Sync Demo ─────────────────────────────────
document
  .getElementById("btn-bg-sync")
  .addEventListener("click", async () => {
    if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
      log("Background Sync not supported in this browser");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    try {
      await reg.sync.register("sync-messages");
      log("Background sync registered: sync-messages");
    } catch (err) {
      log("Background sync failed: " + err.message);
    }
  });

// ── Display Mode Detection ───────────────────────────────
const displayEl = document.getElementById("display-mode");

function checkDisplayMode() {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    displayEl.textContent = "Standalone";
    displayEl.className = "value online";
    log("Running in standalone mode (installed)");
  } else {
    displayEl.textContent = "Browser Tab";
    displayEl.className = "value";
  }
}

checkDisplayMode();
window
  .matchMedia("(display-mode: standalone)")
  .addEventListener("change", checkDisplayMode);

log("PWA Demo loaded");

/* Meet Me Club — Service Worker : notifications push (messages & appels) */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Meet Me Club", body: event.data ? event.data.text() : "" };
  }

  const isCall = data.kind === "call";
  const options = {
    body: data.body || "Nouveau message",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    tag: data.tag || "mmc",
    renotify: true,
    silent: false, // son et vibration du téléphone
    requireInteraction: isCall,
    vibrate: isCall ? [400, 200, 400, 200, 400, 200, 400] : [180, 80, 180],
    timestamp: Date.now(),
    data: { url: data.url || "/messages" },
    actions: isCall
      ? [{ action: "open", title: "Répondre" }]
      : [{ action: "open", title: "Ouvrir" }],
  };

  // Toujours afficher : l'iPhone coupe les notifications d'un site qui en reçoit sans les montrer
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || "Meet Me Club", options);
      // Pastille sur l'icône de l'application (Android / iPhone installé)
      try {
        const shown = await self.registration.getNotifications();
        if (self.navigator && "setAppBadge" in self.navigator) await self.navigator.setAppBadge(shown.length);
      } catch {}
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/messages", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsList) {
        if (client.url.startsWith(self.location.origin)) {
          try {
            await client.focus();
          } catch {}
          // L'application ouverte se charge d'afficher la conversation (sans rechargement)
          client.postMessage({ type: "mmc:navigate", url: target });
          return;
        }
      }
      return self.clients.openWindow(target);
    })()
  );
});

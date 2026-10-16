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
    requireInteraction: isCall,
    vibrate: isCall ? [400, 200, 400, 200, 400, 200, 400] : [120, 60, 120],
    data: { url: data.url || "/messages" },
    actions: isCall
      ? [{ action: "open", title: "Répondre" }]
      : [{ action: "open", title: "Ouvrir" }],
  };

  event.waitUntil(
    (async () => {
      // Pas de notification système si la conversation est déjà ouverte et visible
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const visible = clientsList.some((c) => c.visibilityState === "visible" && c.url.includes("/messages"));
      if (visible && !isCall && data.kind === "message") return;
      await self.registration.showNotification(data.title || "Meet Me Club", options);
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
          await client.focus();
          if ("navigate" in client) return client.navigate(target);
          return;
        }
      }
      return self.clients.openWindow(target);
    })()
  );
});

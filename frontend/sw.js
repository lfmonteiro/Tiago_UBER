self.addEventListener("push", (event) => {
  if (!event.data) return;

  const { titulo, corpo } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: "/logo-192.png",
      badge: "/logo-192.png",
      vibrate: [200, 100, 200],
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});

/* Service Worker — Push Notifications */
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Novo agendamento!';
  const options = {
    body: data.body || '',
    icon: '/tiago.jpg.jpeg',
    badge: '/tiago.jpg.jpeg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/painel' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/painel')
  );
});

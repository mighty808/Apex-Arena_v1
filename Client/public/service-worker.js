/* eslint-env serviceworker */
// Web Push service worker — receives pushes from the Apex Arenas backend
// (see server: shared/utils/push.util.ts) even when no tab is open.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Apex Arenas', body: event.data.text() };
  }

  const title = payload.title || 'Apex Arenas';
  const options = {
    body: payload.body || '',
    icon: '/apex-logo.png',
    badge: '/apex-logo.png',
    data: { action_url: payload.action_url },
  };
  if (payload.image_url) {
    options.image = payload.image_url;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.notification.data && event.notification.data.action_url;
  const targetUrl = new URL(actionUrl || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if one is open, otherwise open a new one
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (windowClients.length > 0 && 'navigate' in windowClients[0]) {
        return windowClients[0].navigate(targetUrl).then((client) => client && client.focus());
      }
      return clients.openWindow(targetUrl);
    })
  );
});

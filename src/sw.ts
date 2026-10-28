/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import type { PushPayload } from './models/PushPayload';

declare const self: ServiceWorkerGlobalScope;

// App shell: same precache + SPA fallback the generated worker had.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// Page navigations fall back to the app shell, except addresses that belong to the API: an assistant
// connecting via OAuth opens /api/oauth/authorize (and returns through /api/oauth/callback) as a real
// page in this browser, and answering those with the shell would show a blank page.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//, /^\/\.well-known\//] })
);

// registerType 'autoUpdate': a new worker takes over straight away.
self.addEventListener('install', () => void self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const payload = event.data?.json() as PushPayload | undefined;
  if (!payload) return;
  event.waitUntil(
    (async () => {
      // Someone is looking at the app: the in-app UI already shows what changed.
      const windows = await self.clients.matchAll({ type: 'window' });
      if (windows.some((client) => client.focused)) return;
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        icon: '/pwa-192x192.png',
        data: { url: payload.url },
      });
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
  event.waitUntil(
    (async () => {
      const [open] = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (open) await (await open.focus()).navigate(url);
      else await self.clients.openWindow(url);
    })()
  );
});

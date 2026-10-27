import { api } from './api';

export const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const fetchPushConfig = () => api.get<{ publicKey: string | null }>('/notifications/config');

const toBytes = (base64Url: string) => {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

/** Subscribes this browser to push (reusing an existing subscription) and registers it with the backend. */
export async function subscribeToPush(): Promise<void> {
  const { publicKey } = await fetchPushConfig();
  if (!publicKey) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) }));
  await api.post('/notifications/subscriptions', subscription.toJSON());
}

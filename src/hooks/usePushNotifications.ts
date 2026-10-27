import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPushConfig, pushSupported, subscribeToPush } from '../lib/push';

/** Re-registers this browser with the backend on load once permission was granted (endpoints can rotate). */
export function useSyncPushSubscription() {
  useEffect(() => {
    if (pushSupported && Notification.permission === 'granted') subscribeToPush().catch(() => undefined);
  }, []);
}

/** The "turn on notifications" state; `available` is false where push can't work or the backend has no keys. */
export function usePushPermission() {
  const { data: config } = useQuery({ queryKey: ['push-config'], queryFn: fetchPushConfig, staleTime: Infinity });
  const [permission, setPermission] = useState<NotificationPermission>(
    pushSupported ? Notification.permission : 'denied'
  );

  const enable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') await subscribeToPush();
  };

  return { available: pushSupported && !!config?.publicKey, permission, enable };
}

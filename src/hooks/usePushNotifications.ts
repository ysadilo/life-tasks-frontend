import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { fetchPushConfig, pushSupported, subscribeToPush } from '../lib/push';

/**
 * Re-registers this browser with the backend on load once permission was granted (endpoints can rotate),
 * and again when the UI language changes so pushes follow it.
 */
export function useSyncPushSubscription() {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (pushSupported && Notification.permission === 'granted') subscribeToPush(i18n.language).catch(() => undefined);
  }, [i18n.language]);
}

/**
 * The Settings "Notifications" switch. Turning it on asks the browser for permission (its prompt
 * shows here, from the click) and subscribes this device; off silences every push on every device.
 * `available` is false where push can't work or the backend has no keys.
 */
export function useNotificationsSwitch() {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: config } = useQuery({ queryKey: ['push-config'], queryFn: fetchPushConfig, staleTime: Infinity });
  const [permission, setPermission] = useState<NotificationPermission>(
    pushSupported ? Notification.permission : 'denied'
  );

  const toggle = useMutation({
    mutationFn: async (on: boolean) => {
      if (on) {
        const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') return;
        await subscribeToPush(i18n.language);
      }
      await api.put('/notifications/settings', { enabled: on });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['push-config'] }),
  });

  return {
    available: pushSupported && !!config?.publicKey,
    // A device that blocked notifications can't receive them, whatever the account switch says.
    on: !!config?.enabled && permission === 'granted',
    blocked: permission === 'denied',
    pending: toggle.isPending,
    setOn: (on: boolean) => toggle.mutate(on),
  };
}

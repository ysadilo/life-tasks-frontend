import { useEffect, useRef } from 'react';
import { peek } from '../components/ui';
import { tryAppear } from '../lib/samoyed';
import { useActivity } from './useActivity';
import { useBoardMembers } from './useBoards';

/** The dog announces a task a teammate assigned to you while the app is open (activity polls every 30s). */
export function useHandedTaskPeek() {
  const { shared, me } = useBoardMembers();
  const { data: activity } = useActivity(shared);
  const since = useRef(Date.now());

  useEffect(() => {
    const handed = (activity ?? [])
      .filter((e) => e.type === 'assigned' && e.targetUserId === me?.userId && e.actorId !== me?.userId)
      .filter((e) => Date.parse(e.createdAt) > since.current)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    if (!handed) return;
    since.current = Date.parse(handed.createdAt);
    if (tryAppear('handed')) peek.show('handed', handed.actorEmail.split('@')[0]);
  }, [activity, me?.userId]);
}

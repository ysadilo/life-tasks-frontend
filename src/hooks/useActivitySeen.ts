import { useCallback, useEffect, useState } from 'react';

const storageKey = (boardId: string) => `activitySeen:${boardId}`;

function read(boardId: string | undefined): number {
  if (!boardId) return Date.now();
  try {
    const stored = localStorage.getItem(storageKey(boardId));
    if (stored) return Number(stored);
    // First visit: start from now, so a board's whole history doesn't show up as unread.
    localStorage.setItem(storageKey(boardId), String(Date.now()));
  } catch {
    // Storage unavailable: nothing is remembered, so everything new since page load counts.
  }
  return Date.now();
}

/** When the user last opened the activity list on this board (per device); drives the bell's unread count. */
export function useActivitySeen(boardId: string | undefined) {
  const [seenAt, setSeenAt] = useState(() => read(boardId));
  useEffect(() => setSeenAt(read(boardId)), [boardId]);

  const markSeen = useCallback(() => {
    const now = Date.now();
    setSeenAt(now);
    if (!boardId) return;
    try {
      localStorage.setItem(storageKey(boardId), String(now));
    } catch {
      // see read()
    }
  }, [boardId]);

  return { seenAt, markSeen };
}

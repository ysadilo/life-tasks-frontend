import { useEffect, type RefObject } from 'react';

/** Scrolls the `[data-today]` element inside `ref` into view on mount and whenever `period` changes. */
export function useScrollTodayIntoView(ref: RefObject<HTMLElement>, period: string) {
  useEffect(() => {
    ref.current?.querySelector('[data-today]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [ref, period]);
}

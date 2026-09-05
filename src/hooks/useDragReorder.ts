import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * Pointer-based (mouse + touch) drag-to-reorder for a vertical list of rows.
 * Each row registers its element via `registerRow`; a row's drag handle
 * spreads `dragHandleProps(id)`. While dragging, `order` reflects the live
 * preview; `onReorder` fires once, with the final order, on release.
 */
export function useDragReorder(ids: string[], onReorder: (ids: string[]) => void) {
  const [order, setOrder] = useState(ids);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const orderRef = useRef(order);
  orderRef.current = order;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const draggingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draggingRef.current) setOrder(ids);
  }, [ids]);

  const registerRow = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) rowRefs.current.set(id, el);
      else rowRefs.current.delete(id);
    },
    []
  );

  const moveTo = useCallback((id: string, clientY: number) => {
    setOrder((current) => {
      const others = current.filter((itemId) => itemId !== id);
      let insertAt = others.length;
      for (let i = 0; i < others.length; i++) {
        const rowEl = rowRefs.current.get(others[i]);
        if (rowEl && clientY < rowEl.getBoundingClientRect().top + rowEl.getBoundingClientRect().height / 2) {
          insertAt = i;
          break;
        }
      }
      const next = others.slice();
      next.splice(insertAt, 0, id);
      return next.length === current.length && next.every((v, i) => v === current[i]) ? current : next;
    });
  }, []);

  const dragHandleProps = useCallback(
    (id: string) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        draggingRef.current = id;
        setDraggingId(id);
        const prevUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = 'none';

        // Listen on `document`, not the handle: a reorder moves the handle's
        // DOM node to a new position in the list, and some browsers silently
        // drop pointer capture when the captured element's position changes
        // — which made a drag stop dead after the first reorder.
        const onMove = (moveEvent: PointerEvent) => moveTo(id, moveEvent.clientY);
        const onUp = () => {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onUp);
          document.body.style.userSelect = prevUserSelect;
          draggingRef.current = null;
          setDraggingId(null);
          onReorderRef.current(orderRef.current);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
      },
    }),
    [moveTo]
  );

  return { order, draggingId, registerRow, dragHandleProps };
}

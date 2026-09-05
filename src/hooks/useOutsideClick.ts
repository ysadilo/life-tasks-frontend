import { useEffect, type RefObject } from 'react';

/** Calls `onOutside` on a click outside `ref`'s element, or on Escape. */
export function useOutsideClick(ref: RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOutside();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, onOutside]);
}

import { useLayoutEffect, useState, type RefObject } from 'react';

interface Position {
  top: number;
  left: number;
}

const VIEWPORT_MARGIN = 16;
const ANCHOR_GAP = 8;

/**
 * Positions a `position: fixed` popover below its anchor (the popover's own
 * parent element), right-aligned to the anchor but clamped so it never runs
 * past either viewport edge — the failure mode of a plain CSS `right: 0`
 * when the anchor isn't near the screen's right edge (e.g. wrapped mobile
 * header actions).
 */
export function useAnchoredPopoverPosition(popoverRef: RefObject<HTMLElement>): Position | null {
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const anchor = popover?.parentElement;
    if (!popover || !anchor) return;

    const reposition = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const left = Math.min(
        Math.max(anchorRect.right - popover.offsetWidth, VIEWPORT_MARGIN),
        window.innerWidth - popover.offsetWidth - VIEWPORT_MARGIN
      );
      setPosition({ top: anchorRect.bottom + ANCHOR_GAP, left });
    };

    reposition();
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [popoverRef]);

  return position;
}

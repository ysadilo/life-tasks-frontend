import { useLayoutEffect, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/**
 * True while `trailing` would wrap onto a line below `leading` inside `container`.
 * When it wraps, the width both need side by side is remembered; each time the container grows it tries the full row again
 * (the trailing items can change width with the viewport, e.g. a button that only shows below some breakpoint).
 */
export function useCollapseOnWrap(
  container: RefObject<HTMLElement | null>,
  leading: RefObject<HTMLElement | null>,
  trailing: RefObject<HTMLElement | null>
): boolean {
  const [width, setWidth] = useState(Infinity);
  const [needed, setNeeded] = useState(0);
  const collapsed = width < needed;

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    let last = 0;
    // Synchronous, so the trial full-width row is measured and re-collapsed before the browser paints it.
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      flushSync(() => {
        setWidth(next);
        if (next > last) setNeeded(0);
      });
      last = next;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [container]);

  // Runs after every render: content (a longer title) can make an expanded row wrap again.
  useLayoutEffect(() => {
    const [el, lead, trail] = [container.current, leading.current, trailing.current];
    if (collapsed || !el || !lead || !trail) return;
    if (trail.offsetTop < lead.offsetTop + lead.offsetHeight) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    setNeeded(lead.offsetWidth + gap + trail.offsetWidth);
  });

  return collapsed;
}

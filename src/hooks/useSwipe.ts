import { useState, type CSSProperties, type PointerEvent } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

const THRESHOLD_PX = 90;
/** How far a blocked side can be dragged to reveal its message before it stops following the finger. */
const BLOCKED_MAX_PX = 200;

function dominantDirection({ x, y }: { x: number; y: number }): { direction: SwipeDirection; distance: number } {
  const horizontal = Math.abs(x) > Math.abs(y);
  return {
    direction: horizontal ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up',
    distance: Math.abs(horizontal ? x : y),
  };
}
const FLY_MS = 200;

type Mode = 'idle' | 'drag' | 'fly';

/**
 * Touch-only (mouse keeps using buttons/keys) swipe gesture for a card: drags with the finger,
 * and on release past THRESHOLD_PX along the dominant axis flies off and reports the direction.
 * Pass `{ horizontalOnly: true }` for a list row: it slides without tilting or following vertical movement, and if
 * `onSwipe` returns a promise the row stays off-screen until it settles. Touches that start on a button, input or
 * link are ignored so their clicks aren't swallowed by pointer capture.
 * `blocked` directions only peek (the row resists at BLOCKED_MAX_PX) and always spring back instead of committing.
 * Spread `bind` on the card and `style` onto it (`direction` + `progress` 0..1 drive a colour fill); give it `touch-action: none` in CSS.
 */
export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void | Promise<unknown>,
  allowed: SwipeDirection[],
  { horizontalOnly = false, blocked = [] }: { horizontalOnly?: boolean; blocked?: SwipeDirection[] } = {}
) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>('idle');

  const bind = {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || mode === 'fly') return;
      if ((e.target as Element).closest('button, input, a')) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setStart({ x: e.clientX, y: e.clientY });
      setMode('drag');
    },
    onPointerMove: (e: PointerEvent) => {
      if (!start) return;
      const x = e.clientX - start.x;
      const side: SwipeDirection = x > 0 ? 'right' : 'left';
      setOffset({
        x: blocked.includes(side) ? Math.sign(x) * Math.min(Math.abs(x), BLOCKED_MAX_PX) : x,
        y: e.clientY - start.y,
      });
    },
    onPointerUp: () => {
      if (!start) return;
      setStart(null);
      const { direction, distance } = dominantDirection(offset);
      const horizontal = direction === 'left' || direction === 'right';
      if (distance < THRESHOLD_PX || !allowed.includes(direction) || blocked.includes(direction)) {
        setMode('idle');
        setOffset({ x: 0, y: 0 });
        return;
      }
      setMode('fly');
      setOffset({
        x: horizontal ? Math.sign(offset.x) * window.innerWidth : 0,
        y: horizontal ? offset.y : Math.sign(offset.y) * window.innerHeight,
      });
      window.setTimeout(() => {
        const reset = () => {
          setMode('drag'); // no transition while the next card snaps into place
          setOffset({ x: 0, y: 0 });
        };
        // Rejections are surfaced by the caller's mutation state; here we only need to settle.
        Promise.resolve(onSwipe(direction)).then(reset, reset);
      }, FLY_MS);
    },
    onPointerCancel: () => {
      setStart(null);
      setMode('idle');
      setOffset({ x: 0, y: 0 });
    },
  };

  const { direction, distance } = dominantDirection(offset);
  const progress = allowed.includes(direction) ? Math.min(distance / THRESHOLD_PX, 1) : 0;

  const style: CSSProperties = {
    transform: horizontalOnly
      ? `translateX(${offset.x}px)`
      : `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 20}deg)`,
    // A row fades as it's dragged toward the commit distance and out entirely as it flies off.
    ...(horizontalOnly && { opacity: mode === 'fly' ? 0 : 1 - 0.4 * progress }),
    transition: mode === 'drag' ? 'none' : `transform ${FLY_MS}ms var(--ease-out), opacity ${FLY_MS}ms var(--ease-out)`,
  };

  return { bind, style, direction, progress };
}

import { useState, type CSSProperties, type PointerEvent } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

const THRESHOLD_PX = 90;

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
 * Spread `bind` on the card and `style` onto it (`direction` + `progress` 0..1 drive a colour fill); give it `touch-action: none` in CSS.
 */
export function useSwipe(onSwipe: (direction: SwipeDirection) => void, allowed: SwipeDirection[]) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>('idle');

  const bind = {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || mode === 'fly') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setStart({ x: e.clientX, y: e.clientY });
      setMode('drag');
    },
    onPointerMove: (e: PointerEvent) => {
      if (!start) return;
      setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
    },
    onPointerUp: () => {
      if (!start) return;
      setStart(null);
      const { direction, distance } = dominantDirection(offset);
      const horizontal = direction === 'left' || direction === 'right';
      if (distance < THRESHOLD_PX || !allowed.includes(direction)) {
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
        onSwipe(direction);
        setMode('drag'); // no transition while the next card snaps into place
        setOffset({ x: 0, y: 0 });
      }, FLY_MS);
    },
    onPointerCancel: () => {
      setStart(null);
      setMode('idle');
      setOffset({ x: 0, y: 0 });
    },
  };

  const style: CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 20}deg)`,
    transition: mode === 'drag' ? 'none' : `transform ${FLY_MS}ms var(--ease-out)`,
  };

  const { direction, distance } = dominantDirection(offset);
  const progress = allowed.includes(direction) ? Math.min(distance / THRESHOLD_PX, 1) : 0;

  return { bind, style, direction, progress };
}

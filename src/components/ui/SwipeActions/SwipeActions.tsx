import { useRef, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { useSwipe } from '../../../hooks/useSwipe';
import styles from './SwipeActions.module.css';

export type SwipeAction =
  | {
      label: string;
      tone: 'danger' | 'neutral';
      /** The row stays off-screen until this settles, so it can't flash back before the list refetches. */
      onAction: () => void | Promise<unknown>;
    }
  /** Not allowed: the label explains why, and the row springs back instead of committing. */
  | { label: string; tone: 'blocked' };

interface SwipeActionsProps {
  /** Revealed by swiping left (finger moves left), on the right edge. */
  left?: SwipeAction;
  /** Revealed by swiping right, on the left edge. */
  right?: SwipeAction;
  /** A tap on the row. Pointer capture retargets touch clicks here, so the handler gets them; drags don't count. */
  onClick?: (e: MouseEvent) => void;
  children: ReactNode;
}

const TAP_SLOP_PX = 8;

/** Touch-only: drag the row sideways past the threshold to trigger an action; mouse users keep their buttons. */
export function SwipeActions({ left, right, onClick, children }: SwipeActionsProps) {
  const downX = useRef(0);
  const sides = [
    { direction: 'left' as const, action: left },
    { direction: 'right' as const, action: right },
  ].filter((side): side is { direction: 'left' | 'right'; action: SwipeAction } => !!side.action);
  const swipe = useSwipe(
    (direction) => {
      const action = direction === 'left' ? left : right;
      return action?.tone === 'blocked' ? undefined : action?.onAction();
    },
    sides.map((side) => side.direction),
    {
      horizontalOnly: true,
      blocked: sides.filter((side) => side.action.tone === 'blocked').map((side) => side.direction),
    }
  );
  const active = swipe.direction === 'left' ? left : swipe.direction === 'right' ? right : undefined;

  return (
    <div className={`${styles.wrap} ${swipe.flying ? styles.collapsed : ''}`}>
      <div className={styles.inner}>
        {active && (
          <div
            className={`${styles.backdrop} ${styles[active.tone]} ${swipe.direction === 'left' ? styles.alignEnd : ''}`}
            style={{ '--swipe-progress': swipe.progress } as CSSProperties}
            aria-hidden
          >
            {active.label}
          </div>
        )}
        <div
          {...swipe.bind}
          onPointerDown={(e: PointerEvent) => {
            downX.current = e.clientX;
            swipe.bind.onPointerDown(e);
          }}
          onClick={onClick && ((e) => Math.abs(e.clientX - downX.current) < TAP_SLOP_PX && onClick(e))}
          style={swipe.style}
          className={styles.content}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

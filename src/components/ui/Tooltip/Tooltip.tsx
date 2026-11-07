import { cloneElement, useCallback, useId, useRef, useState, type PointerEvent, type ReactElement } from 'react';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import styles from './Tooltip.module.css';

interface TooltipProps {
  /** Shown above the trigger; also linked to it via aria-describedby. Falsy renders the trigger alone. */
  text?: string | false;
  /** A single focusable trigger. For a blocked action, use `aria-disabled` (not `disabled`) so taps still reach it. */
  children: ReactElement;
}

/** A short hint bubble: hover or focus on desktop, tap on touch (tap elsewhere or Escape closes it). */
export function Tooltip({ text, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(ref, close);
  // Touch fires emulated hover too — only a real mouse should open/close on hover.
  const onHover = (show: boolean) => (e: PointerEvent) => e.pointerType === 'mouse' && setOpen(show);
  if (!text) return children;

  return (
    <span
      ref={ref}
      className={styles.wrap}
      onPointerEnter={onHover(true)}
      onPointerLeave={onHover(false)}
      onFocus={() => setOpen(true)}
      onBlur={close}
      onClick={() => setOpen(true)}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span id={id} role="tooltip" className={[styles.bubble, open ? styles.open : ''].join(' ')}>
        {text}
      </span>
    </span>
  );
}

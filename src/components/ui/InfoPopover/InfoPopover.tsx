import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import styles from './InfoPopover.module.css';

const VIEWPORT_MARGIN = 12;

interface InfoPopoverProps {
  /** Accessible name of the (i) button, e.g. "About The Streak Keeper". */
  label: string;
  shows: { heading: string; text: string };
  counted: { heading: string; text: string };
  dismissLabel: string;
}

/** An (i) button that opens a small dark bubble explaining what a figure shows and how it's counted. */
export function InfoPopover({ label, shows, counted, dismissLabel }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(ref, close);

  // Keep the bubble inside the viewport; the arrow keeps pointing at the icon.
  useLayoutEffect(() => {
    if (!open || !bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const natural = rect.left - shift;
    const right = natural + rect.width;
    const max = window.innerWidth - VIEWPORT_MARGIN;
    setShift(right > max ? max - right : natural < VIEWPORT_MARGIN ? VIEWPORT_MARGIN - natural : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured once per open
  }, [open]);

  return (
    <span ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.button}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="4.9" r=".95" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <span
          ref={bubbleRef}
          id={id}
          role="dialog"
          aria-label={label}
          className={styles.bubble}
          style={{ transform: `translateX(${shift}px)` }}
        >
          <span className={styles.arrow} style={{ left: 15 - shift }} />
          <span className={styles.section}>
            <span className={styles.heading}>{shows.heading}</span>
            <span className={styles.lead}>{shows.text}</span>
          </span>
          <span className={styles.section}>
            <span className={styles.heading}>{counted.heading}</span>
            <span className={styles.body}>{counted.text}</span>
          </span>
          <button type="button" className={styles.dismiss} onClick={close}>
            {dismissLabel}
          </button>
        </span>
      )}
    </span>
  );
}

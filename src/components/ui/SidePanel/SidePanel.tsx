import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { MOBILE_QUERY } from '../../../hooks/useIsMobile';
import styles from './SidePanel.module.css';

const EXIT_MS = 250;
const DISMISS_DRAG_PX = 100;

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}

/** Non-modal panel that sits beside the page content (bottom-up sheet on mobile). Mount as a flex sibling of <main>. */
export function SidePanel({ open, onClose, title, closeLabel = 'Close', children }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // A nested dialog (e.g. the link editor) owns Escape while it is open.
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('dialog[open]')) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Stay mounted while the mobile sheet slides out, rendering the last content the panel had.
  const [mounted, setMounted] = useState(open);
  const lastChildren = useRef(children);
  if (open) lastChildren.current = children;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setDragY(0);
      return;
    }
    const delay = window.matchMedia(MOBILE_QUERY).matches ? EXIT_MS : 0;
    const timer = window.setTimeout(() => setMounted(false), delay);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Drag the handle/header down to dismiss (mobile sheet only; the CSS disables touch scrolling there).
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const drag = {
    onPointerDown: (e: PointerEvent) => {
      if (!window.matchMedia(MOBILE_QUERY).matches) return;
      dragStart.current = e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent) => {
      if (dragStart.current != null) setDragY(Math.max(0, e.clientY - dragStart.current));
    },
    onPointerUp: () => {
      if (dragStart.current == null) return;
      dragStart.current = null;
      if (dragY > DISMISS_DRAG_PX) onClose();
      else setDragY(0);
    },
    onPointerCancel: () => {
      dragStart.current = null;
      setDragY(0);
    },
  };

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        className={[styles.scrim, open ? '' : styles.leaving].join(' ')}
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        className={[styles.panel, open ? '' : styles.leaving].join(' ')}
        style={
          dragY
            ? { transform: `translateY(${dragY}px)`, transition: dragStart.current == null ? undefined : 'none' }
            : undefined
        }
        aria-label={title}
      >
        <span className={styles.handle} aria-hidden {...drag} />
        <div className={styles.header} {...drag}>
          <h3 className={styles.title}>{title}</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        <div className={styles.body}>{open ? children : lastChildren.current}</div>
      </aside>
    </>
  );
}

import { useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, closeLabel = 'Close', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // React bubbles a portaled child's events through the *React* tree, not the DOM one — so a
  // Modal opened from inside another Modal (e.g. the description's link editor) would otherwise
  // have its close/cancel reach the outer Modal's onClose too. stopPropagation keeps each dialog's
  // dismissal local; the portal to <body> keeps the actual DOM valid (a dialog nested in a dialog
  // means a <form> nested in a <form>, which the outer form would otherwise swallow).
  const stopAnd = (e: SyntheticEvent) => {
    e.stopPropagation();
    onClose();
  };

  return createPortal(
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={stopAnd}
      onCancel={stopAnd}
      onClick={(e) => {
        if (e.target === ref.current) stopAnd(e);
      }}
    >
      {open && (
        <div className={styles.inner}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button type="button" className={styles.close} onClick={stopAnd} aria-label={closeLabel}>
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>,
    document.body
  );
}

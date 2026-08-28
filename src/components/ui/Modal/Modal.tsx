import { useEffect, useRef, type ReactNode } from 'react';
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

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className={styles.inner}>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

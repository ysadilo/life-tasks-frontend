import { toast, useToasts } from './toastStore';
import styles from './Toaster.module.css';

/** Mount once (see AppShell). Fire toasts from anywhere via `toast.show()`. */
export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} type="button" className={styles.toast} onClick={() => toast.dismiss(t.id)}>
          {t.message}
        </button>
      ))}
    </div>
  );
}

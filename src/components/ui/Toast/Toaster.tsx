import { toast, useToasts } from './toastStore';
import styles from './Toaster.module.css';

/** Mount once (see AppShell). Fire toasts from anywhere via `toast.show()`. */
export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      {toasts.map((t) =>
        t.action ? (
          <div key={t.id} className={`${styles.toast} ${styles.withAction}`}>
            <span className={styles.message}>{t.message}</span>
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                t.action?.onClick();
                toast.dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          </div>
        ) : (
          <button key={t.id} type="button" className={styles.toast} onClick={() => toast.dismiss(t.id)}>
            {t.message}
          </button>
        )
      )}
    </div>
  );
}

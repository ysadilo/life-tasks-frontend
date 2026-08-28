import { useTranslation } from 'react-i18next';
import styles from './EditButton.module.css';

interface EditButtonProps {
  /** Task title, for the accessible label. */
  title: string;
  onClick: () => void;
}

export function EditButton({ title, onClick }: EditButtonProps) {
  const { t } = useTranslation();
  return (
    <button type="button" className={styles.button} onClick={onClick} aria-label={t('task.edit', { title })}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

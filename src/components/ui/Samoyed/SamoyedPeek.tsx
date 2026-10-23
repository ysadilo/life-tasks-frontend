import { useTranslation } from 'react-i18next';
import { SamoyedAvatar } from './SamoyedAvatar';
import { usePeek } from './peekStore';
import styles from './Samoyed.module.css';

/** Mount once (see AppShell). */
export function SamoyedPeek() {
  const { t } = useTranslation();
  const moment = usePeek();
  if (!moment) return null;

  return (
    <div key={moment} className={styles.peek} role="status" aria-live="polite">
      <SamoyedAvatar moment={moment} size={46} />
      <span>{t(`samoyed.phrases.${moment}`)}</span>
    </div>
  );
}

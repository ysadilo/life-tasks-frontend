import { useTranslation } from 'react-i18next';
import type { MomentId } from '../../../lib/samoyed';
import { SamoyedAvatar } from './SamoyedAvatar';
import styles from './Samoyed.module.css';

interface SamoyedMomentProps {
  moment: MomentId;
  size?: number;
}

/** Avatar with its speech bubble underneath; for moments that take the place of a list or an icon. */
export function SamoyedMoment({ moment, size = 150 }: SamoyedMomentProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.moment}>
      <SamoyedAvatar moment={moment} size={size} />
      <p className={styles.bubble}>{t(`samoyed.phrases.${moment}`)}</p>
    </div>
  );
}

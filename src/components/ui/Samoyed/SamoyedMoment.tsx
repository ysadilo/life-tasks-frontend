import type { MomentId } from '../../../lib/samoyed';
import { SamoyedAvatar } from './SamoyedAvatar';
import { usePhrase } from './usePhrase';
import styles from './Samoyed.module.css';

interface SamoyedMomentProps {
  moment: MomentId;
  size?: number;
}

/** Avatar with its speech bubble underneath; for moments that take the place of a list or an icon. */
export function SamoyedMoment({ moment, size = 150 }: SamoyedMomentProps) {
  const phrase = usePhrase(moment);
  return (
    <div className={styles.moment}>
      <SamoyedAvatar moment={moment} size={size} />
      <p className={styles.bubble}>{phrase}</p>
    </div>
  );
}

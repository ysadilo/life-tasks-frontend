import type { ReactNode } from 'react';
import type { MomentId } from '../../../lib/samoyed';
import { SamoyedAvatar } from './SamoyedAvatar';
import { usePhrase } from './usePhrase';
import styles from './Samoyed.module.css';

interface SamoyedNudgeProps {
  moment: MomentId;
  /** Nudges always come with an action: pass the buttons. */
  actions: ReactNode;
}

/** The dog inside a card, saying its piece with the buttons that act on it. */
export function SamoyedNudge({ moment, actions }: SamoyedNudgeProps) {
  const phrase = usePhrase(moment);
  return (
    <div className={styles.nudge}>
      <SamoyedAvatar moment={moment} size={80} />
      <div className={styles.nudgeBody}>
        <span className={styles.nudgeText}>{phrase}</span>
        <div className={styles.nudgeActions}>{actions}</div>
      </div>
    </div>
  );
}

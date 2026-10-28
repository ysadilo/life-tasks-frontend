import { SamoyedAvatar } from './SamoyedAvatar';
import { usePeek, type Peek } from './peekStore';
import { usePhrase } from './usePhrase';
import styles from './Samoyed.module.css';

/** Mount once (see AppShell). */
export function SamoyedPeek() {
  const current = usePeek();
  return current && <PeekBubble key={`${current.moment}${current.name}`} {...current} />;
}

function PeekBubble({ moment, name }: Peek) {
  const phrase = usePhrase(moment, name);
  return (
    <div className={styles.peek} role="status" aria-live="polite">
      <span className={styles.peekDog}>
        <SamoyedAvatar moment={moment} size={96} />
      </span>
      <span className={styles.peekBubble}>{phrase}</span>
    </div>
  );
}

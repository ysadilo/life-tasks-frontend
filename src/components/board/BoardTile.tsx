import { colorFor, initialOf } from './boardColors';
import styles from './board.module.css';

export function BoardTile({ id, name }: { id: string; name: string }) {
  return (
    <span className={styles.tile} style={{ background: colorFor(id) }} aria-hidden>
      {initialOf(name)}
    </span>
  );
}

export function MemberAvatar({ email }: { email: string }) {
  return (
    <span className={styles.avatar} style={{ background: colorFor(email) }} title={email}>
      {initialOf(email)}
    </span>
  );
}

import { imageUrl } from '../../lib/images';
import { colorFor, initialOf } from './boardColors';
import styles from './board.module.css';

export function BoardTile({ id, name, coverKey }: { id: string; name: string; coverKey?: string | null }) {
  if (coverKey) return <img className={styles.tile} src={imageUrl(coverKey)} alt="" loading="lazy" />;
  return (
    <span className={styles.tile} style={{ background: colorFor(id) }} aria-hidden>
      {initialOf(name)}
    </span>
  );
}

export function MemberAvatar({ email, avatarKey }: { email: string; avatarKey?: string | null }) {
  if (avatarKey) return <img className={styles.avatar} src={imageUrl(avatarKey)} alt="" title={email} loading="lazy" />;
  return (
    <span className={styles.avatar} style={{ background: colorFor(email) }} title={email}>
      {initialOf(email)}
    </span>
  );
}

import { useState } from 'react';
import styles from './ProfileAvatar.module.css';

interface ProfileAvatarProps {
  /** Photo URL: an uploaded avatar or the sign-in provider's picture. */
  src?: string;
  /** Whose avatar; its first letter shows when there is no photo. */
  name: string;
  /** Sets the size; the shape, colours and initial come from here. */
  className?: string;
}

/**
 * Gravatar links from Auth0 fall back to generated coloured initials; ask Gravatar for a 404 instead so
 * people without a real photo get the app's own initial avatar.
 */
function realPhotoOnly(src: string): string {
  if (!src.includes('gravatar.com/avatar')) return src;
  const url = new URL(src);
  url.searchParams.set('d', '404');
  return url.toString();
}

/** A round profile photo, or the person's initial on grey (v7) when there is none or it fails to load. */
export function ProfileAvatar({ src, name, className }: ProfileAvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const classes = [styles.avatar, className].filter(Boolean).join(' ');

  if (src && failed !== src) {
    return (
      <img
        className={classes}
        src={realPhotoOnly(src)}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(src)}
      />
    );
  }
  return (
    <span className={classes} aria-hidden="true">
      {name.trim()[0]?.toUpperCase()}
    </span>
  );
}

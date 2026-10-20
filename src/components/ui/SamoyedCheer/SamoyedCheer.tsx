import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from './SamoyedCheer.module.css';

interface SamoyedCheerProps {
  /** Fires once the slide-up / wink / bubble sequence has finished. */
  onDone: () => void;
}

/** A samoyed slides up from the bottom edge, winks and says a random short phrase. Decorative. */
export function SamoyedCheer({ onDone }: SamoyedCheerProps) {
  const { t } = useTranslation();
  // Picked once per mount; the component is only mounted while the cheer plays.
  const [phrase] = useState(() => {
    const phrases = t('cheer.phrases', { returnObjects: true }) as string[];
    return phrases[Math.floor(Math.random() * phrases.length)];
  });

  return createPortal(
    <div
      className={styles.cheer}
      aria-hidden="true"
      onAnimationEnd={(e) => {
        // Child animations bubble up too; only the wrapper's slide marks the end.
        if (e.target === e.currentTarget) onDone();
      }}
    >
      <span className={styles.bubble}>{phrase}</span>
      <svg className={styles.svg} viewBox="60 60 500 500" fill="none">
        <path
          className={styles.fur}
          d="M165 132 C168 98 192 82 218 92 C255 108 330 120 382 94 C408 72 442 68 448 102 C452 128 464 142 482 152 C524 186 548 262 540 362 C534 452 504 502 440 522 C380 540 250 546 170 541 C108 536 78 492 78 420 C78 330 90 250 126 196 C150 166 163 152 165 132 Z"
        />
        <g className={styles.ink}>
          <path d="M152 164 L124 200 M114 236 L92 278 M99 298 L88 328 M85 380 L75 402 M85 432 L81 470" />
          <path d="M480 158 L505 178 M519 232 L527 250 M523 306 L540 346 M521 398 L525 446 M504 484 L496 510" />
        </g>
        <path className={styles.tongueFill} d="M277 320 L304 302 L329 319 V351 H277 Z" />
        <path className={styles.tongue} d="M277 323 V352 C277 369 289 378 303 378 C318 378 329 369 329 351 V323" />
        <path className={styles.ink} d="M303 332 V354" />
        <path className={styles.ink} d="M243 311 Q266 332 304 300 M368 310 Q342 332 304 300 M304 300 V310" />
        <path
          className={styles.fill}
          d="M284 270 C284 260 295 258 305 258 C316 258 327 260 327 270 C327 282 316 293 305 298 C294 293 284 282 284 270 Z"
        />
        <ellipse className={styles.fill} cx="260" cy="245" rx="14" ry="11" transform="rotate(12 260 245)" />
        <ellipse
          className={`${styles.fill} ${styles.eyeOpen}`}
          cx="346"
          cy="243"
          rx="13"
          ry="10"
          transform="rotate(-12 346 243)"
        />
        <path className={`${styles.ink} ${styles.eyeWink}`} d="M332 247 Q346 231 360 247" />
      </svg>
    </div>,
    document.body
  );
}

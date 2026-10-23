import type { MomentId } from '../../../lib/samoyed';
import { artFor, FACE } from './art';

interface SamoyedAvatarProps {
  moment: MomentId;
  /** Diameter in px. */
  size?: number;
}

/** The dog as a round badge whose eyes, mouth, tilt and prop follow the moment. Decorative. */
export function SamoyedAvatar({ moment, size = 128 }: SamoyedAvatarProps) {
  const art = artFor(moment);
  return (
    <svg
      viewBox="0 0 612 612"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flex: 'none', borderRadius: '50%' }}
    >
      <rect width="612" height="612" fill={art.bg} />
      <g transform={`rotate(${art.tilt} 306 330)`}>
        <path fill="#fff" d={FACE.fur} />
        <path stroke={FACE.ink} strokeWidth={7} d={FACE.fluff} />
        {art.blush && FACE.cheeks}
        {art.eyes}
        {art.mouth}
      </g>
      {art.prop}
    </svg>
  );
}

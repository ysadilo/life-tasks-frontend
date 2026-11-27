import type { TimeOfDay } from '../../lib/timeOfDay';
import styles from './AuthLandingPage.module.css';

/** Where the sun (or moon) travels in the 1280×372 sky, ending at `end`. Coordinates are the body's centre. */
const SCENES: Record<TimeOfDay, { path: string; end: string; r: number }> = {
  morning: { path: 'M640 490 L640 372', end: '640 372', r: 104 },
  afternoon: { path: 'M880 450 Q905 250 1000 205', end: '1000 205', r: 62 },
  evening: { path: 'M860 150 Q1060 170 1090 412', end: '1090 412', r: 104 },
  night: { path: 'M110 430 Q150 230 230 200', end: '230 200', r: 60 },
};

const STARS = [
  [180, 90],
  [260, 190],
  [340, 60],
  [905, 80],
  [980, 210],
  [1090, 120],
  [1180, 250],
  [760, 40],
  [120, 280],
  [1220, 60],
];

/** Decorative sky above the horizon: the body rides in once (~3 s) for the local time of day, then rests. */
export function HorizonSky({ when }: { when: TimeOfDay }) {
  const { path, end, r } = SCENES[when];
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <svg className={styles.sky} viewBox="0 0 1280 372" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {when === 'night' && (
        <>
          <g className={styles.stars}>
            {STARS.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />
            ))}
          </g>
          <mask id="lt-moon">
            <rect x="-60" y="-60" width="120" height="120" fill="#fff" />
            <circle cx="22" cy="-18" r="54" fill="#000" />
          </mask>
        </>
      )}
      <g transform={still ? `translate(${end})` : undefined}>
        {!still && (
          <animateMotion dur="3s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".25 .6 .3 1" path={path} />
        )}
        {when === 'night' ? (
          <circle className={styles.moon} r={r} mask="url(#lt-moon)" />
        ) : (
          <circle className={styles.sun} r={r} />
        )}
      </g>
    </svg>
  );
}

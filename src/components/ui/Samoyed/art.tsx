import type { ReactNode } from 'react';
import type { MomentId } from '../../../lib/samoyed';

const INK = '#4a4444';
const GOLD = '#E8C766';

type ArtId =
  | 'allDone'
  | 'triageCleared'
  | 'streak'
  | 'overdue'
  | 'heavyDay'
  | 'roughCheckin'
  | 'emptyBacklog'
  | 'lateNight'
  | 'handed'
  | 'welcomeBack';

const FUR =
  'M165 132 C168 98 192 82 218 92 C255 108 330 120 382 94 C408 72 442 68 448 102 C452 128 464 142 482 152 C524 186 548 262 540 362 C534 452 504 502 440 522 C380 540 250 546 170 541 C108 536 78 492 78 420 C78 330 90 250 126 196 C150 166 163 152 165 132 Z';
const FLUFF =
  'M152 164 L124 200 M114 236 L92 278 M99 298 L88 328 M85 380 L75 402 M85 432 L81 470 M480 158 L505 178 M519 232 L527 250 M523 306 L540 346 M521 398 L525 446 M504 484 L496 510';
const NOSE =
  'M284 270 C284 260 295 258 305 258 C316 258 327 260 327 270 C327 282 316 293 305 298 C294 293 284 282 284 270 Z';
const SMILE = 'M243 311 Q266 332 304 300 M368 310 Q342 332 304 300 M304 300 V310';

const sparkle = (cx: number, cy: number, r: number) => (
  <path
    fill={GOLD}
    stroke={INK}
    strokeWidth={5}
    d={`M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`}
  />
);

const dots = (
  <g fill={INK}>
    <ellipse cx="260" cy="247" rx="12" ry="12" />
    <ellipse cx="346" cy="245" rx="12" ry="12" />
  </g>
);
const open = (
  <g fill={INK}>
    <ellipse cx="260" cy="245" rx="14" ry="11" transform="rotate(12 260 245)" />
    <ellipse cx="346" cy="243" rx="13" ry="10" transform="rotate(-12 346 243)" />
  </g>
);

const EYES = {
  wink: (
    <>
      <ellipse fill={INK} cx="260" cy="245" rx="14" ry="11" transform="rotate(12 260 245)" />
      <path stroke={INK} strokeWidth={7} d="M330 248 Q346 232 362 248" />
    </>
  ),
  happy: <path stroke={INK} strokeWidth={7} d="M244 252 Q260 232 276 252 M330 250 Q346 230 362 250" />,
  worried: (
    <>
      {dots}
      <path stroke={INK} strokeWidth={6} d="M240 222 L276 206 M330 204 L366 220" />
    </>
  ),
  sleepy: <path stroke={INK} strokeWidth={7} d="M244 242 Q260 256 276 242 M330 240 Q346 254 362 240" />,
  open,
};

const nose = <path fill={INK} d={NOSE} />;
const smile = <path stroke={INK} strokeWidth={5} d={SMILE} />;

const MOUTHS = {
  tongue: (
    <>
      {nose}
      <path fill="#f4716f" d="M277 320 L304 302 L329 319 V351 H277 Z" />
      <path
        fill="#f4716f"
        stroke={INK}
        strokeWidth={6}
        d="M277 323 V352 C277 369 289 378 303 378 C318 378 329 369 329 351 V323"
      />
      <path stroke={INK} strokeWidth={5} d="M303 332 V354" />
      {smile}
    </>
  ),
  smile: (
    <>
      {nose}
      {smile}
    </>
  ),
  flat: (
    <>
      {nose}
      <path stroke={INK} strokeWidth={5} d="M266 324 Q304 314 342 324 M304 300 V318" />
    </>
  ),
  oh: (
    <>
      {nose}
      <path stroke={INK} strokeWidth={5} d="M304 300 V312" />
      <ellipse cx="304" cy="332" rx="14" ry="17" fill="#f4716f" stroke={INK} strokeWidth={5} />
    </>
  ),
};

const cheeks = (
  <g fill="#f4a3a8" opacity=".7">
    <ellipse cx="222" cy="286" rx="22" ry="12" />
    <ellipse cx="388" cy="284" rx="22" ry="12" />
  </g>
);

interface Art {
  bg: string;
  tilt: number;
  eyes: ReactNode;
  mouth: ReactNode;
  blush?: boolean;
  prop?: ReactNode;
}

/** Same face every time; eyes, mouth, tilt, background and one prop change per scenario. */
const ARTS: Record<ArtId, Art> = {
  allDone: {
    bg: '#CFDDD2',
    tilt: 0,
    eyes: EYES.wink,
    mouth: MOUTHS.tongue,
    blush: true,
    prop: (
      <>
        {sparkle(118, 118, 36)}
        {sparkle(506, 96, 26)}
        {sparkle(540, 190, 16)}
      </>
    ),
  },
  triageCleared: {
    bg: '#F3E3B3',
    tilt: 0,
    eyes: EYES.happy,
    mouth: MOUTHS.smile,
    blush: true,
    prop: (
      <g stroke={INK} strokeWidth={6}>
        <path d="M500 30 V50 M500 170 V190 M420 110 H440 M560 110 H580 M444 54 L458 68 M542 152 L556 166 M556 54 L542 68 M458 152 L444 166" />
        <circle cx="500" cy="110" r="38" fill={GOLD} />
      </g>
    ),
  },
  streak: {
    bg: '#DDD8EE',
    tilt: 0,
    eyes: EYES.happy,
    mouth: MOUTHS.tongue,
    blush: true,
    prop: (
      <>
        <g transform="rotate(-10 300 100)">
          <path d="M254 116 L300 14 L348 116 Z" fill="#E1B4A8" stroke={INK} strokeWidth={6} />
          <path d="M272 76 L328 76 M262 98 L340 98" stroke="#FBFAF7" strokeWidth={7} />
          <circle cx="300" cy="16" r="16" fill={GOLD} stroke={INK} strokeWidth={5} />
        </g>
        {sparkle(124, 130, 22)}
        {sparkle(500, 120, 18)}
      </>
    ),
  },
  overdue: {
    bg: '#EFD8D2',
    tilt: 0,
    eyes: EYES.worried,
    mouth: MOUTHS.oh,
    prop: (
      <path
        d="M412 150 C426 174 434 190 434 202 C434 216 424 225 412 225 C400 225 390 216 390 202 C390 190 398 174 412 150 Z"
        fill="#B6C9DE"
        stroke={INK}
        strokeWidth={5}
      />
    ),
  },
  heavyDay: { bg: '#EFD1A8', tilt: -8, eyes: EYES.worried, mouth: MOUTHS.flat },
  roughCheckin: {
    bg: '#F0DCD6',
    tilt: 8,
    eyes: EYES.sleepy,
    mouth: MOUTHS.smile,
    prop: (
      <path
        d="M494 168 C450 136 440 104 466 92 C482 85 494 98 494 106 C494 98 506 85 522 92 C548 104 538 136 494 168 Z"
        fill="#f4716f"
        stroke={INK}
        strokeWidth={5}
      />
    ),
  },
  emptyBacklog: {
    bg: '#D3DEEC',
    tilt: 0,
    eyes: EYES.sleepy,
    mouth: MOUTHS.flat,
    prop: (
      <g fill={INK} fontFamily="Instrument Sans, sans-serif" fontWeight={700}>
        <text x="430" y="170" fontSize="44">
          z
        </text>
        <text x="470" y="122" fontSize="58">
          z
        </text>
        <text x="516" y="70" fontSize="72">
          z
        </text>
      </g>
    ),
  },
  lateNight: {
    bg: '#C9C2E4',
    tilt: 0,
    eyes: EYES.sleepy,
    mouth: MOUTHS.flat,
    prop: (
      <>
        <circle cx="494" cy="112" r="48" fill={GOLD} stroke={INK} strokeWidth={5} />
        <circle cx="518" cy="94" r="42" fill="#C9C2E4" />
        {sparkle(120, 110, 18)}
        {sparkle(410, 60, 12)}
      </>
    ),
  },
  handed: {
    bg: '#B6C9DE',
    tilt: 0,
    eyes: EYES.open,
    mouth: MOUTHS.smile,
    prop: (
      <>
        <circle cx="452" cy="468" r="58" fill={GOLD} stroke={INK} strokeWidth={6} />
        <path d="M400 446 Q452 494 506 448" stroke={INK} strokeWidth={5} />
      </>
    ),
  },
  welcomeBack: { bg: '#AFC8B5', tilt: -6, eyes: EYES.open, mouth: MOUTHS.tongue },
};

// ponytail: milestones borrow another scenario's art; give them their own if the design adds it.
const MILESTONE_ART: Partial<Record<MomentId, ArtId>> = {
  added3: 'handed',
  added6: 'triageCleared',
  added10: 'heavyDay',
  done3: 'handed',
  done6: 'streak',
  done10: 'allDone',
};

export const artFor = (moment: MomentId): Art => ARTS[MILESTONE_ART[moment] ?? (moment as ArtId)];

export const FACE = { fur: FUR, fluff: FLUFF, ink: INK, cheeks };

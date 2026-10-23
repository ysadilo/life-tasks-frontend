import { localISODate } from './dateUtils';

export type SamoyedMode = 'off' | 'bigWins' | 'chatty';

export type MomentId =
  | 'allDone'
  | 'triageCleared'
  | 'streak'
  | 'overdue'
  | 'heavyDay'
  | 'roughCheckin'
  | 'emptyBacklog'
  | 'lateNight'
  | 'handed'
  | 'welcomeBack'
  | 'added3'
  | 'added6'
  | 'added10'
  | 'done3'
  | 'done6'
  | 'done10';

export const SAMOYED_MODES: SamoyedMode[] = ['off', 'bigWins', 'chatty'];

const BIG_WINS: MomentId[] = ['allDone', 'triageCleared', 'streak'];
const MAX_PER_DAY = 3;
const MILESTONES = [3, 6, 10];
const AWAY_DAYS = 3;
const KEY = 'samoyed';

interface Stored {
  mode: SamoyedMode;
  day: string;
  shown: MomentId[];
  added: number;
  done: number;
  lastVisit: string;
}

const fresh = (stored?: Partial<Stored>): Stored => {
  const day = localISODate();
  const sameDay = stored?.day === day;
  return {
    mode: stored?.mode ?? 'chatty',
    day,
    shown: sameDay ? (stored?.shown ?? []) : [],
    added: sameDay ? (stored?.added ?? 0) : 0,
    done: sameDay ? (stored?.done ?? 0) : 0,
    lastVisit: stored?.lastVisit ?? day,
  };
};

function load(): Stored {
  try {
    return fresh(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
  } catch {
    return fresh();
  }
}

function save(state: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the dog just forgets between loads.
  }
}

export const getSamoyedMode = () => load().mode;

export function setSamoyedMode(mode: SamoyedMode) {
  save({ ...load(), mode });
}

/** Whether the mode lets this moment through at all (ignores the daily limits). */
export const modeAllows = (mode: SamoyedMode, id: MomentId) =>
  mode === 'chatty' || (mode === 'bigWins' && BIG_WINS.includes(id));

// Moments already shown during this page load stay allowed, so remounts and StrictMode re-renders don't burn the day's quota.
const seen = new Set<MomentId>();

/** Applies the rules (mode, once per moment per day, 3 a day) and records the appearance. */
export function tryAppear(id: MomentId): boolean {
  if (seen.has(id)) return true;
  const state = load();
  if (!modeAllows(state.mode, id) || state.shown.includes(id) || state.shown.length >= MAX_PER_DAY) return false;
  seen.add(id);
  save({ ...state, shown: [...state.shown, id] });
  return true;
}

/** Counts a task added/finished today; returns the milestone moment when this one is the 3rd, 6th or 10th. */
export function bump(kind: 'added' | 'done', allow: (id: MomentId) => boolean = () => true): MomentId | null {
  const state = load();
  const count = state[kind] + 1;
  save({ ...state, [kind]: count });
  const id = `${kind}${count}` as MomentId;
  return MILESTONES.includes(count) && allow(id) && tryAppear(id) ? id : null;
}

let returned: boolean | undefined;

/** First open after a few days away? Decided once per page load, and stamps today as the latest visit. */
export function welcomeBack(): boolean {
  if (returned === undefined) {
    const state = load();
    const gap = (Date.parse(state.day) - Date.parse(state.lastVisit)) / 86_400_000;
    if (state.lastVisit !== state.day) save({ ...state, lastVisit: state.day });
    returned = gap >= AWAY_DAYS && tryAppear('welcomeBack');
  }
  return returned;
}

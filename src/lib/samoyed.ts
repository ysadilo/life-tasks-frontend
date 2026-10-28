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
const LOAD_DAYS = 14;
const HEAVY_EXTRA_MINUTES = 60;
const MIN_LOAD_HISTORY = 2;

interface Stored {
  mode: SamoyedMode;
  day: string;
  shown: MomentId[];
  added: number;
  done: number;
  lastVisit: string;
  /** Planned minutes on Today per day, last LOAD_DAYS days; the average of the earlier ones is the "usual". */
  loads: Record<string, number>;
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
    loads: stored?.loads ?? {},
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

/** Records today's planned minutes; true when that is an hour or more over the usual (needs a few earlier days to compare). */
export function isHeavyDay(plannedMinutes: number): boolean {
  const state = load();
  const loads = { ...state.loads, [state.day]: plannedMinutes };
  const days = Object.keys(loads).sort().slice(-LOAD_DAYS);
  save({ ...state, loads: Object.fromEntries(days.map((d) => [d, loads[d]])) });
  const earlier = days.filter((d) => d !== state.day).map((d) => loads[d]);
  if (earlier.length < MIN_LOAD_HISTORY) return false;
  return plannedMinutes >= earlier.reduce((a, b) => a + b, 0) / earlier.length + HEAVY_EXTRA_MINUTES;
}

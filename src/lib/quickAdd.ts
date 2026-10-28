import { localISODate, addDays } from './dateUtils';
import type { LifeArea, LifeAreaId, Priority } from '../models';

/** What a quick-add line resolves to; also the prefill handed to the full task form. */
export interface TaskDraft {
  title: string;
  /** `YYYY-MM-DD`. */
  dueDate: string | null;
  priority: Priority | null;
  areaId: LifeAreaId | null;
  minutes: number | null;
}

const PRIORITY = /^p([1-4])$/i;
const EFFORT = /^(\d+)(m|h)$/i;

/**
 * Pulls `today|tomorrow`, `p1`–`p4`, `#Area` and `15m`/`2h` tokens out of a line; the rest is the title.
 * Each kind is taken once (first wins); an unknown `#tag` stays in the title.
 */
export function parseQuickAdd(input: string, areas: LifeArea[], now = new Date()): TaskDraft {
  const draft: TaskDraft = { title: '', dueDate: null, priority: null, areaId: null, minutes: null };
  const rest: string[] = [];

  for (const word of input.trim().split(/\s+/).filter(Boolean)) {
    const lower = word.toLowerCase();
    const effort = EFFORT.exec(word);
    if (!draft.dueDate && (lower === 'today' || lower === 'tomorrow')) {
      draft.dueDate = localISODate(lower === 'today' ? now : addDays(now, 1));
    } else if (!draft.priority && PRIORITY.test(word)) {
      draft.priority = word.toUpperCase() as Priority;
    } else if (!draft.minutes && effort && Number(effort[1]) > 0) {
      draft.minutes = Number(effort[1]) * (effort[2].toLowerCase() === 'h' ? 60 : 1);
    } else if (!draft.areaId && word.length > 1 && word.startsWith('#')) {
      const name = lower.slice(1);
      const area =
        areas.find((a) => a.name.toLowerCase() === name) ?? areas.find((a) => a.name.toLowerCase().startsWith(name));
      if (area) draft.areaId = area.id;
      else rest.push(word);
    } else {
      rest.push(word);
    }
  }

  draft.title = rest.join(' ');
  return draft;
}

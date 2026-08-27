export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function toISODate(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export function weekdayLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
}

export function monthLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
}

export function formatWeekRangeTitle(weekStart: Date, locale: string): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startLabel = `${weekStart.getDate()}`;
  const endLabel = `${weekEnd.getDate()} ${monthLabel(weekEnd, locale)}`;
  const startFull = sameMonth ? startLabel : `${startLabel} ${monthLabel(weekStart, locale)}`;
  return `${startFull} – ${endLabel}`;
}

export function formatMonthTitle(date: Date, locale: string): string {
  return `${monthLabel(date, locale)} ${date.getFullYear()}`;
}

export interface MonthCell {
  date: Date;
  isCurrentMonth: boolean;
}

export function buildMonthGrid(monthDate: Date): MonthCell[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  const firstOfNextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const lastOfMonth = addDays(firstOfNextMonth, -1);
  const gridEnd = addDays(startOfWeek(lastOfMonth), 6);

  const cells: MonthCell[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    cells.push({ date: d, isCurrentMonth: d.getMonth() === monthDate.getMonth() });
  }
  return cells;
}

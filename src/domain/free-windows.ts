import type { TimetableEntry, TimetableException } from '@/db/types';
import { isoDayOfWeek } from '@/lib/date';

export type FreeWindow = { start: number; end: number };

export type FreeWindowOptions = {
  /** Minutes from midnight; default 08:00. */
  from: number;
  /** Minutes from midnight; default 22:00. */
  to: number;
  /** Minimum gap length in minutes; default 20. */
  minMinutes: number;
};

const DEFAULTS: FreeWindowOptions = { from: 8 * 60, to: 22 * 60, minMinutes: 20 };

/** Gaps between classes on a local date, inside [from, to], at least
 * `minMinutes` long. Day-level exceptions (entry_id = null, type 'cancel')
 * remove every class that day; entry-specific ones remove a single class. */
export function freeWindows(
  day: string,
  entries: TimetableEntry[],
  exceptions: TimetableException[],
  options: Partial<FreeWindowOptions> = {},
): FreeWindow[] {
  const opts = { ...DEFAULTS, ...options };
  const date = new Date(`${day}T00:00:00`);
  const weekday = isoDayOfWeek(date);

  const cancelledIds = new Set<string>();
  let cancelAll = false;
  for (const exception of exceptions) {
    if (exception.date !== day || exception.type !== 'cancel') continue;
    if (exception.entry_id === null) cancelAll = true;
    else cancelledIds.add(exception.entry_id);
  }

  const busy = entries
    .filter((entry) => entry.day_of_week === weekday)
    .filter((entry) => !cancelAll && !cancelledIds.has(entry.id))
    .map((entry) => ({ start: entry.start_min, end: entry.end_min }))
    .filter((slot) => slot.end > opts.from && slot.start < opts.to)
    .sort((a, b) => a.start - b.start);

  const windows: FreeWindow[] = [];
  let cursor = opts.from;
  for (const slot of busy) {
    if (slot.start - cursor >= opts.minMinutes) {
      windows.push({ start: cursor, end: slot.start });
    }
    cursor = Math.max(cursor, slot.end);
  }
  if (opts.to - cursor >= opts.minMinutes) {
    windows.push({ start: cursor, end: opts.to });
  }
  return windows;
}

/** Total free minutes across a day's windows. */
export function freeMinutes(windows: FreeWindow[]): number {
  return windows.reduce((sum, window) => sum + (window.end - window.start), 0);
}

/** The next `count` free windows of at least `minMinutes`, starting today. */
export function nextFreeWindows(
  today: string,
  daysToScan: number,
  entries: TimetableEntry[],
  exceptions: TimetableException[],
  minMinutes = 30,
  count = 2,
): { day: string; window: FreeWindow }[] {
  const found: { day: string; window: FreeWindow }[] = [];
  const base = new Date(`${today}T00:00:00`);
  for (let offset = 0; offset < daysToScan && found.length < count; offset++) {
    const day = new Date(base);
    day.setDate(day.getDate() + offset);
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
      day.getDate(),
    ).padStart(2, '0')}`;
    for (const window of freeWindows(dayStr, entries, exceptions, { minMinutes })) {
      found.push({ day: dayStr, window });
      if (found.length >= count) break;
    }
  }
  return found;
}

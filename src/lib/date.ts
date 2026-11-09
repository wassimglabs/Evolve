/** Date/time helpers. Dates are LOCAL 'YYYY-MM-DD' strings, times are minutes
 * from midnight, timestamps are ISO 8601 strings. */

export function nowIso(): string {
  return new Date().toISOString();
}

/** Formats a Date as a local 'YYYY-MM-DD' string (not UTC). */
export function toDateString(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function todayDateString(): string {
  return toDateString(new Date());
}

/** ISO-style day of week: 1 = Monday ... 7 = Sunday. */
export function isoDayOfWeek(date: Date = new Date()): number {
  const js = date.getDay();
  return js === 0 ? 7 : js;
}

/** 'HH:MM' representation of minutes from midnight. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Minutes from midnight of an 'HH:MM' or 'H:MM' string. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/** Local 'YYYY-MM-DD' of a Date shifted by n days. */
export function dateOffset(base: Date, days: number): string {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return toDateString(next);
}

/** Live device date like "Monday, 9 Nov" (English, weekday long + day + month short). */
export function longDayShortMonth(date: Date = new Date()): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday}, ${date.getDate()} ${month}`;
}

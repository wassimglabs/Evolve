import type { LaneKey } from '@/components/tag';
import { dateOffset, minutesToTime } from '@/lib/date';

export { dateOffset };

export const LANE_LABELS: Record<LaneKey, string> = {
  study: 'Study',
  solven: 'Solven',
  career: 'Career',
  life: 'Life',
};

export function laneLabel(lane: string): string {
  return LANE_LABELS[lane as LaneKey] ?? lane;
}

/** Free-time tile format: "4h 15" ("40 m" under an hour, "0" when none). */
export function formatFreeHours(minutes: number): string {
  if (minutes <= 0) return '0';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} m`;
  if (m === 0) return `${h} h`;
  return `${h}h ${m}`;
}

/** Deadline/plan estimate: "about 2 h" / "about 30 m" / "about 2 h 30". */
export function formatEstimate(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `about ${m} m`;
  if (m === 0) return `about ${h} h`;
  return `about ${h} h ${m}`;
}

/** Short weekday of a 'YYYY-MM-DD' string, e.g. "Wed". */
export function shortWeekday(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/** "Tue 15:30" for a date string + minutes from midnight. */
export function formatSlot(dateStr: string, startMin: number): string {
  return `${shortWeekday(dateStr)} ${minutesToTime(startMin)}`;
}

/** Overdue / Due today / Due Wed for a due date relative to today. */
export function dueLabel(dueDate: string, today: string): string {
  if (dueDate < today) return 'Overdue';
  if (dueDate === today) return 'Due today';
  return `Due ${shortWeekday(dueDate)}`;
}

/** Human schedule line from ISO weekdays: "Every day" or "Mon, Wed, Fri". */
export function daysLabel(days: number[]): string {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (days.length === 7) return 'Every day';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((day) => names[day - 1] ?? String(day))
    .join(', ');
}


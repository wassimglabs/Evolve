import type { Habit, HabitLog } from '@/db/types';
import { isoDayOfWeek, toDateString } from '@/lib/date';

export type HabitDot = 'target' | 'minimum' | 'missed' | 'off';

const DAY_COUNT = 14;

/** 14 dots ending today (oldest first).
 * - 'target'  → log with level 'full' that day
 * - 'minimum' → log with level 'min'
 * - 'missed'  → scheduled weekday with no log (or only a 'skipped' log)
 * - 'off'     → non-scheduled weekday, or before the habit was created */
export function habitDots(habit: Habit, logs: HabitLog[], today: string): HabitDot[] {
  const todayDate = new Date(`${today}T00:00:00`);
  const createdDate = toDateString(new Date(habit.created_at));
  const scheduledDays = new Set(
    habit.days
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => value >= 1 && value <= 7),
  );

  const byDate = new Map<string, string>();
  for (const log of logs) {
    if (log.habit_id !== habit.id) continue;
    const existing = byDate.get(log.date);
    if (existing === 'full') continue;
    if (log.level === 'full') byDate.set(log.date, 'full');
    else if (log.level === 'min' && existing !== 'min') byDate.set(log.date, 'min');
  }

  const dots: HabitDot[] = [];
  for (let offset = DAY_COUNT - 1; offset >= 0; offset--) {
    const day = new Date(todayDate);
    day.setDate(day.getDate() - offset);
    const dateStr = toDateString(day);
    if (dateStr < createdDate || !scheduledDays.has(isoDayOfWeek(day))) {
      dots.push('off');
      continue;
    }
    const level = byDate.get(dateStr);
    if (level === 'full') dots.push('target');
    else if (level === 'min') dots.push('minimum');
    else dots.push('missed');
  }
  return dots;
}

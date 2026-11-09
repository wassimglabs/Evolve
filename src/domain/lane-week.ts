import type { Habit, HabitLog, Task, TimetableEntry } from '@/db/types';
import { isoDayOfWeek, toDateString } from '@/lib/date';
import type { LaneKey } from '@/components/tag';

import { categoryToLane } from './lane-map';

export type WeekRange = { start: string; end: string };

/** Monday-Sunday week containing the given local date. */
export function weekRange(date: Date): WeekRange {
  const weekday = isoDayOfWeek(date);
  const monday = new Date(date);
  monday.setDate(date.getDate() - (weekday - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateString(monday), end: toDateString(sunday) };
}

export type LaneWeekData = {
  entries: TimetableEntry[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
};

export type LaneWeekStats = { plannedMin: number; doneMin: number };

function inWeek(dateStr: string | null, week: WeekRange): boolean {
  return dateStr !== null && dateStr >= week.start && dateStr <= week.end;
}

/** Formulas (documented in the README):
 * - study.planned = class minutes of study-lane timetable entries in the week
 *   + est_minutes of study tasks scheduled OR completed in the week.
 * - solven/career.planned = est_minutes of that lane's tasks scheduled OR
 *   completed in the week + duration_min of habit logs of that lane's habits.
 * - life.planned = duration_min of life-lane habit logs in the week.
 * - doneMin = the completed part: past classes (weekday before today), tasks
 *   done in the week, and all habit-log minutes (a log is a completed act). */
export function laneWeekStats(
  laneId: LaneKey,
  week: WeekRange,
  data: LaneWeekData,
  today: string,
): LaneWeekStats {
  const todayWeekday = isoDayOfWeek(new Date(`${today}T00:00:00`));
  const habitsByLane = new Map<string, Habit[]>();
  for (const habit of data.habits) {
    const lane = categoryToLane(habit.category);
    const list = habitsByLane.get(lane) ?? [];
    list.push(habit);
    habitsByLane.set(lane, list);
  }
  const laneHabitIds = new Set((habitsByLane.get(laneId) ?? []).map((habit) => habit.id));

  let plannedMin = 0;
  let doneMin = 0;

  if (laneId === 'study') {
    for (const entry of data.entries) {
      if (entry.kind !== 'study') continue;
      plannedMin += entry.end_min - entry.start_min;
      if (entry.day_of_week < todayWeekday) {
        doneMin += entry.end_min - entry.start_min;
      }
    }
  }

  const laneLogs = data.habitLogs.filter(
    (log) => laneHabitIds.has(log.habit_id) && inWeek(log.date, week),
  );
  for (const log of laneLogs) {
    const minutes = log.duration_min ?? 0;
    if (laneId !== 'study') plannedMin += minutes;
    doneMin += minutes;
  }

  if (laneId !== 'life') {
    for (const task of data.tasks) {
      if (task.lane !== laneId) continue;
      const scheduledInWeek = inWeek(task.scheduled_date, week);
      const doneInWeek = task.done === 1 && inWeek(task.updated_at.slice(0, 10), week);
      const est = task.est_minutes ?? 0;
      if (scheduledInWeek || doneInWeek) plannedMin += est;
      if (doneInWeek) doneMin += est;
    }
  }

  return { plannedMin, doneMin };
}

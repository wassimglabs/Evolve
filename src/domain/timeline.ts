import type { Habit, HabitLog, Task, TimetableEntry, TimetableException } from '@/db/types';
import type { LaneKey } from '@/components/tag';
import { minutesToTime, isoDayOfWeek, toDateString, timeToMinutes } from '@/lib/date';

export type TimelineItemType = 'class' | 'task' | 'habit' | 'checkin';

export type TimelineRow =
  | { kind: 'class'; id: string; time: string; title: string; lane: LaneKey; past: boolean }
  | {
      kind: 'placed';
      id: string;
      time: string;
      title: string;
      lane: LaneKey;
      done: boolean;
      itemType: 'task' | 'habit';
      est: number | null;
      source: string | null;
    }
  | {
      kind: 'nextUp';
      id: string;
      time: string;
      title: string;
      lane: LaneKey;
      caption: string;
      itemType: 'task' | 'habit';
      est: number | null;
      source: string | null;
    }
  | { kind: 'checkin'; id: string; time: string; title: string };

export type TimelineData = {
  entries: TimetableEntry[];
  exceptions: TimetableException[];
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
};

const CHECKIN_MIN = 21 * 60;
/** Habits have no duration; the "Now" window is a generous hour. */
const HABIT_WINDOW_MIN = 60;

type Candidate = {
  id: string;
  start: number;
  end: number;
  title: string;
  lane: LaneKey;
  done: boolean;
  itemType: 'task' | 'habit';
  est: number | null;
  source: string | null;
};

function captionFor(item: Candidate, nowMin: number): string {
  const parts: string[] = [nowMin >= item.start && nowMin < item.end ? 'Now' : 'Next'];
  if (item.est !== null) parts.push(`${item.est} min`);
  if (item.source === 'coach') parts.push('from Coach');
  return parts.join(' · ');
}

/** Today's rows using the same rules as the approved design: classes, placed
 * tasks/habits (done items muted), the single next-up highlight (amber for
 * Career, mint for every other lane via the screen's styling) and the evening
 * check-in row. Habits without preferred_time are listed first in an
 * "Anytime today" group with gutter text "any" (same dashed style). */
export function buildTimeline(now: Date, data: TimelineData): TimelineRow[] {
  const today = toDateString(now);
  const weekday = isoDayOfWeek(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Day-level and entry-level cancellations apply to today's classes.
  const cancelledIds = new Set<string>();
  let cancelAll = false;
  for (const exception of data.exceptions) {
    if (exception.date !== today || exception.type !== 'cancel') continue;
    if (exception.entry_id === null) cancelAll = true;
    else cancelledIds.add(exception.entry_id);
  }

  const rows: TimelineRow[] = [];

  for (const entry of data.entries) {
    if (entry.day_of_week !== weekday || cancelAll || cancelledIds.has(entry.id)) continue;
    const lane = (['study', 'solven', 'career', 'life'] as const).includes(entry.kind as LaneKey)
      ? (entry.kind as LaneKey)
      : 'study';
    rows.push({
      kind: 'class',
      id: entry.id,
      time: minutesToTime(entry.start_min),
      title: entry.title,
      lane,
      past: entry.end_min < nowMin,
    });
  }

  const loggedHabitIds = new Set(
    data.habitLogs.filter((log) => log.date === today && log.level !== 'skipped').map((log) => log.habit_id),
  );

  const anytime: TimelineRow[] = [];
  const timed: Candidate[] = [];

  for (const habit of data.habits) {
    if (habit.archived === 1) continue;
    const scheduledDays = habit.days.split(',').map((value) => Number(value.trim()));
    if (!scheduledDays.includes(weekday)) continue;
    const done = loggedHabitIds.has(habit.id);
    const lane = (['study', 'solven', 'career', 'life'] as const).includes(habit.category as never)
      ? undefined
      : undefined;
    void lane;
    const habitRowBase = {
      id: habit.id,
      title: habit.name,
      done,
      itemType: 'habit' as const,
      est: null,
      source: null,
    };
    if (habit.preferred_time) {
      const start = timeToMinutes(habit.preferred_time);
      timed.push({ ...habitRowBase, start, end: start + HABIT_WINDOW_MIN, lane: habitLane(habit.category) });
    } else {
      anytime.push({
        kind: 'placed',
        time: 'any',
        ...habitRowBase,
        lane: habitLane(habit.category),
      });
    }
  }

  for (const task of data.tasks) {
    if (task.scheduled_date !== today) continue;
    const base = {
      id: task.id,
      title: task.title,
      done: task.done === 1,
      itemType: 'task' as const,
      est: task.est_minutes,
      source: task.source,
      lane: (['study', 'solven', 'career', 'life'].includes(task.lane) ? task.lane : 'study') as LaneKey,
    };
    if (task.scheduled_start_min !== null) {
      const start = task.scheduled_start_min;
      timed.push({ ...base, start, end: start + (task.est_minutes ?? 60) });
    } else {
      anytime.push({ kind: 'placed', time: 'any', ...base });
    }
  }

  rows.push(...anytime);

  timed.sort((a, b) => a.start - b.start);

  // Next-up: the current slot when we are inside one, else the first upcoming.
  let nextUp: Candidate | null = null;
  for (const item of timed) {
    if (item.done) continue;
    if (nowMin >= item.start && nowMin < item.end) {
      nextUp = item;
      break;
    }
  }
  if (!nextUp) {
    for (const item of timed) {
      if (item.done) continue;
      if (item.start >= nowMin) {
        nextUp = item;
        break;
      }
    }
  }

  for (const item of timed) {
    if (nextUp && item.id === nextUp.id && item.itemType === nextUp.itemType) {
      rows.push({
        kind: 'nextUp',
        id: item.id,
        time: minutesToTime(item.start),
        title: item.title,
        lane: item.lane,
        caption: captionFor(item, nowMin),
        itemType: item.itemType,
        est: item.est,
        source: item.source,
      });
      continue;
    }
    rows.push({
      kind: 'placed',
      id: item.id,
      time: minutesToTime(item.start),
      title: item.title,
      lane: item.lane,
      done: item.done,
      itemType: item.itemType,
      est: item.est,
      source: item.source,
    });
  }

  rows.push({
    kind: 'checkin',
    id: 'evening-checkin',
    time: minutesToTime(CHECKIN_MIN),
    title: 'Evening check-in',
  });

  return rows;
}

function habitLane(category: string): LaneKey {
  switch (category) {
    case 'Physical':
      return 'life';
    case 'Professional':
      return 'solven';
    case 'Communication':
      return 'career';
    default:
      return 'study';
  }
}

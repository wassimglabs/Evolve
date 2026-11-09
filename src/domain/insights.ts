import type { DailyCheckin, Habit, HabitLog } from '@/db/types';
import { dateOffset, isoDayOfWeek, toDateString } from '@/lib/date';

export type HabitCompletionRow = {
  habitId: string;
  name: string;
  done: number;
  scheduled: number;
  /** done / scheduled, 0 when nothing was scheduled. */
  ratio: number;
};

/** Per habit over the last `periodDays` (ending today): non-skipped logs
 * divided by scheduled days (weekday in `days`, on/after the habit was
 * created, on/before today). */
export function habitCompletion(
  periodDays: number,
  data: { habits: Habit[]; logs: HabitLog[] },
  today: string,
): HabitCompletionRow[] {
  const start = dateOffset(new Date(`${today}T00:00:00`), -(periodDays - 1));
  const doneByHabit = new Map<string, Set<string>>();
  for (const log of data.logs) {
    if (log.level === 'skipped' || log.date < start || log.date > today) continue;
    const set = doneByHabit.get(log.habit_id) ?? new Set<string>();
    set.add(log.date);
    doneByHabit.set(log.habit_id, set);
  }

  return data.habits
    .filter((habit) => habit.archived === 0)
    .map((habit) => {
      const createdDate = toDateString(new Date(habit.created_at));
      const scheduledDays = new Set(habit.days.split(',').map((value) => Number(value.trim())));
      let scheduled = 0;
      const startDate = new Date(`${start}T00:00:00`);
      const todayDate = new Date(`${today}T00:00:00`);
      for (let day = startDate; day <= todayDate; day.setDate(day.getDate() + 1)) {
        const dateStr = toDateString(day);
        if (dateStr < createdDate) continue;
        if (scheduledDays.has(isoDayOfWeek(day))) scheduled += 1;
      }
      const done = doneByHabit.get(habit.id)?.size ?? 0;
      return {
        habitId: habit.id,
        name: habit.name,
        done,
        scheduled,
        ratio: scheduled === 0 ? 0 : done / scheduled,
      };
    });
}

export type EnergyOnHabitDays =
  | { needMore: number }
  | { withHabit: number; withoutHabit: number };

/** Average self-reported energy (1-5) on days with at least one habit log vs
 * days without. Needs >= 7 check-ins with >= 3 on each side; otherwise
 * returns { needMore: currentCheckinCount }. */
export function energyOnHabitDays(data: {
  checkins: DailyCheckin[];
  logs: HabitLog[];
}): EnergyOnHabitDays {
  const habitDates = new Set(
    data.logs.filter((log) => log.level !== 'skipped').map((log) => log.date),
  );
  const withEnergy: number[] = [];
  const withoutEnergy: number[] = [];
  for (const checkin of data.checkins) {
    if (habitDates.has(checkin.date)) withEnergy.push(checkin.energy);
    else withoutEnergy.push(checkin.energy);
  }

  const total = data.checkins.length;
  if (total < 7 || withEnergy.length < 3 || withoutEnergy.length < 3) {
    return { needMore: total };
  }
  const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return { withHabit: avg(withEnergy), withoutHabit: avg(withoutEnergy) };
}

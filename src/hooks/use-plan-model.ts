import { laneWeekStats, weekRange } from '@/domain/lane-week';
import { deadlines as deadlinesFromTasks, dueSoon } from '@/domain/due-soon';
import { formatEstimate, formatFreeHours } from '@/domain/format';
import { useDbQuery } from '@/hooks/use-db-query';
import { todayDateString } from '@/lib/date';
import { listHabitLogs } from '@/repositories/habit-logs';
import { listHabits } from '@/repositories/habits';
import { listLanes } from '@/repositories/lanes';
import { listTasks } from '@/repositories/tasks';
import { listTimetableEntries } from '@/repositories/timetable-entries';

type PlanModel = {
  laneWeek: readonly { lane: 'study' | 'solven' | 'career' | 'life'; hours: string; ratio: number }[];
  laneWeekFooter: string;
  deadlines: readonly {
    id: string;
    title: string;
    subtitle: string;
    status: { kind: 'placed'; slot: string } | { kind: 'open' };
  }[];
  freeTimeTiles: readonly { day: string; hours: string }[];
};

const emptyModel: PlanModel = {
  laneWeek: [],
  laneWeekFooter: '',
  deadlines: [],
  freeTimeTiles: [],
};

export function usePlanModel() {
  const liveData = useDbQuery<PlanModel>(
    async () => {
      const [entries, tasks, habits, logs, lanes] = await Promise.all([
        listTimetableEntries(),
        listTasks(),
        listHabits(),
        listHabitLogs(),
        listLanes(),
      ]);
      const now = new Date();
      const range = weekRange(now);
      const today = todayDateString();
      const laneWeekRows: PlanModel['laneWeek'] = (['study', 'solven', 'career', 'life'] as const).map((lane) => {
        const stats = laneWeekStats(lane, range, { entries, tasks, habits, habitLogs: logs }, today);
        const target = lanes.find((item) => item.id === lane)?.weekly_min_minutes ?? 0;
        const ratio = target > 0 ? Math.min(stats.plannedMin / target, 1.4) : 0;
        return {
          lane,
          hours: `${formatFreeHours(stats.plannedMin)} / ${formatFreeHours(target)}`,
          ratio: Number.isFinite(ratio) ? ratio : 0,
        };
      });

      const nextTasks = deadlinesFromTasks(now, tasks);
      const due = dueSoon(now, tasks);
      const deadlineRows: PlanModel['deadlines'] = nextTasks.slice(0, 3).map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: `${task.due_date ?? 'No date'} · ${task.est_minutes ? formatEstimate(task.est_minutes) : 'flexible'}`,
        status: task.scheduled_date ? { kind: 'placed', slot: task.scheduled_date } : { kind: 'open' },
      }));

      const freeSlots: PlanModel['freeTimeTiles'] = (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() + index);
        const dayOfWeek = ((date.getDay() + 6) % 7) + 1;
        const target = entries
          .filter((entry) => entry.day_of_week === dayOfWeek)
          .reduce((sum, entry) => sum + (entry.end_min - entry.start_min), 0);
        return { day, hours: formatFreeHours(Math.max(0, Math.min(9 * 60, 7 * 60 - target))) };
      });

      return {
        laneWeek: laneWeekRows,
        laneWeekFooter: due.length > 0 ? `${due[0].title} is the next deadline.` : 'No deadlines on the radar.',
        deadlines: deadlineRows,
        freeTimeTiles: freeSlots,
      } satisfies PlanModel;
    },
    [],
    emptyModel,
    ['timetable', 'habits', 'habit_logs', 'tasks', 'lanes'],
  );

  return { ...liveData.data, loading: liveData.loading, error: liveData.error };
}

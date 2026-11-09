import { buildTimeline } from '@/domain/timeline';
import { dueSoon } from '@/domain/due-soon';
import { todayDateString, longDayShortMonth } from '@/lib/date';
import { useDbQuery } from '@/hooks/use-db-query';
import { listHabitLogs } from '@/repositories/habit-logs';
import { listHabits } from '@/repositories/habits';
import { listTasks } from '@/repositories/tasks';
import { listTimetableEntries } from '@/repositories/timetable-entries';
import { listTimetableExceptions } from '@/repositories/timetable-exceptions';

function loadProgress(rows: readonly { kind: string; done?: boolean }[]) {
  const tasks = rows.filter((row) => row.kind === 'placed' || row.kind === 'nextUp');
  const done = tasks.filter((row) => (row.kind === 'placed' ? row.done : false)).length;
  return { done, total: tasks.length };
}

const emptyModel = {
  overline: longDayShortMonth(),
  today: todayDateString(),
  rows: [] as Awaited<ReturnType<typeof buildTimeline>>,
  dueSoon: [] as ReturnType<typeof dueSoon>,
  progress: { done: 0, total: 0 },
};

export function useTodayModel() {
  const liveData = useDbQuery(
    async () => {
      const [entries, exceptions, habits, habitLogs, tasks] = await Promise.all([
        listTimetableEntries(),
        listTimetableExceptions(),
        listHabits(),
        listHabitLogs(),
        listTasks(),
      ]);
      const rows = buildTimeline(new Date(), { entries, exceptions, habits, habitLogs, tasks });
      return {
        overline: longDayShortMonth(),
        today: todayDateString(),
        rows,
        dueSoon: dueSoon(new Date(), tasks).slice(0, 2),
        progress: loadProgress(rows),
      };
    },
    [],
    emptyModel,
    ['timetable', 'habits', 'habit_logs', 'tasks'],
  );

  return { ...liveData.data, loading: liveData.loading, error: liveData.error };
}

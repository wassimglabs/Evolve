import { laneWeekStats, weekRange } from '@/domain/lane-week';
import { formatFreeHours } from '@/domain/format';
import { useDbQuery } from '@/hooks/use-db-query';
import { todayDateString } from '@/lib/date';
import { listHabitLogs } from '@/repositories/habit-logs';
import { listHabits } from '@/repositories/habits';
import { listLanes } from '@/repositories/lanes';
import { listTasks } from '@/repositories/tasks';
import { listTimetableEntries } from '@/repositories/timetable-entries';
import { listJobs } from '@/repositories/jobs';
import { listContentIdeas } from '@/repositories/content-ideas';
import type { ContentIdea, Job, Task } from '@/db/types';

const laneIds = ['study', 'solven', 'career', 'life'] as const;
type LaneId = (typeof laneIds)[number];
type LaneSummary = { title: string; value: string; ratio: number };
type LanesModel = {
  laneWeekSummary: Record<LaneId, LaneSummary>;
  tasks: Task[];
  jobs: Job[];
  ideas: ContentIdea[];
  activeHabitCount: number;
};

const emptySummary = Object.fromEntries(
  laneIds.map((lane) => [lane, { title: `${lane} · this week`, value: '0 / 0 min', ratio: 0 }]),
) as Record<LaneId, LaneSummary>;

const emptyModel: LanesModel = {
  laneWeekSummary: emptySummary,
  tasks: [],
  jobs: [],
  ideas: [],
  activeHabitCount: 0,
};

export function useLanesModel() {
  const liveData = useDbQuery(
    async () => {
      const [entries, tasks, habits, logs, lanes, jobs, ideas] = await Promise.all([
        listTimetableEntries(),
        listTasks(),
        listHabits(),
        listHabitLogs(),
        listLanes(),
        listJobs(),
        listContentIdeas(),
      ]);
      const now = new Date();
      const range = weekRange(now);
      const today = todayDateString();
      const laneWeekSummary = Object.fromEntries(
        laneIds.map((lane) => {
          const stats = laneWeekStats(lane, range, { entries, tasks, habits, habitLogs: logs }, today);
          const target = lanes.find((item) => item.id === lane)?.weekly_min_minutes ?? 0;
          return [
            lane,
            {
              title: `${lane} · this week`,
              value: `${formatFreeHours(stats.plannedMin)} / ${formatFreeHours(target)}`,
              ratio: target > 0 ? Math.min(stats.plannedMin / target, 1.4) : 0,
            },
          ];
        }),
      ) as Record<LaneId, LaneSummary>;
      return {
        laneWeekSummary,
        tasks,
        jobs,
        ideas,
        activeHabitCount: habits.filter((habit) => habit.archived === 0).length,
      };
    },
    [],
    emptyModel,
    ['habits', 'habit_logs', 'tasks', 'lanes', 'timetable', 'jobs', 'ideas'],
  );

  return { ...liveData.data, loading: liveData.loading, error: liveData.error };
}

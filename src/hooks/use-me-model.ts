import { useDbQuery } from '@/hooks/use-db-query';
import { listContentIdeas } from '@/repositories/content-ideas';
import { listDailyCheckins } from '@/repositories/daily-checkins';
import { listHabits } from '@/repositories/habits';
import { listJobs } from '@/repositories/jobs';
import { listTasks } from '@/repositories/tasks';

const emptyModel = { tasks: 0, habits: 0, jobs: 0, ideas: 0, checkins: 0 };

export function useMeModel() {
  return useDbQuery(
    async () => {
      const [tasks, habits, jobs, ideas, checkins] = await Promise.all([
        listTasks(),
        listHabits(),
        listJobs(),
        listContentIdeas(),
        listDailyCheckins(),
      ]);
      return {
        tasks: tasks.length,
        habits: habits.filter((habit) => habit.archived === 0).length,
        jobs: jobs.length,
        ideas: ideas.length,
        checkins: checkins.length,
      };
    },
    [],
    emptyModel,
    ['tasks', 'habits', 'jobs', 'ideas', 'checkins'],
  );
}

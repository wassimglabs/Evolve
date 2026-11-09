import { useDbQuery } from '@/hooks/use-db-query';
import { listTasks } from '@/repositories/tasks';
import { listHabits } from '@/repositories/habits';

const emptyModel: {
  contextChips: readonly string[];
  message: { text: string; source: string };
  quickActions: readonly string[];
  placeholder: string;
} = {
  contextChips: [],
  message: { text: 'Add a task or habit to start planning.', source: 'Your local data only.' },
  quickActions: [],
  placeholder: '',
};

export function useCoachModel() {
  const liveData = useDbQuery(
    async () => {
      const [tasks, habits] = await Promise.all([listTasks(), listHabits()]);
      const nextTask = tasks
        .filter((task) => task.done === 0)
        .sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31'))[0];

      const text = nextTask
        ? `Next task: ${nextTask.title}. ${nextTask.due_date ? `Due ${nextTask.due_date}.` : 'No due date set.'} ${nextTask.est_minutes ? `Estimate: ${nextTask.est_minutes} minutes.` : ''}`
        : habits.some((habit) => habit.archived === 0)
          ? 'No open tasks. Your active habits are ready for today.'
          : 'Add a task or habit to see your plan here.';

      return {
        ...emptyModel,
        message: { text, source: nextTask ? 'Based on your saved tasks.' : 'Your local data only.' },
      };
    },
    [],
    emptyModel,
    ['tasks', 'habits'],
  );

  return { ...liveData.data, loading: liveData.loading, error: liveData.error };
}

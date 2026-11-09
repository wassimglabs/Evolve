import { useDbQuery } from '@/hooks/use-db-query';
import { dateOffset, isoDayOfWeek, toDateString } from '@/lib/date';
import { listHabits } from '@/repositories/habits';
import { listHabitLogs } from '@/repositories/habit-logs';

type HabitDisplay = {
  id: string;
  name: string;
  category: string;
  targets: string;
  schedule: string;
  days: readonly ('target' | 'minimum' | 'missed' | 'not-scheduled')[];
};

const habitCategories = ['All', 'Physical', 'Intellectual', 'Professional', 'Communication'] as const;
const habitHistoryDays = 14;

const emptyModel = {
  overline: '0 active',
  categories: habitCategories,
  historyDays: habitHistoryDays,
  habits: [] as readonly HabitDisplay[],
};

export function useHabitsModel(category: string) {
  const liveData = useDbQuery(
    async () => {
      const [allHabits, logs] = await Promise.all([listHabits(), listHabitLogs()]);
      const today = new Date();
      const logsByHabitAndDate = new Map(logs.map((log) => [`${log.habit_id}:${log.date}`, log]));
      const mapped = allHabits.filter((habit) => habit.archived === 0).map((habit) => {
        const scheduledDays = new Set(habit.days.split(',').map(Number));
        const createdDate = toDateString(new Date(habit.created_at));
        return {
          id: habit.id,
          name: habit.name,
          category: habit.category,
          targets: `${habit.min_target === 'none' ? 'Minimum not set' : `Minimum ${habit.min_target}`} · ${habit.full_target === 'full' ? 'Target full session' : `Target ${habit.full_target}`}`,
          schedule: `${habit.days.split(',').map((value) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Number(value) - 1]).filter(Boolean).join(', ') || 'No days'}${habit.preferred_time ? ` · ${habit.preferred_time}` : ''}`,
          days: Array.from({ length: habitHistoryDays }, (_, index) => {
            const date = dateOffset(today, index - (habitHistoryDays - 1));
            const weekday = isoDayOfWeek(new Date(`${date}T00:00:00`));
            if (date < createdDate || !scheduledDays.has(weekday)) return 'not-scheduled' as const;
            const log = logsByHabitAndDate.get(`${habit.id}:${date}`);
            if (!log || log.level === 'skipped') return 'missed' as const;
            return log.level === 'min' ? 'minimum' as const : 'target' as const;
          }),
        };
      });
      const filtered = category === 'All' ? mapped : mapped.filter((habit) => habit.category === category);
      return {
        overline: `${mapped.length} active`,
        categories: habitCategories,
        historyDays: habitHistoryDays,
        habits: filtered,
      };
    },
    [category],
    emptyModel,
    ['habits', 'habit_logs'],
  );

  return { ...liveData.data, loading: liveData.loading, error: liveData.error };
}

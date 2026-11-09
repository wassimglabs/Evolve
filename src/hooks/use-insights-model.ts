import { energyOnHabitDays, habitCompletion } from '@/domain/insights';
import { useDbQuery } from '@/hooks/use-db-query';
import { todayDateString } from '@/lib/date';
import { listDailyCheckins } from '@/repositories/daily-checkins';
import { listHabitLogs } from '@/repositories/habit-logs';
import { listHabits } from '@/repositories/habits';

type InsightsModel = {
  habits: ReturnType<typeof habitCompletion>;
  energy: ReturnType<typeof energyOnHabitDays>;
  checkinCount: number;
  logCount: number;
};

const emptyModel: InsightsModel = {
  habits: [],
  energy: { needMore: 0 },
  checkinCount: 0,
  logCount: 0,
};

export function useInsightsModel(periodDays: number) {
  const liveData = useDbQuery(
    async () => {
      const [habits, logs, checkins] = await Promise.all([
        listHabits(),
        listHabitLogs(),
        listDailyCheckins(),
      ]);
      return {
        habits: habitCompletion(periodDays, { habits, logs }, todayDateString()),
        energy: energyOnHabitDays({ checkins, logs }),
        checkinCount: checkins.length,
        logCount: logs.length,
      };
    },
    [periodDays],
    emptyModel,
    ['habits', 'habit_logs', 'checkins'],
  );
  return liveData;
}

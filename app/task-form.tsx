import { router, useLocalSearchParams } from 'expo-router';

import { TaskHabitForm, type TaskHabitKind } from '@/components/task-habit-form';

const LANES = ['study', 'solven', 'career', 'life'] as const;

export default function TaskFormScreen() {
  const { type, lane } = useLocalSearchParams<{ type?: string; lane?: string }>();
  const formType: TaskHabitKind = type === 'Habits' ? 'Habits' : 'Tasks';

  return (
    <TaskHabitForm
      type={formType}
      initialValues={{
        ...(formType === 'Tasks' && lane && LANES.includes(lane as (typeof LANES)[number]) ? { lane } : {}),
      }}
      onCancel={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}

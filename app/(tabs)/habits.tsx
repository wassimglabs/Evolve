import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function HabitsScreen() {
  return (
    <Screen title="Habits">
      <EmptyState title="Habits shell" message="Your habits, targets and logs will live here later." />
    </Screen>
  );
}

import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function ScheduleScreen() {
  return (
    <Screen title="Schedule">
      <EmptyState title="Schedule shell" message="Timetable entries, free windows and exceptions will live here later." />
    </Screen>
  );
}

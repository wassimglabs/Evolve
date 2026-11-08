import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';

export default function InsightsScreen() {
  return (
    <Screen title="Insights">
      <EmptyState title="Insights shell" message="Trends across habits and check-ins will live here later." />
    </Screen>
  );
}

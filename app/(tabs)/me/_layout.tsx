import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/** Me tab stack: the Me tab itself + Insights and Settings sub-screens
 * (tab bar stays visible with Me highlighted). */
export default function MeLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/** Lanes tab stack: the Lanes tab itself + the Habits sub-screen
 * (tab bar stays visible with Lanes highlighted). */
export default function LanesLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

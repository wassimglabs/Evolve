import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/use-theme';

export function ProgressBar({ value, max = 1 }: { value: number; max?: number }) {
  const t = useTheme();
  const ratio = Math.max(0, Math.min(value / Math.max(max, 1), 1));

  return (
    <View style={[styles.track, { backgroundColor: t.surface2, borderColor: t.border }]}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: t.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 8,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 8,
    height: '100%',
  },
});

import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

/** Habit history dot, 12x12. missed = surface bg + 1pt dashed border (stays 12x12). */
export function Dot({ kind }: { kind: 'target' | 'minimum' | 'missed' | 'not-scheduled' }) {
  if (kind === 'missed') {
    return <View style={[styles.dot, styles.missed]} />;
  }

  if (kind === 'not-scheduled') {
    return <View style={[styles.dot, styles.notScheduled]} />;
  }

  return <View style={[styles.dot, { backgroundColor: kind === 'target' ? colors.accent : colors.dotMinimum }]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  missed: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.dashed,
    boxSizing: 'border-box',
  },
  notScheduled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.divider,
    boxSizing: 'border-box',
  },
});

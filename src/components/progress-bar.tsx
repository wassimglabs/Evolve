import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';

/** height 8, radius 4, track colors.border; pass style={{ flex: 1 }} in rows. */
export function ProgressBar({ ratio, color, style }: { ratio: number; color: string; style?: StyleProp<ViewStyle> }) {
  const clamped = Math.min(Math.max(ratio, 0), 1);

  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});

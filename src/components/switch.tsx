import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

/** Custom switch: hit area 60x44, track 52x30 r15, thumb 24x24. */
export function Switch({ value, onValueChange }: { value: boolean; onValueChange: (next: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => {
        haptics.selection();
        onValueChange(!value);
      }}
      style={({ pressed }) => [styles.hit, pressed && { opacity: 0.85 }]}>
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
  },
  trackOn: {
    backgroundColor: colors.accent,
  },
  trackOff: {
    backgroundColor: colors.border,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  thumbOn: {
    backgroundColor: colors.onAccent,
    alignSelf: 'flex-end',
  },
  thumbOff: {
    backgroundColor: colors.muted,
    alignSelf: 'flex-start',
  },
});

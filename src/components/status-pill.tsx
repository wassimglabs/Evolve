import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

/** Connection status pill: 12pt, radius 8. `positive` = accent on mint,
 * `neutral` = muted on surface2. */
export function StatusPill({ label, tone = 'positive' }: { label: string; tone?: 'positive' | 'neutral' }) {
  return (
    <View style={[styles.pill, tone === 'neutral' ? styles.neutral : styles.positive]}>
      <Text style={[styles.label, { color: tone === 'neutral' ? colors.muted : colors.accent }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    flexShrink: 0,
    alignSelf: 'center',
  },
  positive: {
    backgroundColor: colors.highlight.mint.bg,
  },
  neutral: {
    backgroundColor: colors.surface2,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.inter,
  },
});

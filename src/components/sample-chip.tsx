import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

/** "Sample data" / "Sample chat" chip, aligned with the title baseline. */
export function SampleChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.sampleChip.bg,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 6,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: colors.sampleChip.fg,
  },
});

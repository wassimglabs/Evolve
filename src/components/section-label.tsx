import { StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

/** 13/600 muted label; pair it with the card below it inside a gap-8 column. */
export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    color: colors.muted,
  },
});

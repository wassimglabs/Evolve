import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export function LargeHeader({
  overline,
  title,
  rightSlot,
}: {
  overline?: string;
  title: string;
  rightSlot?: React.ReactNode;
}) {
  const t = useTheme();

  return (
    <View style={styles.header}>
      {overline ? (
        <Text variant="caption" style={{ color: t.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {overline}
        </Text>
      ) : null}
      <View style={styles.headerRow}>
        <Text variant="title" style={{ marginTop: overline ? 4 : 0 }}>{title}</Text>
        {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
    paddingTop: 8,
  },
  headerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slot: {
    marginLeft: 12,
  },
});

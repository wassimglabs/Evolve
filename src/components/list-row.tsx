import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export function ListRow({
  title,
  subtitle,
  trailing,
  chevron = false,
  onPress,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, backgroundColor: t.surface }]}>
      <View style={styles.copy}>
        <Text variant="heading" style={{ fontWeight: '600' }}>{title}</Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
      <View style={styles.trailingWrap}>
        {trailing}
        {chevron ? <Text style={{ color: t.muted }}>›</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderColor: '#00000000',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  trailingWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});

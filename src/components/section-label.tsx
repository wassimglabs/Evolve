import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/theme/use-theme';

export function SectionLabel({ label }: { label: string }) {
  const t = useTheme();

  return (
    <View style={styles.section}>
      <Text variant="caption" style={{ color: t.muted, letterSpacing: 0.7, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 8,
  },
});

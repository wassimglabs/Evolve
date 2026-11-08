import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <Text variant="heading" style={{ textAlign: 'center' }}>{title}</Text>
      {message ? <Text variant="muted" style={{ textAlign: 'center' }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
});

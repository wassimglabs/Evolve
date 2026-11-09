import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { LargeHeader } from '@/components/large-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useCoachModel } from '@/hooks/use-coach-model';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

export default function CoachScreen() {
  const { message, error } = useCoachModel();

  return (
    <Screen>
      <LargeHeader overline="Based on your saved records" title="Coach" />
      {error ? <Text style={styles.error}>Could not load your tasks: {error.message}</Text> : null}
      <Card variant="padded" style={styles.card}>
        <Text style={styles.message}>{message.text}</Text>
        <Text style={styles.source}>{message.source}</Text>
      </Card>
      <Button
        variant="primary"
        size="block"
        onPress={() => router.push({ pathname: '/me/data', params: { type: 'Tasks' } })}>
        Manage tasks
      </Button>
      <Button
        variant="secondary"
        size="block"
        onPress={() => router.push({ pathname: '/me/data', params: { type: 'Habits' } })}>
        Manage habits
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  message: { fontSize: 15, lineHeight: 22, fontFamily: fonts.inter, color: colors.text },
  source: { fontSize: 12, fontFamily: fonts.inter, color: colors.muted },
  error: { color: colors.danger.text, fontSize: 13, fontFamily: fonts.inter },
});

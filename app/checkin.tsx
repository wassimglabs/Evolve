import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';

export default function CheckInScreen() {
  return (
    <Screen title="Evening check-in" rightSlot={<Link href="/" asChild><Button title="Done" variant="secondary" /></Link>}>
      <Card style={styles.card}>
        <Text variant="heading">How was today?</Text>
        <Text variant="muted">Energy, focus, and mood inputs are ready for the real data model later.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
});

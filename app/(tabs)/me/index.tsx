import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { LargeHeader } from '@/components/large-header';
import { NavRow } from '@/components/nav-row';
import { Screen } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { Text } from '@/components/text';
import { useMeModel } from '@/hooks/use-me-model';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

export default function MeScreen() {
  const { data, loading, error } = useMeModel();

  return (
    <Screen gap={16}>
      <LargeHeader overline="Your records stay on this device" title="Me" />

      <View style={styles.section}>
        <SectionLabel>Your data</SectionLabel>
        <Card variant="padded" style={styles.dataCard}>
          {error ? <Text style={styles.error}>Could not load counts: {error.message}</Text> : null}
          <Text style={styles.caption}>
            {loading
              ? 'Loading your records…'
              : `${data.tasks} tasks · ${data.habits} habits · ${data.jobs} jobs · ${data.ideas} ideas · ${data.checkins} check-ins`}
          </Text>
          <Button variant="primary" size="block" onPress={() => router.push('/me/data')}>
            Manage all records
          </Button>
        </Card>
      </View>

      <Card variant="flush">
        <NavRow
          title="Insights"
          subtitle="Calculated from your habit logs and check-ins"
          onPress={() => router.push('/me/insights')}
        />
        <NavRow
          title="Evening check-in"
          subtitle="Record or review your daily check-ins"
          onPress={() => router.push({ pathname: '/me/data', params: { type: 'Check-ins' } })}
        />
        <NavRow
          title="Settings"
          subtitle="Notifications and display preferences"
          last
          onPress={() => router.push('/me/settings')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  dataCard: { gap: 10 },
  caption: { color: colors.muted, fontSize: 13, fontFamily: fonts.inter, lineHeight: 19 },
  error: { color: colors.danger.text, fontSize: 13, fontFamily: fonts.inter },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LargeHeader } from '@/components/large-header';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Text } from '@/components/text';
import { useInsightsModel } from '@/hooks/use-insights-model';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

const periods = ['7 days', '30 days', '90 days'] as const;
const periodDays: Record<(typeof periods)[number], number> = { '7 days': 7, '30 days': 30, '90 days': 90 };

export default function InsightsScreen() {
  const [period, setPeriod] = useState<(typeof periods)[number]>('7 days');
  const { data, loading, error } = useInsightsModel(periodDays[period]);

  return (
    <Screen gap={16}>
      <LargeHeader overline="Calculated from your records" title="Insights" onBack={() => router.back()} />
      <Segmented variant="period" options={periods} value={period} onChange={(value) => setPeriod(value as (typeof periods)[number])} />
      {loading ? <Text style={styles.caption}>Loading your records…</Text> : null}
      {error ? <Text style={styles.error}>Could not load insights: {error.message}</Text> : null}

      {!loading && !error && data.habits.length === 0 ? (
        <EmptyState
          title="No habit history yet"
          caption="Create habits and log sessions to see your own completion patterns here."
          action={{ label: 'Manage habits', onPress: () => router.push({ pathname: '/me/data', params: { type: 'Habits' } }) }}
        />
      ) : null}

      {data.habits.length > 0 ? (
        <Card variant="padded" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Habit completion</Text>
            <Text style={styles.caption}>Completed sessions / scheduled days</Text>
          </View>
          {data.habits.map((habit) => (
            <View style={styles.habitRow} key={habit.habitId}>
              <View style={styles.habitHeading}>
                <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                <Text style={styles.value}>{habit.done}/{habit.scheduled}</Text>
              </View>
              <ProgressBar ratio={habit.ratio} color={colors.accent} />
            </View>
          ))}
        </Card>
      ) : null}

      {data.checkinCount > 0 ? (
        <Card variant="padded" style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Energy on habit days</Text>
            <Text style={styles.caption}>Based on {data.checkinCount} saved check-ins</Text>
          </View>
          {'needMore' in data.energy ? (
            <Text style={styles.caption}>More check-ins across habit and non-habit days are needed to compare energy.</Text>
          ) : (
            <View style={styles.energyRow}>
              <View style={styles.energyTile}>
                <Text style={styles.energyValue}>{data.energy.withHabit.toFixed(1)}</Text>
                <Text style={styles.caption}>With a habit log</Text>
              </View>
              <View style={styles.energyTile}>
                <Text style={styles.energyValue}>{data.energy.withoutHabit.toFixed(1)}</Text>
                <Text style={styles.caption}>Without a habit log</Text>
              </View>
            </View>
          )}
        </Card>
      ) : !loading && !error && data.habits.length > 0 ? (
        <EmptyState
          title="No check-ins yet"
          caption="Save check-ins to compare energy across days with and without habit logs."
          action={{ label: 'Manage check-ins', onPress: () => router.push({ pathname: '/me/data', params: { type: 'Check-ins' } }) }}
        />
      ) : null}

      <Button
        variant="secondary"
        size="block"
        onPress={() => router.push({ pathname: '/me/data', params: { type: 'Check-ins' } })}>
        Manage check-ins
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  cardHeader: { gap: 2 },
  cardTitle: { fontSize: 15, fontFamily: fonts.interSemiBold, color: colors.text },
  caption: { fontSize: 12.5, fontFamily: fonts.inter, color: colors.muted },
  error: { fontSize: 13, fontFamily: fonts.inter, color: colors.danger.text },
  habitRow: { gap: 7 },
  habitHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  habitName: { flex: 1, minWidth: 0, fontSize: 13.5, fontFamily: fonts.interMedium, color: colors.text },
  value: { fontSize: 12.5, fontFamily: fonts.interSemiBold, color: colors.text, fontVariant: ['tabular-nums'] },
  energyRow: { flexDirection: 'row', gap: 10 },
  energyTile: { flex: 1, borderRadius: 12, padding: 12, backgroundColor: colors.surface2, gap: 2 },
  energyValue: { fontSize: 24, fontFamily: fonts.grotesk, color: colors.text, fontVariant: ['tabular-nums'] },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Dot } from '@/components/dot';
import { Icon } from '@/components/icon';
import { LargeHeader } from '@/components/large-header';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Text } from '@/components/text';
import { useHabitsModel } from '@/hooks/use-habits-model';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

export default function HabitsScreen() {
  const [category, setCategory] = useState('All');
  const { overline, categories, habits, error, loading } = useHabitsModel(category);

  return (
    <Screen>
      <LargeHeader
        overline={overline}
        title="Habits"
        onBack={() => router.back()}
        right={
          <Button
            variant="primary"
            size="compact"
            icon={<Icon name="plus" size={16} color={colors.onAccent} strokeWidth={2.4} />}
            labelStyle={{ fontSize: 13.5 }}
            onPress={() => router.push({ pathname: '/task-form', params: { type: 'Habits' } })}>
            New habit
          </Button>
        }
      />

      <Segmented variant="chips" options={categories} value={category} onChange={setCategory} />
      {error ? <Text style={styles.error}>Could not load habits: {error.message}</Text> : null}
      {!loading && !error && habits.length === 0 ? (
        <EmptyState
          title="No habits in this category"
          caption="Create a habit to start tracking your own history."
          action={{ label: 'Add habit', onPress: () => router.push({ pathname: '/task-form', params: { type: 'Habits' } }) }}
        />
      ) : null}

      <View style={styles.legend}>
        <View style={styles.legendPair}>
          <Dot kind="target" />
          <Text style={styles.legendText}>Target</Text>
        </View>
        <View style={styles.legendPair}>
          <Dot kind="minimum" />
          <Text style={styles.legendText}>Minimum</Text>
        </View>
        <View style={styles.legendPair}>
          <Dot kind="missed" />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendPair}>
          <Dot kind="not-scheduled" />
          <Text style={styles.legendText}>Not scheduled</Text>
        </View>
        <Text style={styles.legendText}>· last 14 days</Text>
      </View>

      <View style={styles.cards}>
        {habits.map((habit) => {
          const done = habit.days.filter((day) => day === 'target' || day === 'minimum').length;
          const missed = habit.days.filter((day) => day === 'missed').length;

          return (
            <Card variant="padded" style={styles.habitCard} key={habit.id}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
                  {habit.name}
                </Text>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {habit.category}
                  </Text>
                </View>
              </View>
              <Text style={styles.line}>{habit.targets}</Text>
              <Text style={styles.line}>{habit.schedule}</Text>
              <View
                style={styles.dotsRow}
                accessibilityLabel={`${done} done, ${missed} missed in the last 14 days`}>
                {habit.days.map((day, index) => (
                  <Dot key={index} kind={day} />
                ))}
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    rowGap: 8,
  },
  legendPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  cards: {
    gap: 10,
  },
  habitCard: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
    flexShrink: 1,
    minWidth: 0,
  },
  categoryChip: {
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  line: {
    fontSize: 13,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 2,
  },
  error: { color: colors.danger.text, fontSize: 13, fontFamily: fonts.inter },
});

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ListRow } from '@/components/list-row';
import { ProgressRing } from '@/components/progress-ring';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { Tag } from '@/components/tag';
import { Text } from '@/components/text';
import { TimelineRow } from '@/components/timeline-row';
import { getSettingByKey, updateSetting } from '@/repositories/settings';
import { listHabitLogs } from '@/repositories/habit-logs';
import { listHabits } from '@/repositories/habits';
import { listTimetableEntries } from '@/repositories/timetable-entries';
import { haptics } from '@/lib/haptics';
import { isoDayOfWeek, timeToMinutes, todayDateString } from '@/lib/date';

const dayModes = ['Normal', 'Low energy', 'Recovery'] as const;
type DayMode = (typeof dayModes)[number];

function mapMode(value: string | null): DayMode {
  if (value === 'low') return 'Low energy';
  if (value === 'recovery') return 'Recovery';
  return 'Normal';
}

function toStoredMode(value: DayMode): 'normal' | 'low' | 'recovery' {
  if (value === 'Low energy') return 'low';
  if (value === 'Recovery') return 'recovery';
  return 'normal';
}

function laneForKey(key: string): 'study' | 'solven' | 'career' | 'life' {
  if (key === 'career') return 'career';
  if (key === 'life') return 'life';
  if (key === 'study') return 'study';
  return 'solven';
}

export default function TodayScreen() {
  const todayString = todayDateString();
  const [mode, setMode] = useState<DayMode>('Normal');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [entries, habits, logs, savedMode] = await Promise.all([
          listTimetableEntries(),
          listHabits(),
          listHabitLogs(),
          getSettingByKey('day_mode'),
        ]);

        if (!active) return;

        const todayEntries = entries.filter((entry) => entry.day_of_week === isoDayOfWeek());
        const habitLogs = new Set(logs.filter((log) => log.date === todayString).map((log) => log.habit_id));

        const list = [
          ...todayEntries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            lane: laneForKey(entry.kind || 'study'),
            startMin: entry.start_min,
            endMin: entry.end_min,
            kind: 'class',
            done: false,
            subtitle: `${entry.start_min / 60}:00–${entry.end_min / 60}:00`,
          })),
          ...habits.map((habit) => ({
            id: habit.id,
            title: habit.name,
            lane: laneForKey(habit.category || 'solven'),
            startMin: habit.preferred_time ? timeToMinutes(habit.preferred_time) : 540,
            endMin: habit.preferred_time ? timeToMinutes(habit.preferred_time) + 30 : 570,
            kind: 'habit',
            done: habitLogs.has(habit.id),
            subtitle: habit.category,
          })),
        ].sort((a, b) => a.startMin - b.startMin);

        setItems(list);

        if (savedMode) {
          setMode(mapMode(savedMode));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [todayString]);

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items]);
  const totalCount = Math.max(items.length, 1);

  const nextItem = useMemo(() => {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    return [...items].sort((a, b) => a.startMin - b.startMin).find((item) => item.startMin >= nowMinutes) ?? items[0] ?? null;
  }, [items]);

  const dueSoon = useMemo(() => items.slice(0, 2).map((item) => ({ title: item.title, lane: item.lane })), [items]);

  const handleComplete = async (item: any) => {
    haptics.success();
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, done: true } : entry)));

    if (item.kind === 'habit') {
      try {
        const { createHabitLog } = await import('@/repositories/habit-logs');
        await createHabitLog({
          habit_id: item.id,
          date: todayString,
          level: 'target',
          duration_min: 30,
          note: 'completed from Today',
        });
      } catch {
        setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, done: false } : entry)));
      }
    }
  };

  const handleDayModeChange = async (nextMode: DayMode) => {
    setMode(nextMode);
    haptics.selection();
    await updateSetting('day_mode', toStoredMode(nextMode));
  };

  return (
    <Screen title="Today" rightSlot={<ProgressRing value={doneCount} max={totalCount} label={`${doneCount}/${totalCount}`} />}>
      <View style={styles.overviewRow}>
        <Text variant="caption" style={{ color: '#A3AAB8' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
      </View>

      <SegmentedControl value={mode} options={dayModes} onChange={handleDayModeChange} />

      {dueSoon.length > 0 ? (
        <Card>
          <Text variant="heading">Due soon</Text>
          {dueSoon.map(({ title, lane }) => (
            <ListRow key={title} title={title} subtitle={lane} trailing={<Tag label={lane} lane={lane} />} chevron />
          ))}
        </Card>
      ) : null}

      <Card>
        <Text variant="heading">Timeline</Text>
        {loading ? (
          <View style={styles.skeletonStack}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
          </View>
        ) : items.length > 0 ? (
          <>
            {nextItem ? (
              <Card tone="highlight" style={styles.nextCard}>
                <Text variant="caption" style={{ color: '#77D9B2' }}>Next up</Text>
                <Text variant="heading">{nextItem.title}</Text>
                <Text variant="caption">{nextItem.kind === 'habit' ? 'Habit' : 'Scheduled'} · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
              </Card>
            ) : null}

            {items.map((item) => (
              <Pressable key={item.id} onPress={() => void handleComplete(item)}>
                <TimelineRow time={String(Math.floor(item.startMin / 60)).padStart(2, '0') + ':' + String(item.startMin % 60).padStart(2, '0')} title={item.title} subtitle={item.subtitle} lane={item.lane} variant={item.kind === 'habit' ? 'class' : 'class'} />
              </Pressable>
            ))}
          </>
        ) : (
          <EmptyState title="Nothing scheduled" message="Add a habit or timetable entry to build your day view." />
        )}
      </Card>

      <Button title="Evening check-in" onPress={() => router.push('/checkin' as any)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  overviewRow: {
    paddingTop: 4,
  },
  nextCard: {
    marginBottom: 12,
  },
  skeletonStack: {
    gap: 8,
    paddingTop: 8,
  },
  skeletonLine: {
    backgroundColor: '#1D222B',
    borderRadius: 8,
    height: 16,
    width: '100%',
  },
});

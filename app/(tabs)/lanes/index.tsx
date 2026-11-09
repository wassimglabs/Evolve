import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LargeHeader } from '@/components/large-header';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { Segmented } from '@/components/segmented';
import type { LaneKey } from '@/components/tag';
import { Text } from '@/components/text';
import { useLanesModel } from '@/hooks/use-lanes-model';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

const laneOptions = ['Study', 'Solven', 'Career', 'Life'] as const;

function laneKey(value: string): LaneKey {
  return value.toLowerCase() as LaneKey;
}

export default function LanesScreen() {
  const [selectedLane, setSelectedLane] = useState('Career');
  const { laneWeekSummary, tasks, jobs, ideas, activeHabitCount, error } = useLanesModel();
  const lane = laneKey(selectedLane);
  const summary = laneWeekSummary[lane];
  const laneTasks = tasks.filter((task) => task.lane === lane);

  return (
    <Screen>
      <LargeHeader overline="Calculated from your records" title="Lanes" />
      <Segmented variant="lane" options={laneOptions} value={selectedLane} onChange={setSelectedLane} />
      {error ? <Text style={styles.error}>Could not load your records: {error.message}</Text> : null}

      <Card variant="padded" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{summary.title}</Text>
          <Text style={styles.summaryValue}>{summary.value}</Text>
        </View>
        <ProgressBar ratio={summary.ratio} color={colors.lanes[lane].fg} />
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionLabel>Tasks</SectionLabel>
          <Button
            variant="secondary"
            size="compact"
            onPress={() => router.push({ pathname: '/task-form', params: { type: 'Tasks', lane } })}>
            Add task
          </Button>
        </View>
        {laneTasks.length ? (
          <Card variant="flush">
            {laneTasks.map((task, index) => (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/me/data', params: { type: 'Tasks' } })}
                style={[styles.taskRow, index < laneTasks.length - 1 && styles.divider]}>
                <View style={styles.taskCopy}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.caption}>
                    {task.done ? 'Complete' : 'Open'} · {task.due_date ?? 'No due date'}
                  </Text>
                </View>
                <Text style={styles.editLabel}>Manage</Text>
              </Pressable>
            ))}
          </Card>
        ) : (
          <EmptyState
            title="No tasks in this lane"
            caption="Add a task and it will appear here."
            action={{ label: 'Add task', onPress: () => router.push({ pathname: '/task-form', params: { type: 'Tasks', lane } }) }}
          />
        )}
      </View>

      {lane === 'career' ? (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionLabel>{`Job pipeline (${jobs.length})`}</SectionLabel>
              <Button
                variant="secondary"
                size="compact"
                onPress={() => router.push({ pathname: '/me/data', params: { type: 'Jobs' } })}>
                Manage
              </Button>
            </View>
            {jobs.length ? (
              <Card variant="flush">
                {jobs.map((job, index) => (
                  <Pressable
                    key={job.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/me/data', params: { type: 'Jobs' } })}
                    style={[styles.taskRow, index < jobs.length - 1 && styles.divider]}>
                    <View style={styles.taskCopy}>
                      <Text style={styles.taskTitle}>{job.title}</Text>
                      <Text style={styles.caption}>{job.company} · {job.status}</Text>
                    </View>
                    <Text style={styles.editLabel}>Manage</Text>
                  </Pressable>
                ))}
              </Card>
            ) : (
              <EmptyState title="No jobs saved" caption="Add job leads to keep track of your applications." />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionLabel>{`Content ideas (${ideas.length})`}</SectionLabel>
              <Button
                variant="secondary"
                size="compact"
                onPress={() => router.push({ pathname: '/me/data', params: { type: 'Ideas' } })}>
                Manage
              </Button>
            </View>
            {ideas.length ? (
              <Card variant="flush">
                {ideas.map((idea, index) => (
                  <Pressable
                    key={idea.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/me/data', params: { type: 'Ideas' } })}
                    style={[styles.taskRow, index < ideas.length - 1 && styles.divider]}>
                    <View style={styles.taskCopy}>
                      <Text style={styles.taskTitle}>{idea.title}</Text>
                      <Text style={styles.caption}>{idea.status}</Text>
                    </View>
                    <Text style={styles.editLabel}>Manage</Text>
                  </Pressable>
                ))}
              </Card>
            ) : (
              <EmptyState title="No content ideas" caption="Add your own idea when you have one to save." />
            )}
          </View>
        </>
      ) : null}

      <Button
        variant="secondary"
        size="block"
        onPress={() => router.push('/lanes/habits')}>
        Habits ({activeHabitCount})
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: { gap: 10 },
  summaryHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  summaryTitle: { flex: 1, minWidth: 0, fontSize: 15, fontFamily: fonts.interSemiBold, color: colors.text },
  summaryValue: { fontSize: 12.5, fontFamily: fonts.inter, color: colors.muted, fontVariant: ['tabular-nums'] },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  taskRow: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  taskCopy: { flex: 1, minWidth: 0, gap: 3 },
  taskTitle: { color: colors.text, fontSize: 14, fontFamily: fonts.interMedium },
  caption: { color: colors.muted, fontSize: 12, fontFamily: fonts.inter },
  editLabel: { color: colors.accent, fontSize: 13, fontFamily: fonts.interMedium },
  error: { color: colors.danger.text, fontSize: 13, fontFamily: fonts.inter },
});

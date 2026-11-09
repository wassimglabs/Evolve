import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { LargeHeader } from '@/components/large-header';
import { ProgressRing } from '@/components/progress-ring';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Tag } from '@/components/tag';
import { Text } from '@/components/text';
import { useTodayModel } from '@/hooks/use-today-model';
import { useSetting } from '@/hooks/use-setting';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

const DAY_MODES: readonly string[] = ['Normal', 'Low energy', 'Recovery'];

function toStoredMode(label: string): 'normal' | 'low' | 'recovery' {
  if (label === 'Low energy') return 'low';
  if (label === 'Recovery') return 'recovery';
  return 'normal';
}

function modeLabel(stored: string): string {
  if (stored === 'low') return 'Low energy';
  if (stored === 'recovery') return 'Recovery';
  return 'Normal';
}

export default function TodayScreen() {
  const { overline, rows, dueSoon, progress, error } = useTodayModel();
  const [storedMode, setStoredMode] = useSetting('day_mode', 'normal');

  return (
    <Screen>
      <LargeHeader
        overline={overline}
        title="Today"
        right={
          <View style={styles.headerActions}>
            <View style={styles.progressPill}>
              <ProgressRing done={progress.done} total={progress.total} />
              <View>
                <Text style={styles.progressValue} numberOfLines={1}>{`${progress.done} of ${progress.total}`}</Text>
                <Text style={styles.progressLabel} numberOfLines={1}>
                  tasks done
                </Text>
              </View>
            </View>
            <Button
              variant="primary"
              size="compact"
              onPress={() => router.push({ pathname: '/me/data', params: { type: 'Tasks' } })}>
              Add task
            </Button>
          </View>
        }
      />
      {error ? <Text style={styles.loadError}>Could not load today: {error.message}</Text> : null}

      <Segmented
        variant="modeToday"
        options={DAY_MODES}
        value={modeLabel(storedMode)}
        onChange={(next) => setStoredMode(toStoredMode(next))}
      />

      <View style={styles.dueRow}>
        {dueSoon.map((card) => (
          <View style={styles.dueCard} key={card.id}>
            <Text style={styles.dueTitle} numberOfLines={2} ellipsizeMode="tail">
              {card.title}
            </Text>
            <Text style={styles.dueSubtitle} numberOfLines={2} ellipsizeMode="tail">
              {card.subtitle}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.timeline}>
        {rows.map((row) => {
          switch (row.kind) {
            case 'class':
              return <ClassRowView key={row.id} row={row} />;
            case 'placed':
              return <PlacedRowView key={row.id} row={row} />;
            case 'nextUp':
              return <NextUpRowView key={row.id} row={row} />;
            case 'checkin':
              return <CheckinRowView key={row.id} row={row} />;
          }
        })}
      </View>

      {rows.length === 0 ? (
        <EmptyState title="Nothing scheduled" caption="Add classes in Plan to see your day" />
      ) : null}
    </Screen>
  );
}

function ClassRowView({ row }: { row: Extract<ReturnType<typeof useTodayModel>['rows'][number], { kind: 'class' }> }) {
  return (
    <View style={styles.timelineRow}>
      <Text style={styles.gutter}>{row.time}</Text>
      <View style={[styles.block, row.past ? styles.classPast : styles.classSolid]}>
        <Text style={row.past ? styles.classTitlePast : styles.classTitle} numberOfLines={2} ellipsizeMode="tail">
          {row.title}
        </Text>
        <Tag lane={row.lane} />
      </View>
    </View>
  );
}

function PlacedRowView({ row }: { row: Extract<ReturnType<typeof useTodayModel>['rows'][number], { kind: 'placed' }> }) {
  return (
    <View style={styles.timelineRow}>
      <Text style={styles.gutter}>{row.time}</Text>
      <View style={[styles.block, styles.placed, row.done ? styles.placedDone : null]}>
        <View style={styles.placedLeft}>
          {row.done ? <Icon name="checkCircle" size={16} color={colors.accent} strokeWidth={2} /> : null}
          <Text style={row.done ? styles.placedTitleDone : styles.placedTitle} numberOfLines={2} ellipsizeMode="tail">
            {row.title}
          </Text>
        </View>
        <Tag lane={row.lane} />
      </View>
    </View>
  );
}

function NextUpRowView({ row }: { row: Extract<ReturnType<typeof useTodayModel>['rows'][number], { kind: 'nextUp' }> }) {
  return (
    <View style={[styles.timelineRow, styles.nextRow]}>
      <Text style={[styles.gutter, styles.gutterNext]}>{row.time}</Text>
      <View style={[styles.nextBlock, { backgroundColor: colors.highlight.amber.bg, borderColor: colors.highlight.amber.border }]}>
        <View style={styles.nextTop}>
          <Text style={styles.nextCaption} numberOfLines={1} ellipsizeMode="tail">
            {row.caption}
          </Text>
          <Tag lane={row.lane} />
        </View>
        <Text style={styles.nextTitle} numberOfLines={2} ellipsizeMode="tail">
          {row.title}
        </Text>
        <View style={styles.nextButtons}>
          <Button
            variant="primaryAmber"
            size="block"
            onPress={() => router.push({ pathname: '/me/data', params: { type: row.itemType === 'task' ? 'Tasks' : 'Habits' } })}>
            Manage
          </Button>
        </View>
      </View>
    </View>
  );
}

function CheckinRowView({ row }: { row: Extract<ReturnType<typeof useTodayModel>['rows'][number], { kind: 'checkin' }> }) {
  return (
    <View style={styles.timelineRow}>
      <Text style={styles.gutter}>{row.time}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/checkin')}
        style={({ pressed }) => [styles.block, styles.checkinRow, pressed && { opacity: 0.85 }]}>
        <Text style={styles.classTitle} numberOfLines={2} ellipsizeMode="tail">
          {row.title}
        </Text>
        <Icon name="chevron" size={18} color={colors.muted} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadError: { color: colors.danger.text, fontSize: 13, fontFamily: fonts.inter },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  progressValue: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: colors.muted,
    lineHeight: 14,
  },
  dueRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dueCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 2,
  },
  dueTitle: {
    fontSize: 13.5,
    fontFamily: fonts.interMedium,
    color: colors.text,
  },
  dueSubtitle: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  timeline: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  nextRow: {
    alignItems: 'flex-start',
  },
  gutter: {
    minWidth: 44,
    flexShrink: 0,
    fontSize: 12,
    fontFamily: fonts.inter,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  gutterNext: {
    color: colors.text,
    fontFamily: fonts.interSemiBold,
    paddingTop: 14,
  },
  block: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  classSolid: {
    backgroundColor: colors.surface,
  },
  classPast: {
    backgroundColor: colors.pastRow,
  },
  classTitle: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: colors.text,
    flexShrink: 1,
  },
  classTitlePast: {
    fontSize: 14,
    fontFamily: fonts.inter,
    color: colors.muted,
    flexShrink: 1,
  },
  placed: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.dashed,
  },
  placedDone: {
    borderColor: colors.border,
  },
  placedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  placedTitle: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: colors.text,
    flexShrink: 1,
  },
  placedTitleDone: {
    fontSize: 14,
    fontFamily: fonts.inter,
    color: colors.muted,
    flexShrink: 1,
  },
  nextBlock: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  nextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nextCaption: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    color: colors.lanes.career.fg,
    flexShrink: 1,
  },
  nextTitle: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
  },
  nextButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  checkinRow: {
    backgroundColor: colors.surface,
  },
});

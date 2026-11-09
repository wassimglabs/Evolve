import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { LargeHeader } from '@/components/large-header';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { Tag } from '@/components/tag';
import { Text } from '@/components/text';
import { usePlanModel } from '@/hooks/use-plan-model';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

export default function PlanScreen() {
  const { laneWeek, laneWeekFooter, deadlines, freeTimeTiles, error } = usePlanModel();

  return (
    <Screen>
      <LargeHeader
        overline="Calculated from your records"
        title="Plan"
        right={
          <Button
            variant="secondary"
            size="compact"
            icon={<Icon name="refresh" size={16} color={colors.text} strokeWidth={2} />}
            onPress={() => router.push({ pathname: '/me/data', params: { type: 'Timetable' } })}>
            Timetable
          </Button>
        }
      />
      {error ? <Text style={styles.error}>Could not load your plan: {error.message}</Text> : null}

      <Card variant="padded" style={styles.laneCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>This week by lane</Text>
          <Text style={styles.caption}>Planned hours against your minimums</Text>
        </View>
        {laneWeek.map((row) => (
          <View style={styles.laneRow} key={row.lane}>
            <View style={styles.laneTag}>
              <Tag lane={row.lane} />
            </View>
            <ProgressBar ratio={row.ratio} color={colors.lanes[row.lane].fg} style={styles.laneBar} />
            <Text
              style={styles.laneHours}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {row.hours}
            </Text>
          </View>
        ))}
        <Text style={styles.laneFooter}>{laneWeekFooter}</Text>
        <Button
          variant="secondary"
          size="block"
          onPress={() => router.push({ pathname: '/me/data', params: { type: 'Lane goals' } })}>
          Edit weekly goals
        </Button>
      </Card>

      <Card variant="padded" style={styles.deadlinesCard}>
        <View style={styles.deadlinesHeader}>
          <Text style={[styles.cardTitle, styles.deadlinesTitle]}>Deadlines</Text>
          <Button
            variant="secondary"
            size="compact"
            onPress={() => router.push({ pathname: '/task-form', params: { type: 'Tasks' } })}>
            Add task
          </Button>
        </View>
        {deadlines.map((deadline) => (
          <View style={styles.deadlineRow} key={deadline.id}>
            <View style={styles.deadlineLeft}>
              <Text style={styles.deadlineTitle}>{deadline.title}</Text>
              <Text style={styles.caption}>{deadline.subtitle}</Text>
            </View>
            {deadline.status.kind === 'placed' ? (
              <Text style={styles.deadlineStatus} numberOfLines={2}>{`Placed\n${deadline.status.slot}`}</Text>
            ) : (
              <Button
                variant="primary"
                size="compact"
                onPress={() => router.push({ pathname: '/me/data', params: { type: 'Tasks' } })}>
                Manage
              </Button>
            )}
          </View>
        ))}
        {deadlines.length === 0 ? <Text style={styles.caption}>No open tasks with deadlines.</Text> : null}
      </Card>

      <View style={styles.freeSection}>
        <View style={styles.freeHeader}>
          <Text style={styles.cardTitle}>Free time per day</Text>
          <Text style={styles.caption}>From your timetable</Text>
        </View>
        <View style={styles.tilesRow}>
          {freeTimeTiles.map((tile) => (
            <View style={styles.tile} key={tile.day}>
              <Text style={styles.tileDay} numberOfLines={1}>
                {tile.day}
              </Text>
              <Text style={styles.tileHours} numberOfLines={1}>
                {tile.hours}
              </Text>
            </View>
          ))}
        </View>
        <Button
          variant="secondary"
          size="block"
          onPress={() => router.push({ pathname: '/me/data', params: { type: 'Timetable' } })}>
          Edit timetable
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  laneCard: {
    gap: 12,
  },
  cardHeader: {
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
  },
  caption: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  error: { fontSize: 13, fontFamily: fonts.inter, color: colors.danger.text },
  laneRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  laneTag: {
    width: '18%',
    alignItems: 'center',
  },
  laneBar: {
    flex: 1,
    minWidth: 0,
  },
  laneHours: {
    width: '26%',
    textAlign: 'right',
    fontSize: 13,
    fontFamily: fonts.inter,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  laneFooter: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.lanes.career.fg,
  },
  deadlinesCard: {
    gap: 4,
  },
  deadlinesTitle: {
    paddingBottom: 0,
  },
  deadlinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 6,
  },
  deadlineRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  deadlineLeft: {
    gap: 2,
    flexShrink: 1,
  },
  deadlineTitle: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: colors.text,
  },
  deadlineStatus: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.accent,
    textAlign: 'right',
    flexShrink: 0,
  },
  freeSection: {
    gap: 8,
  },
  freeHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tile: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tileDay: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
    color: colors.text,
  },
  tileHours: {
    fontSize: 11,
    fontFamily: fonts.inter,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
});

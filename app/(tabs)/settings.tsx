import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ConnectedAccountCard } from '@/components/connected-account-card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { getTableRowCounts, wipeAllData, type TableRowCounts } from '@/db/client';
import { useGoogleAccount } from '@/integrations/google/use-google-account';
import { isoDayOfWeek, todayDateString } from '@/lib/date';
import { createDailyCheckin } from '@/repositories/daily-checkins';
import { createHabit } from '@/repositories/habits';
import { createHabitLog } from '@/repositories/habit-logs';
import { createTimetableEntry } from '@/repositories/timetable-entries';

/** Proves the DB layer end to end (Stage 5 sanity check). Removed later. */
async function insertSampleData(): Promise<void> {
  const habit = await createHabit({
    name: 'Stretch',
    category: 'body',
    min_target: 'none',
    full_target: 'full',
    preferred_time: '07:30',
  });
  await createTimetableEntry({
    title: 'Deep work',
    day_of_week: isoDayOfWeek(),
    start_min: 9 * 60,
    end_min: 11 * 60,
    location: null,
    kind: 'work',
  });
  await createHabitLog({
    habit_id: habit.id,
    date: todayDateString(),
    level: 'full',
    duration_min: 20,
    note: 'sample log',
  });
  await createDailyCheckin({
    date: todayDateString(),
    energy: 3,
    focus: 3,
    mood: 3,
    note: 'sample check-in',
  });
}

/** Formats unexpected errors for the status line. */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function SettingsScreen() {
  const [counts, setCounts] = useState<TableRowCounts | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const googleAccount = useGoogleAccount();

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await getTableRowCounts());
    } catch (error) {
      setStatus(toMessage(error));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTableRowCounts()
      .then((next) => {
        if (!cancelled) setCounts(next);
      })
      .catch((error) => {
        if (!cancelled) setStatus(toMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(
    (action: () => Promise<void>, doneMessage: string) => {
      setBusy(true);
      void (async () => {
        try {
          await action();
          setStatus(doneMessage);
        } catch (error) {
          setStatus(toMessage(error));
        } finally {
          setBusy(false);
          await loadCounts();
        }
      })();
    },
    [loadCounts],
  );

  const rows: [string, number][] = counts
    ? [
        ['timetable_entries', counts.timetable_entries],
        ['timetable_exceptions', counts.timetable_exceptions],
        ['habits', counts.habits],
        ['habit_logs', counts.habit_logs],
        ['daily_checkins', counts.daily_checkins],
        ['settings', counts.settings],
      ]
    : [];

  return (
    <Screen title="Settings">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="muted">App preferences and data tools will live here later.</Text>

        <View style={styles.accountSection}>
          <Text variant="body" style={styles.sectionTitle}>
            Connected accounts
          </Text>
          <ConnectedAccountCard
            account={googleAccount.account}
            status={googleAccount.status}
            busy={googleAccount.busy}
            error={googleAccount.error}
            notice={googleAccount.notice}
            canConnect={googleAccount.canConnect}
            configurationMessage={googleAccount.configurationMessage}
            onConnect={() => void googleAccount.connect()}
            onDisconnect={() => void googleAccount.disconnect()}
            onRetry={() => void googleAccount.reload()}
          />
        </View>

        <Card style={styles.devCard}>
          <Text variant="body" style={styles.devTitle}>
            Developer
          </Text>
          <View style={styles.devButtons}>
            <Button title="Insert sample data" disabled={busy} onPress={() => run(insertSampleData, 'Sample data inserted.')} />
            <Button title="Wipe data" variant="destructive" disabled={busy} onPress={() => run(wipeAllData, 'Data wiped.')} />
          </View>
          <View style={styles.devCounts}>
            {rows.length > 0 ? (
              rows.map(([label, value]) => (
                <Text key={label} variant="caption">
                  {label}: {value}
                </Text>
              ))
            ) : (
              <Text variant="caption">Loading counts…</Text>
            )}
          </View>
          {status ? <Text variant="caption">{status}</Text> : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 24,
  },
  accountSection: {
    gap: 8,
  },
  sectionTitle: {
    fontWeight: 600,
  },
  devCard: {
    gap: 12,
  },
  devTitle: {
    fontWeight: 600,
  },
  devButtons: {
    gap: 8,
  },
  devCounts: {
    gap: 2,
  },
});

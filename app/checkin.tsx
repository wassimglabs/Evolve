import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { haptics } from '@/lib/haptics';
import { isoDayOfWeek, longDayShortMonth, todayDateString } from '@/lib/date';
import { createDailyCheckin, listDailyCheckins, updateDailyCheckin } from '@/repositories/daily-checkins';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { type } from '@/theme/type';
import { useDbQuery } from '@/hooks/use-db-query';
import { listHabits } from '@/repositories/habits';
import { listHabitLogs } from '@/repositories/habit-logs';

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [energy, setEnergy] = useState(0);
  const [focus, setFocus] = useState(0);
  const [mood, setMood] = useState(0);
  const [note, setNote] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const canSave = energy > 0 && focus > 0 && mood > 0;
  const today = todayDateString();
  const { data: habitStatus } = useDbQuery(
    async () => {
      const [habits, logs] = await Promise.all([listHabits(), listHabitLogs()]);
      const scheduled = habits.filter(
        (habit) => habit.archived === 0 && habit.days.split(',').map(Number).includes(isoDayOfWeek()),
      );
      const loggedIds = new Set(
        logs.filter((log) => log.date === today && log.level !== 'skipped').map((log) => log.habit_id),
      );
      return { total: scheduled.length, done: scheduled.filter((habit) => loggedIds.has(habit.id)).length };
    },
    [today],
    { total: 0, done: 0 },
    ['habits', 'habit_logs'],
  );

  async function save() {
    if (!canSave) return;
    try {
      setSaveError(null);
      const date = today;
      const trimmedNote = note.trim();
      const existing = (await listDailyCheckins()).find((row) => row.date === date);
      const payload = { energy, focus, mood, note: trimmedNote ? trimmedNote : null };
      if (existing) {
        await updateDailyCheckin(existing.id, payload);
      } else {
        await createDailyCheckin({ date, ...payload });
      }
      haptics.success();
      router.back();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your check-in.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close check-in"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.close, pressed && { opacity: 0.85 }]}>
            <Icon name="close" size={20} color={colors.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.dateText} numberOfLines={1}>{`${longDayShortMonth()} · evening`}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>How was today?</Text>
          <Text style={styles.subtitle}>
            {habitStatus.done} of {habitStatus.total} scheduled habits logged today
          </Text>
        </View>
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        <View style={styles.ratings}>
          <RatingGroup label="Energy" hint="1 low · 5 high" value={energy} onChange={setEnergy} />
          <RatingGroup label="Focus" hint="1 scattered · 5 sharp" value={focus} onChange={setFocus} />
          <RatingGroup label="Mood" hint="1 rough · 5 great" value={mood} onChange={setMood} />
        </View>

        <View style={styles.noteField}>
          <Text style={styles.noteLabel}>
            Anything unusual?
            <Text style={styles.optional}> Optional</Text>
          </Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="Add context for this day"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Button
            variant="primary"
            size="block"
            disabled={!canSave}
            style={styles.saveButton}
            labelStyle={styles.saveLabel}
            onPress={() => void save()}>
            Save check-in
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.skip, pressed && { opacity: 0.85 }]}>
            <Text style={styles.skipText}>Skip tonight</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RatingGroup({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupLabel}>{label}</Text>
        <Text style={styles.groupHint}>{hint}</Text>
      </View>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = value === score;
          return (
            <Pressable
              key={score}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                haptics.selection();
                onChange(score);
              }}
              style={({ pressed }) => [
                styles.rating,
                selected && styles.ratingOn,
                pressed && { opacity: 0.85 },
              ]}>
              <Text style={selected ? styles.ratingTextOn : styles.ratingTextOff}>{score}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 13,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  header: {
    gap: 6,
  },
  title: {
    ...type.screenTitle,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  error: {
    fontSize: 13,
    fontFamily: fonts.inter,
    color: colors.danger.text,
  },
  ratings: {
    gap: 18,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  groupLabel: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
  },
  groupHint: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rating: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingOn: {
    backgroundColor: colors.accent,
  },
  ratingTextOff: {
    fontSize: 16,
    fontFamily: fonts.interMedium,
    color: colors.text,
  },
  ratingTextOn: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
    color: colors.onAccent,
  },
  noteField: {
    gap: 8,
  },
  noteLabel: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    color: colors.text,
  },
  optional: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
  noteInput: {
    minHeight: 84,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    fontFamily: fonts.inter,
    color: colors.text,
    padding: 14,
    textAlignVertical: 'top',
  },
  spacer: {
    flex: 1,
  },
  actions: {
    gap: 6,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 14,
  },
  saveLabel: {
    fontSize: 16,
  },
  skip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 13.5,
    fontFamily: fonts.inter,
    color: colors.muted,
  },
});

import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { createHabit, updateHabit } from '@/repositories/habits';
import { createTask, updateTask } from '@/repositories/tasks';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { timeToMinutes } from '@/lib/date';

export type TaskHabitKind = 'Tasks' | 'Habits';

export type TaskHabitValues = {
  title: string;
  lane: string;
  dueDate: string;
  estimate: string;
  scheduledDate: string;
  scheduledTime: string;
  category: string;
  days: number[];
  minTarget: string;
  fullTarget: string;
  preferredTime: string;
};

const LANES = ['study', 'solven', 'career', 'life'] as const;
const CATEGORIES = ['Physical', 'Intellectual', 'Professional', 'Communication'] as const;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const WEEKDAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

const EMPTY_VALUES: TaskHabitValues = {
  title: '',
  lane: 'study',
  dueDate: '',
  estimate: '',
  scheduledDate: '',
  scheduledTime: '',
  category: 'Physical',
  days: [1, 2, 3, 4, 5],
  minTarget: 'brief',
  fullTarget: 'full',
  preferredTime: '',
};

function isTime(value: string): boolean {
  return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value);
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  const [year, month, day] = value.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function TaskHabitForm({
  type,
  recordId,
  initialValues,
  embedded = false,
  onCancel,
  onSaved,
}: {
  type: TaskHabitKind;
  recordId?: string;
  initialValues?: Partial<TaskHabitValues>;
  embedded?: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<TaskHabitValues>(() => ({
    ...EMPTY_VALUES,
    ...initialValues,
    days: initialValues?.days ?? EMPTY_VALUES.days,
  }));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const title = values.title.trim();
    if (!title) {
      Alert.alert('Title required', 'Enter a name before saving.');
      return;
    }

    if (type === 'Tasks') {
      const estimate = values.estimate.trim() ? Number(values.estimate) : null;
      if (estimate !== null && (!Number.isInteger(estimate) || estimate < 1 || estimate > 1440)) {
        Alert.alert('Invalid estimate', 'Enter a whole number of minutes from 1 to 1440.');
        return;
      }
      if (values.dueDate && !isDate(values.dueDate)) {
        Alert.alert('Invalid due date', 'Use YYYY-MM-DD, for example 2026-11-09.');
        return;
      }
      if (values.scheduledDate && !isDate(values.scheduledDate)) {
        Alert.alert('Invalid scheduled date', 'Use YYYY-MM-DD, for example 2026-11-09.');
        return;
      }
      if (values.scheduledTime && !isTime(values.scheduledTime)) {
        Alert.alert('Invalid scheduled time', 'Use 24-hour time, such as 09:30.');
        return;
      }
      if (values.scheduledTime && !values.scheduledDate) {
        Alert.alert('Scheduled date required', 'Choose a scheduled date before setting a time.');
        return;
      }

      setSaving(true);
      try {
        const input = {
          title,
          lane: values.lane,
          due_date: values.dueDate || null,
          est_minutes: estimate,
          scheduled_date: values.scheduledDate || null,
          scheduled_start_min: values.scheduledTime ? timeToMinutes(values.scheduledTime) : null,
        };
        if (recordId) await updateTask(recordId, input);
        else await createTask(input);
        onSaved();
      } catch (error) {
        Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (values.days.length === 0) {
      Alert.alert('Choose days', 'Select at least one weekday for this habit.');
      return;
    }
    if (values.preferredTime && !isTime(values.preferredTime)) {
      Alert.alert('Invalid time', 'Use 24-hour time, such as 07:30.');
      return;
    }

    setSaving(true);
    try {
      const input = {
        name: title,
        category: values.category,
        days: [...values.days].sort((a, b) => a - b).join(','),
        min_target: values.minTarget,
        full_target: values.fullTarget,
        preferred_time: values.preferredTime || null,
      };
      if (recordId) await updateHabit(recordId, input);
      else await createHabit(input);
      onSaved();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: embedded ? 16 : insets.top + 8, paddingBottom: embedded ? 0 : insets.bottom },
      ]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{`${recordId ? 'Edit' : 'New'} ${type === 'Tasks' ? 'task' : 'habit'}`}</Text>
        <Pressable accessibilityRole="button" onPress={onCancel} disabled={saving}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Title" value={values.title} onChangeText={(title) => setValues({ ...values, title })} />
        {type === 'Tasks' ? (
          <>
            <ChoiceField label="Lane" options={LANES} value={values.lane} onChange={(lane) => setValues({ ...values, lane })} />
            <Field label="Due date (YYYY-MM-DD)" value={values.dueDate} onChangeText={(dueDate) => setValues({ ...values, dueDate })} placeholder="Optional" />
            <Field label="Estimate (minutes)" value={values.estimate} onChangeText={(estimate) => setValues({ ...values, estimate })} keyboardType="number-pad" placeholder="Optional" />
            <Field label="Scheduled date (YYYY-MM-DD)" value={values.scheduledDate} onChangeText={(scheduledDate) => setValues({ ...values, scheduledDate })} placeholder="Optional" />
            <Field label="Scheduled time (HH:MM)" value={values.scheduledTime} onChangeText={(scheduledTime) => setValues({ ...values, scheduledTime })} placeholder="Optional" />
          </>
        ) : (
          <>
            <ChoiceField label="Category" options={CATEGORIES} value={values.category} onChange={(category) => setValues({ ...values, category })} />
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Days</Text>
              <View style={styles.dayChoices}>
                {WEEKDAYS.map((day, index) => {
                  const weekday = WEEKDAY_NUMBERS[index];
                  const selected = values.days.includes(weekday);
                  return (
                    <Pressable
                      key={day}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() =>
                        setValues({
                          ...values,
                          days: selected ? values.days.filter((value) => value !== weekday) : [...values.days, weekday],
                        })
                      }
                      style={[styles.dayChoice, selected && styles.selectedChoice]}>
                      <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Field label="Minimum target" value={values.minTarget} onChangeText={(minTarget) => setValues({ ...values, minTarget })} placeholder="brief" />
            <Field label="Full target" value={values.fullTarget} onChangeText={(fullTarget) => setValues({ ...values, fullTarget })} placeholder="full" />
            <Field label="Preferred time (HH:MM)" value={values.preferredTime} onChangeText={(preferredTime) => setValues({ ...values, preferredTime })} placeholder="Optional" />
          </>
        )}
        <Button variant="primary" disabled={saving} onPress={() => void save()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function ChoiceField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={[styles.choice, selected && styles.selectedChoice]}>
              <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    minHeight: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { color: colors.text, fontSize: 17, fontFamily: fonts.interSemiBold },
  cancel: { color: colors.accent, fontSize: 15, fontFamily: fonts.interMedium },
  form: { padding: 20, gap: 16 },
  formField: { gap: 7 },
  fieldLabel: { color: colors.text, fontSize: 13, fontFamily: fonts.interMedium },
  input: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.inter,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  dayChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChoice: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedChoice: { backgroundColor: colors.accent },
  choiceText: { color: colors.text, fontSize: 13, fontFamily: fonts.interMedium },
  selectedChoiceText: { color: colors.onAccent },
});

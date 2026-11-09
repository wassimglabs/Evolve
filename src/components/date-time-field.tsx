import { useState } from 'react';
import { DateTimePickerAndroid, default as DateTimePicker } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/text';
import { dateOffset, minutesToTime, toDateString } from '@/lib/date';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

type PickerMode = 'date' | 'time';

type DateTimeFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  required?: boolean;
  error?: string;
};

const DATE_FORMAT_ERROR = 'Use YYYY-MM-DD.';
const TIME_FORMAT_ERROR = 'Use 24-hour time, such as 09:30.';
const TIME_SLOTS = ['07:00', '09:00', '12:00', '15:00', '18:00'] as const;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  const [year, month, day] = value.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTime(value: string): boolean {
  return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value);
}

function pickerDate(value: string, mode: PickerMode): Date {
  const now = new Date();
  if (mode === 'date' && isValidDate(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  if (mode === 'time' && isValidTime(value)) {
    const [hour, minute] = value.split(':').map(Number);
    now.setHours(hour, minute, 0, 0);
  }
  return now;
}

function formatPickerValue(date: Date, mode: PickerMode): string {
  if (mode === 'date') return toDateString(date);
  return minutesToTime(date.getHours() * 60 + date.getMinutes());
}

function DateTimeField({
  mode,
  label,
  value,
  onChangeText,
  required = false,
  error,
}: DateTimeFieldProps & { mode: PickerMode }) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerValue, setPickerValue] = useState(() => new Date());
  const [touched, setTouched] = useState(false);
  const valid = mode === 'date' ? isValidDate(value) : isValidTime(value);
  const formatError = value && !valid ? (mode === 'date' ? DATE_FORMAT_ERROR : TIME_FORMAT_ERROR) : undefined;
  const requiredError = required && touched && !value ? `${label} is required.` : undefined;
  const visibleError = error ?? formatError ?? requiredError;
  const quickOptions =
    mode === 'date'
      ? [
          { label: 'Today', value: dateOffset(new Date(), 0) },
          { label: 'Tomorrow', value: dateOffset(new Date(), 1) },
          { label: '+1 week', value: dateOffset(new Date(), 7) },
        ]
      : TIME_SLOTS.map((time) => ({ label: time, value: time }));

  const openPicker = () => {
    setTouched(true);
    const initialValue = pickerDate(value, mode);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialValue,
        mode,
        is24Hour: true,
        onValueChange: (_event, selectedDate) => {
          if (selectedDate) onChangeText(formatPickerValue(selectedDate, mode));
        },
      });
      return;
    }
    if (Platform.OS === 'ios') {
      setPickerValue(initialValue);
      setPickerVisible(true);
    }
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={(nextValue) => {
          setTouched(true);
          onChangeText(nextValue);
        }}
        onBlur={() => setTouched(true)}
        placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM'}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        style={styles.input}
      />
      <View style={styles.quickOptions}>
        {quickOptions.map((option) => (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: option.value === value }}
            onPress={() => {
              setTouched(true);
              onChangeText(option.value);
            }}
            style={[styles.chip, option.value === value && styles.selectedChip]}>
            <Text style={[styles.chipText, option.value === value && styles.selectedChipText]}>{option.label}</Text>
          </Pressable>
        ))}
        {Platform.OS !== 'web' ? (
          <Pressable accessibilityRole="button" onPress={openPicker} style={styles.pickerButton}>
            <Text style={styles.pickerButtonText}>Pick {mode}</Text>
          </Pressable>
        ) : null}
      </View>
      {visibleError ? <Text style={styles.error}>{visibleError}</Text> : null}
      {pickerVisible ? (
        <View style={styles.pickerPanel}>
          <DateTimePicker
            value={pickerValue}
            mode={mode}
            display="spinner"
            is24Hour
            onValueChange={(_event, selectedDate) => {
              if (selectedDate) setPickerValue(selectedDate);
            }}
          />
          <View style={styles.pickerActions}>
            <Pressable accessibilityRole="button" onPress={() => setPickerVisible(false)}>
              <Text style={styles.pickerButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onChangeText(formatPickerValue(pickerValue, mode));
                setTouched(true);
                setPickerVisible(false);
              }}>
              <Text style={styles.pickerButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function DateField(props: DateTimeFieldProps) {
  return <DateTimeField {...props} mode="date" />;
}

export function TimeField(props: DateTimeFieldProps) {
  return <DateTimeField {...props} mode="time" />;
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontFamily: fonts.interMedium },
  input: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.inter,
  },
  quickOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  selectedChip: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 12, fontFamily: fonts.interMedium },
  selectedChipText: { color: colors.onAccent },
  pickerButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  pickerButtonText: { color: colors.accent, fontSize: 13, fontFamily: fonts.interMedium },
  error: { color: colors.danger.text, fontSize: 12, fontFamily: fonts.inter },
  pickerPanel: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingVertical: 8,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
});

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LargeHeader } from '@/components/large-header';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Text } from '@/components/text';
import { useDbQuery } from '@/hooks/use-db-query';
import { listHabits, createHabit, updateHabit, deleteHabit } from '@/repositories/habits';
import { listTasks, createTask, updateTask, deleteTask } from '@/repositories/tasks';
import {
  listTimetableEntries,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from '@/repositories/timetable-entries';
import {
  listTimetableExceptions,
  createTimetableException,
  updateTimetableException,
  deleteTimetableException,
} from '@/repositories/timetable-exceptions';
import type { ContentIdea, DailyCheckin, Habit, HabitLog, Job, Task, TimetableEntry, TimetableException } from '@/db/types';
import { minutesToTime, timeToMinutes, todayDateString } from '@/lib/date';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { createHabitLog, listHabitLogs, updateHabitLog, deleteHabitLog } from '@/repositories/habit-logs';
import { createJob, listJobs, updateJob, deleteJob } from '@/repositories/jobs';
import { createContentIdea, listContentIdeas, updateContentIdea, deleteContentIdea } from '@/repositories/content-ideas';
import { createDailyCheckin, listDailyCheckins, updateDailyCheckin, deleteDailyCheckin } from '@/repositories/daily-checkins';
import { listLanes, updateLane } from '@/repositories/lanes';

const DATA_TYPES = ['Tasks', 'Habits', 'Habit logs', 'Timetable', 'Exceptions', 'Jobs', 'Ideas', 'Check-ins', 'Lane goals'] as const;
const LANES = ['study', 'solven', 'career', 'life'] as const;
const CATEGORIES = ['Physical', 'Intellectual', 'Professional', 'Communication'] as const;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const WEEKDAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

type DataType = (typeof DATA_TYPES)[number];
type DataRows = {
  tasks: Task[];
  habits: Habit[];
  timetable: TimetableEntry[];
  exceptions: TimetableException[];
  logs: HabitLog[];
  jobs: Job[];
  ideas: ContentIdea[];
  checkins: DailyCheckin[];
  laneGoals: Awaited<ReturnType<typeof listLanes>>;
};
type FormState = {
  type: DataType;
  id?: string;
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
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  entryKind: string;
  company: string;
  link: string;
  status: string;
  body: string;
  date: string;
  energy: string;
  focus: string;
  mood: string;
  note: string;
  weeklyMinutes: string;
  habitId: string;
  logLevel: string;
  duration: string;
  exceptionEntry: string;
};

const EMPTY_ROWS: DataRows = {
  tasks: [],
  habits: [],
  timetable: [],
  exceptions: [],
  logs: [],
  jobs: [],
  ideas: [],
  checkins: [],
  laneGoals: [],
};

function isTime(value: string): boolean {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match !== null;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  const [year, month, day] = value.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function newForm(type: DataType): FormState {
  return {
    type,
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
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    entryKind: 'class',
    company: '',
    link: '',
    status: 'saved',
    body: '',
    date: todayDateString(),
    energy: '3',
    focus: '3',
    mood: '3',
    note: '',
    weeklyMinutes: '120',
    habitId: '',
    logLevel: 'full',
    duration: '',
    exceptionEntry: '',
  };
}

function itemLabel(type: DataType): string {
  if (type === 'Timetable') return 'timetable entry';
  if (type === 'Exceptions') return 'schedule exception';
  if (type === 'Check-ins') return 'check-in';
  if (type === 'Lane goals') return 'lane goal';
  if (type === 'Habit logs') return 'habit log';
  return type.slice(0, -1).toLowerCase();
}

export default function DataScreen() {
  const { type: requestedType, lane: requestedLane } = useLocalSearchParams<{ type?: string; lane?: string }>();
  const initialType = DATA_TYPES.find((option) => option.toLowerCase() === requestedType?.toLowerCase()) ?? 'Tasks';
  const [type, setType] = useState<DataType>(initialType);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const { data, loading, error } = useDbQuery(
    async () => {
      const [tasks, habits, timetable, exceptions, logs, jobs, ideas, checkins, laneGoals] = await Promise.all([
        listTasks(),
        listHabits(),
        listTimetableEntries(),
        listTimetableExceptions(),
        listHabitLogs(),
        listJobs(),
        listContentIdeas(),
        listDailyCheckins(),
        listLanes(),
      ]);
      return { tasks, habits, timetable, exceptions, logs, jobs, ideas, checkins, laneGoals };
    },
    [],
    EMPTY_ROWS,
    ['tasks', 'habits', 'timetable', 'habit_logs', 'jobs', 'ideas', 'checkins', 'lanes'],
  );

  const openNew = () => setForm({
    ...newForm(type),
    ...(type === 'Tasks' && requestedLane && LANES.includes(requestedLane as (typeof LANES)[number]) ? { lane: requestedLane } : {}),
    ...(type === 'Habit logs' ? { habitId: data.habits.find((habit) => habit.archived === 0)?.id ?? '' } : {}),
  });
  const openTask = (task: Task) =>
    setForm({
      ...newForm('Tasks'),
      id: task.id,
      title: task.title,
      lane: task.lane,
      dueDate: task.due_date ?? '',
      estimate: task.est_minutes === null ? '' : String(task.est_minutes),
      scheduledDate: task.scheduled_date ?? '',
      scheduledTime: task.scheduled_start_min === null ? '' : minutesToTime(task.scheduled_start_min),
    });
  const openHabit = (habit: Habit) =>
    setForm({
      ...newForm('Habits'),
      id: habit.id,
      title: habit.name,
      category: habit.category,
      days: habit.days.split(',').map(Number).filter((day) => day >= 1 && day <= 7),
      minTarget: habit.min_target,
      fullTarget: habit.full_target,
      preferredTime: habit.preferred_time ?? '',
    });
  const openTimetableEntry = (entry: TimetableEntry) =>
    setForm({
      ...newForm('Timetable'),
      id: entry.id,
      title: entry.title,
      dayOfWeek: entry.day_of_week,
      startTime: minutesToTime(entry.start_min),
      endTime: minutesToTime(entry.end_min),
      location: entry.location ?? '',
      entryKind: entry.kind,
    });
  const openException = (exception: TimetableException) =>
    setForm({
      ...newForm('Exceptions'),
      id: exception.id,
      date: exception.date,
      exceptionEntry: exception.entry_id ?? '',
      note: exception.note ?? '',
    });
  const openJob = (job: Job) =>
    setForm({
      ...newForm('Jobs'),
      id: job.id,
      title: job.title,
      company: job.company,
      link: job.link ?? '',
      status: job.status,
      note: job.notes ?? '',
    });
  const openIdea = (idea: ContentIdea) =>
    setForm({
      ...newForm('Ideas'),
      id: idea.id,
      title: idea.title,
      body: idea.body ?? '',
      status: idea.status,
    });
  const openCheckin = (checkin: DailyCheckin) =>
    setForm({
      ...newForm('Check-ins'),
      id: checkin.id,
      date: checkin.date,
      energy: String(checkin.energy),
      focus: String(checkin.focus),
      mood: String(checkin.mood),
      note: checkin.note ?? '',
    });
  const openHabitLog = (log: HabitLog) =>
    setForm({
      ...newForm('Habit logs'),
      id: log.id,
      habitId: log.habit_id,
      date: log.date,
      logLevel: log.level,
      duration: log.duration_min === null ? '' : String(log.duration_min),
      note: log.note ?? '',
    });
  const openLaneGoal = (lane: DataRows['laneGoals'][number]) =>
    setForm({
      ...newForm('Lane goals'),
      id: lane.id,
      lane: lane.id,
      weeklyMinutes: String(lane.weekly_min_minutes),
    });

  const save = async () => {
    if (!form) return;
    const title = form.title.trim();
    if (form.type !== 'Lane goals' && form.type !== 'Check-ins' && form.type !== 'Habit logs' && form.type !== 'Exceptions' && !title) {
      Alert.alert('Title required', 'Enter a name before saving.');
      return;
    }

    if (form.type === 'Tasks') {
      const estimate = form.estimate.trim() ? Number(form.estimate) : null;
      if (estimate !== null && (!Number.isInteger(estimate) || estimate < 1 || estimate > 1440)) {
        Alert.alert('Invalid estimate', 'Enter a whole number of minutes from 1 to 1440.');
        return;
      }
      if (form.dueDate && !isDate(form.dueDate)) {
        Alert.alert('Invalid due date', 'Use YYYY-MM-DD, for example 2026-11-09.');
        return;
      }
      if (form.scheduledDate && !isDate(form.scheduledDate)) {
        Alert.alert('Invalid scheduled date', 'Use YYYY-MM-DD, for example 2026-11-09.');
        return;
      }
      if (form.scheduledTime && !isTime(form.scheduledTime)) {
        Alert.alert('Invalid scheduled time', 'Use 24-hour time, such as 09:30.');
        return;
      }
      if (form.scheduledTime && !form.scheduledDate) {
        Alert.alert('Scheduled date required', 'Choose a scheduled date before setting a time.');
        return;
      }
      const input = {
        title,
        lane: form.lane,
        due_date: form.dueDate || null,
        est_minutes: estimate,
        scheduled_date: form.scheduledDate || null,
        scheduled_start_min: form.scheduledTime ? timeToMinutes(form.scheduledTime) : null,
      };
      await persist(() => (form.id ? updateTask(form.id, input) : createTask(input)));
      return;
    }

    if (form.type === 'Habits') {
      if (form.days.length === 0) {
        Alert.alert('Choose days', 'Select at least one weekday for this habit.');
        return;
      }
      if (form.preferredTime && !isTime(form.preferredTime)) {
        Alert.alert('Invalid time', 'Use 24-hour time, such as 07:30.');
        return;
      }
      const input = {
        name: title,
        category: form.category,
        days: [...form.days].sort((a, b) => a - b).join(','),
        min_target: form.minTarget,
        full_target: form.fullTarget,
        preferred_time: form.preferredTime || null,
      };
      await persist(() => (form.id ? updateHabit(form.id, input) : createHabit(input)));
      return;
    }

    if (form.type === 'Jobs') {
      if (!form.company.trim()) {
        Alert.alert('Company required', 'Enter the company name.');
        return;
      }
      if (form.link.trim() && !/^https?:\/\/\S+$/i.test(form.link.trim())) {
        Alert.alert('Invalid link', 'Enter a full URL starting with http:// or https://.');
        return;
      }
      const input = {
        title,
        company: form.company.trim(),
        link: form.link.trim() || null,
        status: form.status,
        notes: form.note.trim() || null,
      };
      await persist(() => (form.id ? updateJob(form.id, input) : createJob(input)));
      return;
    }

    if (form.type === 'Exceptions') {
      if (!isDate(form.date)) {
        Alert.alert('Invalid date', 'Use YYYY-MM-DD, for example 2026-11-09.');
        return;
      }
      if (form.exceptionEntry && !data.timetable.some((entry) => entry.id === form.exceptionEntry)) {
        Alert.alert('Choose a timetable entry', 'Select a saved timetable entry or apply the cancellation to the whole day.');
        return;
      }
      const input = {
        date: form.date,
        entry_id: form.exceptionEntry || null,
        type: 'cancel',
        title: null,
        start_min: null,
        end_min: null,
        note: form.note.trim() || null,
      };
      await persist(() => (form.id ? updateTimetableException(form.id, input) : createTimetableException(input)));
      return;
    }

    if (form.type === 'Ideas') {
      const input = { title, body: form.body.trim() || null, status: form.status };
      await persist(() => (form.id ? updateContentIdea(form.id, input) : createContentIdea(input)));
      return;
    }

    if (form.type === 'Check-ins') {
      const ratings = [Number(form.energy), Number(form.focus), Number(form.mood)];
      if (!isDate(form.date) || ratings.some((value) => !Number.isInteger(value) || value < 1 || value > 5)) {
        Alert.alert('Check-in values required', 'Use a valid YYYY-MM-DD date and ratings from 1 to 5.');
        return;
      }
      const input = {
        date: form.date,
        energy: ratings[0] ?? 3,
        focus: ratings[1] ?? 3,
        mood: ratings[2] ?? 3,
        note: form.note.trim() || null,
      };
      await persist(() => (form.id ? updateDailyCheckin(form.id, input) : createDailyCheckin(input)));
      return;
    }

    if (form.type === 'Habit logs') {
      const duration = form.duration.trim() ? Number(form.duration) : null;
      if (!data.habits.some((habit) => habit.id === form.habitId)) {
        Alert.alert('Choose a habit', 'Select a saved habit for this log.');
        return;
      }
      if (!isDate(form.date) || !['skipped', 'min', 'full'].includes(form.logLevel)) {
        Alert.alert('Invalid habit log', 'Use a valid date and choose skipped, minimum, or full.');
        return;
      }
      if (duration !== null && (!Number.isInteger(duration) || duration < 0 || duration > 1440)) {
        Alert.alert('Invalid duration', 'Enter a whole number of minutes from 0 to 1440.');
        return;
      }
      if (data.logs.some((log) => log.id !== form.id && log.habit_id === form.habitId && log.date === form.date)) {
        Alert.alert('Log already exists', 'Edit the existing log for this habit and date instead of creating a duplicate.');
        return;
      }
      const input = {
        habit_id: form.habitId,
        date: form.date,
        level: form.logLevel,
        duration_min: duration,
        note: form.note.trim() || null,
      };
      await persist(() => (form.id ? updateHabitLog(form.id, input) : createHabitLog(input)));
      return;
    }

    if (form.type === 'Lane goals') {
      const weeklyMinutes = Number(form.weeklyMinutes);
      if (!Number.isInteger(weeklyMinutes) || weeklyMinutes < 0 || weeklyMinutes > 10080) {
        Alert.alert('Invalid weekly goal', 'Enter a whole number from 0 to 10080 minutes.');
        return;
      }
      await persist(() => updateLane(form.lane, { weekly_min_minutes: weeklyMinutes }));
      return;
    }

    if (!isTime(form.startTime) || !isTime(form.endTime)) {
      Alert.alert('Invalid time', 'Use 24-hour time, such as 09:00.');
      return;
    }
    const start = timeToMinutes(form.startTime);
    const end = timeToMinutes(form.endTime);
    if (end <= start) {
      Alert.alert('Invalid time range', 'The end time must be after the start time.');
      return;
    }
    const input = {
      title,
      day_of_week: form.dayOfWeek,
      start_min: start,
      end_min: end,
      location: form.location.trim() || null,
      kind: form.entryKind.trim() || 'class',
    };
    await persist(() => (form.id ? updateTimetableEntry(form.id, input) : createTimetableEntry(input)));
  };

  const persist = async (operation: () => Promise<unknown>) => {
    setSaving(true);
    try {
      await operation();
      setForm(null);
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (label: string, operation: () => Promise<void>, message = 'This action cannot be undone.') => {
    Alert.alert(`Delete ${label}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void persist(operation);
        },
      },
    ]);
  };

  const visibleCount =
    type === 'Tasks'
      ? data.tasks.length
      : type === 'Habits'
        ? data.habits.filter((habit) => habit.archived === 0).length
        : type === 'Timetable'
          ? data.timetable.length
          : type === 'Exceptions'
            ? data.exceptions.length
          : type === 'Jobs'
            ? data.jobs.length
            : type === 'Ideas'
              ? data.ideas.length
              : type === 'Check-ins'
                ? data.checkins.length
                : type === 'Habit logs'
                  ? data.logs.length
                  : data.laneGoals.length;

  return (
    <Screen>
      <LargeHeader
        overline="Stored on this device"
        title="Manage data"
        onBack={() => router.back()}
        right={type !== 'Lane goals' ? (
          <Button variant="primary" size="compact" onPress={openNew}>
            Add
          </Button>
        ) : null}
      />
      <Segmented variant="chips" options={DATA_TYPES} value={type} onChange={(value) => setType(value as DataType)} />

      {loading ? <Text style={styles.muted}>Loading your data…</Text> : null}
      {error ? <Text style={styles.error}>Could not load local data: {error.message}</Text> : null}
      {type === 'Tasks'
        ? data.tasks.map((task) => (
            <Card variant="padded" style={styles.record} key={task.id}>
              <Pressable onPress={() => openTask(task)} accessibilityRole="button">
                <Text style={styles.recordTitle}>{task.title}</Text>
                <Text style={styles.muted}>
                  {task.lane} · {task.due_date ?? 'No due date'}
                  {task.est_minutes ? ` · ${task.est_minutes} min` : ''}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                <Button variant="secondary" size="compact" onPress={() => openTask(task)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="compact"
                  onPress={() => void persist(() => updateTask(task.id, { done: task.done ? 0 : 1 }))}>
                  {task.done ? 'Reopen' : 'Complete'}
                </Button>
                <Button
                  variant="danger"
                  size="compact"
                  onPress={() => confirmDelete(task.title, () => deleteTask(task.id))}>
                  Delete
                </Button>
              </View>
            </Card>
          ))
        : null}
      {type === 'Habits'
        ? data.habits.filter((habit) => habit.archived === 0).map((habit) => (
            <Card variant="padded" style={styles.record} key={habit.id}>
              <Pressable onPress={() => openHabit(habit)} accessibilityRole="button">
                <Text style={styles.recordTitle}>{habit.name}</Text>
                <Text style={styles.muted}>
                  {habit.category} · {habit.days.split(',').map((day) => WEEKDAYS[Number(day) - 1]).join(', ')}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                  <Button variant="secondary" size="compact" onPress={() => openHabit(habit)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="compact"
                    onPress={() =>
                      confirmDelete(
                        habit.name,
                        () => deleteHabit(habit.id),
                        'Deleting this habit also permanently deletes its habit logs.',
                      )
                    }>
                    Delete
                  </Button>
                  {data.logs.some((log) => log.habit_id === habit.id && log.date === todayDateString()) ? (
                    <Text style={styles.muted}>Logged today</Text>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="compact"
                        disabled={saving}
                        onPress={() =>
                          void persist(() =>
                            createHabitLog({
                              habit_id: habit.id,
                              date: todayDateString(),
                              level: 'min',
                              duration_min: null,
                              note: null,
                            }),
                          )
                        }>
                        Log min
                      </Button>
                      <Button
                        variant="secondary"
                        size="compact"
                        disabled={saving}
                        onPress={() =>
                          void persist(() =>
                            createHabitLog({
                              habit_id: habit.id,
                              date: todayDateString(),
                              level: 'full',
                              duration_min: null,
                              note: null,
                            }),
                          )
                        }>
                        Log full
                      </Button>
                      <Button
                        variant="secondary"
                        size="compact"
                        disabled={saving}
                        onPress={() =>
                          void persist(() =>
                            createHabitLog({
                              habit_id: habit.id,
                              date: todayDateString(),
                              level: 'skipped',
                              duration_min: null,
                              note: null,
                            }),
                          )
                        }>
                        Skip today
                      </Button>
                    </>
                  )}
              </View>
            </Card>
          ))
        : null}
      {type === 'Habit logs'
        ? data.logs.map((log) => {
            const habitName = data.habits.find((habit) => habit.id === log.habit_id)?.name ?? 'Deleted habit';
            return (
              <Card variant="padded" style={styles.record} key={log.id}>
                <Pressable onPress={() => openHabitLog(log)} accessibilityRole="button">
                  <Text style={styles.recordTitle}>{habitName}</Text>
                  <Text style={styles.muted}>{log.date} · {log.level}{log.duration_min !== null ? ` · ${log.duration_min} min` : ''}</Text>
                  {log.note ? <Text style={styles.muted}>{log.note}</Text> : null}
                </Pressable>
                <View style={styles.actions}>
                  <Button variant="secondary" size="compact" onPress={() => openHabitLog(log)}>Edit</Button>
                  <Button variant="danger" size="compact" onPress={() => confirmDelete(`${habitName} log`, () => deleteHabitLog(log.id))}>Delete</Button>
                </View>
              </Card>
            );
          })
        : null}
      {type === 'Timetable'
        ? data.timetable.map((entry) => (
            <Card variant="padded" style={styles.record} key={entry.id}>
              <Pressable onPress={() => openTimetableEntry(entry)} accessibilityRole="button">
                <Text style={styles.recordTitle}>{entry.title}</Text>
                <Text style={styles.muted}>
                  {WEEKDAYS[entry.day_of_week - 1]} · {minutesToTime(entry.start_min)}–{minutesToTime(entry.end_min)}
                  {entry.location ? ` · ${entry.location}` : ''}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                <Button variant="secondary" size="compact" onPress={() => openTimetableEntry(entry)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="compact"
                  onPress={() => confirmDelete(entry.title, () => deleteTimetableEntry(entry.id))}>
                  Delete
                </Button>
              </View>
            </Card>
          ))
        : null}
      {type === 'Exceptions'
        ? data.exceptions.map((exception) => {
            const entryTitle = exception.entry_id
              ? data.timetable.find((entry) => entry.id === exception.entry_id)?.title ?? 'Deleted timetable entry'
              : 'All timetable entries';
            return (
              <Card variant="padded" style={styles.record} key={exception.id}>
                <Pressable onPress={() => openException(exception)} accessibilityRole="button">
                  <Text style={styles.recordTitle}>{exception.date}</Text>
                  <Text style={styles.muted}>Cancelled: {entryTitle}</Text>
                  {exception.note ? <Text style={styles.muted}>{exception.note}</Text> : null}
                </Pressable>
                <View style={styles.actions}>
                  <Button variant="secondary" size="compact" onPress={() => openException(exception)}>Edit</Button>
                  <Button variant="danger" size="compact" onPress={() => confirmDelete(`cancellation for ${exception.date}`, () => deleteTimetableException(exception.id))}>Delete</Button>
                </View>
              </Card>
            );
          })
        : null}
      {type === 'Jobs'
        ? data.jobs.map((job) => (
            <Card variant="padded" style={styles.record} key={job.id}>
              <Pressable onPress={() => openJob(job)} accessibilityRole="button">
                <Text style={styles.recordTitle}>{job.title}</Text>
                <Text style={styles.muted}>{job.company} · {job.status}</Text>
                {job.link ? <Text style={styles.muted} numberOfLines={1}>{job.link}</Text> : null}
              </Pressable>
              <View style={styles.actions}>
                <Button variant="secondary" size="compact" onPress={() => openJob(job)}>Edit</Button>
                <Button variant="danger" size="compact" onPress={() => confirmDelete(job.title, () => deleteJob(job.id))}>Delete</Button>
              </View>
            </Card>
          ))
        : null}
      {type === 'Ideas'
        ? data.ideas.map((idea) => (
            <Card variant="padded" style={styles.record} key={idea.id}>
              <Pressable onPress={() => openIdea(idea)} accessibilityRole="button">
                <Text style={styles.recordTitle}>{idea.title}</Text>
                <Text style={styles.muted}>{idea.status}</Text>
                {idea.body ? <Text style={styles.muted}>{idea.body}</Text> : null}
              </Pressable>
              <View style={styles.actions}>
                <Button variant="secondary" size="compact" onPress={() => openIdea(idea)}>Edit</Button>
                <Button variant="danger" size="compact" onPress={() => confirmDelete(idea.title, () => deleteContentIdea(idea.id))}>Delete</Button>
              </View>
            </Card>
          ))
        : null}
      {type === 'Check-ins'
        ? data.checkins.map((checkin) => (
            <Card variant="padded" style={styles.record} key={checkin.id}>
              <Pressable onPress={() => openCheckin(checkin)} accessibilityRole="button">
                <Text style={styles.recordTitle}>{checkin.date}</Text>
                <Text style={styles.muted}>Energy {checkin.energy} · Focus {checkin.focus} · Mood {checkin.mood}</Text>
                {checkin.note ? <Text style={styles.muted}>{checkin.note}</Text> : null}
              </Pressable>
              <View style={styles.actions}>
                <Button variant="secondary" size="compact" onPress={() => openCheckin(checkin)}>Edit</Button>
                <Button variant="danger" size="compact" onPress={() => confirmDelete(checkin.date, () => deleteDailyCheckin(checkin.id))}>Delete</Button>
              </View>
            </Card>
          ))
        : null}
      {type === 'Lane goals'
        ? data.laneGoals.map((lane) => (
            <Card variant="padded" style={styles.record} key={lane.id}>
              <Pressable onPress={() => openLaneGoal(lane)} accessibilityRole="button">
                <Text style={styles.recordTitle}>{lane.id}</Text>
                <Text style={styles.muted}>{lane.weekly_min_minutes} minutes per week</Text>
              </Pressable>
              <Button variant="secondary" size="compact" onPress={() => openLaneGoal(lane)}>Edit goal</Button>
            </Card>
          ))
        : null}

      {!loading && !error && visibleCount === 0 && type !== 'Lane goals' ? (
        <EmptyState
          title={type === 'Timetable' ? 'No timetable entries yet' : type === 'Exceptions' ? 'No schedule exceptions yet' : type === 'Habit logs' && !data.habits.some((habit) => habit.archived === 0) ? 'No habits to log yet' : `No ${type.toLowerCase()} yet`}
          caption={type === 'Habit logs' && !data.habits.some((habit) => habit.archived === 0) ? 'Create a habit first, then add its logs.' : type === 'Exceptions' ? 'Cancel a recurring timetable entry for a specific date.' : 'Add one here to start using your own data.'}
          action={
            type === 'Habit logs' && !data.habits.some((habit) => habit.archived === 0)
              ? { label: 'Manage habits', onPress: () => setType('Habits') }
              : { label: `Add ${itemLabel(type)}`, onPress: openNew }
          }
        />
      ) : null}

      <Modal visible={form !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setForm(null)}>
        {form ? (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{form.id ? `Edit ${itemLabel(form.type)}` : `New ${itemLabel(form.type)}`}</Text>
              <Pressable accessibilityRole="button" onPress={() => setForm(null)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              {form.type !== 'Lane goals' && form.type !== 'Check-ins' && form.type !== 'Habit logs' && form.type !== 'Exceptions' ? (
                <Field label="Title" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
              ) : null}
              {form.type === 'Tasks' ? (
                <>
                  <ChoiceField label="Lane" options={LANES} value={form.lane} onChange={(lane) => setForm({ ...form, lane })} />
                  <Field label="Due date (YYYY-MM-DD)" value={form.dueDate} onChangeText={(dueDate) => setForm({ ...form, dueDate })} placeholder="Optional" />
                  <Field label="Estimate (minutes)" value={form.estimate} onChangeText={(estimate) => setForm({ ...form, estimate })} keyboardType="number-pad" placeholder="Optional" />
                  <Field label="Scheduled date (YYYY-MM-DD)" value={form.scheduledDate} onChangeText={(scheduledDate) => setForm({ ...form, scheduledDate })} placeholder="Optional" />
                  <Field label="Scheduled time (HH:MM)" value={form.scheduledTime} onChangeText={(scheduledTime) => setForm({ ...form, scheduledTime })} placeholder="Optional" />
                </>
              ) : null}
              {form.type === 'Habits' ? (
                <>
                  <ChoiceField label="Category" options={CATEGORIES} value={form.category} onChange={(category) => setForm({ ...form, category })} />
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Days</Text>
                    <View style={styles.dayChoices}>
                      {WEEKDAYS.map((day, index) => {
                        const weekday = WEEKDAY_NUMBERS[index];
                        const selected = form.days.includes(weekday);
                        return (
                          <Pressable
                            key={day}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() => setForm({ ...form, days: selected ? form.days.filter((value) => value !== weekday) : [...form.days, weekday] })}
                            style={[styles.dayChoice, selected && styles.selectedChoice]}>
                            <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{day}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  <Field label="Minimum target" value={form.minTarget} onChangeText={(minTarget) => setForm({ ...form, minTarget })} placeholder="brief" />
                  <Field label="Full target" value={form.fullTarget} onChangeText={(fullTarget) => setForm({ ...form, fullTarget })} placeholder="full" />
                  <Field label="Preferred time (HH:MM)" value={form.preferredTime} onChangeText={(preferredTime) => setForm({ ...form, preferredTime })} placeholder="Optional" />
                </>
              ) : null}
              {form.type === 'Jobs' ? (
                <>
                  <Field label="Company" value={form.company} onChangeText={(company) => setForm({ ...form, company })} />
                  <Field label="Link" value={form.link} onChangeText={(link) => setForm({ ...form, link })} placeholder="Optional URL" />
                  <ChoiceField
                    label="Status"
                    options={['saved', 'applied', 'interview', 'offer', 'rejected']}
                    value={form.status}
                    onChange={(status) => setForm({ ...form, status })}
                  />
                  <Field label="Notes" value={form.note} onChangeText={(note) => setForm({ ...form, note })} placeholder="Optional" />
                </>
              ) : null}
              {form.type === 'Ideas' ? (
                <>
                  <ChoiceField
                    label="Status"
                    options={['idea', 'drafted', 'posted']}
                    value={form.status}
                    onChange={(status) => setForm({ ...form, status })}
                  />
                  <Field label="Details" value={form.body} onChangeText={(body) => setForm({ ...form, body })} placeholder="Optional" multiline />
                </>
              ) : null}
              {form.type === 'Check-ins' ? (
                <>
                  <Field label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(date) => setForm({ ...form, date })} />
                  <Field label="Energy (1–5)" value={form.energy} onChangeText={(energy) => setForm({ ...form, energy })} keyboardType="number-pad" />
                  <Field label="Focus (1–5)" value={form.focus} onChangeText={(focus) => setForm({ ...form, focus })} keyboardType="number-pad" />
                  <Field label="Mood (1–5)" value={form.mood} onChangeText={(mood) => setForm({ ...form, mood })} keyboardType="number-pad" />
                  <Field label="Note" value={form.note} onChangeText={(note) => setForm({ ...form, note })} placeholder="Optional" multiline />
                </>
              ) : null}
              {form.type === 'Habit logs' ? (
                <>
                  <ChoiceField
                    label="Habit"
                    options={data.habits.filter((habit) => habit.archived === 0).map((habit) => habit.id)}
                    labels={Object.fromEntries(data.habits.map((habit) => [habit.id, habit.name]))}
                    value={form.habitId}
                    onChange={(habitId) => setForm({ ...form, habitId })}
                  />
                  <Field label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(date) => setForm({ ...form, date })} />
                  <ChoiceField
                    label="Level"
                    options={['skipped', 'min', 'full']}
                    value={form.logLevel}
                    onChange={(logLevel) => setForm({ ...form, logLevel })}
                  />
                  <Field label="Duration (minutes)" value={form.duration} onChangeText={(duration) => setForm({ ...form, duration })} keyboardType="number-pad" placeholder="Optional" />
                  <Field label="Note" value={form.note} onChangeText={(note) => setForm({ ...form, note })} placeholder="Optional" multiline />
                </>
              ) : null}
              {form.type === 'Lane goals' ? (
                <>
                  <ChoiceField
                    label="Lane"
                    options={LANES}
                    value={form.lane}
                    onChange={(lane) => setForm({ ...form, lane })}
                  />
                  <Field
                    label="Weekly minimum (minutes)"
                    value={form.weeklyMinutes}
                    onChangeText={(weeklyMinutes) => setForm({ ...form, weeklyMinutes })}
                    keyboardType="number-pad"
                  />
                </>
              ) : null}
              {form.type === 'Timetable' ? (
                <>
                  <ChoiceField
                    label="Weekday"
                    options={WEEKDAYS}
                    value={WEEKDAYS[form.dayOfWeek - 1]}
                    onChange={(day) => setForm({ ...form, dayOfWeek: WEEKDAYS.indexOf(day as (typeof WEEKDAYS)[number]) + 1 })}
                  />
                  <Field label="Start time (HH:MM)" value={form.startTime} onChangeText={(startTime) => setForm({ ...form, startTime })} />
                  <Field label="End time (HH:MM)" value={form.endTime} onChangeText={(endTime) => setForm({ ...form, endTime })} />
                  <Field label="Location" value={form.location} onChangeText={(location) => setForm({ ...form, location })} placeholder="Optional" />
                  <Field label="Type" value={form.entryKind} onChangeText={(entryKind) => setForm({ ...form, entryKind })} placeholder="class, work, personal" />
                </>
              ) : null}
              {form.type === 'Exceptions' ? (
                <>
                  <Field label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(date) => setForm({ ...form, date })} />
                  <ChoiceField
                    label="What to cancel"
                    options={['', ...data.timetable.map((entry) => entry.id)]}
                    labels={{
                      '': 'All timetable entries',
                      ...Object.fromEntries(data.timetable.map((entry) => [entry.id, entry.title])),
                    }}
                    value={form.exceptionEntry}
                    onChange={(exceptionEntry) => setForm({ ...form, exceptionEntry })}
                  />
                  <Field label="Note" value={form.note} onChangeText={(note) => setForm({ ...form, note })} placeholder="Optional" multiline />
                </>
              ) : null}
              <Button variant="primary" disabled={saving} onPress={() => void save()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
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
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function ChoiceField({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  labels?: Record<string, string>;
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
              <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{labels?.[option] ?? option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  record: { gap: 12 },
  recordTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.interSemiBold },
  muted: { color: colors.muted, fontSize: 12.5, fontFamily: fonts.inter },
  error: { color: colors.danger.text, fontSize: 13, fontFamily: fonts.inter },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  modal: { flex: 1, backgroundColor: colors.bg, paddingTop: 16 },
  modalHeader: {
    minHeight: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontFamily: fonts.interSemiBold },
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
  multilineInput: { minHeight: 100, paddingTop: 12 },
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

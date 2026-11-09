/** Row shapes for the SQLite schema (migration 001). These are the types
 * repositories read/write; column names match the tables exactly. */

export type TimetableEntry = {
  id: string;
  title: string;
  /** 1 = Monday ... 7 = Sunday */
  day_of_week: number;
  /** Minutes from midnight. */
  start_min: number;
  end_min: number;
  location: string | null;
  /** e.g. 'class' | 'work' | 'personal'. Free-form for now. */
  kind: string;
  created_at: string;
};

export type TimetableException = {
  id: string;
  /** Local 'YYYY-MM-DD'. */
  date: string;
  /** Null when the exception applies to the whole day/cancellation of all? Convention: null = day-level. */
  entry_id: string | null;
  /** e.g. 'cancel' | 'move' | 'edit'. Free-form for now. */
  type: string;
  title: string | null;
  start_min: number | null;
  end_min: number | null;
  note: string | null;
  created_at: string;
};

export type Habit = {
  id: string;
  name: string;
  category: string;
  /** Comma-separated ISO weekdays the habit is scheduled on ('1,2,3,4,5,6,7'; 1 = Monday). */
  days: string;
  /** e.g. 'none' | 'brief' | 'maintain'. Free-form for now. */
  min_target: string;
  /** e.g. 'full' | 'custom:<label>'. Free-form for now. */
  full_target: string;
  /** 'HH:MM' hint or null. */
  preferred_time: string | null;
  /** SQLite boolean: 0 = active, 1 = archived. */
  archived: 0 | 1;
  created_at: string;
};

/** Insert-only: logs are never mutated, only appended. */
export type HabitLog = {
  id: string;
  habit_id: string;
  /** Local 'YYYY-MM-DD'. */
  date: string;
  /** e.g. 'skipped' | 'min' | 'full'. Free-form for now. */
  level: string;
  duration_min: number | null;
  note: string | null;
  created_at: string;
};

export type DailyCheckin = {
  id: string;
  /** Local 'YYYY-MM-DD'; unique per day. */
  date: string;
  /** 1-5 ordinal scales for now. */
  energy: number;
  focus: number;
  mood: number;
  note: string | null;
  created_at: string;
};

export type SettingRow = {
  key: string;
  value: string;
};

export type ConnectedAccountStatus = 'connected' | 'reauth_required';

export type ConnectedAccount = {
  provider: string;
  account_id: string;
  email: string;
  display_name: string | null;
  scopes: string[];
  status: ConnectedAccountStatus;
  connected_at: string;
};

export type Lane = {
  id: string;
  weekly_min_minutes: number;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  lane: string;
  /** Local 'YYYY-MM-DD' or null. */
  due_date: string | null;
  /** Minutes, or null when unknown. */
  est_minutes: number | null;
  /** Set when the task is placed on Today. */
  scheduled_date: string | null;
  /** Minutes from midnight, or null when placed without a time. */
  scheduled_start_min: number | null;
  /** SQLite boolean. */
  done: 0 | 1;
  /** e.g. 'coach' | null. */
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  link: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentIdea = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/** Insert payloads: generated fields (id, created_at) are omitted, and
 * created_at timestamps are set by the repositories. */
export type TimetableEntryInput = Omit<TimetableEntry, 'id' | 'created_at'>;
export type TimetableExceptionInput = Omit<TimetableException, 'id' | 'created_at'>;
export type HabitInput = Omit<Habit, 'id' | 'archived' | 'created_at'>;
export type HabitLogInput = Omit<HabitLog, 'id' | 'created_at'>;
export type DailyCheckinInput = Omit<DailyCheckin, 'id' | 'created_at'>;
export type TaskInput = Omit<Task, 'id' | 'done' | 'source' | 'created_at' | 'updated_at'>;
export type JobInput = Omit<Job, 'id' | 'created_at' | 'updated_at'>;
export type ContentIdeaInput = Omit<ContentIdea, 'id' | 'created_at' | 'updated_at'>;

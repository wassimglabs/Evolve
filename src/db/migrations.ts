import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ordered array of migration SQL strings. Index 0 is migration 001 and so on.
 * Each migration runs exactly once, inside a transaction, and is recorded in
 * `schema_version`. Re-running is a no-op for already applied migrations.
 *
 * Do not edit older migrations; add a new string at the end instead.
 */
export const MIGRATIONS: readonly string[] = [
  // 001 - initial schema
  `
  CREATE TABLE IF NOT EXISTS timetable_entries (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_min INTEGER NOT NULL,
    end_min INTEGER NOT NULL,
    location TEXT,
    kind TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timetable_exceptions (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    entry_id TEXT,
    type TEXT NOT NULL,
    title TEXT,
    start_min INTEGER,
    end_min INTEGER,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    min_target TEXT NOT NULL,
    full_target TEXT NOT NULL,
    preferred_time TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL,
    level TEXT NOT NULL,
    duration_min INTEGER,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_checkins (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL UNIQUE,
    energy INTEGER NOT NULL,
    focus INTEGER NOT NULL,
    mood INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id_date
    ON habit_logs (habit_id, date);

  CREATE INDEX IF NOT EXISTS idx_timetable_entries_day_of_week
    ON timetable_entries (day_of_week);
  `,

  // 002 - connected account metadata (tokens remain in SecureStore)
  `
  CREATE TABLE IF NOT EXISTS connected_accounts (
    provider TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    scopes_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('connected', 'reauth_required')),
    connected_at TEXT NOT NULL
  );
  `,

  // 003 - real data: habit schedule days + tasks / lanes / jobs / content ideas.
  // Additive only: `habits.category` already exists in 001, so only `days` is
  // added. Lanes are seeded once and survive "Wipe data" (like settings).
  `
  ALTER TABLE habits ADD COLUMN days TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7';

  CREATE TABLE IF NOT EXISTS lanes (
    id TEXT PRIMARY KEY NOT NULL,
    weekly_min_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  INSERT OR IGNORE INTO lanes (id, weekly_min_minutes, created_at) VALUES
    ('study', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('solven', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('career', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('life', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    lane TEXT NOT NULL CHECK (lane IN ('study', 'solven', 'career', 'life')),
    due_date TEXT,
    est_minutes INTEGER,
    scheduled_date TEXT,
    scheduled_start_min INTEGER,
    done INTEGER NOT NULL DEFAULT 0,
    source TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_lane ON tasks (lane);
  CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks (scheduled_date);

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    link TEXT,
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS content_ideas (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'drafted', 'posted')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
];

/** Runs pending migrations. Idempotent; call as often as app start. */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const current = await db.getFirstAsync<{ version: number }>(
    `SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;`,
  );
  const next = (current?.version ?? 0) + 1;

  for (let version = next; version <= MIGRATIONS.length; version++) {
    const sql = MIGRATIONS[version - 1];
    if (!sql) break;

    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.runAsync(
        `INSERT INTO schema_version (version, applied_at) VALUES (?, ?);`,
        version,
        new Date().toISOString(),
      );
    });
  }
}

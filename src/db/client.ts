import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';

import { runMigrations } from './migrations';

const DATABASE_NAME = 'evolve.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Opens the app database and runs migrations exactly once per process.
 * Subsequent callers (all screens + repositories) share the same promise.
 */
export function getDb(): Promise<SQLiteDatabase> {
  dbPromise ??= open();
  return dbPromise;
}

async function open(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await runMigrations(db);
  return db;
}

/** Deletes all data rows; keeps the schema and applied migrations. */
export async function wipeAllData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM timetable_exceptions;`);
    await db.runAsync(`DELETE FROM timetable_entries;`);
    await db.runAsync(`DELETE FROM habit_logs;`);
    await db.runAsync(`DELETE FROM habits;`);
    await db.runAsync(`DELETE FROM daily_checkins;`);
    await db.runAsync(`DELETE FROM settings;`);
  });
}

export type TableRowCounts = {
  timetable_entries: number;
  timetable_exceptions: number;
  habits: number;
  habit_logs: number;
  daily_checkins: number;
  settings: number;
};

export async function getTableRowCounts(): Promise<TableRowCounts> {
  const db = await getDb();
  const row = await db.getFirstAsync<TableRowCounts>(`
    SELECT
      (SELECT COUNT(*) FROM timetable_entries)     AS timetable_entries,
      (SELECT COUNT(*) FROM timetable_exceptions)  AS timetable_exceptions,
      (SELECT COUNT(*) FROM habits)                AS habits,
      (SELECT COUNT(*) FROM habit_logs)            AS habit_logs,
      (SELECT COUNT(*) FROM daily_checkins)        AS daily_checkins,
      (SELECT COUNT(*) FROM settings)              AS settings;
  `);
  if (!row) throw new Error('Could not read table row counts.');
  return row;
}

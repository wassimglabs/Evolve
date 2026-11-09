import { useCallback, useEffect, useState } from 'react';

import { getTableRowCounts, type TableRowCounts } from '@/db/client';

/** Live row counts for the Developer card ("timetable 7 · habits 4 · …"). */
export function useDeveloperCounts() {
  const [counts, setCounts] = useState<TableRowCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTableRowCounts()
      .then((next) => {
        if (!cancelled) setCounts(next);
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      setCounts(await getTableRowCounts());
    } catch {
      setCounts(null);
    }
  }, []);

  const line = counts
    ? `timetable ${counts.timetable_entries} · habits ${counts.habits} · logs ${counts.habit_logs} · check-ins ${counts.daily_checkins}`
    : 'timetable – · habits – · logs – · check-ins –';

  return { line, reload };
}

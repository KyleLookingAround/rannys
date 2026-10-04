/**
 * Opening-hours rows with the weekdays each one covers (Sun = 0), so the page
 * script can highlight today's row (see paintToday in app.ts).
 */
import { hoursRows } from './site';

type Settings = Parameters<typeof hoursRows>[0];
const IDX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

export function hoursWithDays(s: Settings) {
  return hoursRows(s).map((r, i) => {
    const src = s.hours[i];
    const days: number[] = [];
    const start = IDX[src.fromDay];
    const end = src.toDay ? IDX[src.toDay] : start;
    if (start != null) for (let d = start; ; d = (d + 1) % 7) { days.push(d); if (d === end) break; }
    return { ...r, days: days.join(',') };
  });
}

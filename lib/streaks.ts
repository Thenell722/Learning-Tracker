import { differenceInCalendarDays } from 'date-fns';

/**
 * Given an array of ISO date strings (study session dates), returns the
 * current streak (consecutive days up to today or yesterday) and the
 * longest streak ever achieved.
 */
export function calculateStreaks(sessionDates: string[]): {
  current: number;
  longest: number;
} {
  if (sessionDates.length === 0) return { current: 0, longest: 0 };

  // Normalize to YYYY-MM-DD, dedupe, sort descending
  const uniqueDates = Array.from(
    new Set(sessionDates.map((d) => d.slice(0, 10)))
  ).sort((a, b) => b.localeCompare(a));

  // Current streak: count backwards from today (or yesterday if no session today)
  let current = 0;
  const today = new Date();
  const firstDate = new Date(uniqueDates[0] + 'T00:00:00');
  const gap = differenceInCalendarDays(today, firstDate);

  // If the most recent session is today or yesterday, start counting
  if (gap <= 1) {
    let cursor = new Date(today);
    if (gap === 1) cursor = new Date(firstDate);
    for (const dateStr of uniqueDates) {
      const d = new Date(dateStr + 'T00:00:00');
      if (differenceInCalendarDays(cursor, d) === 0) {
        current++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else if (differenceInCalendarDays(cursor, d) > 0) {
        break;
      }
    }
  }

  // Longest streak: iterate all dates
  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDates[i] + 'T00:00:00');
    if (differenceInCalendarDays(prev, curr) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return { current, longest: Math.max(longest, current) };
}

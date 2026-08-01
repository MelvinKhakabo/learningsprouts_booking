import { addDays, parseISO, format } from 'date-fns';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthNameOf(date: Date): string {
  return MONTH_NAMES[date.getMonth()];
}

export type CycleWindow = {
  cycleNumber: number;
  sessionDates: string[]; // ISO yyyy-MM-dd, length === cohort.cycle_length
};

/** Generates weekly session dates from anchorISO, skipping paused months. */
function generateSessionDates(anchorISO: string, pausedMonths: string[], count: number): Date[] {
  const dates: Date[] = [];
  let cursor = parseISO(anchorISO);
  let guard = 0;
  while (dates.length < count && guard < 1000) {
    if (!pausedMonths.includes(monthNameOf(cursor))) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, 7);
    guard++;
  }
  return dates;
}

/**
 * Returns the next `upcomingCount` cycles from today (including the
 * current one if today falls inside a cycle already in progress).
 * Returns [] for term-based cohorts (cycle_length is null).
 */
export function computeUpcomingCycles(
  cohort: { start_date: string; cycle_length: number | null; paused_months: string | null },
  upcomingCount = 3
): CycleWindow[] {
  if (!cohort.cycle_length) return [];

  const pausedMonths = cohort.paused_months
    ? cohort.paused_months.split(',').map((m) => m.trim())
    : [];

  const today = new Date();
  const rawDates = generateSessionDates(
    cohort.start_date,
    pausedMonths,
    cohort.cycle_length * (upcomingCount + 12) // generous buffer
  );

  const cycles: CycleWindow[] = [];
  for (let i = 0; i * cohort.cycle_length < rawDates.length; i++) {
    const slice = rawDates.slice(i * cohort.cycle_length, (i + 1) * cohort.cycle_length);
    if (slice.length < cohort.cycle_length) break;
    cycles.push({
      cycleNumber: i + 1,
      sessionDates: slice.map((d) => format(d, 'yyyy-MM-dd')),
    });
  }

  const firstRelevant = cycles.findIndex((c) => {
    const last = parseISO(c.sessionDates[c.sessionDates.length - 1]);
    return last >= today;
  });

  const startIndex = firstRelevant === -1 ? 0 : firstRelevant;
  return cycles.slice(startIndex, startIndex + upcomingCount);
}

export function formatCycleLabel(cycle: CycleWindow): string {
  const first = format(parseISO(cycle.sessionDates[0]), 'MMM d');
  const last = format(parseISO(cycle.sessionDates[cycle.sessionDates.length - 1]), 'MMM d, yyyy');
  return `Cycle ${cycle.cycleNumber}: ${first} – ${last}`;
}
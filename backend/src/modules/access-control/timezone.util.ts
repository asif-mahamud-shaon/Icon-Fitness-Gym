import { DayOfWeek } from '@prisma/client';

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+06:00 (Asia/Dhaka has no DST)

const JS_DAY_TO_PRISMA: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export interface DhakaTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: DayOfWeek;
  timeHHmm: string;
  dateKey: string; // YYYY-MM-DD in Asia/Dhaka
  normalizedDayStartUtc: Date; // 00:00:00.000 UTC for the Dhaka calendar date
}

/**
 * Computes deterministic Asia/Dhaka (UTC+06:00) calendar and wall-clock components
 * regardless of the host server's OS timezone setting.
 */
export function getDhakaTimeParts(date: Date = new Date()): DhakaTimeParts {
  const dhakaEpochMs = date.getTime() + DHAKA_OFFSET_MS;
  const shifted = new Date(dhakaEpochMs);

  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  const second = shifted.getUTCSeconds();
  const jsDay = shifted.getUTCDay();

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateKey = `${year}-${pad(month)}-${pad(day)}`;
  const timeHHmm = `${pad(hour)}:${pad(minute)}`;
  const normalizedDayStartUtc = new Date(`${dateKey}T00:00:00.000Z`);

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dayOfWeek: JS_DAY_TO_PRISMA[jsDay],
    timeHHmm,
    dateKey,
    normalizedDayStartUtc,
  };
}

/**
 * Returns the exact end-of-day cutoff in Asia/Dhaka (YYYY-MM-DDT23:59:59.999+06:00)
 * for a membership's endDate so a package is NEVER disabled at the beginning
 * (00:00:00) of its final valid day.
 */
export function getDhakaEndOfDayCutoff(endDate: Date): Date {
  const parts = getDhakaTimeParts(endDate);
  return new Date(`${parts.dateKey}T23:59:59.999+06:00`);
}

/**
 * Returns the exact start-of-day in Asia/Dhaka (YYYY-MM-DDT00:00:00.000+06:00)
 * for a membership's startDate.
 */
export function getDhakaStartOfDayCutoff(startDate: Date): Date {
  const parts = getDhakaTimeParts(startDate);
  return new Date(`${parts.dateKey}T00:00:00.000+06:00`);
}

/**
 * Checks whether a given timestamp `now` is within the inclusive membership validity window
 * in Asia/Dhaka timezone (from 00:00:00.000+06:00 of startDate through 23:59:59.999+06:00 of endDate).
 */
export function isMembershipValidAtDhakaTime(
  startDate: Date,
  endDate: Date,
  now: Date = new Date(),
): {
  isValid: boolean;
  hasStarted: boolean;
  isExpired: boolean;
  effectiveStartUtc: Date;
  effectiveExpiryUtc: Date;
} {
  const effectiveStartUtc = getDhakaStartOfDayCutoff(startDate);
  const effectiveExpiryUtc = getDhakaEndOfDayCutoff(endDate);
  const nowMs = now.getTime();

  const hasStarted = nowMs >= effectiveStartUtc.getTime();
  const isExpired = nowMs > effectiveExpiryUtc.getTime();

  return {
    isValid: hasStarted && !isExpired,
    hasStarted,
    isExpired,
    effectiveStartUtc,
    effectiveExpiryUtc,
  };
}

/**
 * Parses "HH:mm" into minutes from 00:00 (0..1439).
 */
export function parseHHmmToMinutes(hhmm: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec((hhmm || '').trim());
  if (!match) {
    throw new Error(`Invalid time format "${hhmm}". Expected HH:mm (00:00 - 23:59).`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Checks if two [start, end) intervals in "HH:mm" format overlap on the same day.
 */
export function doTimeWindowsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const sA = parseHHmmToMinutes(startA);
  const eA = parseHHmmToMinutes(endA);
  const sB = parseHHmmToMinutes(startB);
  const eB = parseHHmmToMinutes(endB);
  return sA < eB && sB < eA;
}

/**
 * Checks if wall-clock `currentHHmm` is inside `[startTime, endTime]` (inclusive of start, exclusive of end).
 */
export function isTimeWithinSessionWindow(
  currentHHmm: string,
  startTime: string,
  endTime: string,
): boolean {
  const current = parseHHmmToMinutes(currentHHmm);
  const start = parseHHmmToMinutes(startTime);
  const end = parseHHmmToMinutes(endTime);
  return current >= start && current < end;
}


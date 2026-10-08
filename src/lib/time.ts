/** Time-of-day greeting for an hour in 0..23 (the browser's local hour). */
export function greetingForHour(hour: number): string {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return 'Welcome back';
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * Relative time such as "just now", "5 minutes ago" or "yesterday".
 * Pure: `now` is injected. Future timestamps (clock skew) read as "just now".
 * Returns '' for an invalid date.
 */
export function formatRelativeTime(from: string | Date, now: Date): string {
  const then = typeof from === 'string' ? new Date(from) : from;
  const diffSeconds = Math.round((then.getTime() - now.getTime()) / 1000);
  if (Number.isNaN(diffSeconds)) return '';
  if (diffSeconds >= 0) return 'just now';

  const ago = -diffSeconds;
  if (ago < 45) return 'just now';
  if (ago < HOUR) return relativeFormat.format(-Math.max(1, Math.floor(ago / MINUTE)), 'minute');
  if (ago < DAY) return relativeFormat.format(-Math.floor(ago / HOUR), 'hour');
  if (ago < MONTH) return relativeFormat.format(-Math.floor(ago / DAY), 'day');
  if (ago < YEAR) return relativeFormat.format(-Math.floor(ago / MONTH), 'month');
  return relativeFormat.format(-Math.floor(ago / YEAR), 'year');
}

/**
 * Timezone utilities for SYNAPZ STUDY ZONE (Asia/Kolkata)
 */

export const READING_ROOM_TIMEZONE = process.env.READING_ROOM_TZ || 'Asia/Kolkata';

/**
 * Returns today's date in Asia/Kolkata timezone formatted as "YYYY-MM-DD"
 */
export function getKolkataToday() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: READING_ROOM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now); // "YYYY-MM-DD"
}

/**
 * Formats a Date object into human-readable IST time (e.g., "08:15 AM")
 */
export function formatKolkataTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    timeZone: READING_ROOM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a Date object into human-readable IST date and time (e.g., "24 Oct 2026, 08:15 AM")
 */
export function formatKolkataDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    timeZone: READING_ROOM_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

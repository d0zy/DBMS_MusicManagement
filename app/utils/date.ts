/**
 * Date utility functions for the booking system
 */

/**
 * Convert a local date to GMT (UTC)
 * @param localDate The local date to convert
 * @returns Date object in GMT (UTC) timezone
 */
export function toGMT(localDate: Date): Date {
  // Create a new date object to avoid modifying the original
  const date = new Date(localDate);

  // Convert to UTC by creating a new date with the UTC time components
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  ));
}

/**
 * Convert a GMT (UTC) date to local timezone
 * @param gmtDate The GMT (UTC) date to convert
 * @returns Date object in local timezone
 */
export function fromGMT(gmtDate: Date): Date {
  // Create a new date object from the UTC timestamp
  return new Date(gmtDate.getTime());
}

// Keep the old functions for backward compatibility
export const toGMT530 = toGMT;
export const fromGMT530 = fromGMT;

/**
 * Check if a date is a weekend in GMT (UTC) timezone
 * @param date The date to check (in any timezone)
 * @returns boolean indicating if the date is a weekend in GMT (UTC)
 */
export function isWeekendInGMT(date: Date): boolean {
  // Convert to GMT (UTC)
  const gmtDate = toGMT(date);

  // Get the day of week in GMT (UTC) (0 = Sunday, 6 = Saturday)
  const dayOfWeek = gmtDate.getDay();

  // Check if it's a weekend (Saturday or Sunday)
  return dayOfWeek === 0 || dayOfWeek === 6;
}

// Keep the old function for backward compatibility
export const isWeekendInGMT530 = isWeekendInGMT;

/**
 * Check if the current time is after 10pm the previous day
 * @param bookingDate The date to check for booking
 * @returns boolean indicating if booking is allowed
 */
export function canBookForDate(bookingDate: Date): boolean {
  // Convert both dates to GMT (UTC) for consistent comparison
  const now = toGMT(new Date());

  // Create a date for 10pm the day before the booking in GMT (UTC)
  const bookingDateInGMT = toGMT(new Date(bookingDate));
  const bookingDateMinus1Day = new Date(bookingDateInGMT);
  bookingDateMinus1Day.setDate(bookingDateMinus1Day.getDate() - 1);
  bookingDateMinus1Day.setHours(22, 0, 0, 0);

  // Check if current time is after 10pm the previous day
  return now >= bookingDateMinus1Day;
}

/**
 * Check if the current time is after 10pm the previous day in GMT (UTC)
 * @param bookingDate The date to check for booking
 * @returns boolean indicating if booking is allowed
 */
export function canBookForDateInGMT(bookingDate: Date): boolean {
  return canBookForDate(bookingDate);
}

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a time to a readable string
 * @param date The date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

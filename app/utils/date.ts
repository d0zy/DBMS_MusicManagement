/**
 * Date utility functions for the booking system
 */

// GMT +5:30 offset in minutes
const GMT_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * Convert a local date to GMT +5:30
 * @param localDate The local date to convert
 * @returns Date object in GMT +5:30 timezone
 */
export function toGMT530(localDate: Date): Date {
  // Create a new date object to avoid modifying the original
  const date = new Date(localDate);

  // Get the local timezone offset in minutes
  const localOffset = date.getTimezoneOffset();

  // Calculate the total offset in minutes (local to GMT+5:30)
  const totalOffsetMinutes = localOffset + GMT_OFFSET_MINUTES;

  // Apply the offset
  date.setMinutes(date.getMinutes() + totalOffsetMinutes);

  return date;
}

/**
 * Convert a GMT +5:30 date to local timezone
 * @param gmt530Date The GMT +5:30 date to convert
 * @returns Date object in local timezone
 */
export function fromGMT530(gmt530Date: Date): Date {
  // Create a new date object to avoid modifying the original
  const date = new Date(gmt530Date);

  // Get the local timezone offset in minutes
  const localOffset = date.getTimezoneOffset();

  // Calculate the total offset in minutes (GMT+5:30 to local)
  const totalOffsetMinutes = -(localOffset + GMT_OFFSET_MINUTES);

  // Apply the offset
  date.setMinutes(date.getMinutes() + totalOffsetMinutes);

  return date;
}

/**
 * Check if a date is a weekend in GMT +5:30 timezone
 * @param date The date to check (in any timezone)
 * @returns boolean indicating if the date is a weekend in GMT +5:30
 */
export function isWeekendInGMT530(date: Date): boolean {
  // Convert to GMT +5:30
  const gmt530Date = toGMT530(date);

  // Get the day of week in GMT +5:30 (0 = Sunday, 6 = Saturday)
  const dayOfWeek = gmt530Date.getDay();

  // Check if it's a weekend (Saturday or Sunday)
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Check if the current time is after 10pm the previous day
 * @param bookingDate The date to check for booking
 * @returns boolean indicating if booking is allowed
 */
export function canBookForDate(bookingDate: Date): boolean {
  // Convert both dates to GMT +5:30 for consistent comparison
  const now = toGMT530(new Date());

  // Create a date for 10pm the day before the booking in GMT +5:30
  const bookingDateInGMT530 = toGMT530(new Date(bookingDate));
  const bookingDateMinus1Day = new Date(bookingDateInGMT530);
  bookingDateMinus1Day.setDate(bookingDateMinus1Day.getDate() - 1);
  bookingDateMinus1Day.setHours(22, 0, 0, 0);

  // Check if current time is after 10pm the previous day
  return now >= bookingDateMinus1Day;
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

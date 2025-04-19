/**
 * Date utility functions for the booking system
 */

/**
 * Check if the current time is after 10pm the previous day
 * @param bookingDate The date to check for booking
 * @returns boolean indicating if booking is allowed
 */
export function canBookForDate(bookingDate: Date): boolean {
  const now = new Date();
  
  // Create a date for 10pm the day before the booking
  const bookingDateMinus1Day = new Date(bookingDate);
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
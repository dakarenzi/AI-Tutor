/**
 * DateUtils.ts
 * 
 * Date/time utilities
 */

export class DateUtils {
  /**
   * Format date for display
   */
  static formatDate(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date) : date;
    return d.toISOString();
  }

  /**
   * Get days until date
   */
  static daysUntil(targetDate: Date | string | number): number {
    const target = typeof targetDate === 'string' || typeof targetDate === 'number'
      ? new Date(targetDate)
      : targetDate;
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: Date | string | number): boolean {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
    return d.getTime() < Date.now();
  }

  /**
   * Get relative time string
   */
  static getRelativeTime(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date) : date;
    const now = Date.now();
    const diff = now - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}




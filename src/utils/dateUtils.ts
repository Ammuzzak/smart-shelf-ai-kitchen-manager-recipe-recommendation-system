/**
 * Date utility for Smart Shelf AI Kitchen Manager.
 * Single source of truth for all calendar and expiry calculations.
 * Always works with local calendar dates to avoid UTC offset drift.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object set to 00:00:00.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Calculates exact whole days difference between today and the target expiry date.
 * Positive = days left in the future (e.g. today Oct 14, expiry Oct 18 -> 4 days left).
 * 0 = expires today.
 * Negative = expired in the past (e.g. today Oct 14, expiry Oct 12 -> -2 days, i.e. 2 days ago).
 */
export function getDaysUntilExpiry(expiryDateStr: string, referenceDateStr?: string): number {
  if (!expiryDateStr) return 999;
  const targetDate = parseLocalDate(expiryDateStr);
  const refDate = referenceDateStr ? parseLocalDate(referenceDateStr) : parseLocalDate(getTodayDateString());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = targetDate.getTime() - refDate.getTime();
  return Math.round(diffMs / msPerDay);
}

/**
 * Returns true if the item's expiry date is strictly in the past (before today).
 */
export function isExpired(expiryDateStr: string): boolean {
  return getDaysUntilExpiry(expiryDateStr) < 0;
}

/**
 * Returns true if the item is expiring soon (0 to threshold days left, default 3).
 * An item expiring in 4 days is NOT expiring soon with threshold 3.
 */
export function isExpiringSoon(expiryDateStr: string, thresholdDays = 3): boolean {
  const days = getDaysUntilExpiry(expiryDateStr);
  return days >= 0 && days <= thresholdDays;
}

export type UrgencyTier = 'expired' | 'critical' | 'warning' | 'optimal';

/**
 * Returns consistent urgency classification based on canonical days calculation:
 * - 'expired': < 0 days (past expiry date)
 * - 'critical': 0 to 1 days (expires today or tomorrow)
 * - 'warning': 2 to 3 days (expires in 2-3 days)
 * - 'optimal': > 3 days (fresh and safe)
 */
export function getExpiryUrgency(expiryDateStr: string): UrgencyTier {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days < 0) return 'expired';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'warning';
  return 'optimal';
}

/**
 * Human-friendly relative text for expiry.
 */
export function getExpiryRelativeLabel(expiryDateStr: string): string {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days < 0) {
    const past = Math.abs(days);
    return `Expired ${past} day${past === 1 ? '' : 's'} ago`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow (1 day left)';
  return `Expires in ${days} days`;
}

/**
 * Formats a YYYY-MM-DD string into a friendly localized string like "Oct 18, 2026" or "18 Oct".
 */
export function formatFriendlyDate(dateStr: string, includeYear = true): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined,
  });
}

/**
 * Adds N days to a date string and returns 'YYYY-MM-DD'.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

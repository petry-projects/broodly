export type StalenessLevel = 'fresh' | 'subtle' | 'warning' | 'critical';

const FIVE_MINUTES = 5 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;

/**
 * Determines staleness tier based on data age.
 * - fresh: within staleTime (5 min)
 * - subtle: < 24 hours
 * - warning: 24-72 hours
 * - critical: > 72 hours
 */
export function getStalenessLevel(dataUpdatedAt: Date, now = new Date()): StalenessLevel {
  const ageMs = now.getTime() - dataUpdatedAt.getTime();

  if (ageMs < FIVE_MINUTES) return 'fresh';
  if (ageMs < TWENTY_FOUR_HOURS) return 'subtle';
  if (ageMs < SEVENTY_TWO_HOURS) return 'warning';
  return 'critical';
}

/**
 * Returns a human-readable relative time label.
 * "Just now", "2h ago", "2 days ago", etc.
 */
export function getRelativeTimeLabel(dataUpdatedAt: Date, now = new Date()): string {
  const ageMs = now.getTime() - dataUpdatedAt.getTime();
  const minutes = Math.floor(ageMs / (60 * 1000));
  const hours = Math.floor(ageMs / (60 * 60 * 1000));
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  if (minutes < 5) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

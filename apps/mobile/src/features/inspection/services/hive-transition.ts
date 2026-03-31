/**
 * Hive transition context service.
 *
 * Provides context information when transitioning between hives
 * during a multi-hive inspection session, including TTS announcements.
 */

import type { SessionHive } from '../../../store/multi-hive-session-store';

export interface HiveTransitionContext {
  /** Hive name for display and TTS */
  hiveName: string;
  /** Position in sequence (1-indexed for human readability) */
  positionLabel: string;
  /** Health status from last inspection */
  lastHealthStatus: string | null;
  /** Human-readable time since last inspection */
  lastInspectionSummary: string | null;
  /** Count of observations already recorded for this hive */
  existingObservationCount: number;
  /** TTS announcement text for the transition */
  ttsAnnouncement: string;
}

/**
 * Build a human-readable summary of how long ago an inspection occurred.
 */
export function formatTimeSinceInspection(
  lastInspectionDate: string | undefined,
): string | null {
  if (!lastInspectionDate) return null;

  const last = new Date(lastInspectionDate);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Inspected today';
  if (diffDays === 1) return 'Inspected yesterday';
  if (diffDays < 7) return `Inspected ${diffDays} days ago`;
  if (diffDays < 14) return 'Inspected last week';
  if (diffDays < 30) return `Inspected ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return 'Inspected last month';
  return `Inspected ${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Build a TTS announcement for hive transition.
 */
export function buildTransitionAnnouncement(
  hive: SessionHive,
  totalHives: number,
): string {
  const parts: string[] = [];

  const position = hive.orderIndex + 1;
  parts.push(`Now at ${hive.hiveName}, hive ${position} of ${totalHives}.`);

  if (hive.lastHealthStatus) {
    parts.push(`Last status: ${hive.lastHealthStatus}.`);
  }

  const timeSummary = formatTimeSinceInspection(hive.lastInspectionDate);
  if (timeSummary) {
    parts.push(`${timeSummary}.`);
  }

  if (hive.observations.length > 0) {
    parts.push(
      `${hive.observations.length} observation${hive.observations.length === 1 ? '' : 's'} already recorded.`,
    );
  }

  return parts.join(' ');
}

/**
 * Build full transition context for a hive.
 */
export function buildHiveTransitionContext(
  hive: SessionHive,
  totalHives: number,
): HiveTransitionContext {
  return {
    hiveName: hive.hiveName,
    positionLabel: `${hive.orderIndex + 1} of ${totalHives}`,
    lastHealthStatus: hive.lastHealthStatus ?? null,
    lastInspectionSummary: formatTimeSinceInspection(hive.lastInspectionDate),
    existingObservationCount: hive.observations.length,
    ttsAnnouncement: buildTransitionAnnouncement(hive, totalHives),
  };
}

/**
 * Summarize observations for a hive (for review or transition back).
 */
export function summarizeHiveObservations(hive: SessionHive): string {
  if (hive.observations.length === 0) {
    return 'No observations recorded yet.';
  }

  const urgent = hive.observations.filter(
    (o) => o.classification === 'urgent',
  ).length;
  const cautionary = hive.observations.filter(
    (o) => o.classification === 'cautionary',
  ).length;
  const normal = hive.observations.filter(
    (o) => o.classification === 'normal',
  ).length;

  const parts: string[] = [];
  parts.push(`${hive.observations.length} total observations.`);
  if (urgent > 0) parts.push(`${urgent} urgent.`);
  if (cautionary > 0) parts.push(`${cautionary} cautionary.`);
  if (normal > 0) parts.push(`${normal} normal.`);

  return parts.join(' ');
}

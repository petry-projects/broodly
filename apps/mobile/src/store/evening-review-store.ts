import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';
import type { Observation } from '../features/inspection/types';

export type ReviewStatus = 'pending' | 'reviewed';

export interface ReviewableHive {
  hiveId: string;
  hiveName: string;
  observations: Observation[];
  reviewStatus: ReviewStatus;
  /** Observations that have been edited during review */
  editedObservationIds: string[];
}

export interface EveningReviewSession {
  sessionId: string;
  apiaryId: string;
  apiaryName: string;
  hives: ReviewableHive[];
  startedAt: string;
  completedAt: string | null;
}

interface EveningReviewState {
  review: EveningReviewSession | null;

  startReview: (params: {
    sessionId: string;
    apiaryId: string;
    apiaryName: string;
    hives: Array<{
      hiveId: string;
      hiveName: string;
      observations: Observation[];
    }>;
  }) => void;

  getHive: (hiveId: string) => ReviewableHive | null;
  getLowConfidenceObservations: (hiveId: string) => Observation[];
  getAllLowConfidenceObservations: () => Array<{
    hiveId: string;
    hiveName: string;
    observation: Observation;
  }>;

  updateObservation: (
    hiveId: string,
    observationId: string,
    updates: Partial<Observation>,
  ) => void;

  markHiveReviewed: (hiveId: string) => void;
  completeReview: () => void;
  clearReview: () => void;

  hasActiveReview: () => boolean;
  getReviewProgress: () => { reviewed: number; total: number; percentage: number };
}

/** Threshold below which a voice transcription is flagged for review */
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

export const useEveningReviewStore = create<EveningReviewState>()(
  persist(
    (set, get) => ({
      review: null,

      startReview: ({ sessionId, apiaryId, apiaryName, hives }) => {
        const reviewableHives: ReviewableHive[] = hives.map((h) => ({
          hiveId: h.hiveId,
          hiveName: h.hiveName,
          observations: h.observations,
          reviewStatus: 'pending',
          editedObservationIds: [],
        }));

        set({
          review: {
            sessionId,
            apiaryId,
            apiaryName,
            hives: reviewableHives,
            startedAt: new Date().toISOString(),
            completedAt: null,
          },
        });
      },

      getHive: (hiveId) => {
        const { review } = get();
        if (!review) return null;
        return review.hives.find((h) => h.hiveId === hiveId) ?? null;
      },

      getLowConfidenceObservations: (hiveId) => {
        const { review } = get();
        if (!review) return [];

        const hive = review.hives.find((h) => h.hiveId === hiveId);
        if (!hive) return [];

        return hive.observations.filter(
          (o) =>
            o.voiceConfidence !== undefined &&
            o.voiceConfidence < LOW_CONFIDENCE_THRESHOLD,
        );
      },

      getAllLowConfidenceObservations: () => {
        const { review } = get();
        if (!review) return [];

        const results: Array<{
          hiveId: string;
          hiveName: string;
          observation: Observation;
        }> = [];

        for (const hive of review.hives) {
          for (const obs of hive.observations) {
            if (
              obs.voiceConfidence !== undefined &&
              obs.voiceConfidence < LOW_CONFIDENCE_THRESHOLD
            ) {
              results.push({
                hiveId: hive.hiveId,
                hiveName: hive.hiveName,
                observation: obs,
              });
            }
          }
        }

        return results;
      },

      updateObservation: (hiveId, observationId, updates) => {
        const { review } = get();
        if (!review) return;

        const updatedHives = review.hives.map((h) => {
          if (h.hiveId !== hiveId) return h;

          return {
            ...h,
            observations: h.observations.map((o) =>
              o.id === observationId ? { ...o, ...updates } : o,
            ),
            editedObservationIds: h.editedObservationIds.includes(observationId)
              ? h.editedObservationIds
              : [...h.editedObservationIds, observationId],
          };
        });

        set({ review: { ...review, hives: updatedHives } });
      },

      markHiveReviewed: (hiveId) => {
        const { review } = get();
        if (!review) return;

        const updatedHives = review.hives.map((h) =>
          h.hiveId === hiveId ? { ...h, reviewStatus: 'reviewed' as const } : h,
        );

        set({ review: { ...review, hives: updatedHives } });
      },

      completeReview: () => {
        const { review } = get();
        if (!review) return;

        // Mark all hives as reviewed
        const updatedHives = review.hives.map((h) => ({
          ...h,
          reviewStatus: 'reviewed' as const,
        }));

        set({
          review: {
            ...review,
            hives: updatedHives,
            completedAt: new Date().toISOString(),
          },
        });
      },

      clearReview: () => set({ review: null }),

      hasActiveReview: () => {
        const { review } = get();
        return review !== null && review.completedAt === null;
      },

      getReviewProgress: () => {
        const { review } = get();
        if (!review) return { reviewed: 0, total: 0, percentage: 0 };

        const reviewed = review.hives.filter(
          (h) => h.reviewStatus === 'reviewed',
        ).length;
        const total = review.hives.length;
        const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;

        return { reviewed, total, percentage };
      },
    }),
    {
      name: 'broodly-evening-review',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

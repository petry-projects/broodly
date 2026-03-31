import {
  useEveningReviewStore,
  LOW_CONFIDENCE_THRESHOLD,
} from './evening-review-store';
import type { Observation } from '../features/inspection/types';

function makeObservation(overrides: Partial<Observation> = {}): Observation {
  return {
    id: `obs-${Math.random()}`,
    promptId: 'entrance',
    observationType: 'entrance_assessment',
    value: 'normal',
    classification: 'normal',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const HIGH_CONFIDENCE_OBS = makeObservation({
  id: 'obs-high',
  voiceTranscription: 'bees look great',
  voiceConfidence: 0.95,
  value: 'bees look great',
});

const LOW_CONFIDENCE_OBS = makeObservation({
  id: 'obs-low',
  voiceTranscription: 'something about mites',
  voiceConfidence: 0.4,
  value: 'something about mites',
});

const MEDIUM_CONFIDENCE_OBS = makeObservation({
  id: 'obs-med',
  voiceTranscription: 'queen spotted',
  voiceConfidence: 0.75,
  value: 'queen spotted',
});

function startTestReview() {
  useEveningReviewStore.getState().startReview({
    sessionId: 'session-1',
    apiaryId: 'apiary-1',
    apiaryName: 'Test Apiary',
    hives: [
      {
        hiveId: 'h1',
        hiveName: 'Hive Alpha',
        observations: [HIGH_CONFIDENCE_OBS, LOW_CONFIDENCE_OBS],
      },
      {
        hiveId: 'h2',
        hiveName: 'Hive Beta',
        observations: [MEDIUM_CONFIDENCE_OBS],
      },
    ],
  });
}

beforeEach(() => {
  useEveningReviewStore.getState().clearReview();
});

describe('Evening review store', () => {
  describe('review lifecycle', () => {
    it('initializes with no active review', () => {
      expect(useEveningReviewStore.getState().review).toBeNull();
      expect(useEveningReviewStore.getState().hasActiveReview()).toBe(false);
    });

    it('starts a review with correct state', () => {
      startTestReview();
      const { review } = useEveningReviewStore.getState();

      expect(review).not.toBeNull();
      expect(review!.sessionId).toBe('session-1');
      expect(review!.hives).toHaveLength(2);
      expect(review!.startedAt).toBeTruthy();
      expect(review!.completedAt).toBeNull();
    });

    it('all hives start as pending', () => {
      startTestReview();
      const { review } = useEveningReviewStore.getState();

      expect(review!.hives[0].reviewStatus).toBe('pending');
      expect(review!.hives[1].reviewStatus).toBe('pending');
    });

    it('reports active review correctly', () => {
      startTestReview();
      expect(useEveningReviewStore.getState().hasActiveReview()).toBe(true);
    });

    it('completes review', () => {
      startTestReview();
      useEveningReviewStore.getState().completeReview();

      const { review } = useEveningReviewStore.getState();
      expect(review!.completedAt).toBeTruthy();
      expect(review!.hives[0].reviewStatus).toBe('reviewed');
      expect(review!.hives[1].reviewStatus).toBe('reviewed');
      expect(useEveningReviewStore.getState().hasActiveReview()).toBe(false);
    });

    it('clears review', () => {
      startTestReview();
      useEveningReviewStore.getState().clearReview();
      expect(useEveningReviewStore.getState().review).toBeNull();
    });
  });

  describe('hive retrieval', () => {
    it('gets hive by ID', () => {
      startTestReview();
      const hive = useEveningReviewStore.getState().getHive('h1');
      expect(hive).not.toBeNull();
      expect(hive!.hiveName).toBe('Hive Alpha');
    });

    it('returns null for unknown hive ID', () => {
      startTestReview();
      expect(useEveningReviewStore.getState().getHive('nonexistent')).toBeNull();
    });

    it('returns null with no review', () => {
      expect(useEveningReviewStore.getState().getHive('h1')).toBeNull();
    });
  });

  describe('low confidence detection', () => {
    it('identifies low confidence observations for a hive', () => {
      startTestReview();
      const lowConf =
        useEveningReviewStore.getState().getLowConfidenceObservations('h1');

      expect(lowConf).toHaveLength(1);
      expect(lowConf[0].id).toBe('obs-low');
    });

    it('returns empty for hive with no low confidence observations', () => {
      startTestReview();
      const lowConf =
        useEveningReviewStore.getState().getLowConfidenceObservations('h2');

      expect(lowConf).toHaveLength(0);
    });

    it('gets all low confidence observations across hives', () => {
      startTestReview();
      const allLow =
        useEveningReviewStore.getState().getAllLowConfidenceObservations();

      expect(allLow).toHaveLength(1);
      expect(allLow[0].hiveId).toBe('h1');
      expect(allLow[0].hiveName).toBe('Hive Alpha');
      expect(allLow[0].observation.id).toBe('obs-low');
    });

    it('uses correct threshold', () => {
      expect(LOW_CONFIDENCE_THRESHOLD).toBe(0.7);
    });
  });

  describe('observation editing', () => {
    it('updates observation value', () => {
      startTestReview();
      useEveningReviewStore
        .getState()
        .updateObservation('h1', 'obs-low', { value: 'varroa mites detected' });

      const hive = useEveningReviewStore.getState().getHive('h1');
      const obs = hive!.observations.find((o) => o.id === 'obs-low');
      expect(obs!.value).toBe('varroa mites detected');
    });

    it('tracks edited observation IDs', () => {
      startTestReview();
      useEveningReviewStore
        .getState()
        .updateObservation('h1', 'obs-low', { value: 'corrected' });

      const hive = useEveningReviewStore.getState().getHive('h1');
      expect(hive!.editedObservationIds).toContain('obs-low');
    });

    it('does not duplicate edited observation IDs on multiple edits', () => {
      startTestReview();
      useEveningReviewStore
        .getState()
        .updateObservation('h1', 'obs-low', { value: 'first edit' });
      useEveningReviewStore
        .getState()
        .updateObservation('h1', 'obs-low', { value: 'second edit' });

      const hive = useEveningReviewStore.getState().getHive('h1');
      const count = hive!.editedObservationIds.filter(
        (id) => id === 'obs-low',
      ).length;
      expect(count).toBe(1);
    });
  });

  describe('hive review status', () => {
    it('marks a hive as reviewed', () => {
      startTestReview();
      useEveningReviewStore.getState().markHiveReviewed('h1');

      const hive = useEveningReviewStore.getState().getHive('h1');
      expect(hive!.reviewStatus).toBe('reviewed');
    });

    it('does not affect other hives', () => {
      startTestReview();
      useEveningReviewStore.getState().markHiveReviewed('h1');

      const hive2 = useEveningReviewStore.getState().getHive('h2');
      expect(hive2!.reviewStatus).toBe('pending');
    });
  });

  describe('progress tracking', () => {
    it('reports zero progress initially', () => {
      startTestReview();
      const progress = useEveningReviewStore.getState().getReviewProgress();
      expect(progress).toEqual({ reviewed: 0, total: 2, percentage: 0 });
    });

    it('reports progress after marking hives reviewed', () => {
      startTestReview();
      useEveningReviewStore.getState().markHiveReviewed('h1');

      const progress = useEveningReviewStore.getState().getReviewProgress();
      expect(progress).toEqual({ reviewed: 1, total: 2, percentage: 50 });
    });

    it('reports 100% when all hives reviewed', () => {
      startTestReview();
      useEveningReviewStore.getState().markHiveReviewed('h1');
      useEveningReviewStore.getState().markHiveReviewed('h2');

      const progress = useEveningReviewStore.getState().getReviewProgress();
      expect(progress).toEqual({ reviewed: 2, total: 2, percentage: 100 });
    });

    it('reports zero with no review', () => {
      const progress = useEveningReviewStore.getState().getReviewProgress();
      expect(progress).toEqual({ reviewed: 0, total: 0, percentage: 0 });
    });
  });
});

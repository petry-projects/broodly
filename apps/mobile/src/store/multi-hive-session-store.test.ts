import { useMultiHiveSessionStore } from './multi-hive-session-store';
import type { Observation } from '../features/inspection/types';

const makeObservation = (overrides: Partial<Observation> = {}): Observation => ({
  id: `obs-${Date.now()}-${Math.random()}`,
  promptId: 'entrance',
  observationType: 'entrance_assessment',
  value: 'normal',
  classification: 'normal',
  createdAt: new Date().toISOString(),
  ...overrides,
});

const TEST_HIVES = [
  { hiveId: 'h1', hiveName: 'Hive Alpha', lastHealthStatus: 'healthy' },
  { hiveId: 'h2', hiveName: 'Hive Beta', lastHealthStatus: 'attention' },
  { hiveId: 'h3', hiveName: 'Hive Gamma' },
];

function startTestSession() {
  useMultiHiveSessionStore.getState().startSession({
    sessionId: 'session-1',
    apiaryId: 'apiary-1',
    apiaryName: 'Test Apiary',
    hives: TEST_HIVES,
  });
}

beforeEach(() => {
  useMultiHiveSessionStore.getState().clearSession();
});

describe('Multi-hive session store', () => {
  describe('session lifecycle', () => {
    it('initializes with no active session', () => {
      expect(useMultiHiveSessionStore.getState().session).toBeNull();
      expect(useMultiHiveSessionStore.getState().hasActiveSession()).toBe(false);
    });

    it('starts a session with correct initial state', () => {
      startTestSession();
      const { session } = useMultiHiveSessionStore.getState();

      expect(session).not.toBeNull();
      expect(session!.sessionId).toBe('session-1');
      expect(session!.apiaryId).toBe('apiary-1');
      expect(session!.hives).toHaveLength(3);
      expect(session!.currentHiveIndex).toBe(0);
      expect(session!.status).toBe('in_progress');
      expect(session!.startedAt).toBeTruthy();
      expect(session!.completedAt).toBeNull();
    });

    it('sets first hive to in_progress and others to pending', () => {
      startTestSession();
      const { session } = useMultiHiveSessionStore.getState();

      expect(session!.hives[0].status).toBe('in_progress');
      expect(session!.hives[0].startedAt).toBeTruthy();
      expect(session!.hives[1].status).toBe('pending');
      expect(session!.hives[2].status).toBe('pending');
    });

    it('preserves health status and last inspection date', () => {
      startTestSession();
      const { session } = useMultiHiveSessionStore.getState();

      expect(session!.hives[0].lastHealthStatus).toBe('healthy');
      expect(session!.hives[1].lastHealthStatus).toBe('attention');
      expect(session!.hives[2].lastHealthStatus).toBeUndefined();
    });

    it('reports active session correctly', () => {
      startTestSession();
      expect(useMultiHiveSessionStore.getState().hasActiveSession()).toBe(true);
    });

    it('pauses and resumes session', () => {
      startTestSession();

      useMultiHiveSessionStore.getState().pauseSession();
      expect(useMultiHiveSessionStore.getState().session!.status).toBe('paused');
      expect(useMultiHiveSessionStore.getState().hasActiveSession()).toBe(true);

      useMultiHiveSessionStore.getState().resumeSession();
      expect(useMultiHiveSessionStore.getState().session!.status).toBe('in_progress');
    });

    it('completes session and marks in_progress hives as completed', () => {
      startTestSession();

      useMultiHiveSessionStore.getState().completeSession();
      const { session } = useMultiHiveSessionStore.getState();

      expect(session!.status).toBe('completed');
      expect(session!.completedAt).toBeTruthy();
      expect(session!.hives[0].status).toBe('completed');
      expect(useMultiHiveSessionStore.getState().hasActiveSession()).toBe(false);
    });

    it('clears session', () => {
      startTestSession();
      useMultiHiveSessionStore.getState().clearSession();
      expect(useMultiHiveSessionStore.getState().session).toBeNull();
    });
  });

  describe('hive navigation', () => {
    it('gets current hive', () => {
      startTestSession();
      const current = useMultiHiveSessionStore.getState().getCurrentHive();
      expect(current).not.toBeNull();
      expect(current!.hiveId).toBe('h1');
      expect(current!.hiveName).toBe('Hive Alpha');
    });

    it('navigates to next hive', () => {
      startTestSession();
      const next = useMultiHiveSessionStore.getState().nextHive();

      expect(next).not.toBeNull();
      expect(next!.hiveId).toBe('h2');
      expect(next!.status).toBe('in_progress');

      const { session } = useMultiHiveSessionStore.getState();
      expect(session!.currentHiveIndex).toBe(1);
      expect(session!.hives[0].status).toBe('completed');
    });

    it('returns null when no next hive', () => {
      startTestSession();
      useMultiHiveSessionStore.getState().nextHive();
      useMultiHiveSessionStore.getState().nextHive();
      const result = useMultiHiveSessionStore.getState().nextHive();
      expect(result).toBeNull();
    });

    it('navigates to previous hive', () => {
      startTestSession();
      useMultiHiveSessionStore.getState().nextHive();
      const prev = useMultiHiveSessionStore.getState().previousHive();

      expect(prev).not.toBeNull();
      expect(prev!.hiveId).toBe('h1');
      expect(prev!.status).toBe('in_progress');
    });

    it('returns null when no previous hive', () => {
      startTestSession();
      const result = useMultiHiveSessionStore.getState().previousHive();
      expect(result).toBeNull();
    });

    it('navigates to a specific hive by ID', () => {
      startTestSession();
      const target = useMultiHiveSessionStore.getState().goToHive('h3');

      expect(target).not.toBeNull();
      expect(target!.hiveId).toBe('h3');
      expect(target!.status).toBe('in_progress');
      expect(useMultiHiveSessionStore.getState().session!.currentHiveIndex).toBe(2);
    });

    it('navigates to a specific hive by name (case-insensitive)', () => {
      startTestSession();
      const target = useMultiHiveSessionStore.getState().goToHive('hive beta');

      expect(target).not.toBeNull();
      expect(target!.hiveId).toBe('h2');
    });

    it('returns null for unknown hive', () => {
      startTestSession();
      const result = useMultiHiveSessionStore.getState().goToHive('nonexistent');
      expect(result).toBeNull();
    });

    it('gets hive by index', () => {
      startTestSession();
      const hive = useMultiHiveSessionStore.getState().getHiveByIndex(1);
      expect(hive).not.toBeNull();
      expect(hive!.hiveId).toBe('h2');
    });

    it('gets hive by ID', () => {
      startTestSession();
      const hive = useMultiHiveSessionStore.getState().getHiveById('h3');
      expect(hive).not.toBeNull();
      expect(hive!.hiveName).toBe('Hive Gamma');
    });
  });

  describe('observations', () => {
    it('adds observation to current hive', () => {
      startTestSession();
      const obs = makeObservation({ id: 'obs-1' });
      useMultiHiveSessionStore.getState().addObservationToCurrentHive(obs);

      const current = useMultiHiveSessionStore.getState().getCurrentHive();
      expect(current!.observations).toHaveLength(1);
      expect(current!.observations[0].id).toBe('obs-1');
      expect(useMultiHiveSessionStore.getState().session!.totalObservations).toBe(1);
    });

    it('updates observation in current hive', () => {
      startTestSession();
      const obs = makeObservation({ id: 'obs-1', value: 'normal' });
      useMultiHiveSessionStore.getState().addObservationToCurrentHive(obs);

      useMultiHiveSessionStore
        .getState()
        .updateObservationInCurrentHive('obs-1', {
          value: 'reduced',
          classification: 'cautionary',
        });

      const current = useMultiHiveSessionStore.getState().getCurrentHive();
      expect(current!.observations[0].value).toBe('reduced');
      expect(current!.observations[0].classification).toBe('cautionary');
    });

    it('observations stay with their hive after navigation', () => {
      startTestSession();
      const obs = makeObservation({ id: 'obs-h1' });
      useMultiHiveSessionStore.getState().addObservationToCurrentHive(obs);

      useMultiHiveSessionStore.getState().nextHive();
      const obsH2 = makeObservation({ id: 'obs-h2' });
      useMultiHiveSessionStore.getState().addObservationToCurrentHive(obsH2);

      const hive1 = useMultiHiveSessionStore.getState().getHiveById('h1');
      const hive2 = useMultiHiveSessionStore.getState().getHiveById('h2');
      expect(hive1!.observations).toHaveLength(1);
      expect(hive1!.observations[0].id).toBe('obs-h1');
      expect(hive2!.observations).toHaveLength(1);
      expect(hive2!.observations[0].id).toBe('obs-h2');
    });
  });

  describe('hive status', () => {
    it('marks current hive complete', () => {
      startTestSession();
      useMultiHiveSessionStore.getState().markCurrentHiveComplete();

      const current = useMultiHiveSessionStore.getState().getCurrentHive();
      expect(current!.status).toBe('completed');
      expect(current!.completedAt).toBeTruthy();
    });

    it('skips current hive', () => {
      startTestSession();
      useMultiHiveSessionStore.getState().skipCurrentHive();

      const current = useMultiHiveSessionStore.getState().getCurrentHive();
      expect(current!.status).toBe('skipped');
    });
  });

  describe('progress tracking', () => {
    it('reports zero progress initially', () => {
      startTestSession();
      const progress = useMultiHiveSessionStore.getState().getSessionProgress();
      expect(progress).toEqual({ completed: 0, total: 3, percentage: 0 });
    });

    it('reports progress after completing hives', () => {
      startTestSession();
      useMultiHiveSessionStore.getState().markCurrentHiveComplete();
      useMultiHiveSessionStore.getState().nextHive();
      useMultiHiveSessionStore.getState().skipCurrentHive();

      const progress = useMultiHiveSessionStore.getState().getSessionProgress();
      expect(progress).toEqual({ completed: 2, total: 3, percentage: 67 });
    });

    it('reports zero when no session', () => {
      const progress = useMultiHiveSessionStore.getState().getSessionProgress();
      expect(progress).toEqual({ completed: 0, total: 0, percentage: 0 });
    });
  });

  describe('null safety', () => {
    it('returns null for getCurrentHive with no session', () => {
      expect(useMultiHiveSessionStore.getState().getCurrentHive()).toBeNull();
    });

    it('returns null for nextHive with no session', () => {
      expect(useMultiHiveSessionStore.getState().nextHive()).toBeNull();
    });

    it('returns null for previousHive with no session', () => {
      expect(useMultiHiveSessionStore.getState().previousHive()).toBeNull();
    });

    it('returns null for goToHive with no session', () => {
      expect(useMultiHiveSessionStore.getState().goToHive('h1')).toBeNull();
    });

    it('does not throw for addObservation with no session', () => {
      expect(() =>
        useMultiHiveSessionStore
          .getState()
          .addObservationToCurrentHive(makeObservation()),
      ).not.toThrow();
    });
  });
});

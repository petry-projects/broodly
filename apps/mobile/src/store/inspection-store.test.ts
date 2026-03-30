import { useInspectionStore } from './inspection-store';

beforeEach(() => {
  useInspectionStore.getState().clearInspection();
});

describe('Inspection store', () => {
  it('initializes with no active inspection', () => {
    const state = useInspectionStore.getState();
    expect(state.inspectionId).toBeNull();
    expect(state.observations).toEqual([]);
    expect(state.hasActiveInspection()).toBe(false);
  });

  it('starts an inspection with correct state', () => {
    useInspectionStore.getState().startInspection({
      inspectionId: 'insp-1',
      hiveId: 'hive-1',
      hiveName: 'Test Hive',
      type: 'full',
    });

    const state = useInspectionStore.getState();
    expect(state.inspectionId).toBe('insp-1');
    expect(state.hiveId).toBe('hive-1');
    expect(state.type).toBe('full');
    expect(state.status).toBe('in_progress');
    expect(state.startedAt).toBeTruthy();
    expect(state.hasActiveInspection()).toBe(true);
  });

  it('adds observations incrementally', () => {
    useInspectionStore.getState().startInspection({
      inspectionId: 'insp-1',
      hiveId: 'hive-1',
      hiveName: 'Test Hive',
      type: 'full',
    });

    useInspectionStore.getState().addObservation({
      id: 'obs-1',
      promptId: 'entrance',
      observationType: 'entrance_assessment',
      value: 'normal',
      classification: 'normal',
      createdAt: new Date().toISOString(),
    });

    expect(useInspectionStore.getState().observations).toHaveLength(1);
    expect(useInspectionStore.getState().observations[0].value).toBe('normal');
  });

  it('updates an existing observation', () => {
    useInspectionStore.getState().startInspection({
      inspectionId: 'insp-1',
      hiveId: 'hive-1',
      hiveName: 'Test Hive',
      type: 'full',
    });

    useInspectionStore.getState().addObservation({
      id: 'obs-1',
      promptId: 'entrance',
      observationType: 'entrance_assessment',
      value: 'normal',
      classification: 'normal',
      createdAt: new Date().toISOString(),
    });

    useInspectionStore.getState().updateObservation('obs-1', {
      value: 'reduced',
      classification: 'cautionary',
    });

    const obs = useInspectionStore.getState().observations[0];
    expect(obs.value).toBe('reduced');
    expect(obs.classification).toBe('cautionary');
    expect(obs.promptId).toBe('entrance');
  });

  it('pauses and resumes inspection', () => {
    useInspectionStore.getState().startInspection({
      inspectionId: 'insp-1',
      hiveId: 'hive-1',
      hiveName: 'Test Hive',
      type: 'full',
    });

    useInspectionStore.getState().pauseInspection();
    expect(useInspectionStore.getState().status).toBe('paused');
    expect(useInspectionStore.getState().hasActiveInspection()).toBe(true);

    useInspectionStore.getState().resumeInspection();
    expect(useInspectionStore.getState().status).toBe('in_progress');
  });

  it('completes and clears inspection', () => {
    useInspectionStore.getState().startInspection({
      inspectionId: 'insp-1',
      hiveId: 'hive-1',
      hiveName: 'Test Hive',
      type: 'quick',
    });

    useInspectionStore.getState().completeInspection();
    expect(useInspectionStore.getState().status).toBe('completed');
    expect(useInspectionStore.getState().hasActiveInspection()).toBe(false);

    useInspectionStore.getState().clearInspection();
    expect(useInspectionStore.getState().inspectionId).toBeNull();
  });

  it('tracks prompt index', () => {
    useInspectionStore.getState().setPromptIndex(3);
    expect(useInspectionStore.getState().currentPromptIndex).toBe(3);
  });

  it('tracks safety acknowledgment', () => {
    expect(useInspectionStore.getState().safetyAcknowledged).toBe(false);
    useInspectionStore.getState().setSafetyAcknowledged();
    expect(useInspectionStore.getState().safetyAcknowledged).toBe(true);
  });
});

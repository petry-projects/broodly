import { useOnboardingStore, getResumeRoute } from './onboarding-store';

beforeEach(() => {
  useOnboardingStore.getState().reset();
});

describe('Onboarding store', () => {
  it('initializes with step 0', () => {
    expect(useOnboardingStore.getState().currentStep).toBe(0);
  });

  it('initializes with null values', () => {
    const state = useOnboardingStore.getState();
    expect(state.experienceLevel).toBeNull();
    expect(state.region).toBeNull();
    expect(state.apiary).toBeNull();
    expect(state.interactionMode).toBeNull();
    expect(state.onboardingCompletedAt).toBeNull();
  });

  it('setStep updates current step', () => {
    useOnboardingStore.getState().setStep(3);
    expect(useOnboardingStore.getState().currentStep).toBe(3);
  });

  it('setExperienceLevel updates value', () => {
    useOnboardingStore.getState().setExperienceLevel('amateur');
    expect(useOnboardingStore.getState().experienceLevel).toBe('amateur');
  });

  it('setRegion updates value', () => {
    useOnboardingStore.getState().setRegion('Pacific Northwest');
    expect(useOnboardingStore.getState().region).toBe('Pacific Northwest');
  });

  it('setApiary updates value', () => {
    const apiary = { name: 'Backyard', locationLat: 45.5, locationLng: -122.6, hiveCount: 3 };
    useOnboardingStore.getState().setApiary(apiary);
    expect(useOnboardingStore.getState().apiary).toEqual(apiary);
  });

  it('setGoals updates array', () => {
    useOnboardingStore.getState().setGoals(['health', 'honey']);
    expect(useOnboardingStore.getState().goals).toEqual(['health', 'honey']);
  });

  it('setInteractionMode updates value', () => {
    useOnboardingStore.getState().setInteractionMode('voice_first');
    expect(useOnboardingStore.getState().interactionMode).toBe('voice_first');
  });

  it('setTosAccepted updates value', () => {
    useOnboardingStore.getState().setTosAccepted(true);
    expect(useOnboardingStore.getState().tosAccepted).toBe(true);
  });

  it('setDisclaimerAccepted sets timestamp', () => {
    useOnboardingStore.getState().setDisclaimerAccepted();
    expect(useOnboardingStore.getState().disclaimerAcceptedAt).not.toBeNull();
  });

  it('setOnboardingCompleted sets timestamp', () => {
    useOnboardingStore.getState().setOnboardingCompleted();
    expect(useOnboardingStore.getState().onboardingCompletedAt).not.toBeNull();
  });

  it('reset restores initial state', () => {
    useOnboardingStore.getState().setStep(5);
    useOnboardingStore.getState().setExperienceLevel('sideliner');
    useOnboardingStore.getState().setGoals(['health']);
    useOnboardingStore.getState().reset();

    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.experienceLevel).toBeNull();
    expect(state.goals).toEqual([]);
  });

  it('setMidSeasonBaseline updates value', () => {
    const baseline = {
      queenPresentAndLaying: true,
      colonyStrengthModerateOrStrong: false,
      treatmentsAppliedThisSeason: true,
      honeySupersOn: false,
      healthConcernsObserved: true,
    };
    useOnboardingStore.getState().setMidSeasonBaseline(baseline);
    expect(useOnboardingStore.getState().midSeasonBaseline).toEqual(baseline);
  });
});

describe('getResumeRoute', () => {
  it('returns onboarding root for step 0', () => {
    expect(getResumeRoute(0)).toBe('/(onboarding)');
  });

  it('returns create-account for step 1', () => {
    expect(getResumeRoute(1)).toBe('/(onboarding)/create-account');
  });

  it('returns experience-level for step 2', () => {
    expect(getResumeRoute(2)).toBe('/(onboarding)/experience-level');
  });

  it('returns disclaimer for step 6', () => {
    expect(getResumeRoute(6)).toBe('/(onboarding)/disclaimer');
  });

  it('returns summary for step 7', () => {
    expect(getResumeRoute(7)).toBe('/(onboarding)/summary');
  });

  it('returns root for unknown step', () => {
    expect(getResumeRoute(99)).toBe('/(onboarding)');
  });

  it('returns root for negative step', () => {
    expect(getResumeRoute(-1)).toBe('/(onboarding)');
  });

  it('returns root for step 8 (beyond max)', () => {
    expect(getResumeRoute(8)).toBe('/(onboarding)');
  });

  it('maps all steps 0 through 7 to valid routes', () => {
    for (let step = 0; step <= 7; step++) {
      const route = getResumeRoute(step);
      expect(route).toMatch(/^\/\(onboarding\)/);
    }
  });
});

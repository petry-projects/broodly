import { useUIStore } from './ui-store';

beforeEach(() => {
  useUIStore.setState({
    onboardingComplete: false,
    activeApiaryId: null,
  });
});

describe('UI store', () => {
  it('initializes with onboardingComplete: false', () => {
    expect(useUIStore.getState().onboardingComplete).toBe(false);
  });

  it('initializes with activeApiaryId: null', () => {
    expect(useUIStore.getState().activeApiaryId).toBeNull();
  });

  it('setOnboardingComplete updates the value', () => {
    useUIStore.getState().setOnboardingComplete(true);
    expect(useUIStore.getState().onboardingComplete).toBe(true);
  });

  it('setOnboardingComplete can toggle back to false', () => {
    useUIStore.getState().setOnboardingComplete(true);
    useUIStore.getState().setOnboardingComplete(false);
    expect(useUIStore.getState().onboardingComplete).toBe(false);
  });

  it('setActiveApiaryId updates the value', () => {
    useUIStore.getState().setActiveApiaryId('apiary-123');
    expect(useUIStore.getState().activeApiaryId).toBe('apiary-123');
  });

  it('setActiveApiaryId can be set to null', () => {
    useUIStore.getState().setActiveApiaryId('apiary-123');
    useUIStore.getState().setActiveApiaryId(null);
    expect(useUIStore.getState().activeApiaryId).toBeNull();
  });
});

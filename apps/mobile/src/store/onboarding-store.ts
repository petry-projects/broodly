import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';

export type ExperienceLevel = 'newbie' | 'amateur' | 'sideliner';
export type InteractionMode = 'voice_first' | 'tap_and_read';

export interface OnboardingApiary {
  name: string;
  locationLat: number | null;
  locationLng: number | null;
  hiveCount: number;
}

export interface SeasonalContext {
  hemisphere: 'northern' | 'southern';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  isMidSeason: boolean;
}

export interface MidSeasonBaseline {
  queenPresentAndLaying: boolean;
  colonyStrengthModerateOrStrong: boolean;
  treatmentsAppliedThisSeason: boolean;
  honeySupersOn: boolean;
  healthConcernsObserved: boolean;
}

interface OnboardingState {
  currentStep: number;
  email: string | null;
  displayName: string | null;
  experienceLevel: ExperienceLevel | null;
  region: string | null;
  seasonalContext: SeasonalContext | null;
  apiary: OnboardingApiary | null;
  goals: string[];
  interactionMode: InteractionMode | null;
  midSeasonBaseline: MidSeasonBaseline | null;
  disclaimerAcceptedAt: string | null;
  onboardingCompletedAt: string | null;
  tosAccepted: boolean;

  setStep: (step: number) => void;
  setEmail: (email: string) => void;
  setDisplayName: (name: string) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setRegion: (region: string) => void;
  setSeasonalContext: (ctx: SeasonalContext) => void;
  setApiary: (apiary: OnboardingApiary) => void;
  setGoals: (goals: string[]) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setMidSeasonBaseline: (baseline: MidSeasonBaseline) => void;
  setDisclaimerAccepted: () => void;
  setOnboardingCompleted: () => void;
  setTosAccepted: (accepted: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  email: null as string | null,
  displayName: null as string | null,
  experienceLevel: null as ExperienceLevel | null,
  region: null as string | null,
  seasonalContext: null as SeasonalContext | null,
  apiary: null as OnboardingApiary | null,
  goals: [] as string[],
  interactionMode: null as InteractionMode | null,
  midSeasonBaseline: null as MidSeasonBaseline | null,
  disclaimerAcceptedAt: null as string | null,
  onboardingCompletedAt: null as string | null,
  tosAccepted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setEmail: (email) => set({ email }),
      setDisplayName: (name) => set({ displayName: name }),
      setExperienceLevel: (level) => set({ experienceLevel: level }),
      setRegion: (region) => set({ region }),
      setSeasonalContext: (ctx) => set({ seasonalContext: ctx }),
      setApiary: (apiary) => set({ apiary }),
      setGoals: (goals) => set({ goals }),
      setInteractionMode: (mode) => set({ interactionMode: mode }),
      setMidSeasonBaseline: (baseline) => set({ midSeasonBaseline: baseline }),
      setDisclaimerAccepted: () =>
        set({ disclaimerAcceptedAt: new Date().toISOString() }),
      setOnboardingCompleted: () =>
        set({ onboardingCompletedAt: new Date().toISOString() }),
      setTosAccepted: (accepted) => set({ tosAccepted: accepted }),
      reset: () => set(initialState),
    }),
    {
      name: 'broodly-onboarding',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Maps currentStep to the onboarding route for resume functionality.
 */
export function getResumeRoute(step: number): string {
  const routes: Record<number, string> = {
    0: '/(onboarding)',
    1: '/(onboarding)/create-account',
    2: '/(onboarding)/experience-level',
    3: '/(onboarding)/region-setup',
    4: '/(onboarding)/apiary-setup',
    5: '/(onboarding)/goal-selection',
    6: '/(onboarding)/disclaimer',
    7: '/(onboarding)/summary',
  };
  return routes[step] ?? '/(onboarding)';
}

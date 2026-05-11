import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';

interface UIState {
  onboardingComplete: boolean;
  activeApiaryId: string | null;
  setOnboardingComplete: (complete: boolean) => void;
  setActiveApiaryId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      activeApiaryId: null,

      setOnboardingComplete: (complete: boolean) =>
        set({ onboardingComplete: complete }),

      setActiveApiaryId: (id: string | null) =>
        set({ activeApiaryId: id }),
    }),
    {
      name: 'broodly-ui-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

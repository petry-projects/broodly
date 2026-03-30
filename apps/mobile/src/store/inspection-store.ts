import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';
import type {
  InspectionType,
  InspectionStatus,
  Observation,
} from '../features/inspection/types';

interface InspectionStoreState {
  inspectionId: string | null;
  hiveId: string | null;
  hiveName: string | null;
  type: InspectionType | null;
  status: InspectionStatus;
  currentPromptIndex: number;
  observations: Observation[];
  startedAt: string | null;
  safetyAcknowledged: boolean;

  startInspection: (params: {
    inspectionId: string;
    hiveId: string;
    hiveName: string;
    type: InspectionType;
  }) => void;
  addObservation: (observation: Observation) => void;
  updateObservation: (id: string, updates: Partial<Observation>) => void;
  setPromptIndex: (index: number) => void;
  setSafetyAcknowledged: () => void;
  pauseInspection: () => void;
  resumeInspection: () => void;
  completeInspection: () => void;
  clearInspection: () => void;
  hasActiveInspection: () => boolean;
}

export const useInspectionStore = create<InspectionStoreState>()(
  persist(
    (set, get) => ({
      inspectionId: null,
      hiveId: null,
      hiveName: null,
      type: null,
      status: 'in_progress' as InspectionStatus,
      currentPromptIndex: 0,
      observations: [],
      startedAt: null,
      safetyAcknowledged: false,

      startInspection: ({ inspectionId, hiveId, hiveName, type }) =>
        set({
          inspectionId,
          hiveId,
          hiveName,
          type,
          status: 'in_progress',
          currentPromptIndex: 0,
          observations: [],
          startedAt: new Date().toISOString(),
          safetyAcknowledged: false,
        }),

      addObservation: (observation) =>
        set((state) => ({
          observations: [...state.observations, observation],
        })),

      updateObservation: (id, updates) =>
        set((state) => ({
          observations: state.observations.map((o) =>
            o.id === id ? { ...o, ...updates } : o,
          ),
        })),

      setPromptIndex: (index) => set({ currentPromptIndex: index }),

      setSafetyAcknowledged: () => set({ safetyAcknowledged: true }),

      pauseInspection: () => set({ status: 'paused' }),

      resumeInspection: () => set({ status: 'in_progress' }),

      completeInspection: () => set({ status: 'completed' }),

      clearInspection: () =>
        set({
          inspectionId: null,
          hiveId: null,
          hiveName: null,
          type: null,
          status: 'in_progress',
          currentPromptIndex: 0,
          observations: [],
          startedAt: null,
          safetyAcknowledged: false,
        }),

      hasActiveInspection: () => {
        const state = get();
        return state.inspectionId !== null && state.status !== 'completed';
      },
    }),
    {
      name: 'broodly-inspection',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv-storage';
import type { Observation } from '../features/inspection/types';

export type MultiHiveSessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed';

export type HiveInspectionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped';

export interface SessionHive {
  hiveId: string;
  hiveName: string;
  /** Position in the inspection order (0-indexed) */
  orderIndex: number;
  status: HiveInspectionStatus;
  observations: Observation[];
  startedAt: string | null;
  completedAt: string | null;
  /** Last known health status for context during transitions */
  lastHealthStatus?: string;
  /** Date of last inspection for context */
  lastInspectionDate?: string;
}

export interface MultiHiveSession {
  sessionId: string;
  apiaryId: string;
  apiaryName: string;
  hives: SessionHive[];
  currentHiveIndex: number;
  status: MultiHiveSessionStatus;
  startedAt: string;
  completedAt: string | null;
  /** Total observations across all hives */
  totalObservations: number;
}

interface MultiHiveSessionState {
  session: MultiHiveSession | null;

  startSession: (params: {
    sessionId: string;
    apiaryId: string;
    apiaryName: string;
    hives: Array<{
      hiveId: string;
      hiveName: string;
      lastHealthStatus?: string;
      lastInspectionDate?: string;
    }>;
  }) => void;

  getCurrentHive: () => SessionHive | null;
  getHiveByIndex: (index: number) => SessionHive | null;
  getHiveById: (hiveId: string) => SessionHive | null;

  nextHive: () => SessionHive | null;
  previousHive: () => SessionHive | null;
  goToHive: (hiveId: string) => SessionHive | null;

  addObservationToCurrentHive: (observation: Observation) => void;
  updateObservationInCurrentHive: (
    observationId: string,
    updates: Partial<Observation>,
  ) => void;

  markCurrentHiveComplete: () => void;
  skipCurrentHive: () => void;

  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  clearSession: () => void;

  hasActiveSession: () => boolean;
  getSessionProgress: () => { completed: number; total: number; percentage: number };
}

export const useMultiHiveSessionStore = create<MultiHiveSessionState>()(
  persist(
    (set, get) => ({
      session: null,

      startSession: ({ sessionId, apiaryId, apiaryName, hives }) => {
        const sessionHives: SessionHive[] = hives.map((h, index) => ({
          hiveId: h.hiveId,
          hiveName: h.hiveName,
          orderIndex: index,
          status: index === 0 ? 'in_progress' : 'pending',
          observations: [],
          startedAt: index === 0 ? new Date().toISOString() : null,
          completedAt: null,
          lastHealthStatus: h.lastHealthStatus,
          lastInspectionDate: h.lastInspectionDate,
        }));

        set({
          session: {
            sessionId,
            apiaryId,
            apiaryName,
            hives: sessionHives,
            currentHiveIndex: 0,
            status: 'in_progress',
            startedAt: new Date().toISOString(),
            completedAt: null,
            totalObservations: 0,
          },
        });
      },

      getCurrentHive: () => {
        const { session } = get();
        if (!session) return null;
        return session.hives[session.currentHiveIndex] ?? null;
      },

      getHiveByIndex: (index) => {
        const { session } = get();
        if (!session) return null;
        return session.hives[index] ?? null;
      },

      getHiveById: (hiveId) => {
        const { session } = get();
        if (!session) return null;
        return session.hives.find((h) => h.hiveId === hiveId) ?? null;
      },

      nextHive: () => {
        const { session } = get();
        if (!session) return null;

        const nextIndex = session.currentHiveIndex + 1;
        if (nextIndex >= session.hives.length) return null;

        const updatedHives = [...session.hives];
        // Mark current hive as completed if still in_progress
        if (updatedHives[session.currentHiveIndex].status === 'in_progress') {
          updatedHives[session.currentHiveIndex] = {
            ...updatedHives[session.currentHiveIndex],
            status: 'completed',
            completedAt: new Date().toISOString(),
          };
        }
        // Start the next hive
        updatedHives[nextIndex] = {
          ...updatedHives[nextIndex],
          status: 'in_progress',
          startedAt: new Date().toISOString(),
        };

        set({
          session: {
            ...session,
            hives: updatedHives,
            currentHiveIndex: nextIndex,
          },
        });

        return updatedHives[nextIndex];
      },

      previousHive: () => {
        const { session } = get();
        if (!session) return null;

        const prevIndex = session.currentHiveIndex - 1;
        if (prevIndex < 0) return null;

        const updatedHives = [...session.hives];
        // Re-open previous hive
        updatedHives[prevIndex] = {
          ...updatedHives[prevIndex],
          status: 'in_progress',
          completedAt: null,
        };

        set({
          session: {
            ...session,
            hives: updatedHives,
            currentHiveIndex: prevIndex,
          },
        });

        return updatedHives[prevIndex];
      },

      goToHive: (hiveId) => {
        const { session } = get();
        if (!session) return null;

        const targetIndex = session.hives.findIndex(
          (h) => h.hiveId === hiveId || h.hiveName.toLowerCase() === hiveId.toLowerCase(),
        );
        if (targetIndex === -1) return null;

        const updatedHives = [...session.hives];
        updatedHives[targetIndex] = {
          ...updatedHives[targetIndex],
          status: 'in_progress',
          startedAt: updatedHives[targetIndex].startedAt ?? new Date().toISOString(),
          completedAt: null,
        };

        set({
          session: {
            ...session,
            hives: updatedHives,
            currentHiveIndex: targetIndex,
          },
        });

        return updatedHives[targetIndex];
      },

      addObservationToCurrentHive: (observation) => {
        const { session } = get();
        if (!session) return;

        const idx = session.currentHiveIndex;
        const updatedHives = [...session.hives];
        updatedHives[idx] = {
          ...updatedHives[idx],
          observations: [...updatedHives[idx].observations, observation],
        };

        set({
          session: {
            ...session,
            hives: updatedHives,
            totalObservations: session.totalObservations + 1,
          },
        });
      },

      updateObservationInCurrentHive: (observationId, updates) => {
        const { session } = get();
        if (!session) return;

        const idx = session.currentHiveIndex;
        const updatedHives = [...session.hives];
        updatedHives[idx] = {
          ...updatedHives[idx],
          observations: updatedHives[idx].observations.map((o) =>
            o.id === observationId ? { ...o, ...updates } : o,
          ),
        };

        set({
          session: { ...session, hives: updatedHives },
        });
      },

      markCurrentHiveComplete: () => {
        const { session } = get();
        if (!session) return;

        const idx = session.currentHiveIndex;
        const updatedHives = [...session.hives];
        updatedHives[idx] = {
          ...updatedHives[idx],
          status: 'completed',
          completedAt: new Date().toISOString(),
        };

        set({
          session: { ...session, hives: updatedHives },
        });
      },

      skipCurrentHive: () => {
        const { session } = get();
        if (!session) return;

        const idx = session.currentHiveIndex;
        const updatedHives = [...session.hives];
        updatedHives[idx] = {
          ...updatedHives[idx],
          status: 'skipped',
          completedAt: new Date().toISOString(),
        };

        set({
          session: { ...session, hives: updatedHives },
        });
      },

      pauseSession: () => {
        const { session } = get();
        if (!session) return;
        set({ session: { ...session, status: 'paused' } });
      },

      resumeSession: () => {
        const { session } = get();
        if (!session) return;
        set({ session: { ...session, status: 'in_progress' } });
      },

      completeSession: () => {
        const { session } = get();
        if (!session) return;

        // Mark any in_progress hive as completed
        const updatedHives = session.hives.map((h) =>
          h.status === 'in_progress'
            ? { ...h, status: 'completed' as const, completedAt: new Date().toISOString() }
            : h,
        );

        set({
          session: {
            ...session,
            hives: updatedHives,
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        });
      },

      clearSession: () => set({ session: null }),

      hasActiveSession: () => {
        const { session } = get();
        return session !== null && session.status !== 'completed';
      },

      getSessionProgress: () => {
        const { session } = get();
        if (!session) return { completed: 0, total: 0, percentage: 0 };

        const completed = session.hives.filter(
          (h) => h.status === 'completed' || h.status === 'skipped',
        ).length;
        const total = session.hives.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percentage };
      },
    }),
    {
      name: 'broodly-multi-hive-session',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

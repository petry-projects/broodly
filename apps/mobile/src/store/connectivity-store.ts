import { create } from 'zustand';

interface ConnectivityState {
  isOnline: boolean;
  lastOfflineAt: Date | null;
  setOnline: () => void;
  setOffline: () => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: true,
  lastOfflineAt: null,

  setOnline: () => set({ isOnline: true }),

  setOffline: () =>
    set({ isOnline: false, lastOfflineAt: new Date() }),
}));

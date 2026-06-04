import { create } from 'zustand';

interface ConnectivityState {
  isOnline: boolean;
  lastOnlineAt: Date | null;
  setOnline: () => void;
  setOffline: () => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: true,
  lastOnlineAt: null,

  setOnline: () => set({ isOnline: true }),

  setOffline: () =>
    set({ isOnline: false, lastOnlineAt: new Date() }),
}));

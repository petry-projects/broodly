import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = createMMKV({ id: 'broodly-zustand' });

/**
 * Zustand StateStorage adapter backed by MMKV.
 * Used for persisting UI preferences (onboarding state, active apiary).
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => { mmkv.remove(name); },
};

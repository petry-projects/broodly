import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'fake-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'localhost',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'broodly-dev',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const webAuth = getAuth(app);

const useEmulator = process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR === 'true';
if (useEmulator) {
  const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? 'http://127.0.0.1:9099';
  connectAuthEmulator(webAuth, emulatorHost, { disableWarnings: true });
}

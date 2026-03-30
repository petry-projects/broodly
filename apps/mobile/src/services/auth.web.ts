import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signOut as fbSignOut,
} from 'firebase/auth';
import { webAuth } from '../platform/firebase-web';
import { mapFirebaseError } from './auth/error-messages';

export { mapFirebaseError } from './auth/error-messages';

/** Timeout a promise after ms milliseconds. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject({ code: 'auth/timeout', message: `${label} timed out. Please try again.` }),
      ms,
    );
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * Attempt popup sign-in, falling back to redirect if popup is blocked.
 * Includes a 15-second timeout to prevent silent hangs.
 */
async function signInWithProvider(provider: GoogleAuthProvider | OAuthProvider | FacebookAuthProvider) {
  try {
    const timeout = process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR === 'true' ? 5_000 : 15_000;
    return await withTimeout(
      signInWithPopup(webAuth, provider),
      timeout,
      'Sign-in',
    );
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = (error as { message?: string }).message ?? mapFirebaseError(code ?? '');
    throw { code: code ?? 'auth/unknown', message };
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithProvider(provider);
}

export async function signInWithApple() {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return signInWithProvider(provider);
}

export async function signInWithFacebook() {
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  return signInWithProvider(provider);
}

export async function signOut(): Promise<void> {
  await fbSignOut(webAuth);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const currentUser = webAuth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken(forceRefresh);
}

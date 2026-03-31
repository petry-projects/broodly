import { onAuthStateChanged } from 'firebase/auth';
import { webAuth } from '../platform/firebase-web';
import { useAuthStore } from '../store/auth-store';

export function subscribeToAuthState(): () => void {
  return onAuthStateChanged(webAuth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(false);
        useAuthStore.getState().setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? null,
          idToken,
        });
      } else {
        useAuthStore.getState().clearUser();
      }
    } catch {
      useAuthStore.getState().clearUser();
      useAuthStore.getState().setError('Failed to restore session. Please sign in again.');
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  });
}

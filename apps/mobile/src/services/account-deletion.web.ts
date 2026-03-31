import { deleteUser } from 'firebase/auth';
import { webAuth } from '../platform/firebase-web';
import { mapFirebaseError } from './auth/error-messages';
import { useAuthStore } from '../store/auth-store';

export async function deleteAccount(): Promise<void> {
  const currentUser = webAuth.currentUser;
  if (!currentUser) {
    throw new Error('No user signed in');
  }

  try {
    await deleteUser(currentUser);
    useAuthStore.getState().clearUser();
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    if (code === 'auth/requires-recent-login') {
      throw new Error('Please sign in again before deleting your account.');
    }
    throw new Error(mapFirebaseError(code));
  }
}

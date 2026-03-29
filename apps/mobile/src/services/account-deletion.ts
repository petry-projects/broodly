import auth from '@react-native-firebase/auth';
import { mapFirebaseError } from './auth';
import { useAuthStore } from '../store/auth-store';

export async function deleteAccount(): Promise<void> {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No user signed in');
  }

  try {
    await currentUser.delete();
    useAuthStore.getState().clearUser();
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    if (code === 'auth/requires-recent-login') {
      throw new Error('Please sign in again before deleting your account.');
    }
    throw new Error(mapFirebaseError(code));
  }
}

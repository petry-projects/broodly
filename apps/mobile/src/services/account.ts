import auth from '@react-native-firebase/auth';
import { mapFirebaseError } from './auth';
import { useAuthStore } from '../store/auth-store';

export async function updateDisplayName(name: string): Promise<void> {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No user signed in');
  }

  try {
    await currentUser.updateProfile({ displayName: name });
    const state = useAuthStore.getState();
    if (state.user) {
      useAuthStore.getState().setUser({ ...state.user, displayName: name });
    }
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    throw new Error(mapFirebaseError(code));
  }
}

export function getLinkedProvider(): string {
  const currentUser = auth().currentUser;
  if (!currentUser || !currentUser.providerData || currentUser.providerData.length === 0) {
    return 'unknown';
  }
  return currentUser.providerData[0].providerId;
}

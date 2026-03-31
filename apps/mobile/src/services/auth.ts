import auth, { firebase } from '@react-native-firebase/auth';
import { mapFirebaseError } from './auth/error-messages';

export { mapFirebaseError } from './auth/error-messages';

function handleFirebaseError(error: unknown): never {
  const code = (error as { code?: string }).code ?? '';
  throw new Error(mapFirebaseError(code));
}

export async function signInWithGoogle(googleIdToken?: string) {
  try {
    const credential = firebase.auth.GoogleAuthProvider.credential(googleIdToken);
    return await auth().signInWithCredential(credential);
  } catch (error) {
    handleFirebaseError(error);
  }
}

export async function signInWithApple(appleIdToken?: string, nonce?: string) {
  try {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    const credential = provider.credential(appleIdToken, nonce);
    return await auth().signInWithCredential(credential);
  } catch (error) {
    handleFirebaseError(error);
  }
}

export async function signOut(): Promise<void> {
  await auth().signOut();
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const currentUser = auth().currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken(forceRefresh);
}

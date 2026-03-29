import auth, { firebase } from '@react-native-firebase/auth';

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with the same email. Try signing in with a different provider.',
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
};

export function mapFirebaseError(code: string): string {
  return FIREBASE_ERROR_MAP[code] ?? 'Something went wrong. Please try again.';
}

function handleFirebaseError(error: unknown): never {
  const code = (error as { code?: string }).code ?? '';
  throw new Error(mapFirebaseError(code));
}

export async function signInWithGoogle(googleIdToken: string) {
  try {
    const credential = firebase.auth.GoogleAuthProvider.credential(googleIdToken);
    return await auth().signInWithCredential(credential);
  } catch (error) {
    handleFirebaseError(error);
  }
}

export async function signInWithApple(appleIdToken: string, nonce: string) {
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

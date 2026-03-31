const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with a different sign-in method.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/timeout': 'Sign-in timed out. Please try again.',
};

/**
 * Maps Firebase auth error codes to user-friendly messages.
 * Never expose raw Firebase error codes to users.
 */
export function mapFirebaseError(code: string): string {
  return FIREBASE_ERROR_MAP[code] ?? 'Something went wrong. Please try again.';
}

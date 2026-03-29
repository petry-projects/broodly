import { mapFirebaseError } from './error-messages';

describe('mapFirebaseError', () => {
  it('maps popup-closed-by-user to cancellation message', () => {
    expect(mapFirebaseError('auth/popup-closed-by-user')).toBe(
      'Sign-in was cancelled. Please try again.'
    );
  });

  it('maps cancelled-popup-request to cancellation message', () => {
    expect(mapFirebaseError('auth/cancelled-popup-request')).toBe(
      'Sign-in was cancelled. Please try again.'
    );
  });

  it('maps account-exists-with-different-credential', () => {
    expect(
      mapFirebaseError('auth/account-exists-with-different-credential')
    ).toBe('An account already exists with a different sign-in method.');
  });

  it('maps too-many-requests', () => {
    expect(mapFirebaseError('auth/too-many-requests')).toBe(
      'Too many attempts. Please try again later.'
    );
  });

  it('maps network-request-failed', () => {
    expect(mapFirebaseError('auth/network-request-failed')).toBe(
      'Network error. Check your connection and try again.'
    );
  });

  it('maps invalid-credential', () => {
    expect(mapFirebaseError('auth/invalid-credential')).toBe(
      'Invalid credentials. Please try again.'
    );
  });

  it('maps user-disabled', () => {
    expect(mapFirebaseError('auth/user-disabled')).toBe(
      'This account has been disabled. Please contact support.'
    );
  });

  it('returns fallback for unknown error codes', () => {
    expect(mapFirebaseError('auth/some-unknown-error')).toBe(
      'Something went wrong. Please try again.'
    );
  });

  it('returns fallback for empty string', () => {
    expect(mapFirebaseError('')).toBe(
      'Something went wrong. Please try again.'
    );
  });
});

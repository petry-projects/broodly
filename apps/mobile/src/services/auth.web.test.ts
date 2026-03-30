/**
 * @jest-environment jsdom
 */
import {
  signInWithGoogle,
  signInWithApple,
  signInWithFacebook,
  signOut,
  getIdToken,
} from './auth.web';

const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockGetIdToken = jest.fn();

jest.mock('firebase/auth', () => ({
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  GoogleAuthProvider: jest.fn(),
  OAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
  FacebookAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
}));

jest.mock('../platform/firebase-web', () => ({
  webAuth: {
    currentUser: { getIdToken: (...args: unknown[]) => mockGetIdToken(...args) },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signInWithGoogle (web)', () => {
  it('calls signInWithPopup with GoogleAuthProvider', async () => {
    const mockUser = { uid: 'google-uid', email: 'user@gmail.com', displayName: 'Test' };
    mockSignInWithPopup.mockResolvedValue({ user: mockUser });

    const result = await signInWithGoogle();

    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ user: mockUser });
  });

  it('rejects with user-friendly message on popup cancelled', async () => {
    mockSignInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: 'auth/popup-closed-by-user',
      message: 'Sign-in was cancelled. Please try again.',
    });
  });

  it('rejects with user-friendly message on network failure', async () => {
    mockSignInWithPopup.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(signInWithGoogle()).rejects.toMatchObject({
      code: 'auth/network-request-failed',
      message: 'Network error. Check your connection and try again.',
    });
  });
});

describe('signInWithApple (web)', () => {
  it('calls signInWithPopup with OAuthProvider for apple.com', async () => {
    const mockUser = { uid: 'apple-uid', email: 'user@icloud.com', displayName: null };
    mockSignInWithPopup.mockResolvedValue({ user: mockUser });

    const result = await signInWithApple();

    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ user: mockUser });
  });

  it('rejects with user-friendly message on popup cancelled', async () => {
    mockSignInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

    await expect(signInWithApple()).rejects.toMatchObject({
      code: 'auth/popup-closed-by-user',
      message: 'Sign-in was cancelled. Please try again.',
    });
  });
});

describe('signInWithFacebook (web)', () => {
  it('calls signInWithPopup with FacebookAuthProvider', async () => {
    const mockUser = { uid: 'fb-uid', email: 'user@facebook.com', displayName: 'FB User' };
    mockSignInWithPopup.mockResolvedValue({ user: mockUser });

    const result = await signInWithFacebook();

    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ user: mockUser });
  });

  it('rejects with user-friendly message for duplicate credential', async () => {
    mockSignInWithPopup.mockRejectedValue({
      code: 'auth/account-exists-with-different-credential',
    });

    await expect(signInWithFacebook()).rejects.toMatchObject({
      code: 'auth/account-exists-with-different-credential',
      message: 'An account already exists with a different sign-in method.',
    });
  });
});

describe('signOut (web)', () => {
  it('calls Firebase JS SDK signOut', async () => {
    mockSignOut.mockResolvedValue(undefined);

    await signOut();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('getIdToken (web)', () => {
  it('returns the current user ID token', async () => {
    mockGetIdToken.mockResolvedValue('web-id-token');

    const token = await getIdToken();

    expect(mockGetIdToken).toHaveBeenCalledWith(false);
    expect(token).toBe('web-id-token');
  });

  it('forces token refresh when requested', async () => {
    mockGetIdToken.mockResolvedValue('refreshed-web-token');

    const token = await getIdToken(true);

    expect(mockGetIdToken).toHaveBeenCalledWith(true);
    expect(token).toBe('refreshed-web-token');
  });

  it('returns null when no user is signed in', async () => {
    jest.resetModules();
    jest.doMock('../platform/firebase-web', () => ({
      webAuth: { currentUser: null },
    }));
    const { getIdToken: getIdTokenFresh } = require('./auth.web');

    const token = await getIdTokenFresh();

    expect(token).toBeNull();
  });
});

import {
  signInWithGoogle,
  signInWithApple,
  signOut,
  getIdToken,
  mapFirebaseError,
} from './auth';

// Mock @react-native-firebase/auth
const mockSignInWithCredential = jest.fn();
const mockSignOut = jest.fn();
const mockGetIdToken = jest.fn();
const mockCurrentUser = { getIdToken: mockGetIdToken };

jest.mock('@react-native-firebase/auth', () => {
  const auth = jest.fn(() => ({
    signInWithCredential: mockSignInWithCredential,
    signOut: mockSignOut,
    currentUser: mockCurrentUser,
  }));

  return {
    __esModule: true,
    default: auth,
    firebase: {
      auth: {
        GoogleAuthProvider: {
          credential: jest.fn((idToken) => ({ providerId: 'google.com', token: idToken })),
        },
        OAuthProvider: jest.fn(() => ({
          credential: jest.fn((idToken, nonce) => ({
            providerId: 'apple.com',
            token: idToken,
            secret: nonce,
          })),
        })),
      },
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signInWithGoogle', () => {
  it('calls signInWithCredential with Google credential and returns the user', async () => {
    const mockUser = { uid: 'google-uid-123', email: 'user@gmail.com', displayName: 'Test User' };
    mockSignInWithCredential.mockResolvedValue({ user: mockUser });

    const result = await signInWithGoogle('mock-google-id-token');

    expect(mockSignInWithCredential).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'google.com', token: 'mock-google-id-token' })
    );
    expect(result).toEqual({ user: mockUser });
  });

  it('throws mapped error when Google sign-in fails due to network', async () => {
    mockSignInWithCredential.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(signInWithGoogle('bad-token')).rejects.toThrow(
      'Network error. Check your connection and try again.'
    );
  });
});

describe('signInWithApple', () => {
  it('calls signInWithCredential with Apple credential and returns the user', async () => {
    const mockUser = { uid: 'apple-uid-456', email: 'user@icloud.com', displayName: null };
    mockSignInWithCredential.mockResolvedValue({ user: mockUser });

    const result = await signInWithApple('mock-apple-id-token', 'mock-nonce');

    expect(mockSignInWithCredential).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'apple.com', token: 'mock-apple-id-token' })
    );
    expect(result).toEqual({ user: mockUser });
  });

  it('throws mapped error when Apple sign-in is cancelled', async () => {
    mockSignInWithCredential.mockRejectedValue({ code: 'auth/popup-closed-by-user' });

    await expect(signInWithApple('token', 'nonce')).rejects.toThrow(
      'Sign-in was cancelled. Please try again.'
    );
  });
});

describe('signOut', () => {
  it('calls Firebase signOut', async () => {
    mockSignOut.mockResolvedValue(undefined);

    await signOut();

    expect(mockSignOut).toHaveBeenCalled();
  });
});

describe('getIdToken', () => {
  it('returns the current user ID token', async () => {
    mockGetIdToken.mockResolvedValue('fresh-id-token');

    const token = await getIdToken();

    expect(mockGetIdToken).toHaveBeenCalledWith(false);
    expect(token).toBe('fresh-id-token');
  });

  it('forces token refresh when requested', async () => {
    mockGetIdToken.mockResolvedValue('refreshed-token');

    const token = await getIdToken(true);

    expect(mockGetIdToken).toHaveBeenCalledWith(true);
    expect(token).toBe('refreshed-token');
  });

  it('returns null when no user is signed in', async () => {
    const authModule = require('@react-native-firebase/auth');
    authModule.default.mockReturnValueOnce({
      signInWithCredential: mockSignInWithCredential,
      signOut: mockSignOut,
      currentUser: null,
    });

    const token = await getIdToken();

    expect(token).toBeNull();
  });
});

describe('mapFirebaseError', () => {
  it('maps auth/network-request-failed to human-readable message', () => {
    const message = mapFirebaseError('auth/network-request-failed');
    expect(message).toBe('Network error. Check your connection and try again.');
  });

  it('maps auth/popup-closed-by-user to cancellation message', () => {
    const message = mapFirebaseError('auth/popup-closed-by-user');
    expect(message).toBe('Sign-in was cancelled. Please try again.');
  });

  it('maps auth/cancelled-popup-request to cancellation message', () => {
    const message = mapFirebaseError('auth/cancelled-popup-request');
    expect(message).toBe('Sign-in was cancelled. Please try again.');
  });

  it('maps auth/account-exists-with-different-credential', () => {
    const message = mapFirebaseError('auth/account-exists-with-different-credential');
    expect(message).toBe(
      'An account already exists with a different sign-in method.'
    );
  });

  it('maps unknown errors to generic message', () => {
    const message = mapFirebaseError('auth/unknown-error');
    expect(message).toBe('Something went wrong. Please try again.');
  });
});

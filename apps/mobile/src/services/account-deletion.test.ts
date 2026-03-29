import { useAuthStore } from '../store/auth-store';

const mockDelete = jest.fn();

jest.mock('@react-native-firebase/auth', () => {
  const auth = jest.fn(() => ({
    currentUser: { delete: mockDelete },
  }));
  return { __esModule: true, default: auth };
});

jest.mock('./auth', () => ({
  mapFirebaseError: jest.fn((code: string) => `Mapped: ${code}`),
}));

import { deleteAccount } from './account-deletion';

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().setUser({
    uid: 'test-uid',
    email: 'user@test.com',
    displayName: 'Test',
    idToken: 'token',
  });
});

describe('deleteAccount', () => {
  it('deletes Firebase account and clears Zustand store on success', async () => {
    mockDelete.mockResolvedValue(undefined);

    await deleteAccount();

    expect(mockDelete).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('throws specific message for auth/requires-recent-login', async () => {
    mockDelete.mockRejectedValue({ code: 'auth/requires-recent-login' });

    await expect(deleteAccount()).rejects.toThrow('Please sign in again before deleting your account.');
  });

  it('throws mapped error for other failures', async () => {
    mockDelete.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(deleteAccount()).rejects.toThrow('Mapped: auth/network-request-failed');
  });

  it('keeps user state intact on failure', async () => {
    mockDelete.mockRejectedValue({ code: 'auth/network-request-failed' });

    try {
      await deleteAccount();
    } catch {
      // Expected
    }

    expect(useAuthStore.getState().user).not.toBeNull();
  });
});

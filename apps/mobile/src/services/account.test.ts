import { useAuthStore } from '../store/auth-store';

const mockUpdateProfile = jest.fn();
const mockCurrentUser = {
  updateProfile: mockUpdateProfile,
  providerData: [{ providerId: 'google.com' }],
  email: 'user@test.com',
};

jest.mock('@react-native-firebase/auth', () => {
  const auth = jest.fn(() => ({
    currentUser: mockCurrentUser,
  }));
  return { __esModule: true, default: auth };
});

jest.mock('./auth', () => ({
  mapFirebaseError: jest.fn((code: string) => `Mapped error for ${code}`),
}));

import { updateDisplayName, getLinkedProvider } from './account';

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().setUser({
    uid: 'test-uid',
    email: 'user@test.com',
    displayName: 'Old Name',
    idToken: 'token',
  });
});

describe('updateDisplayName', () => {
  it('calls updateProfile and updates Zustand store on success', async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    await updateDisplayName('New Name');

    expect(mockUpdateProfile).toHaveBeenCalledWith({ displayName: 'New Name' });
    expect(useAuthStore.getState().user?.displayName).toBe('New Name');
  });

  it('throws mapped error on failure', async () => {
    mockUpdateProfile.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(updateDisplayName('Bad')).rejects.toThrow('Mapped error for auth/network-request-failed');
  });
});

describe('getLinkedProvider', () => {
  it('returns the provider ID from currentUser', () => {
    expect(getLinkedProvider()).toBe('google.com');
  });
});

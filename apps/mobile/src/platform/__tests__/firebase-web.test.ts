/**
 * @jest-environment jsdom
 */

const mockInitializeApp = jest.fn().mockReturnValue({});
const mockGetApps = jest.fn().mockReturnValue([]);
const mockGetApp = jest.fn();
const mockGetAuth = jest.fn().mockReturnValue({ name: 'mock-auth' });
const mockConnectAuthEmulator = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  getApp: () => mockGetApp(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
  connectAuthEmulator: (...args: unknown[]) => mockConnectAuthEmulator(...args),
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockGetApps.mockReturnValue([]);
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('firebase-web', () => {
  it('connects to emulator when EXPO_PUBLIC_FIREBASE_USE_EMULATOR is true', () => {
    process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR = 'true';

    require('../firebase-web');

    expect(mockConnectAuthEmulator).toHaveBeenCalledWith(
      expect.anything(),
      'http://127.0.0.1:9099',
      { disableWarnings: true },
    );
  });

  it('does not connect to emulator when EXPO_PUBLIC_FIREBASE_USE_EMULATOR is unset', () => {
    delete process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR;

    require('../firebase-web');

    expect(mockConnectAuthEmulator).not.toHaveBeenCalled();
  });

  it('does not connect to emulator when EXPO_PUBLIC_FIREBASE_USE_EMULATOR is false', () => {
    process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR = 'false';

    require('../firebase-web');

    expect(mockConnectAuthEmulator).not.toHaveBeenCalled();
  });

  it('uses custom emulator host when EXPO_PUBLIC_FIREBASE_EMULATOR_HOST is set', () => {
    process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR = 'true';
    process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = 'http://10.0.0.1:9099';

    require('../firebase-web');

    expect(mockConnectAuthEmulator).toHaveBeenCalledWith(
      expect.anything(),
      'http://10.0.0.1:9099',
      { disableWarnings: true },
    );
  });

  it('provides emulator-safe defaults for Firebase config when env vars are unset', () => {
    delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    delete process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

    require('../firebase-web');

    expect(mockInitializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'fake-api-key',
        projectId: 'broodly-dev',
      }),
    );
  });

  it('uses real Firebase config when env vars are set', () => {
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'real-key';
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'real-project';

    require('../firebase-web');

    expect(mockInitializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'real-key',
        projectId: 'real-project',
      }),
    );
  });

  it('reuses existing app when already initialized', () => {
    const existingApp = { name: 'existing' };
    mockGetApps.mockReturnValue([existingApp]);
    mockGetApp.mockReturnValue(existingApp);

    require('../firebase-web');

    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetApp).toHaveBeenCalled();
  });
});

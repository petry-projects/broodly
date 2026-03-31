import { mmkvStorage } from './mmkv-storage.web';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

describe('mmkvStorage (web localStorage adapter)', () => {
  it('getItem returns stored value', () => {
    localStorageMock.setItem('key1', 'value1');
    const result = mmkvStorage.getItem('key1');
    expect(result).toBe('value1');
  });

  it('getItem returns null for missing keys', () => {
    const result = mmkvStorage.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('setItem stores value in localStorage', () => {
    mmkvStorage.setItem('myKey', 'myValue');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('myKey', 'myValue');
  });

  it('removeItem removes value from localStorage', () => {
    localStorageMock.setItem('toRemove', 'data');
    mmkvStorage.removeItem('toRemove');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('toRemove');
  });

  it('getItem returns null when localStorage throws', () => {
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('SecurityError');
    });
    const result = mmkvStorage.getItem('any');
    expect(result).toBeNull();
  });

  it('setItem handles quota exceeded gracefully', () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => mmkvStorage.setItem('big', 'data')).not.toThrow();
  });

  it('removeItem handles errors gracefully', () => {
    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error('Error');
    });
    expect(() => mmkvStorage.removeItem('key')).not.toThrow();
  });
});

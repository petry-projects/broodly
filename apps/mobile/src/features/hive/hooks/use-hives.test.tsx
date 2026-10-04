jest.mock('urql', () => ({
  useClient: jest.fn(),
  gql: (query: unknown) => query,
}));

import { useHives, useHive, useCreateHive, useUpdateHive, useDeleteHive } from './use-hives';

describe('Hive Hooks', () => {
  it('exports useHives hook', () => {
    expect(typeof useHives).toBe('function');
  });

  it('exports useHive hook', () => {
    expect(typeof useHive).toBe('function');
  });

  it('exports useCreateHive hook', () => {
    expect(typeof useCreateHive).toBe('function');
  });

  it('exports useUpdateHive hook', () => {
    expect(typeof useUpdateHive).toBe('function');
  });

  it('exports useDeleteHive hook', () => {
    expect(typeof useDeleteHive).toBe('function');
  });
});

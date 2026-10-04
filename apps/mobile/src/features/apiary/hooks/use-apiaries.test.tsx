jest.mock('urql', () => ({
  useClient: jest.fn(),
  gql: (query: unknown) => query,
}));

import { useApiaries, useApiary, useCreateApiary, useUpdateApiary, useDeleteApiary } from './use-apiaries';

describe('Apiary Hooks', () => {
  it('exports useApiaries hook', () => {
    expect(typeof useApiaries).toBe('function');
  });

  it('exports useApiary hook', () => {
    expect(typeof useApiary).toBe('function');
  });

  it('exports useCreateApiary hook', () => {
    expect(typeof useCreateApiary).toBe('function');
  });

  it('exports useUpdateApiary hook', () => {
    expect(typeof useUpdateApiary).toBe('function');
  });

  it('exports useDeleteApiary hook', () => {
    expect(typeof useDeleteApiary).toBe('function');
  });
});

import type { OperationResult } from 'urql';
import { throwIfGraphQLError, assertData } from './query-utils';

describe('throwIfGraphQLError', () => {
  it('throws when result has error', () => {
    const result = {
      error: new Error('Test error'),
    } as OperationResult<unknown>;

    expect(() => throwIfGraphQLError(result, 'TestOp')).toThrow(
      'TestOp failed: Test error',
    );
  });

  it('does not throw when no error', () => {
    const result = {
      error: undefined,
      data: { test: 'value' },
    } as OperationResult<unknown>;

    expect(() => throwIfGraphQLError(result, 'TestOp')).not.toThrow();
  });
});

describe('assertData', () => {
  it('returns data when present', () => {
    const result = {
      data: { users: [{ id: '1' }] },
    } as OperationResult<{ users: Array<{ id: string }> }>;

    const data = assertData(result, 'users', 'Users query');
    expect(data).toEqual([{ id: '1' }]);
  });

  it('throws when data is undefined', () => {
    const result = {
      data: undefined,
    } as OperationResult<unknown>;

    expect(() => assertData(result, 'users', 'Users query')).toThrow(
      'No data returned from Users query',
    );
  });

  it('throws when key missing from data', () => {
    const result = {
      data: { other: 'value' },
    } as OperationResult<unknown>;

    expect(() => assertData(result, 'users', 'Users query')).toThrow(
      'No data returned from Users query',
    );
  });

  it('throws when value is null', () => {
    const result = {
      data: { users: null },
    } as OperationResult<{ users: null }>;

    expect(() => assertData(result, 'users', 'Users query')).toThrow(
      'No data returned from Users query',
    );
  });

  it('throws when value is undefined', () => {
    const result = {
      data: { users: undefined },
    } as OperationResult<{ users: undefined }>;

    expect(() => assertData(result, 'users', 'Users query')).toThrow(
      'No data returned from Users query',
    );
  });
});

import type { OperationResult } from 'urql';

export function throwIfGraphQLError<T>(result: OperationResult<T>, operationName: string): void {
  if (result.error) {
    throw new Error(`${operationName} failed: ${result.error.message}`);
  }
}

export function assertData<T, K extends keyof T>(
  result: OperationResult<T>,
  key: K,
  operationName: string,
): T[K] {
  if (!result.data || !(key in result.data) || !result.data[key]) {
    throw new Error(`No data returned from ${operationName}`);
  }
  return result.data[key];
}

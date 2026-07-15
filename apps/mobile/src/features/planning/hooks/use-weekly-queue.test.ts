import { groupByApiary } from './use-weekly-queue';
import type { ApiaryQueue } from './use-weekly-queue';

jest.mock('urql');
jest.mock('@tanstack/react-query');

function makeTask(overrides: {
  id?: string;
  title?: string;
  hiveId?: string;
  hiveName?: string;
  apiaryId?: string;
  apiaryName?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string | null;
  status?: string;
  isOverdue?: boolean;
  catchUpGuidance?: string | null;
}) {
  return {
    id: overrides.id ?? 'task-1',
    title: overrides.title ?? 'Inspect brood',
    hive: {
      id: overrides.hiveId ?? 'hive-1',
      name: overrides.hiveName ?? 'Hive 1',
      apiary: {
        id: overrides.apiaryId ?? 'apiary-1',
        name: overrides.apiaryName ?? 'Back Yard',
      },
    },
    priority: overrides.priority ?? 'MEDIUM',
    dueDate: overrides.dueDate ?? '2026-05-10T00:00:00Z',
    status: overrides.status ?? 'PENDING',
    isOverdue: overrides.isOverdue ?? false,
    catchUpGuidance: overrides.catchUpGuidance ?? null,
  };
}

describe('groupByApiary', () => {
  it('returns empty array for empty input', () => {
    expect(groupByApiary([])).toEqual([]);
  });

  it('groups a single task into one apiary queue', () => {
    const tasks = [makeTask({ id: 't1', apiaryId: 'a1', apiaryName: 'Back Yard', hiveId: 'h1', hiveName: 'Hive 1' })];
    const result = groupByApiary(tasks);

    expect(result).toHaveLength(1);
    expect(result[0].apiaryId).toBe('a1');
    expect(result[0].apiaryName).toBe('Back Yard');
    expect(result[0].tasks).toHaveLength(1);
    expect(result[0].tasks[0].id).toBe('t1');
  });

  it('groups multiple tasks from the same apiary together', () => {
    const tasks = [
      makeTask({ id: 't1', apiaryId: 'a1', hiveId: 'h1' }),
      makeTask({ id: 't2', apiaryId: 'a1', hiveId: 'h2' }),
    ];
    const result = groupByApiary(tasks);

    expect(result).toHaveLength(1);
    expect(result[0].tasks).toHaveLength(2);
    expect(result[0].tasks.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('creates separate queues for different apiaries', () => {
    const tasks = [
      makeTask({ id: 't1', apiaryId: 'a1', apiaryName: 'Back Yard' }),
      makeTask({ id: 't2', apiaryId: 'a2', apiaryName: 'Front Yard' }),
    ];
    const result = groupByApiary(tasks);

    expect(result).toHaveLength(2);
    const names = result.map((q) => q.apiaryName).sort();
    expect(names).toEqual(['Back Yard', 'Front Yard']);
  });

  it('maps QueueTask fields from RawTask correctly', () => {
    const tasks = [
      makeTask({
        id: 'task-x',
        title: 'Add super',
        hiveId: 'hive-x',
        hiveName: 'Hive X',
        apiaryId: 'apiary-x',
        priority: 'HIGH',
        dueDate: '2026-05-15T00:00:00Z',
        status: 'PENDING',
        isOverdue: false,
        catchUpGuidance: null,
      }),
    ];
    const result = groupByApiary(tasks);
    const task = result[0].tasks[0];

    expect(task.id).toBe('task-x');
    expect(task.title).toBe('Add super');
    expect(task.hiveId).toBe('hive-x');
    expect(task.hiveName).toBe('Hive X');
    expect(task.priority).toBe('HIGH');
    expect(task.dueDate).toBe('2026-05-15T00:00:00Z');
    expect(task.status).toBe('PENDING');
    expect(task.isOverdue).toBe(false);
    expect(task.catchUpGuidance).toBeNull();
  });

  it('treats null dueDate as null (not undefined)', () => {
    const tasks = [makeTask({ dueDate: null })];
    const result = groupByApiary(tasks);
    expect(result[0].tasks[0].dueDate).toBeNull();
  });

  it('surfaces catchUpGuidance for overdue tasks', () => {
    const tasks = [makeTask({ isOverdue: true, catchUpGuidance: 'Check queen cells' })];
    const result = groupByApiary(tasks);
    expect(result[0].tasks[0].isOverdue).toBe(true);
    expect(result[0].tasks[0].catchUpGuidance).toBe('Check queen cells');
  });

  it('preserves insertion order of apiaries', () => {
    const tasks = [
      makeTask({ id: 't1', apiaryId: 'a1', apiaryName: 'Alpha' }),
      makeTask({ id: 't2', apiaryId: 'a2', apiaryName: 'Beta' }),
      makeTask({ id: 't3', apiaryId: 'a1', apiaryName: 'Alpha' }),
      makeTask({ id: 't4', apiaryId: 'a3', apiaryName: 'Gamma' }),
    ];
    const result = groupByApiary(tasks);

    expect(result.map((q) => q.apiaryName)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(result[0].tasks).toHaveLength(2);
  });

  it('handles all priority levels', () => {
    const priorities: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const tasks = priorities.map((p, i) => makeTask({ id: `t${i}`, priority: p }));
    const result = groupByApiary(tasks);
    const resultPriorities = result[0].tasks.map((t) => t.priority);
    expect(resultPriorities).toEqual(priorities);
  });

  it('returns type-safe ApiaryQueue array', () => {
    const tasks = [makeTask({})];
    const result: ApiaryQueue[] = groupByApiary(tasks);
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0].apiaryId).toBe('string');
    expect(typeof result[0].apiaryName).toBe('string');
    expect(Array.isArray(result[0].tasks)).toBe(true);
  });
});

describe('useWeeklyQueue hook', () => {
  const mockQuery = jest.fn();
  const mockClient = { query: mockQuery };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useClient } = require('urql');
    useClient.mockReturnValue(mockClient);
  });

  it('exports a function that can be called', () => {
    const { useWeeklyQueue } = require('./use-weekly-queue');
    expect(typeof useWeeklyQueue).toBe('function');
  });

  it('returns a query with correct query key', () => {
    const { useWeeklyQueue } = require('./use-weekly-queue');
    const { useQuery } = require('@tanstack/react-query');
    const mockQueryResult = { data: null };
    useQuery.mockReturnValue(mockQueryResult);

    const result = useWeeklyQueue();
    expect(result).toEqual(mockQueryResult);

    const callArgs = useQuery.mock.calls[0];
    expect(callArgs[0].queryKey).toEqual(['weekly-queue']);
  });
});

describe('useCompleteTask hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a function that can be called', () => {
    const { useCompleteTask } = require('./use-weekly-queue');
    expect(typeof useCompleteTask).toBe('function');
  });

  it('returns a mutation', () => {
    const { useCompleteTask } = require('./use-weekly-queue');
    const { useMutation } = require('@tanstack/react-query');
    const mockMutationResult = { mutate: jest.fn() };
    useMutation.mockReturnValue(mockMutationResult);

    const result = useCompleteTask();
    expect(result).toEqual(mockMutationResult);
  });

  it('invalidates weekly-queue query on success', () => {
    const { useCompleteTask } = require('./use-weekly-queue');
    const { useMutation, useQueryClient } = require('@tanstack/react-query');
    const mockInvalidate = jest.fn();
    const mockQueryClient = { invalidateQueries: mockInvalidate };
    useQueryClient.mockReturnValue(mockQueryClient);

    useMutation.mockImplementation((config) => {
      config.onSuccess?.();
      return { mutate: jest.fn() };
    });

    useCompleteTask();
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['weekly-queue'] });
  });
});

describe('useDeferTask hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a function that can be called', () => {
    const { useDeferTask } = require('./use-weekly-queue');
    expect(typeof useDeferTask).toBe('function');
  });

  it('returns a mutation', () => {
    const { useDeferTask } = require('./use-weekly-queue');
    const { useMutation } = require('@tanstack/react-query');
    const mockMutationResult = { mutate: jest.fn() };
    useMutation.mockReturnValue(mockMutationResult);

    const result = useDeferTask();
    expect(result).toEqual(mockMutationResult);
  });

  it('invalidates weekly-queue query on success', () => {
    const { useDeferTask } = require('./use-weekly-queue');
    const { useMutation, useQueryClient } = require('@tanstack/react-query');
    const mockInvalidate = jest.fn();
    const mockQueryClient = { invalidateQueries: mockInvalidate };
    useQueryClient.mockReturnValue(mockQueryClient);

    useMutation.mockImplementation((config) => {
      config.onSuccess?.();
      return { mutate: jest.fn() };
    });

    useDeferTask();
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['weekly-queue'] });
  });
});

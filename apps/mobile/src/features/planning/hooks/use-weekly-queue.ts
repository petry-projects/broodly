import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from 'urql';
import {
  WEEKLY_QUEUE_QUERY,
  COMPLETE_TASK_MUTATION,
  DEFER_TASK_MUTATION,
} from '../../../services/graphql/planning';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface QueueTask {
  id: string;
  title: string;
  hiveId: string;
  hiveName: string;
  priority: TaskPriority;
  dueDate: string | null;
  status: string;
  isOverdue: boolean;
  catchUpGuidance: string | null;
}

export interface ApiaryQueue {
  apiaryId: string;
  apiaryName: string;
  tasks: QueueTask[];
}

interface RawTask {
  id: string;
  title: string;
  hive: {
    id: string;
    name: string;
    apiary: {
      id: string;
      name: string;
    };
  };
  priority: TaskPriority;
  dueDate: string | null;
  status: string;
  isOverdue: boolean;
  catchUpGuidance: string | null;
}

export function groupByApiary(tasks: RawTask[]): ApiaryQueue[] {
  const map = new Map<string, ApiaryQueue>();
  for (const task of tasks) {
    const { id: apiaryId, name: apiaryName } = task.hive.apiary;
    let queue = map.get(apiaryId);
    if (!queue) {
      queue = { apiaryId, apiaryName, tasks: [] };
      map.set(apiaryId, queue);
    }
    queue.tasks.push({
      id: task.id,
      title: task.title,
      hiveId: task.hive.id,
      hiveName: task.hive.name,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      status: task.status,
      isOverdue: task.isOverdue,
      catchUpGuidance: task.catchUpGuidance ?? null,
    });
  }
  return Array.from(map.values());
}

const QUEUE_KEYS = {
  weekly: ['weekly-queue'] as const,
};

export function useWeeklyQueue() {
  const client = useClient();

  return useQuery({
    queryKey: QUEUE_KEYS.weekly,
    queryFn: async () => {
      const result = await client.query(WEEKLY_QUEUE_QUERY, {}).toPromise();
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error('No data returned from weekly queue');
      return groupByApiary(result.data.tasks as RawTask[]);
    },
  });
}

export function useCompleteTask() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await client.mutation(COMPLETE_TASK_MUTATION, { id }).toPromise();
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error('No data returned from completeTask');
      return result.data.completeTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.weekly });
    },
  });
}

export function useDeferTask() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const result = await client
        .mutation(DEFER_TASK_MUTATION, { id, input: { reason } })
        .toPromise();
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error('No data returned from deferTask');
      return result.data.deferTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.weekly });
    },
  });
}

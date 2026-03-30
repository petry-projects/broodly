import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from 'urql';
import {
  WEEKLY_QUEUE_QUERY,
  COMPLETE_TASK_MUTATION,
  DEFER_TASK_MUTATION,
  DISMISS_TASK_MUTATION,
} from '../../../services/graphql/planning';

export interface QueueTask {
  id: string;
  title: string;
  hiveId: string;
  hiveName: string;
  priority: number;
  dueDate: string;
  status: string;
  isOverdue: boolean;
  catchUpGuidance: string | null;
  requiredMaterials: string[] | null;
  recommendedAction: string | null;
}

export interface ApiaryQueue {
  apiaryId: string;
  apiaryName: string;
  tasks: QueueTask[];
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
      return result.data.weeklyQueue as ApiaryQueue[];
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
    mutationFn: async ({ id, reason, newDueDate }: { id: string; reason?: string; newDueDate: string }) => {
      const result = await client.mutation(DEFER_TASK_MUTATION, { id, reason, newDueDate }).toPromise();
      if (result.error) throw new Error(result.error.message);
      return result.data.deferTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.weekly });
    },
  });
}

export function useDismissTask() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const result = await client.mutation(DISMISS_TASK_MUTATION, { id, reason }).toPromise();
      if (result.error) throw new Error(result.error.message);
      return result.data.dismissTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.weekly });
    },
  });
}

/**
 * React Query hooks for Tasks API.
 * Provides type-safe data fetching, caching, and mutations
 * that integrate with the backend's paginated REST endpoints.
 */
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api-client';
import type { Task, CreateTaskPayload, UpdateTaskPayload, TaskQueryParams } from '@/lib/types';

// ── Query key factory ──────────────────────────────────────────
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TaskQueryParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// ── Queries ────────────────────────────────────────────────────

interface TasksResponse {
  tasks: Task[];
  total: number;
}

/**
 * Fetch paginated, filterable task list.
 */
export function useTasks(params: TaskQueryParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.team_id) searchParams.set('team_id', params.team_id);
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.assignee_id) searchParams.set('assignee_id', params.assignee_id);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  const endpoint = `/tasks${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const res = await api.get<Task[]>(endpoint);
      return {
        tasks: res.data ?? [],
        total: res.meta?.total ?? 0,
        meta: res.meta,
      };
    },
    staleTime: 30_000, // 30s — real-time socket updates keep it fresh
  });
}

/**
 * Fetch a single task by ID.
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<Task>(`/tasks/${id}`);
      return res.data!;
    },
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const res = await api.post<Task>('/tasks', payload);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTaskPayload & { id: string }) => {
      const res = await api.put<Task>(`/tasks/${id}`, payload);
      return res.data!;
    },
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

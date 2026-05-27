/**
 * React Query hooks for Teams API.
 * Handles team CRUD and membership management.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Team,
  TeamWithRole,
  CreateTeamPayload,
  UpdateTeamPayload,
  InviteMemberPayload,
  TeamMember,
} from "@/lib/types";

// ── Query key factory ──────────────────────────────────────────
export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  members: (teamId: string) => [...teamKeys.detail(teamId), "members"] as const,
};

// ── Queries ────────────────────────────────────────────────────

/**
 * Fetch all teams the authenticated user is a member of.
 */
export function useMyTeams() {
  return useQuery({
    queryKey: teamKeys.lists(),
    queryFn: async () => {
      const res = await api.get<TeamWithRole[]>("/teams");
      return res.data ?? [];
    },
    staleTime: 60_000, // Teams change less frequently
  });
}

/**
 * Fetch a single team's details (requires membership).
 */
export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<Team>(`/teams/${id}`);
      return res.data!;
    },
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTeamPayload) => {
      const res = await api.post<Team>("/teams", payload);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTeamPayload & { id: string }) => {
      const res = await api.put<Team>(`/teams/${id}`, payload);
      return res.data!;
    },
    onSuccess: (team) => {
      queryClient.setQueryData(teamKeys.detail(team.id), team);
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, ...payload }: InviteMemberPayload & { teamId: string }) => {
      const res = await api.post<TeamMember>(`/teams/${teamId}/invite`, payload);
      return res.data!;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(variables.teamId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      return { teamId, userId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(variables.teamId) });
    },
  });
}

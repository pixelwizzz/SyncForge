/**
 * SyncForge shared types — mirrors backend Sequelize models exactly.
 * All API hooks and components import from here.
 */

// ── Task ───────────────────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskUser {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  uploader_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  team_id: string;
  creator_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;

  // Eagerly included relations (when returned from API)
  creator?: TaskUser;
  assignee?: TaskUser;
  team?: Team;
  Attachments?: TaskAttachment[];
}

export interface CreateTaskPayload {
  team_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
}

export interface TaskQueryParams {
  team_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  page?: number;
  limit?: number;
}

// ── Team ───────────────────────────────────────────────────────
export type TeamRole = "owner" | "admin" | "member";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamWithRole extends Team {
  TeamMember?: {
    role: TeamRole;
  };
  _count?: {
    members: number;
    tasks: number;
  };
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export interface InviteMemberPayload {
  email: string;
  role?: TeamRole;
}

// ── Team Member ────────────────────────────────────────────────
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
  updated_at: string;
  User?: TaskUser;
}

// ── User ───────────────────────────────────────────────────────
export interface User {
  id: string;
  clerk_id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// ── Status / Priority display metadata ─────────────────────────
export const STATUS_META: Record<TaskStatus, { label: string; color: string; symbol: string }> = {
  todo: { label: "Todo", color: "var(--status-todo)", symbol: "○" },
  in_progress: { label: "In Progress", color: "var(--status-inprogress)", symbol: "●" },
  done: { label: "Done", color: "var(--status-done)", symbol: "✓" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "var(--priority-low)" },
  medium: { label: "Medium", color: "var(--priority-medium)" },
  high: { label: "High", color: "var(--priority-high)" },
};

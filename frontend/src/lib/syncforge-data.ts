// Shared SyncForge mock data
export type Status = "todo" | "in_progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: { name: string; initials: string };
  due?: string;
  team: string;
}

export const STATUS_META: Record<Status, { label: string; color: string; symbol: string }> = {
  todo: { label: "Todo", color: "var(--status-todo)", symbol: "○" },
  in_progress: { label: "In Progress", color: "var(--status-inprogress)", symbol: "●" },
  review: { label: "Review", color: "var(--status-review)", symbol: "◑" },
  done: { label: "Done", color: "var(--status-done)", symbol: "✓" },
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: "var(--priority-low)",
  medium: "var(--priority-medium)",
  high: "var(--priority-high)",
  urgent: "var(--priority-urgent)",
};

export const TASKS: Task[] = [
  { id: "t1", title: "Review API schema for v2 endpoints", status: "todo", priority: "high", assignee: { name: "Priya", initials: "PR" }, due: "May 28", team: "Backend" },
  { id: "t2", title: "Draft onboarding email sequence", status: "todo", priority: "low", assignee: { name: "Mira", initials: "MI" }, due: "Jun 02", team: "Design" },
  { id: "t3", title: "Audit auth flow for edge cases", status: "todo", priority: "medium", assignee: { name: "Arjun", initials: "AR" }, due: "May 30", team: "Backend" },
  { id: "t4", title: "Fix Redis connection timeout under load", status: "in_progress", priority: "urgent", assignee: { name: "Priya", initials: "PR" }, due: "Today", team: "Backend" },
  { id: "t5", title: "Migrate billing webhooks to v2", status: "in_progress", priority: "high", assignee: { name: "Rahul", initials: "RA" }, due: "May 27", team: "Backend" },
  { id: "t6", title: "Refine empty-state illustrations", status: "review", priority: "low", assignee: { name: "Mira", initials: "MI" }, due: "May 29", team: "Design" },
  { id: "t7", title: "Set up Docker compose for local dev", status: "done", priority: "medium", assignee: { name: "Arjun", initials: "AR" }, due: "May 20", team: "Infra" },
  { id: "t8", title: "Write changelog for May release", status: "done", priority: "low", assignee: { name: "Priya", initials: "PR" }, due: "May 21", team: "Backend" },
];

export const TEAMS = [
  { id: "design", name: "Design", color: "#9B7FB6" },
  { id: "backend", name: "Backend", color: "#5A8FB8" },
  { id: "infra", name: "Infra", color: "#8DB3A0" },
];

export const TEAMMATES = [
  { name: "Priya", initials: "PR", online: true },
  { name: "Rahul", initials: "RA", online: true },
  { name: "Arjun", initials: "AR", online: false },
  { name: "Mira", initials: "MI", online: true },
];

export const ACTIVITY = [
  { who: "Priya", what: "updated", target: "Fix Redis connection", when: "2m ago" },
  { who: "Rahul", what: "assigned you", target: "Migrate billing webhooks", when: "10m ago" },
  { who: "Mira", what: "completed", target: "Refine empty-state illustrations", when: "1h ago" },
  { who: "Arjun", what: "commented on", target: "Audit auth flow", when: "3h ago" },
];

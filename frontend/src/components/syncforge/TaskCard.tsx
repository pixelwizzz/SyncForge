import { PRIORITY_META, type Task } from "@/lib/types";
import { Avatar } from "./Avatar";

function formatDueDate(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskCard({ task }: { task: Task }) {
  const dueLabel = formatDueDate(task.due_date);
  const overdue = dueLabel === "Today" || dueLabel === "Overdue";
  const assigneeName = task.assignee?.name ?? "Unassigned";
  const assigneeInitials = assigneeName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className="relative rounded-md border p-3.5 cursor-pointer transition-shadow hover:shadow-[var(--shadow-paper-hover)]"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}
    >
      <span
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
        style={{ background: PRIORITY_META[task.priority].color }}
      />
      <h3 className="text-sm leading-snug pl-1.5 pr-1" style={{ color: "var(--ink)" }}>
        {task.title}
      </h3>
      <div className="mt-3 flex items-center justify-between pl-1.5">
        <span
          className="font-mono text-[10px] tabular uppercase tracking-wider"
          style={{ color: overdue ? "var(--destructive)" : "var(--ink-muted)" }}
        >
          {dueLabel}
        </span>
        <Avatar name={assigneeName} initials={assigneeInitials} size={20} />
      </div>
    </article>
  );
}

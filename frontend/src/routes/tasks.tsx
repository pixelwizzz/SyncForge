import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AppShell } from '@/components/syncforge/AppShell';
import { TaskCard } from '@/components/syncforge/TaskCard';
import { Avatar } from '@/components/syncforge/Avatar';
import { useTasks, useCreateTask } from '@/hooks/use-tasks';
import { STATUS_META, type TaskStatus, type Task } from '@/lib/types';

export const Route = createFileRoute('/tasks')({
  head: () => ({
    meta: [
      { title: 'Tasks — SyncForge' },
      { name: 'description', content: "Board, list, and calendar view of your team's tasks." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    team_id: (search.team_id as string) || undefined,
  }),
  component: TasksPage,
});

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

function TasksPage() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const { team_id } = Route.useSearch();
  const { data, isLoading, error } = useTasks({ team_id, limit: 50 });

  const tasks = data?.tasks ?? [];

  return (
    <AppShell crumbs={['SyncForge', 'Tasks']}>
      <header className="mb-8 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="font-serif text-[2rem] leading-tight" style={{ color: 'var(--ink)' }}>
            Your <em style={{ color: 'var(--accent)' }}>tasks</em>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {isLoading ? 'Loading...' : `${tasks.length} tasks found`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center rounded-md border p-0.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-raised)' }}
          >
            {(['board', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 h-7 text-xs rounded capitalize transition-colors"
                style={{
                  background: view === v ? 'var(--surface-sunken)' : 'transparent',
                  color: view === v ? 'var(--ink)' : 'var(--ink-secondary)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            className="h-9 px-4 rounded-md text-sm"
            style={{ background: 'var(--ink)', color: 'var(--surface)' }}
          >
            New task
          </button>
        </div>
      </header>

      {error && (
        <div
          className="rounded-md border p-4 mb-6 text-sm"
          style={{ borderColor: 'var(--destructive)', color: 'var(--destructive)', background: 'var(--surface-raised)' }}
        >
          Failed to load tasks. Make sure the backend is running on{' '}
          <code className="font-mono text-xs">localhost:3000</code>.
        </div>
      )}

      {view === 'board' ? <Board tasks={tasks} /> : <ListView tasks={tasks} />}
    </AppShell>
  );
}

function Board({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {COLUMNS.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        const meta = STATUS_META[status];
        return (
          <div key={status} className="flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                <span
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {meta.label}
                </span>
                <span className="font-mono text-[10px] tabular" style={{ color: 'var(--ink-muted)' }}>
                  {items.length}
                </span>
              </div>
            </div>
            <div className="space-y-2.5 flex-1">
              {items.map((t, i) => (
                <div key={t.id} className="animate-ink-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <TaskCard task={t} />
                </div>
              ))}
              <button
                className="w-full text-left text-xs py-2 px-3 rounded-md border border-dashed transition-colors hover:border-[var(--border-strong)]"
                style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
              >
                + Add card
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ tasks }: { tasks: Task[] }) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)' }}
    >
      <div
        className="grid grid-cols-[80px_1fr_120px_100px_100px] gap-4 px-4 py-3 border-b text-[10px] uppercase tracking-wider font-mono"
        style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
      >
        <span>Status</span>
        <span>Title</span>
        <span>Assignee</span>
        <span>Priority</span>
        <span>Due</span>
      </div>
      {tasks.map((t) => {
        const s = STATUS_META[t.status];
        const assigneeName = t.assignee?.name ?? 'Unassigned';
        const assigneeInitials = assigneeName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        const dueLabel = t.due_date
          ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—';
        const isToday =
          t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString();

        return (
          <div
            key={t.id}
            className="grid grid-cols-[80px_1fr_120px_100px_100px] gap-4 px-4 h-12 items-center border-b text-sm hover:bg-[var(--surface-sunken)] transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="flex items-center gap-1.5" style={{ color: s.color }}>
              <span>{s.symbol}</span>
              <span className="text-xs">{s.label}</span>
            </span>
            <span style={{ color: 'var(--ink)' }} className="truncate">
              {t.title}
            </span>
            <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-secondary)' }}>
              <Avatar name={assigneeName} initials={assigneeInitials} size={20} />
              {assigneeName}
            </span>
            <span className="text-xs capitalize" style={{ color: 'var(--ink-secondary)' }}>
              {t.priority}
            </span>
            <span
              className="font-mono text-[10px] tabular"
              style={{ color: isToday ? 'var(--destructive)' : 'var(--ink-secondary)' }}
            >
              {dueLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

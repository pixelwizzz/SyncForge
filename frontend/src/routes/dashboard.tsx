import { createFileRoute, Link } from '@tanstack/react-router';
import { AppShell } from '@/components/syncforge/AppShell';
import { Avatar } from '@/components/syncforge/Avatar';
import { useTasks } from '@/hooks/use-tasks';
import { useMyTeams } from '@/hooks/use-teams';
import { STATUS_META, type Task } from '@/lib/types';

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      { title: 'Dashboard — SyncForge' },
      { name: 'description', content: 'Your day at a glance.' },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: taskData, isLoading: tasksLoading } = useTasks({ limit: 10 });
  const { data: teams = [] } = useMyTeams();

  const tasks = taskData?.tasks ?? [];
  const myTasks = tasks.slice(0, 4);

  return (
    <AppShell crumbs={['SyncForge', 'Dashboard']}>
      <header className="mb-10">
        <h1 className="font-serif text-[2.25rem] leading-tight" style={{ color: 'var(--ink)' }}>
          Good morning, <em style={{ color: 'var(--accent)' }}>team</em>.
        </h1>
        <p className="mt-2 text-base" style={{ color: 'var(--ink-secondary)' }}>
          {tasksLoading
            ? 'Loading your tasks...'
            : `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''} across ${teams.length} team${teams.length !== 1 ? 's' : ''}.`}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <Panel title="Recent tasks">
          {tasksLoading ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
              Loading...
            </div>
          ) : myTasks.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
              No tasks yet. Create one to get started!
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {myTasks.map((t) => {
                const s = STATUS_META[t.status];
                const done = t.status === 'done';
                const dueLabel = t.due_date
                  ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—';
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <span
                      className="w-4 h-4 inline-flex items-center justify-center rounded-full border text-[9px]"
                      style={{
                        borderColor: s.color,
                        color: s.color,
                        background: done ? s.color : 'transparent',
                      }}
                    >
                      {done ? '✓' : ''}
                    </span>
                    <span
                      className="flex-1 text-sm"
                      style={{
                        color: 'var(--ink)',
                        textDecoration: done ? 'line-through' : 'none',
                        opacity: done ? 0.5 : 1,
                      }}
                    >
                      {t.title}
                    </span>
                    <span
                      className="font-mono text-[10px] tabular uppercase tracking-wider"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      {dueLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4">
            <Link to="/tasks" search={{ team_id: undefined }} className="text-sm" style={{ color: 'var(--accent-dim)' }}>
              View all tasks →
            </Link>
          </div>
        </Panel>

        <Panel title="Your teams">
          {teams.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
              No teams yet. Create one to start collaborating!
            </div>
          ) : (
            <ul className="space-y-3">
              {teams.map((team) => (
                <li key={team.id} className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-md inline-flex items-center justify-center text-xs font-medium"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm" style={{ color: 'var(--ink)' }}>
                      {team.name}
                    </div>
                    {team.description && (
                      <div className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>
                        {team.description}
                      </div>
                    )}
                  </div>
                  <Link
                    to="/tasks"
                    search={{ team_id: team.id }}
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: 'var(--accent-dim)' }}
                  >
                    View →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-6" title="Task breakdown">
        <TaskBreakdown tasks={tasks} />
      </Panel>
    </AppShell>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border p-5 ${className ?? ''}`}
      style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)' }}
    >
      <h2
        className="font-mono text-[10px] uppercase tracking-[0.18em] mb-4"
        style={{ color: 'var(--ink-muted)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function TaskBreakdown({ tasks }: { tasks: Task[] }) {
  const total = tasks.length || 1; // avoid division by zero
  const counts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="space-y-3 pt-1">
      {(Object.keys(counts) as Array<keyof typeof counts>).map((status) => {
        const meta = STATUS_META[status];
        const pct = Math.round((counts[status] / total) * 100);
        return (
          <div key={status} className="flex items-center gap-3">
            <span className="text-xs w-20" style={{ color: 'var(--ink-secondary)' }}>
              {meta.label}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
            <span className="font-mono text-[10px] tabular w-8 text-right" style={{ color: 'var(--ink-muted)' }}>
              {counts[status]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

import { Link, useRouterState } from '@tanstack/react-router';
import { useMyTeams } from '@/hooks/use-teams';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'My Tasks' },
  { to: '/inbox', label: 'Inbox', badge: 3 },
];

// Fallback team colors when backend doesn't provide them
const TEAM_COLORS = [
  '#5A8FB8',
  '#9B7FB6',
  '#8DB3A0',
  '#D4956A',
  '#7A9E7E',
  '#B58BA0',
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => path === to || (to !== '/' && path.startsWith(to));

  // Live teams from API — gracefully falls back to empty array
  const { data: teams = [] } = useMyTeams();

  return (
    <aside
      className="hidden md:flex flex-col w-[240px] shrink-0 border-r"
      style={{ background: 'var(--surface-sunken)', borderColor: 'var(--border)' }}
    >
      <div className="px-5 py-5">
        <Link to="/dashboard" className="flex items-baseline gap-1.5">
          <span className="font-serif text-[1.5rem] leading-none" style={{ color: 'var(--ink)' }}>
            Sync
          </span>
          <span className="font-serif italic text-[1.5rem] leading-none" style={{ color: 'var(--accent)' }}>
            Forge
          </span>
        </Link>
      </div>

      <nav className="px-2 flex-1 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors"
                style={{
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--ink)' : 'var(--ink-secondary)',
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className="font-mono text-[10px] tabular px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--surface-raised)', color: 'var(--ink-secondary)' }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-7">
          <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--ink-muted)' }}>
            Teams
          </div>
          <div className="space-y-0.5">
            {teams.map((t, i) => (
              <Link
                key={t.id}
                to="/tasks"
                search={{ team_id: t.id }}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm"
                style={{ color: 'var(--ink-secondary)' }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }}
                />
                <span>{t.name}</span>
              </Link>
            ))}
            <button
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm w-full text-left"
              style={{ color: 'var(--ink-muted)' }}
            >
              <span className="w-2 h-2 inline-block">+</span> New team
            </button>
          </div>
        </div>
      </nav>

      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm"
          style={{ color: 'var(--ink-secondary)' }}
        >
          Settings
        </Link>
      </div>
    </aside>
  );
}

import { Avatar } from "./Avatar";

export function Topbar({ crumbs }: { crumbs: string[] }) {
  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-6 border-b"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-secondary)" }}>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: "var(--ink-muted)" }}>/</span>}
            <span style={{ color: i === crumbs.length - 1 ? "var(--ink)" : "var(--ink-secondary)" }}>{c}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 h-9 px-3 rounded-md text-sm border transition-colors hover:border-[var(--border-strong)]"
          style={{ background: "var(--surface-sunken)", borderColor: "var(--border)", color: "var(--ink-secondary)" }}
        >
          <span>Search</span>
          <kbd className="font-mono text-[10px] tabular px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", background: "var(--surface-raised)" }}>⌘K</kbd>
        </button>
        <Avatar name="Arjun" initials="AR" size={28} online />
      </div>
    </header>
  );
}

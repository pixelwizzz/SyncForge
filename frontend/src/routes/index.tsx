import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SyncForge — A workspace that feels like a notebook" },
      {
        name: "description",
        content: "Real-time team tasks with the calm of paper and the precision of ink.",
      },
      { property: "og:title", content: "SyncForge" },
      {
        property: "og:description",
        content: "Real-time team tasks with the calm of paper and the precision of ink.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--surface)" }}>
      <div className="absolute inset-0 dot-grid pointer-events-none" />

      <header className="relative z-10 mx-auto max-w-[1280px] px-8 py-6 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-[1.5rem]" style={{ color: "var(--ink)" }}>
            Sync
          </span>
          <span className="font-serif italic text-[1.5rem]" style={{ color: "var(--accent)" }}>
            Forge
          </span>
        </div>
        <nav className="flex items-center gap-7 text-sm" style={{ color: "var(--ink-secondary)" }}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#docs">Docs</a>
          <Link to="/dashboard" className="px-3 py-1.5">
            Login
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-md text-sm"
            style={{ background: "var(--ink)", color: "var(--surface)" }}
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-[1280px] px-8 pt-16 pb-24 grid md:grid-cols-[1.05fr_1fr] gap-14 items-center">
        <div className="animate-ink-in">
          <div
            className="font-mono text-[10px] tabular uppercase tracking-[0.2em] mb-6"
            style={{ color: "var(--accent-dim)" }}
          >
            ◎ Now in private beta
          </div>
          <h1
            className="font-serif text-[3.25rem] md:text-[4rem] leading-[1.05] tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            Work moves faster
            <br />
            when your team
            <br />
            moves <em style={{ color: "var(--accent)" }}>together</em>.
          </h1>
          <p
            className="mt-7 max-w-md text-[1.05rem]"
            style={{ color: "var(--ink-secondary)", lineHeight: 1.6 }}
          >
            SyncForge is a real-time task workspace for small teams who care about craft. Less
            dashboard, more notebook.
          </p>
          <div className="mt-9 flex items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center h-11 px-5 rounded-md text-sm font-medium"
              style={{ background: "var(--ink)", color: "var(--surface)" }}
            >
              Get started free
            </Link>
            <a
              href="#features"
              className="inline-flex items-center h-11 px-2 text-sm"
              style={{ color: "var(--ink-secondary)" }}
            >
              See how it works →
            </a>
          </div>
        </div>

        <HeroDemo />
      </section>

      <section
        id="features"
        className="relative z-10 mx-auto max-w-[1280px] px-8 py-20 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              k: "01",
              t: "Real-time sync",
              d: "Changes ripple through the workspace in milliseconds. No refresh. No flash.",
            },
            {
              k: "02",
              t: "Presence, not noise",
              d: "See who's looking at what — without the parade of cursors and confetti.",
            },
            {
              k: "03",
              t: "Built for small teams",
              d: "Roles, permissions, and threads that scale to ten, not ten thousand.",
            },
          ].map((f) => (
            <div key={f.k}>
              <div
                className="font-mono text-[10px] tabular tracking-widest mb-3"
                style={{ color: "var(--accent)" }}
              >
                {f.k}
              </div>
              <h3 className="font-serif text-2xl mb-3" style={{ color: "var(--ink)" }}>
                {f.t}
              </h3>
              <p className="text-sm" style={{ color: "var(--ink-secondary)", lineHeight: 1.65 }}>
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="relative z-10 mx-auto max-w-[1280px] px-8 py-16 border-t flex flex-wrap items-center gap-x-12 gap-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: "var(--ink-muted)" }}
        >
          Trusted by teams at
        </span>
        {["Foundry", "Atelier", "Northwind", "Halcyon", "Marlow & Co."].map((n) => (
          <span key={n} className="font-serif text-lg" style={{ color: "var(--ink-secondary)" }}>
            {n}
          </span>
        ))}
      </section>

      <footer
        className="relative z-10 mx-auto max-w-[1280px] px-8 py-10 border-t flex items-center justify-between text-sm"
        style={{ borderColor: "var(--border)", color: "var(--ink-muted)" }}
      >
        <span>© 2026 SyncForge</span>
        <span className="font-mono text-[10px] tabular">Made with ink.</span>
      </footer>
    </div>
  );
}

function HeroDemo() {
  return (
    <div
      className="relative rounded-lg border p-5 shadow-[var(--shadow-paper)]"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--status-inprogress)" }}
          />
          <span className="text-xs" style={{ color: "var(--ink-secondary)" }}>
            Backend · 3 online
          </span>
        </div>
        <div className="flex -space-x-2">
          {["PR", "RA", "AR"].map((i, idx) => (
            <span
              key={i}
              className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center text-white border-2"
              style={{
                background: ["#C8882A", "#5A8FB8", "#8DB3A0"][idx],
                borderColor: "var(--surface-raised)",
              }}
            >
              {i}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            col: "Todo",
            items: [
              { t: "Review API schema", p: "var(--priority-high)" },
              { t: "Audit auth flow", p: "var(--priority-medium)" },
            ],
          },
          {
            col: "In Progress",
            items: [
              { t: "Fix Redis timeout", p: "var(--priority-urgent)" },
              { t: "Migrate webhooks", p: "var(--priority-high)" },
            ],
          },
          { col: "Done", items: [{ t: "Set up Docker", p: "var(--priority-medium)" }] },
        ].map((c) => (
          <div key={c.col}>
            <div
              className="font-mono text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--ink-muted)" }}
            >
              {c.col}
            </div>
            <div className="space-y-2">
              {c.items.map((it, i) => (
                <div
                  key={i}
                  className="relative rounded-md border p-2.5 text-[11px] animate-ink-in"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r"
                    style={{ background: it.p }}
                  />
                  <span className="pl-1.5" style={{ color: "var(--ink)" }}>
                    {it.t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className="absolute -bottom-3 left-6 right-6 h-3 rounded-b-lg"
        style={{ background: "linear-gradient(180deg, rgba(26,23,20,0.04), transparent)" }}
      />
    </div>
  );
}

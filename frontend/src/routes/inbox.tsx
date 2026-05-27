import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/syncforge/AppShell";
import { Avatar } from "@/components/syncforge/Avatar";
import { ACTIVITY } from "@/lib/syncforge-data";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — SyncForge" },
      { name: "description", content: "Mentions and notifications." },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  return (
    <AppShell crumbs={["SyncForge", "Inbox"]}>
      <h1 className="font-serif text-[2rem] leading-tight mb-8" style={{ color: "var(--ink)" }}>
        Inbox
      </h1>
      <div
        className="rounded-lg border divide-y"
        style={{ background: "var(--surface-raised)", borderColor: "var(--border)" }}
      >
        {ACTIVITY.concat(ACTIVITY).map((a, i) => (
          <div key={i} className="flex items-start gap-3 p-4">
            <Avatar name={a.who} size={28} />
            <div className="flex-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
              <span style={{ color: "var(--ink)" }}>{a.who}</span> {a.what}{" "}
              <span style={{ color: "var(--ink)" }}>"{a.target}"</span>
              <div
                className="font-mono text-[10px] tabular mt-1"
                style={{ color: "var(--ink-muted)" }}
              >
                {a.when}
              </div>
            </div>
            <span
              className="w-1.5 h-1.5 rounded-full mt-2"
              style={{ background: i < 3 ? "var(--accent)" : "transparent" }}
            />
          </div>
        ))}
      </div>
    </AppShell>
  );
}

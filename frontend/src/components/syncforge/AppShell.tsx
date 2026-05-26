import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ crumbs, children }: { crumbs: string[]; children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--surface)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar crumbs={crumbs} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1080px] px-6 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/auth";
import { ensureUserHasOrgMembership } from "@/lib/org/server";
import { SidebarNav } from "./_components/sidebar-nav";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Defense in depth: verify auth even though middleware already checks
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const activeOrgId = await ensureUserHasOrgMembership();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Project Godspeed
        </div>
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Übersicht{activeOrgId ? ` · Org ${activeOrgId.slice(0, 8)}` : ""}
          </div>

          <form action="/app/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100"
            >
              Logout
            </button>
          </form>
        </header>

        <main className="flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  );
}

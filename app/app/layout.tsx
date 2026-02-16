import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureUserHasOrgMembership } from "@/lib/org/server";

const navigation = ["Dashboard", "Kunden", "Verträge", "Einstellungen"];

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const activeOrgId = await ensureUserHasOrgMembership();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Project Godspeed
        </div>
        <nav className="mt-10 space-y-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {navigation.map((item) => (
            <div
              key={item}
              className="rounded-full px-4 py-2 text-zinc-900 dark:text-zinc-100"
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {activeOrgId ? `Org ${activeOrgId.slice(0, 8)}` : "Workspace"}
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

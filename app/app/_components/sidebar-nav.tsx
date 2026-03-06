"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/app" },
  { label: "Kunden", href: "/app/clients" },
  { label: "Verträge", href: "/app/contracts" },
  { label: "Einstellungen", href: "/app/settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-10 space-y-1 text-sm font-medium">
      {navigation.map((item) => {
        const isActive =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl px-4 py-2 transition ${
              isActive
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

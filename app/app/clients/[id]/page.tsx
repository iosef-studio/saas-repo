import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClient,
  updateClientAction,
  archiveClientAction,
} from "@/lib/clients/actions";
import { ClientForm } from "../_components/client-form";
import type { ClientStatus } from "@/lib/clients/types";

const statusLabels: Record<ClientStatus, string> = {
  new: "Neu",
  active: "Aktiv",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

const statusStyles: Record<ClientStatus, string> = {
  new: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  completed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  const updateAction = updateClientAction.bind(null, id);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/app/clients"
          className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Zurück zur Kundenliste
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            {client.name}
          </h1>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[client.status]}`}
          >
            {statusLabels[client.status]}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <ClientForm action={updateAction} client={client} />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Erstellt: {formatDate(client.created_at)} · Bearbeitet:{" "}
          {formatDate(client.updated_at)}
        </div>
        {client.status !== "archived" && (
          <form action={archiveClientAction}>
            <input type="hidden" name="id" value={client.id} />
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-rose-700 dark:hover:text-rose-400"
            >
              Archivieren
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

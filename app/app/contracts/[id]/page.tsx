import Link from "next/link";
import { notFound } from "next/navigation";
import { listClients } from "@/lib/clients/actions";
import {
  getContract,
  updateContractAction,
  cancelContractAction,
} from "@/lib/contracts/actions";
import { ContractForm } from "../_components/contract-form";
import type { ContractStatus } from "@/lib/contracts/types";

const statusLabels: Record<ContractStatus, string> = {
  draft: "Entwurf",
  sent: "Gesendet",
  signed: "Unterschrieben",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const statusStyles: Record<ContractStatus, string> = {
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  sent: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  signed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  completed:
    "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  cancelled:
    "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
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

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  const clients = await listClients();
  const updateAction = updateContractAction.bind(null, id);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/app/contracts"
          className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Zurück zur Vertragsliste
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            {contract.title}
          </h1>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[contract.status]}`}
          >
            {statusLabels[contract.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Kunde:{" "}
          <Link
            href={`/app/clients/${contract.client_id}`}
            className="underline underline-offset-4 transition hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {contract.client_name}
          </Link>
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <ContractForm
          action={updateAction}
          contract={contract}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Erstellt: {formatDate(contract.created_at)} · Bearbeitet:{" "}
          {formatDate(contract.updated_at)}
        </div>
        {contract.status !== "cancelled" && (
          <form action={cancelContractAction}>
            <input type="hidden" name="id" value={contract.id} />
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-rose-700 dark:hover:text-rose-400"
            >
              Stornieren
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

import Link from "next/link";
import { listContracts } from "@/lib/contracts/actions";
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
  }).format(new Date(iso));
}

function formatCurrency(value: number | null): string {
  if (value === null) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default async function ContractsPage() {
  const contracts = await listContracts();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Vertragsmanagement
          </p>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            Verträge
          </h1>
        </div>
        <Link
          href="/app/contracts/new"
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Neuer Vertrag
        </Link>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Noch keine Verträge angelegt.
          </p>
          <Link
            href="/app/contracts/new"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Ersten Vertrag anlegen
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
                <th className="px-6 py-3">Titel</th>
                <th className="hidden px-6 py-3 md:table-cell">Kunde</th>
                <th className="hidden px-6 py-3 md:table-cell">Betrag</th>
                <th className="px-6 py-3">Status</th>
                <th className="hidden px-6 py-3 md:table-cell">Erstellt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/app/contracts/${contract.id}`}
                      className="font-medium text-zinc-900 dark:text-zinc-100"
                    >
                      {contract.title}
                    </Link>
                  </td>
                  <td className="hidden px-6 py-4 text-zinc-500 dark:text-zinc-400 md:table-cell">
                    {contract.client_name}
                  </td>
                  <td className="hidden px-6 py-4 text-zinc-500 dark:text-zinc-400 md:table-cell">
                    {formatCurrency(contract.value)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[contract.status]}`}
                    >
                      {statusLabels[contract.status]}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-zinc-500 dark:text-zinc-400 md:table-cell">
                    {formatDate(contract.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

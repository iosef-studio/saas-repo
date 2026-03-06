import Link from "next/link";
import { listClients } from "@/lib/clients/actions";
import { createContractAction } from "@/lib/contracts/actions";
import { ContractForm } from "../_components/contract-form";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const { client_id } = await searchParams;
  const clients = await listClients();

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/app/contracts"
          className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Zurück zur Vertragsliste
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Neuer Vertrag
        </h1>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <ContractForm
          action={createContractAction}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          defaultClientId={client_id}
        />
      </div>
    </section>
  );
}

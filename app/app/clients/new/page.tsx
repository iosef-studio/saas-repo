import Link from "next/link";
import { createClientAction } from "@/lib/clients/actions";
import { ClientForm } from "../_components/client-form";

export default function NewClientPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/app/clients"
          className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Zurück zur Kundenliste
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Neuer Kunde
        </h1>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <ClientForm action={createClientAction} />
      </div>
    </section>
  );
}

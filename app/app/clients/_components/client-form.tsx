"use client";

import { useActionState } from "react";
import type { Client, ClientStatus } from "@/lib/clients/types";

type ActionResult = { error: string } | undefined;

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: "new", label: "Neu" },
  { value: "active", label: "Aktiv" },
  { value: "completed", label: "Abgeschlossen" },
];

const inputClass =
  "mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-800";

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function ClientForm({
  action,
  client,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  client?: Client;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
          {state.error}
        </p>
      )}

      <label className={labelClass}>
        Name *
        <input
          type="text"
          name="name"
          defaultValue={client?.name ?? ""}
          className={inputClass}
          placeholder="z. B. Anna & Max Schmidt"
          required
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          E-Mail
          <input
            type="email"
            name="email"
            defaultValue={client?.email ?? ""}
            className={inputClass}
            placeholder="name@beispiel.de"
          />
        </label>

        <label className={labelClass}>
          Telefon
          <input
            type="tel"
            name="phone"
            defaultValue={client?.phone ?? ""}
            className={inputClass}
            placeholder="+49 ..."
          />
        </label>
      </div>

      <label className={labelClass}>
        Status
        <select
          name="status"
          defaultValue={client?.status ?? "new"}
          className={inputClass}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Interne Notizen
        <textarea
          name="notes"
          defaultValue={client?.notes ?? ""}
          rows={4}
          className={inputClass}
          placeholder="Notizen, die nur dein Team sieht ..."
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {isPending
          ? "Speichern ..."
          : client
            ? "Änderungen speichern"
            : "Kunde anlegen"}
      </button>
    </form>
  );
}

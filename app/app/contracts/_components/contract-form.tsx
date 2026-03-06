"use client";

import { useActionState } from "react";
import type { Contract, ContractStatus } from "@/lib/contracts/types";

type ActionResult = { error: string } | undefined;

type ClientOption = { id: string; name: string };

const statusLabels: Record<ContractStatus, string> = {
  draft: "Entwurf",
  sent: "Gesendet",
  signed: "Unterschrieben",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const statusTransitions: Record<ContractStatus, ContractStatus[]> = {
  draft: ["draft", "sent", "cancelled"],
  sent: ["sent", "signed", "cancelled"],
  signed: ["signed", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-800";

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function ContractForm({
  action,
  contract,
  clients,
  defaultClientId,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  contract?: Contract;
  clients: ClientOption[];
  defaultClientId?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  const isEdit = !!contract;
  const currentStatus = contract?.status ?? "draft";
  const availableStatuses = isEdit
    ? statusTransitions[currentStatus]
    : (["draft"] as ContractStatus[]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
          {state.error}
        </p>
      )}

      <label className={labelClass}>
        Titel *
        <input
          type="text"
          name="title"
          defaultValue={contract?.title ?? ""}
          className={inputClass}
          placeholder="z. B. Brautstyling-Vertrag 2026"
          required
        />
      </label>

      <label className={labelClass}>
        Kunde *
        <select
          name="client_id"
          defaultValue={contract?.client_id ?? defaultClientId ?? ""}
          className={inputClass}
          required
        >
          <option value="" disabled>
            Kunde auswählen …
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          Betrag (EUR)
          <input
            type="number"
            name="value"
            defaultValue={contract?.value ?? ""}
            className={inputClass}
            placeholder="z. B. 2500.00"
            step="0.01"
            min="0"
          />
        </label>

        <label className={labelClass}>
          Leistungsdatum
          <input
            type="date"
            name="service_date"
            defaultValue={contract?.service_date ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        Status
        <select
          name="status"
          defaultValue={currentStatus}
          className={inputClass}
        >
          {availableStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Interne Notizen
        <textarea
          name="notes"
          defaultValue={contract?.notes ?? ""}
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
          : isEdit
            ? "Änderungen speichern"
            : "Vertrag anlegen"}
      </button>
    </form>
  );
}

"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/auth";
import { ensureUserHasOrgMembership } from "@/lib/org/server";
import type { Contract, ContractStatus, ContractWithClient } from "./types";

const VALID_STATUSES: ContractStatus[] = [
  "draft",
  "sent",
  "signed",
  "completed",
  "cancelled",
];

type ActionResult = { error: string } | undefined;

export async function listContracts(): Promise<ContractWithClient[]> {
  const orgId = await ensureUserHasOrgMembership();
  if (!orgId) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("contracts")
    .select("*, clients(name)")
    .eq("org_id", orgId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const { clients: clientData, ...contract } = row as Contract & {
      clients: { name: string } | null;
    };
    return {
      ...contract,
      client_name: clientData?.name ?? "–",
    };
  });
}

export async function getContract(
  id: string,
): Promise<ContractWithClient | null> {
  const orgId = await ensureUserHasOrgMembership();
  if (!orgId) return null;

  const supabase = await createClient();

  const { data } = await supabase
    .from("contracts")
    .select("*, clients(name)")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (!data) return null;

  const { clients: clientData, ...contract } = data as Contract & {
    clients: { name: string } | null;
  };

  return {
    ...contract,
    client_name: clientData?.name ?? "–",
  };
}

export async function listContractsByClient(
  clientId: string,
): Promise<Contract[]> {
  const orgId = await ensureUserHasOrgMembership();
  if (!orgId) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("contracts")
    .select("*")
    .eq("org_id", orgId)
    .eq("client_id", clientId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  return (data as Contract[] | null) ?? [];
}

export async function createContractAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const orgId = await ensureUserHasOrgMembership();
  if (!orgId) {
    return {
      error:
        "Organisation konnte nicht erstellt werden. Bitte lade die Seite neu.",
    };
  }

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { error: "Titel ist erforderlich." };

  const clientId = (formData.get("client_id") as string | null)?.trim();
  if (!clientId) return { error: "Bitte einen Kunden auswählen." };

  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const serviceDateRaw =
    (formData.get("service_date") as string | null)?.trim() || null;
  const valueRaw =
    (formData.get("value") as string | null)?.trim() || null;

  let value: number | null = null;
  if (valueRaw) {
    value = parseFloat(valueRaw);
    if (isNaN(value) || value < 0) {
      return { error: "Bitte einen gültigen Betrag eingeben." };
    }
  }

  // Verify client belongs to the same org (RLS on clients table ensures this)
  const supabase = await createClient();
  const { data: clientCheck } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("org_id", orgId)
    .single();

  if (!clientCheck) {
    return { error: "Ausgewählter Kunde nicht gefunden." };
  }

  const { error } = await supabase.from("contracts").insert({
    org_id: orgId,
    client_id: clientId,
    title,
    value,
    service_date: serviceDateRaw,
    notes,
    status: "draft",
  });

  if (error) {
    console.error("[createContractAction] Insert failed:", error.message);
    return {
      error: `Vertrag konnte nicht angelegt werden: ${error.message}`,
    };
  }

  revalidatePath("/app/contracts");
  redirect("/app/contracts");
}

export async function updateContractAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const orgId = await ensureUserHasOrgMembership();
  if (!orgId) {
    return {
      error:
        "Organisation konnte nicht erstellt werden. Bitte lade die Seite neu.",
    };
  }

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { error: "Titel ist erforderlich." };

  const clientId = (formData.get("client_id") as string | null)?.trim();
  if (!clientId) return { error: "Bitte einen Kunden auswählen." };

  const status = (formData.get("status") as string | null) ?? "draft";
  if (!VALID_STATUSES.includes(status as ContractStatus)) {
    return { error: "Ungültiger Status." };
  }

  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const serviceDateRaw =
    (formData.get("service_date") as string | null)?.trim() || null;
  const valueRaw =
    (formData.get("value") as string | null)?.trim() || null;

  let value: number | null = null;
  if (valueRaw) {
    value = parseFloat(valueRaw);
    if (isNaN(value) || value < 0) {
      return { error: "Bitte einen gültigen Betrag eingeben." };
    }
  }

  // Verify client belongs to same org
  const supabase = await createClient();
  const { data: clientCheck } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("org_id", orgId)
    .single();

  if (!clientCheck) {
    return { error: "Ausgewählter Kunde nicht gefunden." };
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      title,
      client_id: clientId,
      value,
      service_date: serviceDateRaw,
      notes,
      status,
    })
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) {
    console.error("[updateContractAction] Update failed:", error.message);
    return {
      error: `Änderungen konnten nicht gespeichert werden: ${error.message}`,
    };
  }

  revalidatePath("/app/contracts");
  revalidatePath(`/app/contracts/${id}`);
  redirect(`/app/contracts/${id}`);
}

export async function cancelContractAction(formData: FormData): Promise<void> {
  const orgId = await ensureUserHasOrgMembership();
  if (!orgId) return;

  const id = formData.get("id") as string | null;
  if (!id) return;

  const supabase = await createClient();

  await supabase
    .from("contracts")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("org_id", orgId);

  revalidatePath("/app/contracts");
  redirect("/app/contracts");
}

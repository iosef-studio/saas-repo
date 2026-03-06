"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/auth";
import { getActiveOrgId } from "@/lib/org/server";
import type { Client, ClientStatus } from "./types";

const VALID_STATUSES: ClientStatus[] = ["new", "active", "completed", "archived"];

type ActionResult = { error: string } | undefined;

export async function listClients(): Promise<Client[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("org_id", orgId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  return (data as Client[] | null) ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  return (data as Client | null) ?? null;
}

export async function createClientAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "Keine Organisation gefunden." };

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Name ist erforderlich." };

  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const status = (formData.get("status") as string | null) ?? "new";

  if (!VALID_STATUSES.includes(status as ClientStatus)) {
    return { error: "Ungueltiger Status." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("clients").insert({
    org_id: orgId,
    name,
    email,
    phone,
    notes,
    status,
  });

  if (error) return { error: "Kunde konnte nicht angelegt werden." };

  revalidatePath("/app/clients");
  redirect("/app/clients");
}

export async function updateClientAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "Keine Organisation gefunden." };

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Name ist erforderlich." };

  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const status = (formData.get("status") as string | null) ?? "new";

  if (!VALID_STATUSES.includes(status as ClientStatus)) {
    return { error: "Ungueltiger Status." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ name, email, phone, notes, status })
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) return { error: "Aenderungen konnten nicht gespeichert werden." };

  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${id}`);
  redirect(`/app/clients/${id}`);
}

export async function archiveClientAction(formData: FormData): Promise<void> {
  const orgId = await getActiveOrgId();
  if (!orgId) return;

  const id = formData.get("id") as string | null;
  if (!id) return;

  const supabase = await createClient();

  await supabase
    .from("clients")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("org_id", orgId);

  revalidatePath("/app/clients");
  redirect("/app/clients");
}

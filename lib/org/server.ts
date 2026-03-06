import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/auth";

type MembershipRow = { org_id: string };

export async function getActiveOrgId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: memberships, error } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[getActiveOrgId] Failed to query org_members:", error.message);
    return null;
  }

  return (memberships as MembershipRow[] | null)?.[0]?.org_id ?? null;
}

export async function ensureUserHasOrgMembership(): Promise<string | null> {
  const existingOrgId = await getActiveOrgId();

  if (existingOrgId) {
    return existingOrgId;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[ensureUserHasOrgMembership] No authenticated user found");
    return null;
  }

  // Generate ID client-side to avoid .select() after insert.
  // The SELECT RLS policy requires org membership, which doesn't exist yet
  // at this point — so .select("id") would return empty even though the
  // INSERT succeeded.
  const orgId = randomUUID();

  const { error: orgError } = await supabase
    .from("orgs")
    .insert({ id: orgId, name: "Meine Organisation", created_by: user.id });

  if (orgError) {
    console.error("[ensureUserHasOrgMembership] Failed to create org:", orgError.message);
    return null;
  }

  const { error: memberError } = await supabase
    .from("org_members")
    .upsert(
      { org_id: orgId, user_id: user.id, role: "owner" },
      { onConflict: "org_id,user_id" },
    );

  if (memberError) {
    console.error("[ensureUserHasOrgMembership] Failed to create membership:", memberError.message);
    return null;
  }

  return orgId;
}

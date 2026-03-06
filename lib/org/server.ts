import "server-only";

import { createClient } from "@/lib/supabase/auth";

type MembershipRow = { org_id: string };
type OrgRow = { id: string };

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

  console.log("[ensureUserHasOrgMembership] Bootstrapping org for user:", user.id);

  const { data: createdOrgs, error: orgError } = await supabase
    .from("orgs")
    .insert({ name: "Meine Organisation", created_by: user.id })
    .select("id");

  if (orgError || !createdOrgs?.[0]) {
    console.error("[ensureUserHasOrgMembership] Failed to create org:", orgError?.message ?? "No data returned");
    return null;
  }

  const orgId = (createdOrgs as OrgRow[])[0].id;

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

  console.log("[ensureUserHasOrgMembership] Org bootstrapped:", orgId);
  return orgId;
}

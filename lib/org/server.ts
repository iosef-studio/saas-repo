import "server-only";

import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/auth";

type SupabaseUserResponse = { id: string };
type MembershipRow = { org_id: string };
type OrgRow = { id: string };

function getAccessTokenFromCookies() {
  return cookies().then((store) => store.get("sb-access-token")?.value ?? null);
}

function getAuthHeaders(accessToken: string) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  } as const;
}

function getRestUrl(path: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
}

function getAuthUrl(path: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1/${path}`;
}

async function getAuthenticatedUserId(accessToken: string) {
  const response = await fetch(getAuthUrl("user"), {
    method: "GET",
    headers: getAuthHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as SupabaseUserResponse;
  return user.id ?? null;
}

export async function getActiveOrgId() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const accessToken = await getAccessTokenFromCookies();

  if (!accessToken) {
    return null;
  }

  const userId = await getAuthenticatedUserId(accessToken);

  if (!userId) {
    return null;
  }

  const membershipsResponse = await fetch(
    getRestUrl(
      `org_members?select=org_id&user_id=eq.${userId}&order=created_at.asc&limit=1`,
    ),
    {
      method: "GET",
      headers: getAuthHeaders(accessToken),
      cache: "no-store",
    },
  );

  if (!membershipsResponse.ok) {
    return null;
  }

  const memberships = (await membershipsResponse.json()) as MembershipRow[];
  return memberships[0]?.org_id ?? null;
}

export async function ensureUserHasOrgMembership() {
  const existingOrgId = await getActiveOrgId();

  if (existingOrgId) {
    return existingOrgId;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const accessToken = await getAccessTokenFromCookies();

  if (!accessToken) {
    return null;
  }

  const userId = await getAuthenticatedUserId(accessToken);

  if (!userId) {
    return null;
  }

  const createOrgResponse = await fetch(getRestUrl("orgs"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(accessToken),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: "Meine Organisation",
      created_by: userId,
    }),
    cache: "no-store",
  });

  if (!createOrgResponse.ok) {
    const responseBody = await createOrgResponse.text();
    console.error("[ensureUserHasOrgMembership] create org failed", {
      status: createOrgResponse.status,
      body: responseBody,
    });
    return null;
  }

  const createdOrgs = (await createOrgResponse.json()) as OrgRow[];
  const orgId = createdOrgs[0]?.id;

  if (!orgId) {
    return null;
  }

  const createMembershipResponse = await fetch(
    getRestUrl("org_members?on_conflict=org_id,user_id"),
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(accessToken),
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify({
        org_id: orgId,
        user_id: userId,
        role: "owner",
      }),
      cache: "no-store",
    },
  );

  if (!createMembershipResponse.ok) {
    const responseBody = await createMembershipResponse.text();
    console.error("[ensureUserHasOrgMembership] create membership failed", {
      status: createMembershipResponse.status,
      body: responseBody,
    });
    return null;
  }

  return orgId;
}

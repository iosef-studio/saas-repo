export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function buildSupabaseAuthUrl(path: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1/${path}`;
}

export function getSupabaseAuthHeaders() {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  } as const;
}

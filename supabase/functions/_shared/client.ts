// Shared Supabase client helpers for Edge Functions.
//
// We build a client that carries the *caller's* JWT, so all reads and writes
// are subject to Row Level Security. That means a user can only ever touch
// vessels they own or are a member of — no service_role key is required for the
// privileged DB writes these functions perform (the caller is the vessel admin).
//
// A service_role client is only needed for operations that must bypass RLS,
// e.g. Storage uploads from Edge Functions. Read SUPABASE_SERVICE_ROLE_KEY
// from the function environment (set via `supabase secrets set`) — never
// hardcode or commit it.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export function getUserClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
}

export async function requireUser(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new HttpError("Unauthorized — no valid session.", 401);
  return data.user;
}

/**
 * Confirms the caller can access (read) the vessel. With RLS active this
 * returns null for vessels the user has no membership in, which we treat as a
 * 403. Writes are additionally gated by the admin RLS policies.
 */
export async function assertVesselAccess(client: SupabaseClient, vesselId: string) {
  const { data, error } = await client.from("vessels").select("*").eq("id", vesselId).maybeSingle();
  if (error) throw new HttpError(error.message, 400);
  if (!data) throw new HttpError("Forbidden — no access to this vessel.", 403);
  return data;
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

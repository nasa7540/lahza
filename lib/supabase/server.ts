import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Service-role client for route handlers and scripts. Returns null when env is not configured. */
export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

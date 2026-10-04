import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv, requireEnv } from "./env";

/** Service-role client for scripts run from a developer machine. */
export function scriptDb(): SupabaseClient {
  loadEnv();
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

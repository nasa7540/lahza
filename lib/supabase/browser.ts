import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Anon client for the browser (insert-only by RLS). Returns null when env is not configured. */
export function createBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

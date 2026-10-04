import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Called daily by Vercel Cron so the free Supabase project stays active.
 * `db: "no_access"` means the tables answer but the server cannot read rows: the configured key is not the
 * service key, so row-level security hides everything and the app would silently show no content.
 */
export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ ok: false, db: "not_configured" }, { status: 503 });
  }

  for (const table of ["journeys", "journey_drafts", "review_decisions"]) {
    const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
    if (error) {
      return Response.json({ ok: false, db: "error" }, { status: 503 });
    }
  }
  const { count, error } = await supabase.from("quran_verses").select("sura", { count: "exact", head: true });
  if (error || !count) {
    return Response.json({ ok: false, db: "no_access" }, { status: 503 });
  }

  return Response.json({ ok: true, db: "up" });
}

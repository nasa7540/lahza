import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Called daily by Vercel Cron so the free Supabase project stays active. */
export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ ok: false, db: "not_configured" }, { status: 503 });
  }

  const { error } = await supabase
    .from("journeys")
    .select("id", { count: "exact", head: true });
  if (error) {
    return Response.json({ ok: false, db: "error" }, { status: 503 });
  }

  return Response.json({ ok: true, db: "up" });
}

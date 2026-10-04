import { z } from "zod";
import { tooMany } from "@/lib/http/limit";
import { createServiceClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  type: z.enum(["start", "choice", "complete"]),
  journey_id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  lang: z.enum(["ar", "en", "ur"]),
  choice: z.enum(["A", "B", "C", "D", "other"]).optional(),
  company: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
});

/** Anonymous counters for the company dashboard. Accepts ids and enums only; answers with ok and nothing else. */
export async function POST(request: Request) {
  if (tooMany(request, "event")) return Response.json({ ok: false }, { status: 429 });
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const db = createServiceClient();
  if (!db) return Response.json({ ok: false }, { status: 503 });
  const { error } = await db.from("events").insert(parsed.data);
  if (error) console.error("event insert failed:", error.message);
  return Response.json({ ok: !error }, { status: error ? 500 : 200 });
}

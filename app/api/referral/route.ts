import { tooMany } from "@/lib/http/limit";
import { referralSchema } from "@/lib/referral";
import { createServiceClient } from "@/lib/supabase/server";

/** A request to talk to a human specialist: the user's own edited summary, sent only with their consent. */
export async function POST(request: Request) {
  if (tooMany(request)) return Response.json({ ok: false }, { status: 429 });
  const parsed = referralSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const db = createServiceClient();
  if (!db) return Response.json({ ok: false }, { status: 503 });
  const { lang, topic, summary, company } = parsed.data;
  const { error } = await db.from("referrals").insert({ lang, topic, summary, company: company ?? null });
  if (error) console.error("referral insert failed:", error.message);
  return Response.json({ ok: !error }, { status: error ? 500 : 200 });
}

import { after } from "next/server";
import { z } from "zod";
import { ROUTE_JOURNEYS } from "@/lib/classify/journeys";
import { type RouteResult, routeQuestion } from "@/lib/classify/route";
import { tooMany, withoutAngleBrackets } from "@/lib/http/limit";
import { createServiceClient } from "@/lib/supabase/server";

// Above the 12 s cap of the hedged request, so the function is never cut before it can answer with the empty state.
export const maxDuration = 20;

const bodySchema = z.object({ text: z.string().trim().min(2).max(500), lang: z.enum(["ar", "en", "ur"]) });
const EMPTY: RouteResult = { outcome: "empty", journeys: [] };

/**
 * "Noticed something else?" The answer is an outcome and journey ids from the fixed topic list, nothing a model
 * wrote; the model's reason stays in the server log. The screen offers a journey only if it is in the list of
 * approved journeys it was rendered with, so an id for a journey that is not approved shows nothing.
 */
export async function POST(request: Request) {
  if (tooMany(request)) return Response.json(EMPTY, { status: 429 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json(EMPTY, { status: 400 });
  const db = createServiceClient();
  if (!db) return Response.json(EMPTY, { status: 503 });

  const trace = await routeQuestion(db, withoutAngleBrackets(body.data.text), ROUTE_JOURNEYS);
  const result: RouteResult = { outcome: trace.outcome, journeys: trace.journeys };
  console.log(JSON.stringify({ at: "classify", by: trace.by, level: trace.level, classified: trace.classified, top: trace.top, outcome: trace.outcome, ms: trace.ms, reason: trace.reason }));
  // Anonymous counter (level and outcome, never the question), written after the answer is sent.
  after(async () => {
    const { error } = await db.from("events").insert({ type: "classify", lang: body.data.lang, level: trace.level, choice: trace.outcome, journey_id: trace.journeys[0] ?? null });
    if (error) console.error("classify event failed:", error.message);
  });
  // The header names which path answered (an enum), for the load check.
  return Response.json(result, { headers: { "x-lahza-route": trace.by } });
}

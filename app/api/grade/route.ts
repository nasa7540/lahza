import { after } from "next/server";
import { z } from "zod";
import { getJourneyForGrading } from "@/lib/content/journeys";
import { gradeAnswer, type GradeResult } from "@/lib/grade/grade";
import { graderInput } from "@/lib/grade/input";
import { tooMany, withoutAngleBrackets } from "@/lib/http/limit";
import { createServiceClient } from "@/lib/supabase/server";

// Above the 12 s cap of the hedged request plus the similarity check.
export const maxDuration = 25;

const bodySchema = z.object({ journey_id: z.string().regex(/^[a-z0-9-]{1,40}$/), lang: z.enum(["ar", "en", "ur"]), text: z.string().trim().min(2).max(600) });
const UNAVAILABLE: GradeResult = { status: "unavailable", covered: [], missing: [] };

/**
 * "Explain it in your words." The answer is a status and the positions of the key points covered and missing;
 * the screen shows the approved key point texts it already has. The score is computed in code and only stored.
 */
export async function POST(request: Request) {
  if (tooMany(request)) return Response.json(UNAVAILABLE, { status: 429 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json(UNAVAILABLE, { status: 400 });
  const { journey_id, lang, text } = body.data;
  const journey = await getJourneyForGrading(lang, journey_id).catch(() => null);
  if (!journey) return Response.json(UNAVAILABLE, { status: 404 });

  const trace = await gradeAnswer(graderInput(journey, lang, withoutAngleBrackets(text)));
  const result: GradeResult = { status: trace.status, covered: trace.covered, missing: trace.missing };
  console.log(JSON.stringify({ at: "grade", journey: journey_id, by: trace.by, status: trace.status, covered: trace.covered, score: trace.score, misconception: trace.misconception, why: trace.why, ms: trace.ms, quotes: trace.proposals.map((p) => ({ point: p.point, verbatim: p.verbatim, similarity: p.similarity, accepted: p.accepted })) }));
  after(async () => {
    const db = createServiceClient();
    if (!db || trace.score === null) return;
    const choice = trace.misconception === null ? null : (journey.text.options[trace.misconception]?.id ?? null);
    const { error } = await db.from("events").insert({ type: "grade", lang, journey_id, score: trace.score, choice, level: journey.level });
    if (error) console.error("grade event failed:", error.message);
  });
  return Response.json(result, { headers: { "x-lahza-route": trace.by } });
}

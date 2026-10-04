import type { SupabaseClient } from "@supabase/supabase-js";
import { decisionsFor, visibility } from "./review";
import { type Draft, draftSchema, type JourneyText, type Lang, type Source, type When } from "./types";

/** A journey as a reader may see it in one language. Built only from text a human approved (or, in development, clearly tagged drafts). */
export type PublicJourney = {
  id: string;
  draft_id: string;
  level: Draft["level"];
  when: When;
  text: JourneyText;
  /** Every language of the same draft, approved or not. Server-side use only (the grader compares meanings across languages); never sent to a reader. */
  locales: Draft["locales"];
  sources: Source[];
  /** Team-approved but not yet approved by a sharia reviewer. */
  badge: boolean;
  /** False only in development preview. */
  approved: boolean;
};

export type PublishOptions = {
  /** Development only: also return the newest draft of a journey that is not approved, marked approved: false. */
  preview: boolean;
  /** Journeys whose id starts with "test-" exist only while a check runs; they are listed only when a check asks. */
  includeTests: boolean;
};

const TEST_PREFIX = "test-";

/**
 * The display rule in one place. For each journey: the newest draft whose text in this language is approved
 * (team for ordinary topics, sharia reviewer as well for needs_sharii topics). Nothing else leaves the server.
 */
export async function publishedJourneys(db: SupabaseClient, lang: Lang, options: PublishOptions): Promise<PublicJourney[]> {
  const { data, error } = await db.from("journey_drafts").select("id, journey_id, draft, created_at").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).filter((r) => options.includeTests || !String(r.journey_id).startsWith(TEST_PREFIX));
  const decisions = await decisionsFor(db, rows.map((r) => r.id));
  const chosen = new Map<string, PublicJourney>();
  const fallback = new Map<string, PublicJourney>();
  for (const row of rows) {
    if (chosen.has(row.journey_id)) continue;
    const parsed = draftSchema.safeParse(row.draft);
    if (!parsed.success) continue;
    const draft = parsed.data;
    const text = draft.locales[lang];
    if (!text) continue;
    const v = visibility(draft, lang, decisions.get(draft.id) ?? []);
    const journey: PublicJourney = { id: draft.journey_id, draft_id: draft.id, level: draft.level, when: draft.when, text, locales: draft.locales, sources: draft.sources, badge: v.badge, approved: v.visible };
    if (v.visible) chosen.set(draft.journey_id, journey);
    else if (options.preview && !draft.needs_sharii && draft.status === "draft" && !fallback.has(draft.journey_id)) fallback.set(draft.journey_id, journey);
  }
  for (const [id, journey] of fallback) if (!chosen.has(id)) chosen.set(id, journey);
  return [...chosen.values()].sort((a, b) => a.id.localeCompare(b.id));
}

import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { type PublishedRow, type Served, served } from "./publish";
import { publishedJourneys } from "./published";
import type { Draft, Lang, When } from "./types";

/**
 * Unapproved drafts are previewed only by `next dev`; a deployed build never shows them.
 * LAHZA_PREVIEW_UNAPPROVED=1 is set only by the local load check, which needs journeys to grade against a production build.
 */
const PREVIEW = process.env.NODE_ENV !== "production" || process.env.LAHZA_PREVIEW_UNAPPROVED === "1";
const INCLUDE_TESTS = process.env.LAHZA_TEST_JOURNEYS === "1";

/** A journey as the screens and the grader use it. */
export type ShownJourney = Served & { id: string; level: Draft["level"]; when: When; approved: boolean };

/**
 * A deployed build reads the published snapshot: one small query. The snapshot is rewritten by every review
 * decision, edit and draft update, so an approval that is withdrawn disappears with the write that withdraws it,
 * with no cache to wait for. Development preview computes from the drafts instead, so unapproved drafts can be seen.
 */
export async function listJourneys(lang: Lang): Promise<ShownJourney[]> {
  const db = createServiceClient();
  if (!db) return [];
  if (PREVIEW) {
    const drafts = await publishedJourneys(db, lang, { preview: true, includeTests: INCLUDE_TESTS });
    return drafts.flatMap((j) => {
      const s = served({ journey_id: j.id, id: j.draft_id, level: j.level, when: j.when, locales: j.locales, sources: j.sources } as Draft, lang, j.badge, j.approved);
      return s ? [{ ...s, id: j.id, level: j.level, when: j.when, approved: j.approved }] : [];
    });
  }
  const { data, error } = await db.from("journeys").select("id, level, unlock_rule, content").order("id");
  if (error) throw new Error(error.message);
  return ((data ?? []) as PublishedRow[]).flatMap((row) => {
    const s = row.content.app?.[lang];
    if (!s || (!INCLUDE_TESTS && row.id.startsWith("test-"))) return [];
    return [{ ...s, id: row.id, level: row.level, when: row.unlock_rule, approved: true }];
  });
}

export async function getJourney(lang: Lang, id: string): Promise<ShownJourney | null> {
  return (await listJourneys(lang)).find((j) => j.id === id) ?? null;
}

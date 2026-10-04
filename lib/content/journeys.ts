import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { Lang } from "./types";
import { type PublicJourney, publishedJourneys } from "./published";

/**
 * Unapproved drafts are previewed only by `next dev`; a deployed build never shows them.
 * LAHZA_PREVIEW_UNAPPROVED=1 is set only by the local load check, which needs journeys to grade against a production build.
 */
const PREVIEW = process.env.NODE_ENV !== "production" || process.env.LAHZA_PREVIEW_UNAPPROVED === "1";
const INCLUDE_TESTS = process.env.LAHZA_TEST_JOURNEYS === "1";

export async function listJourneys(lang: Lang): Promise<PublicJourney[]> {
  const db = createServiceClient();
  if (!db) return [];
  return publishedJourneys(db, lang, { preview: PREVIEW, includeTests: INCLUDE_TESTS });
}

export async function getJourney(lang: Lang, id: string): Promise<PublicJourney | null> {
  return (await listJourneys(lang)).find((j) => j.id === id) ?? null;
}

const CACHE_MS = 30_000;
const cache = new Map<Lang, { at: number; list: Promise<PublicJourney[]> }>();

/**
 * For the grader only: the same list, remembered for 30 seconds so many answers at once do not each reload every
 * draft. The grader returns positions, never text, so a journey unapproved a moment ago cannot leak through it.
 */
export async function getJourneyForGrading(lang: Lang, id: string): Promise<PublicJourney | null> {
  const hit = cache.get(lang);
  const fresh = hit && Date.now() - hit.at < CACHE_MS ? hit : { at: Date.now(), list: listJourneys(lang) };
  cache.set(lang, fresh);
  try {
    return (await fresh.list).find((j) => j.id === id) ?? null;
  } catch (error) {
    cache.delete(lang);
    throw error;
  }
}

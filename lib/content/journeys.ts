import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { Lang } from "./types";
import { type PublicJourney, publishedJourneys } from "./published";

/** Unapproved drafts are previewed only by `next dev`; a deployed build never shows them. */
const PREVIEW = process.env.NODE_ENV !== "production";
const INCLUDE_TESTS = process.env.LAHZA_TEST_JOURNEYS === "1";

export async function listJourneys(lang: Lang): Promise<PublicJourney[]> {
  const db = createServiceClient();
  if (!db) return [];
  return publishedJourneys(db, lang, { preview: PREVIEW, includeTests: INCLUDE_TESTS });
}

export async function getJourney(lang: Lang, id: string): Promise<PublicJourney | null> {
  return (await listJourneys(lang)).find((j) => j.id === id) ?? null;
}

// P0 check: the tables and columns the app depends on exist.
import { scriptDb } from "../db";

const EXPECTED: Record<string, string> = {
  sources: "id",
  journeys: "id",
  cards: "id",
  card_embeddings: "id",
  referrals: "id",
  events: "id, text, embedding",
  journey_drafts: "id, journey_id, status, needs_sharii, draft",
  review_decisions: "id, draft_id, lang, unit_id, role, action, reviewer, text_hash",
  quran_verses: "sura, aya, text_uthmani, text_norm, en, ur, embedding",
};

async function main() {
  const db = scriptDb();
  let failed = 0;
  for (const [table, columns] of Object.entries(EXPECTED)) {
    const { error } = await db.from(table).select(columns).limit(1);
    console.log(`${error ? "FAIL" : "ok  "} ${table}${error ? ` — ${error.message}` : ""}`);
    if (error) failed++;
  }
  if (failed) process.exit(1);
  console.log("check:db passed");
}

main();

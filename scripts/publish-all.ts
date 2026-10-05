// Rewrites the published snapshot of every journey from its newest draft and the review decisions.
// Safe to run at any time: it writes only languages whose every unit is approved on its current text.
import { latestDrafts } from "../lib/content/drafts";
import { publish } from "../lib/content/publish";
import { scriptDb } from "./db";

async function main() {
  const db = scriptDb();
  for (const draft of await latestDrafts(db)) {
    const shown = await publish(db, draft);
    console.log(`${draft.journey_id}: ${shown.length ? shown.join(" ") : "nothing approved"}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// Embeds the example questions of every journey into card_embeddings (the search side of the free question).
// Sources: the newest draft of each journey in every language it has, plus content/extra-questions.json.
// These texts are used for search only and are never shown. Re-run after drafts change: it replaces all rows.
import { readFileSync } from "node:fs";
import { embed } from "../lib/ai/embed";
import { latestDrafts } from "../lib/content/drafts";
import { scriptDb } from "./db";

async function main() {
  const db = scriptDb();
  const extra = JSON.parse(readFileSync("content/extra-questions.json", "utf8")) as Record<string, string[] | string>;
  const rows: { journey_id: string; lang: string; text: string }[] = [];
  for (const draft of await latestDrafts(db)) {
    if (draft.journey_id.startsWith("test-")) continue;
    for (const [lang, text] of Object.entries(draft.locales)) for (const q of text?.question_variants ?? []) rows.push({ journey_id: draft.journey_id, lang, text: q });
    const more = extra[draft.journey_id];
    if (Array.isArray(more)) for (const q of more) rows.push({ journey_id: draft.journey_id, lang: "extra", text: q });
  }
  const vectors: number[][] = [];
  for (let i = 0; i < rows.length; i += 48) vectors.push(...(await embed(rows.slice(i, i + 48).map((r) => r.text))));
  const cleared = await db.from("card_embeddings").delete().gte("id", 0);
  if (cleared.error) throw new Error(cleared.error.message);
  const { error } = await db.from("card_embeddings").insert(rows.map((r, i) => ({ ...r, embedding: JSON.stringify(vectors[i]) })));
  if (error) throw new Error(error.message);
  const per = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.journey_id]: (acc[r.journey_id] ?? 0) + 1 }), {});
  console.log(`embed-cards: ${rows.length} example questions — ${Object.entries(per).map(([k, v]) => `${k} ${v}`).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

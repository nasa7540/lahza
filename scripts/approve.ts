// Team approval from the command line, until the review panel exists (P5). Writes the same review_decisions rows.
//   npm run approve -- --draft <id|journey> --lang ar|en|ur --name <reviewer>
// Each language is approved on its own, against the text as it reads now: any later edit makes it unapproved again.
// This command only records the project team's approval. A sharia reviewer's approval is never written from here.
import { findDraft } from "../lib/content/drafts";
import { approveAllUnits } from "../lib/content/review";
import { langSchema } from "../lib/content/types";
import { publish } from "../lib/review/decide";
import { scriptDb } from "./db";

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const ref = arg(args, "--draft");
  const lang = langSchema.safeParse(arg(args, "--lang"));
  const name = arg(args, "--name");
  if (!ref || !lang.success || !name) throw new Error("usage: npm run approve -- --draft <id|journey> --lang ar|en|ur --name <reviewer>");
  const db = scriptDb();
  const draft = await findDraft(db, ref);
  if (!draft) throw new Error(`no draft "${ref}"`);
  if (draft.status !== "draft") throw new Error(`draft ${draft.id} is "${draft.status}" and cannot be approved`);
  const n = await approveAllUnits(db, draft, lang.data, "team", name);
  await publish(db, draft);
  console.log(`${draft.journey_id} (${draft.id}): ${n} ${lang.data} units approved by ${name} for the project team` + (draft.needs_sharii ? " — still hidden until a sharia reviewer approves it" : ""));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

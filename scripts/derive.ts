// Derives English or Urdu from the Arabic of a draft and stores it in the same draft, unapproved.
//   npm run derive -- --draft <id|journey> --lang en|ur
// Arabic is the original: by default this refuses until the team approved every Arabic unit.
//   --dev   derive before approval, for local testing of the screens only. The derived text still needs its own approval,
//           and it is derived again once the Arabic is approved (--force).
//   --force replace an existing derived text
import { latestDraft, updateDraft } from "../lib/content/drafts";
import { decisionsFor, visibility } from "../lib/content/review";
import { draftSchema } from "../lib/content/types";
import { derive } from "../lib/factory/derive";
import { scriptDb } from "./db";

async function main() {
  const args = process.argv.slice(2);
  const ref = args[args.indexOf("--draft") + 1];
  const lang = args[args.indexOf("--lang") + 1];
  if (!args.includes("--draft") || !ref || (lang !== "en" && lang !== "ur")) throw new Error("usage: npm run derive -- --draft <id|journey> --lang en|ur [--dev] [--force]");
  const db = scriptDb();
  const byId = /^[0-9a-f-]{36}$/.test(ref) ? await db.from("journey_drafts").select("draft").eq("id", ref).maybeSingle() : null;
  const draft = byId?.data ? draftSchema.parse(byId.data.draft) : await latestDraft(db, ref);
  if (!draft) throw new Error(`no draft "${ref}"`);
  if (draft.locales[lang] && !args.includes("--force")) {
    console.log(`${draft.journey_id}: ${lang} already derived (use --force to replace)`);
    return;
  }
  const decisions = (await decisionsFor(db, [draft.id])).get(draft.id) ?? [];
  const arabic = visibility(draft, "ar", decisions);
  if (!arabic.team && !args.includes("--dev")) throw new Error(`${draft.journey_id}: the Arabic is not approved by the team yet (${arabic.pending} units pending); approve it first, or pass --dev for local testing`);
  const started = Date.now();
  const text = await derive(draft.locales.ar, lang);
  draft.locales[lang] = text;
  draft.log.push({ step: "derive", lang, at: new Date().toISOString(), arabic_approved: arabic.team });
  await updateDraft(db, draftSchema.parse(draft));
  console.log(`${draft.journey_id}: ${lang} derived from ${arabic.team ? "approved" : "UNAPPROVED (dev)"} Arabic and saved in ${draft.id} — ${Math.round((Date.now() - started) / 1000)}s — not shown until approved`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

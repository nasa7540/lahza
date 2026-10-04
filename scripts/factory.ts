// Runs the journey factory for one or more topics and saves each draft as soon as it is ready.
//   npm run factory -- --topic ramadan            one topic
//   npm run factory -- --all                      every topic in content/topics.json
//   add --force to regenerate a topic that already has a draft
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { latestDraft, saveDraft } from "../lib/content/drafts";
import { draftChecks, runFactory } from "../lib/factory/pipeline";
import { loadTopics, type Topic } from "../lib/factory/topics";
import { scriptDb } from "./db";

const HAND_DRAFTS = "docs/pre-challenge/content-draft/content/journeys";

/** Style examples of misconceptions, taken from the hand drafts of the OTHER journeys only. */
function examples(exceptId: string): string {
  if (!existsSync(HAND_DRAFTS)) return "";
  return readdirSync(HAND_DRAFTS)
    .filter((f) => f.endsWith(".json") && f !== `${exceptId}.json`)
    .map((f) => {
      const j = JSON.parse(readFileSync(`${HAND_DRAFTS}/${f}`, "utf8")) as { locales: { ar: { scene: string; options: { label: string }[] } } };
      return `- ${j.locales.ar.scene} ← المفاهيم الخاطئة: ${j.locales.ar.options.map((o) => `«${o.label}»`).join("، ")}`;
    })
    .join("\n");
}

async function one(topic: Topic, force: boolean): Promise<void> {
  const db = scriptDb();
  if (!force && (await latestDraft(db, topic.id))) {
    console.log(`${topic.id}: already has a draft (use --force to regenerate)`);
    return;
  }
  const started = Date.now();
  const result = await runFactory(db, topic, examples(topic.id));
  const seconds = Math.round((Date.now() - started) / 1000);
  if ("guard" in result) {
    console.log(`${topic.id}: ${result.status} by the guard (${result.guard.by}${result.guard.why ? `: ${result.guard.why}` : ""}) — ${seconds}s`);
    return;
  }
  if (!("draft" in result)) {
    console.log(`${topic.id}: failed — ${result.reason} — ${seconds}s`);
    return;
  }
  await saveDraft(db, result.draft);
  const c = result.draft.counters;
  const checks = draftChecks(result.draft.locales.ar, result.draft.character_names, topic.practice_names, topic.allow_in_quotes);
  console.log(
    `${topic.id}: ${result.status} saved ${result.draft.id} — ${seconds}s — facts ${c.facts}, sentences ${c.sentences_generated}, removed ${c.removed_by_verifier}, ` +
      `supported ${c.religious_supported}/${c.religious_claims}, flagged ${c.flagged_sentences}, occasions [${result.draft.occasions.join(", ") || "none"}], ` +
      `needs_sharii ${result.draft.needs_sharii}, checks ${checks.pass ? "pass" : JSON.stringify({ ...checks, pass: undefined })}`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const topics = loadTopics();
  const wanted = args.includes("--all") ? topics : topics.filter((t) => args[args.indexOf("--topic") + 1] === t.id);
  if (wanted.length === 0) throw new Error(`unknown topic; known: ${topics.map((t) => t.id).join(", ")}`);
  for (const topic of wanted) {
    try {
      await one(topic, force);
    } catch (error) {
      console.log(`${topic.id}: error — ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  }
}

main();

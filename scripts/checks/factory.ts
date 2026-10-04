// P1 checks on the saved drafts.
//   check:factory   drafts exist for the given journeys, parse, pass the automatic checks, and every source still matches its hash
//   check:deadline  the automatic 15:00 criterion: at least 80% of religious claims supported across the journeys, no empty reveal
import { createHash } from "node:crypto";
import { latestDraft } from "../../lib/content/drafts";
import { draftChecks } from "../../lib/factory/pipeline";
import { loadTopics } from "../../lib/factory/topics";
import { scriptDb } from "../db";

const JOURNEYS = ["ramadan", "team-dinner"];

async function main() {
  const mode = process.argv[2] === "deadline" ? "deadline" : "factory";
  const db = scriptDb();
  const topics = new Map(loadTopics().map((t) => [t.id, t]));
  let failed = 0;
  let supported = 0;
  let religious = 0;
  for (const id of JOURNEYS) {
    const draft = await latestDraft(db, id); // throws if the stored draft does not match the schema
    if (!draft) {
      console.log(`FAIL ${id}: no draft`);
      failed++;
      continue;
    }
    const checks = draftChecks(draft.locales.ar, draft.character_names, topics.get(id)?.practice_names ?? [], topics.get(id)?.allow_in_quotes ?? false);
    const badHash = draft.sources.filter((s) => createHash("sha256").update(s.text_ar + JSON.stringify(s.translations)).digest("hex") !== s.content_hash).map((s) => s.id);
    const noTranslation = draft.sources.filter((s) => !s.translations.en.text || !s.translations.ur.text).map((s) => s.id);
    supported += draft.counters.religious_supported;
    religious += draft.counters.religious_claims;
    const ok = checks.pass && badHash.length === 0 && noTranslation.length === 0 && draft.counters.sentences_generated > 0;
    console.log(`${ok ? "ok  " : "FAIL"} ${id}: status ${draft.status}, supported ${draft.counters.religious_supported}/${draft.counters.religious_claims}, removed ${draft.counters.removed_by_verifier}, sources ${draft.sources.map((s) => s.id).join(" ")}` +
      (ok ? "" : ` — ${JSON.stringify({ scene: checks.scene_practice_names, names: checks.variant_names, empty: checks.empty, forbidden: checks.forbidden.length, badHash, noTranslation })}`));
    if (!ok) failed++;
  }
  if (mode === "deadline") {
    const share = religious ? supported / religious : 0;
    console.log(`religious claims supported: ${supported}/${religious} (${Math.round(share * 100)}%), required 80%`);
    if (share < 0.8) failed++;
  }
  if (failed) process.exit(1);
  console.log(`check:${mode} passed`);
}

main();

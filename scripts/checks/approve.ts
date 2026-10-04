// P2 check: approval and the display rule, on a temporary copy of a real draft (journey id "test-approve").
//   1. unapproved: not shown   2. Arabic approved: shown in Arabic with the badge, not in English
//   3. a sentence edited after approval: hidden again
// The copy and its decisions are removed at the end. Test journeys are never listed by the app.
import { randomUUID } from "node:crypto";
import { latestDraft, saveDraft, updateDraft } from "../../lib/content/drafts";
import { publishedJourneys } from "../../lib/content/published";
import { approveAllUnits } from "../../lib/content/review";
import type { Lang } from "../../lib/content/types";
import { scriptDb } from "../db";

const TEST_ID = "test-approve";

async function main() {
  const db = scriptDb();
  const base = await latestDraft(db, "ramadan");
  if (!base?.locales.en) throw new Error("needs the ramadan draft with its English text");
  const draft = { ...structuredClone(base), id: randomUUID(), journey_id: TEST_ID };
  const shown = async (lang: Lang) => (await publishedJourneys(db, lang, { preview: false, includeTests: true })).find((j) => j.id === TEST_ID);
  const results: [string, boolean][] = [];
  await saveDraft(db, draft);
  try {
    results.push(["unapproved draft is not shown", !(await shown("ar"))]);
    results.push(["test journeys are not listed by the app", !(await publishedJourneys(db, "ar", { preview: true, includeTests: false })).some((j) => j.id === TEST_ID)]);
    await approveAllUnits(db, draft, "ar", "team", "check:approve");
    const ar = await shown("ar");
    results.push(["approved Arabic is shown", Boolean(ar?.approved)]);
    results.push(["team approval alone carries the badge", ar?.badge === true]);
    results.push(["approving Arabic does not approve English", !(await shown("en"))]);
    draft.locales.ar.explanation[0].text += " (تعديل)";
    await updateDraft(db, draft);
    results.push(["editing a sentence after approval hides the journey", !(await shown("ar"))]);
  } finally {
    await db.from("review_decisions").delete().eq("draft_id", draft.id);
    await db.from("journey_drafts").delete().eq("id", draft.id);
  }
  for (const [name, ok] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (results.some(([, ok]) => !ok)) process.exit(1);
  console.log("check:approve passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

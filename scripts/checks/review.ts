// P5 check: the review rules, through the same functions the panel calls, on temporary copies of a real draft.
// The copies ("test-review", "test-review-sharii"), their decisions and their published rows are removed at the end.
import { randomUUID } from "node:crypto";
import { latestDraft, saveDraft } from "../../lib/content/drafts";
import { publishedJourneys } from "../../lib/content/published";
import { unitsOf } from "../../lib/content/review";
import type { Draft, Lang } from "../../lib/content/types";
import { approvePending, recordDecision } from "../../lib/review/decide";
import { scriptDb } from "../db";

async function main() {
  const db = scriptDb();
  const base = await latestDraft(db, "ramadan");
  if (!base?.locales.en) throw new Error("needs the ramadan draft with its English text");
  const copy = (journey_id: string, needs_sharii: boolean): Draft => ({ ...structuredClone(base), id: randomUUID(), journey_id, needs_sharii });
  const plain = copy("test-review", false);
  const sensitive = copy("test-review-sharii", true);
  const shown = async (id: string, lang: Lang) => (await publishedJourneys(db, lang, { preview: false, includeTests: true })).find((j) => j.id === id);
  const published = async (id: string) => (await db.from("journeys").select("content").eq("id", id).maybeSingle()).data as { content: { locales: Record<string, { scene: string }> } } | null;
  const all = (d: Draft, lang: Lang) => unitsOf(d.locales[lang] as NonNullable<Draft["locales"][Lang]>, d.occasions).map((u) => u.id);
  const results: [string, boolean][] = [];
  const check = (name: string, ok: boolean) => results.push([name, ok]);
  try {
    await saveDraft(db, plain);
    await saveDraft(db, sensitive);

    await approvePending(db, plain.id, "ar", "team", "check:review", all(plain, "ar").slice(1));
    check("one unit still pending: not shown", !(await shown("test-review", "ar")));
    await recordDecision(db, { draftId: plain.id, lang: "ar", unitId: "title", role: "team", reviewer: "check:review", action: "approve" });
    const afterTeam = await shown("test-review", "ar");
    check("team approval of every unit: shown", Boolean(afterTeam?.approved));
    check("team approval alone: badge", afterTeam?.badge === true);
    check("approved Arabic is published to journeys, Arabic only", Object.keys((await published("test-review"))?.content.locales ?? {}).join() === "ar");
    check("English is approved on its own hash: not shown", !(await shown("test-review", "en")));

    await recordDecision(db, { draftId: plain.id, lang: "ar", unitId: "scene", role: "team", reviewer: "check:review", action: "comment", note: "تعليق تجريبي" });
    check("a comment does not change approval", Boolean(await shown("test-review", "ar")));
    await recordDecision(db, { draftId: plain.id, lang: "ar", unitId: "explanation:0", role: "team", reviewer: "check:review", action: "edit", text: `${plain.locales.ar.explanation[0].text} (معدّلة)` });
    check("an edit returns the journey to unapproved", !(await shown("test-review", "ar")));
    check("an edit removes it from the published tables", !(await published("test-review")));
    await recordDecision(db, { draftId: plain.id, lang: "ar", unitId: "explanation:0", role: "team", reviewer: "check:review", action: "approve" });
    check("approving the edited sentence shows it again", Boolean(await shown("test-review", "ar")));
    await recordDecision(db, { draftId: plain.id, lang: "ar", unitId: "scene", role: "team", reviewer: "check:review", action: "reject" });
    check("a rejection hides the journey", !(await shown("test-review", "ar")));
    await recordDecision(db, { draftId: plain.id, lang: "ar", unitId: "scene", role: "team", reviewer: "check:review", action: "approve" });
    await approvePending(db, plain.id, "ar", "sharia", "check:review", all(plain, "ar"));
    check("sharia approval removes the badge", (await shown("test-review", "ar"))?.badge === false);

    await approvePending(db, sensitive.id, "ar", "team", "check:review", all(sensitive, "ar"));
    check("needs_sharii with team approval only: not shown", !(await shown("test-review-sharii", "ar")));
    check("needs_sharii with team approval only: not published", !(await published("test-review-sharii")));
    await approvePending(db, sensitive.id, "ar", "sharia", "check:review", all(sensitive, "ar"));
    check("needs_sharii after sharia approval: shown", Boolean(await shown("test-review-sharii", "ar")));
  } finally {
    for (const d of [plain, sensitive]) {
      await db.from("cards").delete().eq("journey_id", d.journey_id);
      await db.from("journeys").delete().eq("id", d.journey_id);
      await db.from("review_decisions").delete().eq("draft_id", d.id);
      await db.from("journey_drafts").delete().eq("id", d.id);
    }
  }
  for (const [name, ok] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (results.some(([, ok]) => !ok)) process.exit(1);
  console.log("check:review passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

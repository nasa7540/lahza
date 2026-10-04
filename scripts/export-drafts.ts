// Writes the newest draft of every journey, Arabic and English side by side per journey, into one Markdown file
// for the owner's reading:  npm run export:drafts -- <output file>
// The file holds unapproved text, so it is written outside the repository by default and is never committed.
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { latestDrafts } from "../lib/content/drafts";
import type { Draft, JourneyText, Sentence } from "../lib/content/types";
import { loadTopics } from "../lib/factory/topics";
import { scriptDb } from "./db";

const MARK: Record<string, string> = { supported: "✅ supported", general: "▫️ general (no religious claim)", general_religious: "⚠️ religious claim without a source", unsupported: "❌ unsupported" };

function sentence(s: Sentence): string {
  return `- ${s.text}\n  - _${MARK[s.label ?? ""] ?? "unchecked"}${s.segment ? ` · ${s.segment}` : ""}${s.flags.length ? ` · ⚑ ${s.flags.join("; ")}` : ""}_`;
}

function language(name: string, t: JourneyText): string {
  return [
    `### ${name}`,
    `**${t.title}**\n\n_${t.teaser}_`,
    `**Scene**\n\n${t.scene}`,
    ...t.options.map((o) => `**Option ${o.id}: ${o.label}** → **${o.reveal_headline}**\n\n${o.reveal.map(sentence).join("\n")}`),
    `**Explanation**\n\n${t.explanation.map(sentence).join("\n")}`,
    `**Explain prompt**\n\n${t.explain_prompt}`,
    `**Tip: ${t.tip.headline}**\n\n${t.tip.lead}\n\n${t.tip.items.map((i) => `- ${i}`).join("\n")}`,
    `**Key points**\n\n${t.key_points.map((k) => `- ${k}`).join("\n")}`,
  ].join("\n\n");
}

function journey(d: Draft): string {
  const c = d.counters;
  const dropped = d.log.filter((l) => l.event === "dropped").map((l) => `- dropped: ${String(l.ref ?? l.statement)} — ${String(l.why)}`);
  return [
    `## ${d.journey_id}`,
    `Draft \`${d.id}\` · occasions: ${d.occasions.join(", ") || "none"} · needs_sharii: ${d.needs_sharii} · religious claims supported: ${c.religious_supported}/${c.religious_claims} · removed by the verifier: ${c.removed_by_verifier} · flagged sentences: ${c.flagged_sentences}`,
    `To approve the Arabic: \`npm run approve -- --draft ${d.journey_id} --lang ar --name "<your name>"\``,
    `**Sources (verbatim, fetched by code)**\n\n${d.sources.map((s) => `- \`${s.id}\` ${s.kind}${s.grade ? ` (${s.grade})` : ""} — ${s.reference_ar} — ${s.source_url}\n  - ${s.text_ar}\n  - EN: ${s.translations.en.text}`).join("\n")}`,
    ...(dropped.length ? [dropped.join("\n")] : []),
    language("العربية (الأصل)", d.locales.ar),
    d.locales.en ? language("English (derived before approval, for reading only)", d.locales.en) : "### English\n\nNot derived yet.",
  ].join("\n\n");
}

async function main() {
  const out = process.argv[2] ?? `${homedir()}/lahza-drafts/review-${new Date().toISOString().slice(0, 10)}.md`;
  const order = loadTopics().map((t) => t.id);
  const drafts = (await latestDrafts(scriptDb())).filter((d) => order.includes(d.journey_id)).sort((a, b) => order.indexOf(a.journey_id) - order.indexOf(b.journey_id));
  const head = `# Lahza — journeys for review (${new Date().toISOString().slice(0, 16)}Z)\n\nUnapproved drafts. Nothing here is shown to a reader until it is approved. Each sentence carries the verifier's verdict and the source segment it rests on.`;
  writeFileSync(out, [head, ...drafts.map(journey)].join("\n\n---\n\n") + "\n");
  console.log(`${drafts.length} journeys -> ${out}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

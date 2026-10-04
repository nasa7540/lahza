import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ai } from "@/lib/ai/config";
import { cosine, embed } from "@/lib/ai/embed";
import { chatJson, chatRaw, type ChatMessage, type ToolSpec, type Usage } from "@/lib/ai/llm";
import { type Draft, type Fact, type JourneyText, type Sentence, type Source, verdictSchema } from "@/lib/content/types";
import { mentions } from "@/lib/text/arabic";
import { guardTopic } from "./guard";
import { OCCASION_IDS, toWhen } from "./occasions";
import { FACTS_SYSTEM, PROMPT_VERSION, RESEARCH_SYSTEM, VERIFIER_SYSTEM, writerSystem } from "./prompts";
import { fetchSources, type LogEntry, type References, searchHadith, searchQuran, searchTerms, segmentBlock } from "./sources";
import type { Topic } from "./topics";

const SEGMENT_SIMILARITY_FLAG = 0.45; // flag only, never removes
const FORBIDDEN = [/قال رسول الله/, /قال تعالى/, /[﴿﴾]/, /(?<!الساعة\s{0,2})\b\d{1,3}\s*:\s*\d{1,3}\b/, /Allah says/i, /the Prophet said/i];

export type FactoryResult =
  | { status: "refused" | "referred"; guard: Awaited<ReturnType<typeof guardTopic>> }
  | { status: "failed"; reason: string; log: LogEntry[] }
  | { status: "draft" | "incomplete"; draft: Draft };

// ---------- research ----------
const TOOLS: ToolSpec[] = [
  { type: "function", function: { name: "search_quran", description: "بحث دلالي في القرآن. يرجع أقرب 20 آية: المرجع وبداية النص.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function", function: { name: "search_hadith", description: "بحث نصي في موسوعة الأحاديث (HadeethEnc). يرجع الرقم والعنوان.", parameters: { type: "object", properties: { query: { type: "string" }, language: { type: "string", enum: ["ar", "en"] } }, required: ["query"] } } },
  { type: "function", function: { name: "search_terms", description: "بحث في عناوين موسوعة المصطلحات الإسلامية. يرجع الرقم والمصطلح.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  {
    type: "function",
    function: {
      name: "submit_references",
      description: "الإجابة النهائية: مراجع فقط.",
      parameters: {
        type: "object",
        properties: {
          quran: { type: "array", items: { type: "object", properties: { surah: { type: "integer" }, ayah: { type: "integer" } }, required: ["surah", "ayah"] } },
          hadith_ids: { type: "array", items: { type: "integer" } },
          term_ids: { type: "array", items: { type: "integer" } },
        },
        required: ["quran", "hadith_ids", "term_ids"],
      },
    },
  },
];
const referencesSchema = z.object({
  quran: z.array(z.object({ surah: z.number().int(), ayah: z.number().int() })).default([]),
  hadith_ids: z.array(z.number().int()).default([]),
  term_ids: z.array(z.number().int()).default([]),
});

async function research(db: SupabaseClient, topic: string, log: LogEntry[], onUsage: (u: Usage) => void): Promise<References> {
  const messages: ChatMessage[] = [
    { role: "system", content: RESEARCH_SYSTEM },
    { role: "user", content: `<topic>\n${topic}\n</topic>` },
  ];
  for (let step = 0; step < 10; step++) {
    const r = await chatRaw({ model: ai.writerModel(), messages, tools: TOOLS, timeoutMs: 90_000 });
    onUsage(r.usage);
    if (r.tool_calls.length === 0) {
      messages.push({ role: "assistant", content: r.content || "..." }, { role: "user", content: "استدعِ submit_references الآن." });
      continue;
    }
    messages.push({ role: "assistant", content: r.content ?? "", tool_calls: r.tool_calls });
    for (const call of r.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        // an unparsable call gets an empty result below
      }
      if (call.function.name === "submit_references") return referencesSchema.parse(args);
      const query = String(args.query ?? "");
      let result: unknown = [];
      try {
        if (call.function.name === "search_quran") result = await searchQuran(db, query);
        else if (call.function.name === "search_hadith") result = await searchHadith(query, args.language === "en" ? "en" : "ar");
        else if (call.function.name === "search_terms") result = searchTerms(query);
      } catch (error) {
        result = { error: error instanceof Error ? error.message : "search failed" };
      }
      log.push({ stage: "research", tool: call.function.name, query, hits: Array.isArray(result) ? result.length : 0 });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  log.push({ stage: "research", event: "no submit_references after 10 steps" });
  return { quran: [], hadith_ids: [], term_ids: [] };
}

// ---------- facts ----------
const factsSchema = z.object({ facts: z.array(z.object({ statement: z.string(), segments: z.array(z.string()) })) });

async function extractFacts(topic: string, sources: Source[], log: LogEntry[], onUsage: (u: Usage) => void): Promise<Fact[]> {
  const out = await chatJson({ model: ai.writerModel(), system: FACTS_SYSTEM, user: `<topic>\n${topic}\n</topic>\n${segmentBlock(sources)}`, name: "facts", schema: factsSchema, onUsage });
  const kindOf = new Map(sources.flatMap((s) => s.segments.map((g) => [g.seg, g.kind] as const)));
  const facts: Fact[] = [];
  for (const f of out.facts) {
    const segments = f.segments.filter((s) => kindOf.has(s));
    if (segments.length === 0) {
      log.push({ stage: "facts", event: "dropped", statement: f.statement, why: "points at no existing segment" });
      continue;
    }
    const kinds = new Set(segments.map((s) => kindOf.get(s)));
    facts.push({ id: `F${facts.length + 1}`, statement: f.statement, segments, kind: kinds.size === 1 && kinds.has("term") ? "term" : kinds.has("quran") ? "quran" : "hadith" });
  }
  return facts;
}

// ---------- writing ----------
const written = z.object({ text: z.string(), kind: z.enum(["religious", "workplace"]), facts: z.array(z.string()) });
const writerSchema = z.object({
  level: z.enum(["A", "B"]),
  occasions: z.array(z.enum(OCCASION_IDS)),
  title: z.string(),
  teaser: z.string(),
  scene: z.string(),
  character_names: z.array(z.string()),
  options: z.array(z.object({ id: z.string(), label: z.string(), reveal_headline: z.string(), reveal: z.array(written) })),
  explanation: z.array(written),
  explain_prompt: z.string(),
  tip: z.object({ headline: z.string(), lead: z.string(), items: z.array(z.string()) }),
  key_points: z.array(z.string()),
  question_variants: z.array(z.string()),
});
const revealSchema = z.object({ reveal: z.array(written) });
const KIND_LABEL = { quran: "آية", hadith: "حديث", term: "تعريف" } as const;

function factsBlock(facts: Fact[]): string {
  return `<facts>\n${facts.map((f) => `<fact id="${f.id}" kind="${KIND_LABEL[f.kind]}">${f.statement}</fact>`).join("\n")}\n</facts>`;
}

// ---------- verification ----------
const verdictsSchema = z.object({ results: z.array(z.object({ sid: z.string(), label: verdictSchema, segment: z.string().nullable() })) });
type Checked = { sid: string; sentence: Sentence };

/** The verifier's verdict decides what is removed. Everything computed in code here only adds flags. */
async function verify(items: { sid: string; text: string; kind: Sentence["kind"]; facts: string[] }[], sources: Source[], facts: Fact[], onUsage: (u: Usage) => void): Promise<Checked[]> {
  if (items.length === 0) return [];
  const out = await chatJson({
    model: ai.verifierModel(),
    system: VERIFIER_SYSTEM,
    user: `${segmentBlock(sources)}\n<sentences>\n${items.map((s) => `<sentence sid="${s.sid}">${s.text}</sentence>`).join("\n")}\n</sentences>`,
    name: "verify",
    schema: verdictsSchema,
    onUsage,
  });
  const verdict = new Map(out.results.map((r) => [r.sid, r]));
  const segText = new Map(sources.flatMap((s) => s.segments.map((g) => [g.seg, g.text] as const)));
  const factSegs = new Map(facts.map((f) => [f.id, new Set(f.segments)]));
  const supported = items.filter((s) => verdict.get(s.sid)?.label === "supported" && segText.has(verdict.get(s.sid)?.segment ?? ""));
  const vectors = supported.length ? await embed([...supported.map((s) => s.text), ...supported.map((s) => segText.get(verdict.get(s.sid)!.segment!)!)]) : [];
  const similarity = new Map(supported.map((s, i) => [s.sid, cosine(vectors[i], vectors[supported.length + i])]));

  return items.map((s) => {
    const v = verdict.get(s.sid);
    const flags: string[] = [];
    if (!v) flags.push("no verdict returned");
    const label = v?.label ?? "unsupported";
    if (label === "supported") {
      if (!v?.segment || !segText.has(v.segment)) flags.push("verifier cited a segment that does not exist");
      else {
        if ((similarity.get(s.sid) ?? 0) < SEGMENT_SIMILARITY_FLAG) flags.push("low similarity between sentence and cited segment");
        const claimed = new Set(s.facts.flatMap((f) => [...(factSegs.get(f) ?? [])]));
        if (claimed.size && !claimed.has(v.segment)) flags.push("verifier's segment differs from the writer's fact");
      }
    }
    if (s.kind === "workplace" && label !== "general") flags.push("writer marked it workplace but the verifier sees a religious claim");
    if (s.kind === "religious" && s.facts.length === 0) flags.push("religious sentence without a fact number");
    if (label === "general_religious") flags.push("religious claim without a source (basic knowledge)");
    if (FORBIDDEN.some((p) => p.test(s.text))) flags.push("output validator: looks like quoted sacred text or a verse number");
    return { sid: s.sid, sentence: { text: s.text, kind: s.kind, facts: s.facts, label, segment: v?.segment ?? null, flags } };
  });
}

// ---------- automatic checks ----------
function stripQuoted(text: string): string {
  return text.replace(/«[^»]*»|"[^"]*"|“[^”]*”/g, " ");
}

export function draftChecks(text: JourneyText, names: string[], practiceNames: string[], allowInQuotes: boolean) {
  const scene = allowInQuotes ? stripQuoted(text.scene) : text.scene;
  const scene_practice_names = practiceNames.filter((n) => mentions(scene, n));
  const variant_names = names.filter((n) => n.trim() && text.question_variants.some((q) => mentions(q, n)));
  const empty = [...text.options.filter((o) => o.reveal.length === 0).map((o) => `reveal:${o.id}`), ...(text.explanation.length === 0 ? ["explanation"] : [])];
  const all = [text.title, text.teaser, text.scene, ...text.options.flatMap((o) => [o.label, o.reveal_headline, ...o.reveal.map((s) => s.text)]), ...text.explanation.map((s) => s.text), ...text.tip.items, ...text.key_points];
  const forbidden = all.filter((t) => FORBIDDEN.some((p) => p.test(t)));
  return { scene_practice_names, variant_names, empty, forbidden, pass: scene_practice_names.length === 0 && variant_names.length === 0 && empty.length === 0 && forbidden.length === 0 };
}

// ---------- the pipeline ----------
export async function runFactory(db: SupabaseClient, topic: Topic, examples: string): Promise<FactoryResult> {
  const log: LogEntry[] = [];
  const usage: Usage = { prompt_tokens: 0, completion_tokens: 0 };
  const onUsage = (u: Usage) => {
    usage.prompt_tokens += u.prompt_tokens;
    usage.completion_tokens += u.completion_tokens;
  };

  const guard = await guardTopic(topic.topic, onUsage);
  if (guard.decision === "refuse") return { status: "refused", guard };
  if (guard.decision === "refer") return { status: "referred", guard };

  const refs = await research(db, topic.topic, log, onUsage);
  if (topic.pinned_hadith_ids.length) refs.hadith_ids = [...topic.pinned_hadith_ids, ...refs.hadith_ids.filter((id) => !topic.pinned_hadith_ids.includes(id))];
  const proposed = Math.min(refs.quran.length, 2) + Math.min(refs.hadith_ids.length, 1) + Math.min(refs.term_ids.length, 2);
  const { sources, failed } = await fetchSources(db, refs, log);
  if (sources.length === 0) return { status: "failed", reason: "no source could be fetched", log };
  const facts = await extractFacts(topic.topic, sources, log, onUsage);
  if (facts.length === 0) return { status: "failed", reason: "no fact could be extracted", log };

  const system = writerSystem(examples, topic.practice_names, topic.allow_in_quotes);
  const w = await chatJson({ model: ai.writerModel(), system, user: `<topic>\n${topic.topic}\n</topic>\n${factsBlock(facts)}`, name: "journey", schema: writerSchema, timeoutMs: 180_000, onUsage });

  const items = [
    ...w.explanation.map((s, k) => ({ sid: `exp:${k}`, where: "explanation", ...s })),
    ...w.options.flatMap((o) => o.reveal.map((s, k) => ({ sid: `rev:${o.id}:${k}`, where: `reveal:${o.id}`, ...s }))),
  ];
  let checked = (await verify(items, sources, facts, onUsage)).map((c, i) => ({ ...c, where: items[i].where }));
  let generated = items.length;

  // A reveal emptied by the verifier is rewritten once from the facts.
  let regenerated = 0;
  for (const o of w.options) {
    const mine = checked.filter((c) => c.where === `reveal:${o.id}`);
    if (mine.length && mine.every((c) => c.sentence.label === "unsupported")) {
      const again = await chatJson({
        model: ai.writerModel(), system, name: "reveal", schema: revealSchema, onUsage,
        user: `<topic>\n${topic.topic}\n</topic>\n${factsBlock(facts)}\nأعد كتابة كشف هذا الخيار فقط (جملتان أو ثلاث) من الحقائق: «${o.label}». أعد JSON بحقل reveal فقط.`,
      });
      const fresh = again.reveal.map((s, k) => ({ sid: `rev:${o.id}:r${k}`, where: `reveal:${o.id}`, ...s }));
      const rechecked = (await verify(fresh, sources, facts, onUsage)).map((c) => ({ ...c, where: `reveal:${o.id}` }));
      checked = [...checked.filter((c) => c.where !== `reveal:${o.id}`), ...rechecked];
      generated += fresh.length;
      regenerated++;
    }
  }

  const kept = (where: string) => checked.filter((c) => c.where === where && c.sentence.label !== "unsupported").map((c) => c.sentence);
  for (const c of checked) if (c.sentence.label === "unsupported") log.push({ stage: "verify", event: "removed", text: c.sentence.text, where: c.where });

  const ar: JourneyText = {
    title: w.title, teaser: w.teaser, scene: w.scene,
    options: w.options.map((o) => ({ id: o.id, label: o.label, reveal_headline: o.reveal_headline, reveal: kept(`reveal:${o.id}`) })) as JourneyText["options"],
    explanation: kept("explanation"), explain_prompt: w.explain_prompt,
    tip: w.tip as JourneyText["tip"], key_points: w.key_points as JourneyText["key_points"], question_variants: w.question_variants as JourneyText["question_variants"],
  };
  const religious = checked.filter((c) => c.sentence.label !== "general");
  const empty = draftChecks(ar, w.character_names, topic.practice_names, topic.allow_in_quotes).empty;
  const occasions = w.occasions.filter((o) => o !== "none").slice(0, 2);
  log.push({ stage: "usage", prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens });

  const draft: Draft = {
    id: randomUUID(), journey_id: topic.id, topic: topic.topic,
    status: empty.length ? "incomplete" : "draft",
    needs_sharii: guard.decision === "needs_sharii",
    level: w.level, occasions, when: toWhen(occasions), character_names: w.character_names,
    locales: { ar }, sources, facts,
    generation: { prompt_version: PROMPT_VERSION, date: new Date().toISOString(), models: { guard: ai.runtimeModel(), writer: ai.writerModel(), verifier: ai.verifierModel() }, generated_by: ai.writerModel() },
    counters: {
      references_proposed: proposed, references_failed: failed, facts: facts.length, sentences_generated: generated,
      removed_by_verifier: checked.filter((c) => c.sentence.label === "unsupported").length,
      religious_claims: religious.length, religious_supported: religious.filter((c) => c.sentence.label === "supported").length,
      flagged_sentences: checked.filter((c) => c.sentence.flags.length > 0).length, reveals_regenerated: regenerated,
    },
    log,
  };
  return { status: empty.length ? "incomplete" : "draft", draft };
}

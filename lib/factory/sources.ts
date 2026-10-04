import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed } from "@/lib/ai/embed";
import type { Segment, Source } from "@/lib/content/types";
import { normalise, stem, stems } from "@/lib/text/arabic";

const UA = { "User-Agent": "lahza/0.1 (factory)" };
const QURAN_KEYS = { en: "english_rwwad", ur: "urdu_junagarhi" } as const;
export const APP_TRANSLATIONS = ["en", "ur"] as const;

export type LogEntry = Record<string, unknown>;
export type References = { quran: { surah: number; ayah: number }[]; hadith_ids: number[]; term_ids: number[] };

async function getJson<T>(url: string, timeoutMs = 30_000): Promise<T> {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// ---------- search tools: they return references and short previews, never used for display ----------

/** Vector search over the verse index, top 20. */
export async function searchQuran(db: SupabaseClient, query: string): Promise<{ ref: string; arabic: string }[]> {
  const [q] = await embed([normalise(query) || query]);
  const { data, error } = await db.rpc("match_verses", { q: JSON.stringify(q), k: 20 });
  if (error) throw new Error(error.message);
  return (data as { sura: number; aya: number; text_uthmani: string }[]).map((v) => ({ ref: `${v.sura}:${v.aya}`, arabic: v.text_uthmani.slice(0, 220) }));
}

let mcpSession: string | null = null;
let mcpId = 0;

/** The association's public read-only MCP server (search over HadeethEnc). */
async function mcp(method: string, params?: unknown, notify = false): Promise<unknown> {
  const headers: Record<string, string> = { ...UA, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (mcpSession) headers["Mcp-Session-Id"] = mcpSession;
  const res = await fetch("https://mcp.islamiccontent.org/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(notify ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id: ++mcpId, method, params }),
    signal: AbortSignal.timeout(30_000),
  });
  mcpSession = res.headers.get("mcp-session-id") ?? mcpSession;
  if (notify) return null;
  const raw = await res.text();
  const line = raw.split("\n").map((l) => l.replace(/^data: /, "").trim()).find((l) => l.startsWith("{"));
  return line ? JSON.parse(line) : null;
}

export async function searchHadith(query: string, language: "ar" | "en"): Promise<{ id: number; title: string }[]> {
  if (!mcpSession) {
    await mcp("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "lahza-factory", version: "0.1" } });
    await mcp("notifications/initialized", undefined, true);
  }
  const r = (await mcp("tools/call", { name: "search", arguments: { query, sources: ["hadith"], language, limit: 8 } })) as { result?: { content?: { type: string; text?: string }[] } } | null;
  const text = r?.result?.content?.find((c) => c.type === "text")?.text ?? "";
  try {
    const parsed = JSON.parse(text.split("\n")[0]) as { results?: { id: string; title: string }[] };
    return (parsed.results ?? []).map((x) => ({ id: Number(x.id.split(":")[1]), title: x.title.slice(0, 160) }));
  } catch {
    return [];
  }
}

type TermIndex = { terms: Record<string, { term: string; langs: string[] }> };
let termIndex: TermIndex | null = null;

/** Word lookup in the local index of terminology titles (content/terms-index.json). */
export function searchTerms(query: string): { id: number; term: string }[] {
  if (!termIndex) termIndex = existsSync("content/terms-index.json") ? (JSON.parse(readFileSync("content/terms-index.json", "utf8")) as TermIndex) : { terms: {} };
  const q = [...stems(query)].filter((w) => w.length >= 3);
  const out: { id: number; term: string }[] = [];
  for (const [id, t] of Object.entries(termIndex.terms)) {
    const words = new Set(normalise(t.term).split(" ").map(stem));
    if (q.some((w) => words.has(w))) out.push({ id: Number(id), term: t.term });
  }
  return out.slice(0, 8);
}

// ---------- fetch: code copies every text from the approved source ----------

function hashOf(text_ar: string, translations: Source["translations"]): string {
  return createHash("sha256").update(text_ar + JSON.stringify(translations)).digest("hex");
}

function split(kind: Source["kind"], id: string, text: string): Segment[] {
  const parts =
    kind === "quran"
      ? text.split(/\s*[ۖ-ۜ]\s*/) // Qur'anic pause marks
      : text.split(/(?<=[.؟!:؛])\s+|\s*[«»]\s*/);
  const kept = parts.map((p) => p.trim()).filter((p) => p.length >= 6);
  return (kept.length ? kept : [text]).map((p, i) => ({ seg: `${id}#${i + 1}`, text: p, kind }));
}

type HadithRow = { hadeeth: string; attribution: string; grade: string; translations?: string[] };
type TermRow = { term: string | null; idio_def: string | null; brief_expl: string | null; translations?: string[] };

/**
 * Fetches each proposed reference. A source is kept only if it exists, a hadith is graded sahih,
 * and an approved translation exists in every app language. Anything else is dropped and logged.
 */
export async function fetchSources(db: SupabaseClient, refs: References, log: LogEntry[]): Promise<{ sources: Source[]; failed: number }> {
  const sources: Source[] = [];
  const today = new Date().toISOString().slice(0, 10);
  let failed = 0;
  const drop = (ref: string, why: string) => {
    failed++;
    log.push({ stage: "fetch", event: "dropped", ref, why });
  };

  for (const q of refs.quran.slice(0, 2)) {
    const { data } = await db.from("quran_verses").select("sura, aya, text_uthmani, en, ur, translation_versions").eq("sura", q.surah).eq("aya", q.ayah).maybeSingle();
    if (!data) {
      drop(`quran ${q.surah}:${q.ayah}`, "verse does not exist");
      continue;
    }
    const v = data.translation_versions as Record<string, string>;
    const translations = {
      en: { text: data.en as string, translation_key: QURAN_KEYS.en, translation_version: v[QURAN_KEYS.en] ?? null },
      ur: { text: data.ur as string, translation_key: QURAN_KEYS.ur, translation_version: v[QURAN_KEYS.ur] ?? null },
    };
    const id = `quran-${data.sura}-${data.aya}`;
    sources.push({
      id, kind: "quran", text_ar: data.text_uthmani, reference: `${data.sura}:${data.aya}`, reference_ar: `${data.sura}:${data.aya}`, grade: null,
      source_url: `https://quranenc.com/ar/browse/arabic_moyassar/${data.sura}/${data.aya}`, translations,
      segments: split("quran", id, data.text_uthmani), fetched_at: today, content_hash: hashOf(data.text_uthmani, translations),
    });
  }

  for (const hid of refs.hadith_ids.slice(0, 1)) {
    try {
      const base = "https://hadeethenc.com/api/v1/hadeeths/one/";
      const ar = await getJson<HadithRow>(`${base}?language=ar&id=${hid}`);
      if (ar.grade?.trim() !== "صحيح") throw new Error(`grade "${ar.grade}" is not sahih`);
      const missing = APP_TRANSLATIONS.filter((l) => !(ar.translations ?? []).includes(l));
      if (missing.length) throw new Error(`no approved translation in ${missing.join(", ")}`);
      const en = await getJson<HadithRow>(`${base}?language=en&id=${hid}`);
      const ur = await getJson<HadithRow>(`${base}?language=ur&id=${hid}`);
      const translations = {
        en: { text: en.hadeeth, translation_key: "hadeethenc-en", translation_version: null },
        ur: { text: ur.hadeeth, translation_key: "hadeethenc-ur", translation_version: null },
      };
      const id = `hadith-${hid}`;
      sources.push({
        id, kind: "hadith", text_ar: ar.hadeeth, reference: en.attribution, reference_ar: ar.attribution, grade: ar.grade,
        source_url: `https://hadeethenc.com/ar/browse/hadith/${hid}`, translations,
        segments: split("hadith", id, ar.hadeeth), fetched_at: today, content_hash: hashOf(ar.hadeeth, translations),
      });
    } catch (error) {
      drop(`hadith ${hid}`, error instanceof Error ? error.message : "fetch failed");
    }
  }

  for (const tid of refs.term_ids.slice(0, 2)) {
    try {
      const base = "https://terminologyenc.com/api/v1/terms/one/";
      const text = (t: TermRow) => [t.idio_def, t.brief_expl].filter(Boolean).join(" ");
      const ar = await getJson<TermRow>(`${base}?language=ar&id=${tid}`);
      if (!ar.term || !text(ar)) throw new Error("term has no definition");
      const missing = APP_TRANSLATIONS.filter((l) => !(ar.translations ?? []).includes(l));
      if (missing.length) throw new Error(`no approved translation in ${missing.join(", ")}`);
      const en = await getJson<TermRow>(`${base}?language=en&id=${tid}`);
      const ur = await getJson<TermRow>(`${base}?language=ur&id=${tid}`);
      if (!text(en) || !text(ur)) throw new Error("translated definition is empty");
      const translations = {
        en: { text: `${en.term}: ${text(en)}`, translation_key: "terminologyenc-en", translation_version: null },
        ur: { text: `${ur.term}: ${text(ur)}`, translation_key: "terminologyenc-ur", translation_version: null },
      };
      const id = `term-${tid}`;
      const text_ar = `${ar.term}: ${text(ar)}`;
      sources.push({
        id, kind: "term", text_ar, reference: en.term ?? ar.term, reference_ar: ar.term, grade: null,
        source_url: `https://terminologyenc.com/ar/browse/term/${tid}`, translations,
        segments: split("term", id, text_ar), fetched_at: today, content_hash: hashOf(text_ar, translations),
      });
    } catch (error) {
      drop(`term ${tid}`, error instanceof Error ? error.message : "fetch failed");
    }
  }
  return { sources, failed };
}

export const KIND_AR: Record<Source["kind"], string> = { quran: "آية", hadith: "حديث", term: "تعريف" };

export function segmentBlock(sources: Source[]): string {
  return sources.flatMap((s) => s.segments.map((g) => `<segment id="${g.seg}" kind="${KIND_AR[g.kind]}">${g.text}</segment>`)).join("\n");
}

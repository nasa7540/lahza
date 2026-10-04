// Builds the Qur'an verse index used by the factory's research step.
// Text is fetched verbatim from quranenc.com (Uthmani script, Rowwad English, Junagarhi Urdu) and never edited.
// Resumable: verse rows are upserted per surah, and only verses without an embedding are embedded.
import { embed } from "../lib/ai/embed";
import { normalise } from "../lib/text/arabic";
import { scriptDb } from "./db";

const API = "https://quranenc.com/api/v1";
const KEYS = { en: "english_rwwad", ur: "urdu_junagarhi" } as const;
const UA = { "User-Agent": "lahza/0.1 (index-quran)" };

type Row = { sura: string; aya: string; arabic_text: string; translation: string };

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

/** Network calls to the database fail now and then; a verse left without an embedding is picked up on the next pass anyway. */
async function retry(fn: () => Promise<void>, attempts = 4): Promise<void> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

async function versions(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [lang, key] of Object.entries(KEYS)) {
    const list = await getJson<{ translations: { key: string; version: string }[] }>(`${API}/translations/list/${lang}`);
    out[key] = list.translations.find((t) => t.key === key)?.version ?? "unknown";
  }
  return out;
}

async function main() {
  const db = scriptDb();
  const translation_versions = await versions();

  const { data: have } = await db.from("quran_verses").select("sura").limit(7000);
  const done = new Map<number, number>();
  for (const r of have ?? []) done.set(r.sura, (done.get(r.sura) ?? 0) + 1);

  for (let sura = 1; sura <= 114; sura++) {
    const en = (await getJson<{ result: Row[] }>(`${API}/translation/sura/${KEYS.en}/${sura}`)).result;
    if (done.get(sura) === en.length) continue;
    const ur = (await getJson<{ result: Row[] }>(`${API}/translation/sura/${KEYS.ur}/${sura}`)).result;
    const urByAya = new Map(ur.map((r) => [r.aya, r]));
    const rows = en.map((r) => {
      const u = urByAya.get(r.aya);
      if (!u || u.arabic_text !== r.arabic_text) throw new Error(`Arabic text differs between translations at ${sura}:${r.aya}`);
      return { sura, aya: Number(r.aya), text_uthmani: r.arabic_text, text_norm: normalise(r.arabic_text), en: r.translation, ur: u.translation, translation_versions };
    });
    const { error } = await db.from("quran_verses").upsert(rows, { onConflict: "sura,aya", ignoreDuplicates: true });
    if (error) throw new Error(`upsert surah ${sura}: ${error.message}`);
    if (sura % 10 === 0) console.log(`text: surah ${sura}/114`);
  }

  for (;;) {
    const { data: todo, error } = await db.from("quran_verses").select("sura, aya, text_norm").is("embedding", null).order("sura").order("aya").limit(96);
    if (error) throw new Error(error.message);
    if (!todo || todo.length === 0) break;
    for (let i = 0; i < todo.length; i += 48) {
      const batch = todo.slice(i, i + 48);
      const vectors = await embed(batch.map((v) => v.text_norm));
      await Promise.all(
        batch.map((v, k) =>
          retry(async () => {
            const { error: e } = await db.from("quran_verses").update({ embedding: JSON.stringify(vectors[k]) }).eq("sura", v.sura).eq("aya", v.aya);
            if (e) throw new Error(e.message);
          }),
        ),
      );
    }
    const { count } = await db.from("quran_verses").select("sura", { count: "exact", head: true }).is("embedding", null);
    console.log(`embeddings: ${count} verses left`);
  }
  const { count } = await db.from("quran_verses").select("sura", { count: "exact", head: true }).not("embedding", "is", null);
  console.log(`index:quran done — ${count} verses with embeddings`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

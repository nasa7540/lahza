// Builds content/terms-index.json: the titles of every term in the Islamic terminology encyclopedia
// (terminologyenc.com), so the factory can look terms up by word. Definitions are fetched on demand.
// Resumable: finished categories are kept in the output file and skipped on restart.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const API = "https://terminologyenc.com/api/v1";
const OUT = "content/terms-index.json";
const UA = { "User-Agent": "lahza/0.1 (index-terms)" };

type Term = { id: string; term: string; translations: string[] };
type Index = { source: string; fetched_at: string; categories_done: string[]; terms: Record<string, { term: string; langs: string[] }> };

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const index: Index = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, "utf8"))
    : { source: "https://terminologyenc.com", fetched_at: new Date().toISOString().slice(0, 10), categories_done: [], terms: {} };
  const categories = await getJson<{ id: string }[]>(`${API}/categories/list/?language=ar`);
  for (const c of categories) {
    if (index.categories_done.includes(c.id)) continue;
    for (let page = 1; ; page++) {
      const r = await getJson<{ data: Term[]; meta?: { last_page?: string | number } }>(`${API}/terms/list/?language=ar&category_id=${c.id}&page=${page}&per_page=100`);
      for (const t of r.data ?? []) index.terms[t.id] = { term: t.term, langs: (t.translations ?? []).filter(Boolean) };
      if (page >= Number(r.meta?.last_page ?? 1)) break;
    }
    index.categories_done.push(c.id);
    writeFileSync(OUT, JSON.stringify(index));
    console.log(`category ${c.id} done — ${Object.keys(index.terms).length} terms`);
  }
  console.log(`index:terms done — ${Object.keys(index.terms).length} terms in ${index.categories_done.length} categories`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

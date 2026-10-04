import { ai } from "./config";

/** Embeds texts with bge-m3 (1024 dims). Throws after `retries` failed attempts. */
export async function embed(texts: string[], { timeoutMs = 45_000, retries = 3 } = {}): Promise<number[][]> {
  let last: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${ai.embedBaseUrl()}/embeddings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ai.embedKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: ai.embedModel(), input: texts }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`embeddings HTTP ${res.status}`);
      const json = (await res.json()) as { data?: { index: number; embedding: number[] }[] };
      if (!json.data || json.data.length !== texts.length) throw new Error("embeddings: unexpected response");
      return [...json.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
    } catch (error) {
      last = error;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw last instanceof Error ? last : new Error("embeddings failed");
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

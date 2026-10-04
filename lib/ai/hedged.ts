import type { z } from "zod";
import { ai } from "./config";
import { chatRaw } from "./llm";

export const HEDGE_AFTER_MS = 4_000;
export const CAP_MS = 12_000;

export type HedgedResult<T> = { value: T; by: "primary" | "fallback" } | { value: null; by: "timeout" | "failed" };

type Options<T> = { system: string; user: string; name: string; schema: z.ZodType<T>; jsonSchema: Record<string, unknown>; maxTokens?: number };

/**
 * Hedged request for the runtime path. The primary model starts at once; if it has not answered after 4 s (or
 * fails earlier, e.g. HTTP 429) the fallback model starts in parallel, and the first valid answer wins.
 * After 12 s everything is cancelled and the caller shows the empty state. Never throws.
 */
export async function hedgedJson<T>(o: Options<T>): Promise<HedgedResult<T>> {
  const cap = new AbortController();
  const capTimer = setTimeout(() => cap.abort(), CAP_MS);
  const attempt = async (model: string): Promise<T> => {
    const r = await chatRaw({
      model,
      messages: [
        { role: "system", content: o.system },
        { role: "user", content: o.user },
      ],
      timeoutMs: CAP_MS,
      jsonSchema: { name: o.name, schema: o.jsonSchema },
      maxTokens: o.maxTokens ?? 300,
      signal: cap.signal,
    });
    return o.schema.parse(JSON.parse(r.content ?? ""));
  };
  let hedgeTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    const primary = attempt(ai.runtimeModel()).then((value) => ({ value, by: "primary" as const }));
    // The fallback starts when the primary is slow or has already failed, whichever comes first.
    const fallback = new Promise<{ value: T; by: "fallback" }>((resolve, reject) => {
      const start = () => {
        clearTimeout(hedgeTimer);
        if (cap.signal.aborted) return reject(new Error("cancelled"));
        attempt(ai.fallbackModel()).then((value) => resolve({ value, by: "fallback" }), reject);
      };
      hedgeTimer = setTimeout(start, HEDGE_AFTER_MS);
      primary.catch(start);
    });
    return await Promise.any([primary, fallback]);
  } catch {
    return { value: null, by: cap.signal.aborted ? "timeout" : "failed" };
  } finally {
    clearTimeout(capTimer);
    clearTimeout(hedgeTimer);
    cap.abort();
  }
}

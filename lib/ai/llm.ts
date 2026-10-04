import { z } from "zod";
import { ai } from "./config";

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ToolSpec = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } };
export type Usage = { prompt_tokens: number; completion_tokens: number };

const UNSUPPORTED = new Set(["$schema", "minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems", "pattern", "format"]);

/** JSON Schema for the provider's strict mode: zod's output minus keywords strict mode rejects. Zod still validates fully. */
export function providerSchema(schema: z.ZodType): Record<string, unknown> {
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === "object") {
      return Object.fromEntries(Object.entries(node).filter(([k]) => !UNSUPPORTED.has(k)).map(([k, v]) => [k, strip(v)]));
    }
    return node;
  };
  return strip(z.toJSONSchema(schema)) as Record<string, unknown>;
}

type RawOptions = {
  model: string;
  messages: ChatMessage[];
  timeoutMs: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  tools?: ToolSpec[];
  maxTokens?: number;
  signal?: AbortSignal;
};

type RawResult = { content: string | null; tool_calls: ToolCall[]; usage: Usage };

/** One chat completion with a deadline on the whole request. */
export async function chatRaw(o: RawOptions): Promise<RawResult> {
  const body: Record<string, unknown> = { model: o.model, temperature: 0, messages: o.messages, max_tokens: o.maxTokens ?? 6000 };
  // The Qwen 3.7 chat models answer several times faster with reasoning off; other models reject or ignore the switch.
  if (/^qwen\/qwen3\.7-(flash|plus)$/.test(o.model)) body.reasoning = { enabled: false };
  if (o.jsonSchema) body.response_format = { type: "json_schema", json_schema: { name: o.jsonSchema.name, strict: true, schema: o.jsonSchema.schema } };
  if (o.tools) body.tools = o.tools;
  const signals = [AbortSignal.timeout(o.timeoutMs), ...(o.signal ? [o.signal] : [])];
  const res = await fetch(`${ai.baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ai.apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.any(signals),
  });
  if (!res.ok) throw new LlmHttpError(res.status);
  const json = (await res.json()) as { choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[]; usage?: Partial<Usage> };
  const message = json.choices?.[0]?.message;
  if (!message) throw new Error("model returned no message");
  return {
    content: message.content ?? null,
    tool_calls: message.tool_calls ?? [],
    usage: { prompt_tokens: json.usage?.prompt_tokens ?? 0, completion_tokens: json.usage?.completion_tokens ?? 0 },
  };
}

export class LlmHttpError extends Error {
  constructor(public status: number) {
    super(`model HTTP ${status}`);
  }
}

type JsonOptions<T> = {
  model: string;
  system: string;
  user: string;
  name: string;
  schema: z.ZodType<T>;
  timeoutMs?: number;
  retries?: number;
  maxTokens?: number;
  onUsage?: (u: Usage) => void;
};

/** Structured output validated by zod. Retries on transport errors and on invalid output; throws when all attempts fail. */
export async function chatJson<T>(o: JsonOptions<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= (o.retries ?? 2); attempt++) {
    try {
      const r = await chatRaw({
        model: o.model,
        messages: [
          { role: "system", content: o.system },
          { role: "user", content: o.user },
        ],
        timeoutMs: o.timeoutMs ?? 120_000,
        jsonSchema: { name: o.name, schema: providerSchema(o.schema) },
        maxTokens: o.maxTokens,
      });
      o.onUsage?.(r.usage);
      return o.schema.parse(JSON.parse(r.content ?? ""));
    } catch (error) {
      last = error;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw last instanceof Error ? last : new Error("model call failed");
}

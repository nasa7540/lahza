/** Model endpoints and names come from the environment; nothing is hard-coded to a provider. */
function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const ai = {
  baseUrl: () => env("LLM_BASE_URL", "https://openrouter.ai/api/v1"),
  apiKey: () => env("LLM_API_KEY"),
  runtimeModel: () => env("LLM_MODEL", "qwen/qwen3.7-flash"),
  fallbackModel: () => env("LLM_FALLBACK_MODEL", "qwen/qwen3.7-plus"),
  writerModel: () => env("WRITER_MODEL", "anthropic/claude-opus-5.5"),
  verifierModel: () => env("VERIFIER_MODEL", "qwen/qwen3.7-plus"),
  embedBaseUrl: () => env("EMBED_BASE_URL", "https://openrouter.ai/api/v1"),
  embedKey: () => process.env.EMBED_API_KEY ?? env("LLM_API_KEY"),
  embedModel: () => env("EMBED_MODEL", "baai/bge-m3").toLowerCase(),
};

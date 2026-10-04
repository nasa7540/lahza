import { existsSync, readFileSync } from "node:fs";

/** Loads .env.local and .env.development.local into process.env for scripts (Next.js does this itself for the app). */
export function loadEnv(): void {
  for (const file of [".env.development.local", ".env.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!m) continue;
      const value = m[2].replace(/\s+#.*$/, "").replace(/^"(.*)"$/, "$1").trim();
      if (value && process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

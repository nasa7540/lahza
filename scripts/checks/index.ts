// P1 check: every verse is indexed with an embedding, and a plain question about fasting finds 2:183 in the top 20.
import { searchQuran } from "../../lib/factory/sources";
import { scriptDb } from "../db";

async function main() {
  const db = scriptDb();
  const { count: total } = await db.from("quran_verses").select("sura", { count: "exact", head: true });
  const { count: embedded } = await db.from("quran_verses").select("sura", { count: "exact", head: true }).not("embedding", "is", null);
  const hits = await searchQuran(db, "لماذا يصوم المسلمون");
  const found = hits.findIndex((h) => h.ref === "2:183");
  console.log(`verses ${total}, with embeddings ${embedded}; "لماذا يصوم المسلمون" -> 2:183 at rank ${found === -1 ? "not in top 20" : found + 1}`);
  if (total !== 6236 || embedded !== 6236 || found === -1) process.exit(1);
  console.log("check:index passed");
}

main();

// Removes the rows the automatic checks wrote (company = "check") and prints how many there were.
// Run after any check that calls the endpoints: check:stress, check:invariants, check:referral, test:e2e.
import { CHECK_COMPANY } from "../../lib/companies";
import { scriptDb } from "../db";

async function main() {
  const db = scriptDb();
  for (const table of ["events", "referrals"]) {
    const before = (await db.from(table).select("id", { count: "exact", head: true })).count ?? 0;
    const { error } = await db.from(table).delete().eq("company", CHECK_COMPANY);
    if (error) throw new Error(error.message);
    const after = (await db.from(table).select("id", { count: "exact", head: true })).count ?? 0;
    console.log(`${table}: ${before} rows before, ${before - after} check rows removed, ${after} left`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

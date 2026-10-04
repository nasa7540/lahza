import { CHECK_COMPANY, companyCode } from "@/lib/companies";

/**
 * The company written on an event or referral row. A server started by the automatic checks sets
 * LAHZA_CHECK_ROWS=1 and marks every row it writes, so check rows can be told from real ones and removed.
 * The deployed app never sets it, and a visitor cannot send the reserved value.
 */
export function rowCompany(given?: string | null): string | null {
  return process.env.LAHZA_CHECK_ROWS === "1" ? CHECK_COMPANY : companyCode(given);
}

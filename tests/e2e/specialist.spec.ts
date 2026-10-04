import { expect, test } from "@playwright/test";
import { scriptDb } from "../../scripts/db";

const MARK = "E2E-REFERRAL";
const db = scriptDb();
test.afterAll(async () => {
  await db.from("referrals").delete().like("summary", `%${MARK}%`);
});

test("a personal ruling leads to the specialist form, and the request reaches the dashboard queue", async ({ page }) => {
  await page.route("**/api/event", (route) => route.fulfill({ json: { ok: true } }));
  await page.goto("/en/ask");
  await page.getByRole("textbox").fill("I divorced my wife by text message while angry, does it count in my case?");
  await page.locator("button[type=submit]").click();
  await page.getByTestId("to-specialist").click();

  // The summary starts from the fixed template and the user's own question; nothing is sent without consent.
  const summary = page.getByRole("textbox");
  await expect(summary).toHaveValue(/I would like to speak with a specialist[\s\S]*does it count in my case/);
  const send = page.locator("button[type=submit]");
  await expect(send).toBeDisabled();
  await summary.fill(`I would like to ask about my situation. ${MARK}`);
  await page.getByRole("switch").check();
  await send.click();
  await expect(page.getByTestId("referral-sent")).toBeVisible();

  await page.goto("/dashboard");
  await page.locator('input[name="passcode"]').fill(process.env.DASHBOARD_PASSCODE ?? "lahza-dev");
  await page.locator('button[type="submit"]').click();
  const row = page.locator('[data-referral][data-status="new"]').first();
  await expect(row).not.toContainText(MARK); // the employee's text is not on the overview
  await row.getByRole("button").click();
  await expect(page.locator('[data-referral][data-status="accepted"]').first()).toContainText(MARK);
});

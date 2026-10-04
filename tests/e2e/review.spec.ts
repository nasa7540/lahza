import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { latestDraft, saveDraft } from "../../lib/content/drafts";
import { scriptDb } from "../../scripts/db";

// The review panel on a temporary copy of a real draft; real drafts are never approved by a test.
const db = scriptDb();
const id = randomUUID();

test.beforeAll(async () => {
  const base = await latestDraft(db, "ramadan");
  if (!base) throw new Error("needs the ramadan draft");
  await saveDraft(db, { ...structuredClone(base), id, journey_id: "test-e2e-review" });
});
test.afterAll(async () => {
  await db.from("cards").delete().eq("journey_id", "test-e2e-review");
  await db.from("journeys").delete().eq("id", "test-e2e-review");
  await db.from("review_decisions").delete().eq("draft_id", id);
  await db.from("journey_drafts").delete().eq("id", id);
});

test("review: sign in, edit, approve one by one and in bulk", async ({ page }) => {
  await page.goto(`/review/${id}`);
  await expect(page).toHaveURL(/\/review$/); // not signed in
  await page.locator('input[name="passcode"]').fill("wrong");
  await page.locator('input[name="name"]').fill("E2E Reviewer");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.goto("/review"); // a fresh form: React resets a form after its action, which can wipe fields typed too early
  await page.locator('input[name="passcode"]').fill(process.env.REVIEW_PASSCODE ?? "lahza-dev");
  await page.locator('input[name="name"]').fill("E2E Reviewer");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByTestId("reviewer")).toContainText("E2E Reviewer", { timeout: 15_000 });

  await page.goto(`/review/${id}?lang=ar`);
  await expect(page.getByTestId("status")).toContainText("غير معروضة");
  // Flagged sentences come first.
  const flagged = await page.locator('[data-flagged="true"]').count();
  if (flagged > 0) await expect(page.locator("[data-unit]").first()).toHaveAttribute("data-flagged", "true");

  // Edit a sentence: the counter moves and the unit stays undecided.
  const title = page.locator('[data-unit="title"]');
  await title.locator("summary").first().click();
  await title.locator('textarea[name="text"]').fill("عنوان معدّل في الاختبار");
  await title.getByRole("button", { name: "احفظ التعديل" }).click();
  await expect(page.getByTestId("edited")).toHaveText("1");
  await expect(page.locator('[data-unit="title"]')).toHaveAttribute("data-mine", "");

  // Approve flagged units one by one, then the rest in one step.
  for (let i = 0; i < flagged; i++) {
    await page.locator('[data-flagged="true"][data-mine=""]').first().getByRole("button", { name: "اعتماد" }).click();
    await expect(page.locator('[data-flagged="true"][data-mine="approve"]')).toHaveCount(i + 1);
  }
  await page.getByTestId("approve-rest").click();
  await expect(page.getByTestId("status")).toContainText("معروضة للموظفين بشارة");

  // The reader now gets the journey, with the badge and the edited title.
  await page.goto("/ar/j/test-e2e-review");
  await expect(page.getByTestId("unapproved")).toHaveCount(0);
});

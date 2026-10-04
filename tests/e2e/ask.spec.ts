import { expect, test } from "@playwright/test";

// The free question against the real endpoint (rule guard, model, search), in development preview.
test("a question about fasting is offered the Ramadan journey", async ({ page }) => {
  await page.goto("/ar/ask");
  await page.getByRole("textbox").fill("زميلي ما ياكل ولا يشرب طول النهار هالشهر، وش السالفة");
  await page.locator("button[type=submit]").click();
  await expect(page.getByTestId("ask-result")).toHaveAttribute("data-outcome", /journey|candidates/, { timeout: 20_000 });
  await expect(page.getByTestId("ask-result").locator("[data-journey]").first()).toHaveAttribute("data-journey", "ramadan");
});

test("a personal ruling goes to the specialist card with no journey", async ({ page }) => {
  await page.goto("/en/ask");
  await page.getByRole("textbox").fill("I divorced my wife by text message while angry, does it count in my case?");
  await page.locator("button[type=submit]").click();
  await expect(page.getByTestId("ask-result")).toHaveAttribute("data-outcome", "specialist", { timeout: 20_000 });
  await expect(page.getByTestId("ask-result").locator("[data-journey]")).toHaveCount(0);
});

test("an unrelated question gets the empty state", async ({ page }) => {
  await page.goto("/en/ask");
  await page.getByRole("textbox").fill("where can I download my salary slip, the HR portal is not working");
  await page.locator("button[type=submit]").click();
  await expect(page.getByTestId("ask-result")).toHaveAttribute("data-outcome", "empty", { timeout: 20_000 });
});

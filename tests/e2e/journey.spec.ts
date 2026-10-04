import { expect, test } from "@playwright/test";

// Usage events are answered here so test runs do not count as real use; the endpoint itself is covered by check:invariants.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/event", (route) => route.fulfill({ json: { ok: true } }));
});

// One full journey in each language: scene, choice, reveal with its source card, explain, tip, back home marked done.
for (const locale of ["ar", "en", "ur"] as const) {
  test(`journey in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/home`);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "en" ? "ltr" : "rtl");
    await page.locator('[data-journey="ramadan"]').click();
    await expect(page.getByTestId("scene")).toBeVisible();
    await expect(page.getByTestId("unapproved").or(page.getByTestId("badge"))).toBeVisible();

    const options = page.getByRole("radio");
    await expect(options).toHaveCount(5); // four misconceptions and "something else"
    const next = page.locator("button.bg-teal");
    await expect(next).toBeDisabled();
    await options.first().click();
    await next.click();

    await expect(page.getByTestId("reveal-headline")).toBeVisible();
    const verse = page.locator('[data-source^="quran-"]').first();
    await expect(verse).toBeVisible();
    await expect(verse.locator('p[lang="ar"]')).toHaveCSS("font-family", /quran/i);
    if (locale !== "ar") await expect(verse.locator("p")).toHaveCount(2); // the verse and its approved translation
    await next.click();

    await page.getByRole("textbox").fill(locale === "en" ? "He is fasting for Ramadan." : "زميلي صائم في رمضان.");
    await page.getByTestId("check").click();
    // The note is built from the journey's own approved key points: a status and positions come back, never text.
    await expect(page.getByTestId("feedback")).toHaveAttribute("data-status", "graded", { timeout: 25_000 });
    await next.click();
    await expect(page.getByTestId("tip")).toBeVisible();
    await page.locator("a.bg-teal").click();
    await expect(page.locator('[data-journey="ramadan"]').locator("svg").nth(1)).toBeVisible(); // the completed mark
  });
}

test("something else leads to the plain explanation", async ({ page }) => {
  await page.goto("/ar/j/prayer");
  await page.getByRole("radio").last().click();
  await page.locator("button.bg-teal").click();
  await expect(page.getByTestId("reveal-headline")).toHaveText("هذا ما يحدث فعلًا");
  await expect(page.locator("[data-source]").first()).toBeVisible();
});

test("the date parameter moves a journey to today", async ({ page }) => {
  await page.goto("/ar/home?date=2027-02-15"); // inside Ramadan 1448
  await expect(page.locator('[data-journey="ramadan"]')).toHaveAttribute("data-slot", "now");
  await expect(page.locator("[data-journey]").first()).toHaveAttribute("data-slot", "now");
  await page.goto("/ar/home?date=2026-10-04");
  await expect(page.locator('[data-journey="ramadan"]')).toHaveAttribute("data-slot", "library");
});

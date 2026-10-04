import { defineConfig, devices } from "@playwright/test";

/** End-to-end tests run against `next dev`, where unapproved drafts are previewed with a red tag. */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3000", ...devices["Pixel 7"] },
  webServer: { command: "npm run dev", url: "http://localhost:3000/api/health", reuseExistingServer: true, timeout: 120_000 },
});

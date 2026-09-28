import { defineConfig, devices } from "@playwright/test";

// The tests run against `wrangler dev`, which serves dist/ the way production
// does: _redirects, _headers, trailing slashes and the 404 page.
const port = 8787;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "iphone", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: `npm run build && npx wrangler dev --ip 127.0.0.1 --port ${port} --show-interactive-dev-session=false --log-level warn`,
    url: `http://127.0.0.1:${port}/en/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});

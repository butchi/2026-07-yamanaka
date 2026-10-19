import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/pages",
  use: {
    baseURL: "http://127.0.0.1:4399",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build:pages && pnpm exec astro preview --host 127.0.0.1 --port 4399",
    env: {
      SITE_URL: "https://butchi.github.io",
      BASE_PATH: "/2026-07-yamanaka",
    },
    url: "http://127.0.0.1:4399/2026-07-yamanaka/",
    reuseExistingServer: false,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

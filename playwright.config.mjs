import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://localhost:3005",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next start -p 3005",
    port: 3005,
    reuseExistingServer: false,
    timeout: 20000,
  },
});

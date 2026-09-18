import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  workers: 1,
  use: { baseURL: "http://localhost:3000", channel: "chrome", headless: true, trace: "retain-on-failure" },
});

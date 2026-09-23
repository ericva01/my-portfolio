import { test, expect } from "@playwright/test";

test("404 page renders retro CRT diagnostic console, auto-tune scanner, and return navigation", async ({ page }) => {
  // Navigate to an unknown route
  const response = await page.goto("/unknown-frequency-404");
  expect(response?.status()).toBe(404);

  // Check 404 page structure
  const main = page.locator("#main");
  await expect(main).toBeAttached();

  // Verify OSD badges and CRT chassis
  await expect(page.locator(".chassis-brand")).toHaveText(/EV-CRT \/\/ MONITOR 404/);
  await expect(page.locator(".osd-badge")).toHaveText("CH. 404");
  await expect(page.locator(".glitch-text")).toHaveText("404");

  // Capture initial 404 screen
  await page.screenshot({ path: "test-results/404-initial-screen.png" });

  // Test Auto-Tune Scanner interaction
  const scanBtn = page.getByRole("button", { name: /AUTO-TUNE/ });
  await expect(scanBtn).toBeVisible();
  await scanBtn.click();

  // Wait for scanner to lock frequency (approx 3 seconds)
  await page.waitForTimeout(3200);

  // Verify frequency locked state
  await expect(page.locator(".status-led")).toHaveClass(/is-locked/);
  await expect(page.locator(".osd-freq")).toHaveText(/055\.25/);
  await expect(page.locator(".log-msg")).toHaveText(/PRIMARY BROADCAST FOUND/);

  // Capture tuned screen
  await page.screenshot({ path: "test-results/404-tuned-screen.png" });

  // Verify return to broadcast link works
  const returnHome = page.getByRole("link", { name: /RETURN TO BROADCAST/ });
  await expect(returnHome).toHaveAttribute("href", "/");
});

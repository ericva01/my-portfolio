import { test, expect } from "@playwright/test";

test("retro tv remote cursor activates on #projects section and displays HUD telemetry", async ({ page }) => {
  // Set session storage key so intro does not open
  await page.addInitScript(() => {
    sessionStorage.setItem("eric-va:intro-seen:v1", "1");
  });

  await page.goto("/");

  // Ensure intro dialog is closed
  await expect(page.locator("dialog")).toHaveCount(0);

  // Find projects section
  const projectsSec = page.locator("#projects");
  await expect(projectsSec).toBeAttached();

  const cursor = page.locator(".tv-remote-cursor");
  await expect(cursor).toBeAttached();

  // Scroll into view
  await projectsSec.scrollIntoViewIfNeeded();

  // Hover over the projects title
  const title = page.locator("#projects .section-title-row");
  await title.hover({ force: true });
  await page.waitForTimeout(300);

  // Check visibility
  await expect(cursor).toHaveClass(/is-visible/);

  // Hover over the project heading
  const projectTitle = page.locator(".project-copy h4").first();
  await projectTitle.hover({ force: true });
  await page.waitForTimeout(300);
  await expect(cursor).toHaveClass(/is-aiming/);
  const hud = await cursor.locator(".remote-hud-val").innerText();
  expect(hud).toContain("CAMBOSTACK");

  // Mouse down triggers IR blast and pressing state
  await page.mouse.down();
  await page.waitForTimeout(60);
  await expect(cursor).toHaveClass(/is-pressing/);
  await page.screenshot({ path: "test-results/remote-cursor-firing.png" });

  await page.mouse.up();
  await page.waitForTimeout(200);
  await page.screenshot({ path: "test-results/remote-cursor-ready.png" });
});

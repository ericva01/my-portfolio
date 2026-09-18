import { test, expect } from "@playwright/test";

async function mockYouTube(page, { delay = 150, blocked = false, error = false } = {}) {
  await page.route("https://www.youtube.com/embed/cT68Dz1jO94**", route => route.fulfill({
    contentType: "text/html", body: '<html><body style="background:#111;color:white"><button>Native YouTube Play</button></body></html>',
  }));
  await page.route("https://www.youtube.com/iframe_api", route => route.fulfill({
    contentType: "application/javascript", body: `
      window.__ytCalls = [];
      window.__ytPlayers = [];
      window.YT = { Player: class {
        constructor(frame, options) {
          this.frame = frame; this.options = options; this.muted = false; this.dead = false;
          window.__ytPlayers.push(this); window.__ytCalls.push('create');
          this.timer = setTimeout(() => { if (!this.dead) { options.events.onReady({ target: this }); ${error ? 'options.events.onError({ target: this, data: 150 });' : ''} } }, ${delay});
        }
        playVideo() { window.__ytCalls.push('play'); this.options.events.${blocked ? 'onAutoplayBlocked' : 'onStateChange'}({ target: this, data: 1 }); }
        stopVideo() { window.__ytCalls.push('stop'); }
        mute() { this.muted = true; window.__ytCalls.push('mute'); }
        unMute() { this.muted = false; window.__ytCalls.push('unmute'); }
        setVolume(n) { window.__ytCalls.push('volume:' + n); }
        isMuted() { return this.muted; }
        destroy() { this.dead = true; clearTimeout(this.timer); this.frame.remove(); window.__ytCalls.push('destroy'); }
      } };
      window.onYouTubeIframeAPIReady?.();
    `,
  }));
}
const calls = page => page.evaluate(() => window.__ytCalls ?? []);

test("explicit playback, mute, immediate stop, replay and once per session", async ({ page }) => {
  await mockYouTube(page, { delay: 1000 });
  await page.goto("/");
  const play = page.getByRole("button", { name: "PLAY INTRO MUSIC" });
  await expect(play).toBeDisabled();
  await expect(page.getByRole("button", { name: /ENTER PORTFOLIO/ })).toBeEnabled();
  await expect(play).toBeEnabled();
  expect(await calls(page)).not.toContain("play");
  await play.click();
  await expect(page.locator(".intro-music-status")).toContainText("music is playing");
  expect((await calls(page)).slice(-3)).toEqual(["unmute", "volume:70", "play"]);
  await page.getByRole("button", { name: "MUTE MUSIC", exact: true }).click();
  await expect(page.getByRole("button", { name: "UNMUTE MUSIC", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "UNMUTE MUSIC", exact: true }).click();
  await expect(page.getByRole("button", { name: "MUTE MUSIC", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /ENTER PORTFOLIO/ }).click();
  await expect(page.locator(".intro-player iframe")).toHaveCount(0);
  expect((await calls(page)).slice(-3)).toEqual(["mute", "stop", "destroy"]);
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.locator("#main")).toBeFocused();
  await page.getByRole("button", { name: "REPLAY INTRO" }).click();
  await expect(play).toBeEnabled();
  expect((await calls(page)).filter(x => x === "play")).toHaveLength(1);
  await play.click();
  await page.getByRole("link", { name: "Skip intro", exact: true }).click();
  await expect(page.locator(".intro-player iframe")).toHaveCount(0);
  expect((await calls(page)).slice(-3)).toEqual(["mute", "stop", "destroy"]);
  await expect(page.locator("dialog")).toHaveCount(0);
  let apiRequests = 0;
  page.on("request", request => { if (request.url().includes("youtube.com/iframe_api")) apiRequests++; });
  await page.reload();
  await page.waitForTimeout(700);
  await expect(page.locator("dialog")).toHaveCount(0);
  expect(apiRequests).toBe(0);
});

test("blocked playback retains native player and skip", async ({ page }) => {
  await mockYouTube(page, { blocked: true });
  await page.goto("/");
  await page.getByRole("button", { name: "PLAY INTRO MUSIC" }).click();
  await expect(page.locator(".intro-music-status")).toContainText("browser blocked playback");
  await expect(page.frameLocator(".intro-player iframe").getByRole("button")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
  expect(await calls(page)).toContain("destroy");
});

test("embedding errors allow entry", async ({ page }) => {
  await mockYouTube(page, { error: true });
  await page.goto("/");
  await expect(page.locator(".intro-music-status")).toContainText("unavailable");
  await expect(page.getByRole("button", { name: "PLAY INTRO MUSIC" })).toBeDisabled();
  await page.getByRole("button", { name: /ENTER PORTFOLIO/ }).click();
  await expect(page.locator("dialog")).toHaveCount(0);
});

test("early entry cancels pending API initialization", async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route("https://www.youtube.com/iframe_api", async route => { await pending; await route.abort(); });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Skip intro", exact: true }).click();
  await expect(page.locator(".intro-player iframe")).toHaveCount(0);
  release();
  await expect(page.locator("dialog")).toHaveCount(0);
  await page.waitForTimeout(300);
  await expect(page.locator(".intro-player iframe")).toHaveCount(0);
});

for (const width of [320, 390, 768]) {
  test(`responsive 16:9 player at ${width}px and reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockYouTube(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "PLAY INTRO MUSIC" })).toBeEnabled();
    const frame = page.locator(".intro-player iframe");
    const box = await frame.boundingBox();
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await expect(frame).toHaveAttribute("title", /intro music/);
    await expect(frame).toHaveAttribute("allow", /autoplay.*fullscreen/);
    await expect(page.locator(".intro-screen .intro-scanlines")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /ENTER PORTFOLIO/ })).toBeInViewport();
    await page.screenshot({ path: `test-results/intro-${width}.png` });
    await page.getByRole("button", { name: /ENTER PORTFOLIO/ }).press("Enter");
    await expect(page.locator("dialog")).toHaveCount(0);
  });
}

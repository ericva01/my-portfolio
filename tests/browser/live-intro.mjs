import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const failed = [];
page.on('requestfailed', request => { if (/youtube|googlevideo|ytimg/.test(request.url())) failed.push({ url: request.url().slice(0,120), error: request.failure()?.errorText }); });
try {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  const play = page.getByRole('button', { name: 'PLAY INTRO MUSIC' });
  await play.waitFor();
  try { await play.click({ timeout: 23000 }); } catch { /* capture fallback */ }
  await page.waitForTimeout(7000);
  const media = [];
  for (const frame of page.frames()) {
    if (frame.url().includes('youtube.com/embed/cT68Dz1jO94')) {
      media.push(await frame.evaluate(() => ({ text: document.body.innerText.slice(0,700), video: [...document.querySelectorAll('video')].map(v => ({ paused:v.paused, muted:v.muted, time:v.currentTime, volume:v.volume, ready:v.readyState })) })));
    }
  }
  console.log(JSON.stringify({ status: await page.locator('.intro-music-status').innerText(), media, failed }, null, 2));
  await page.screenshot({ path:'test-results/intro-live.png' });
  if (await play.isEnabled()) {
    await page.getByRole('button', { name:'MUTE MUSIC', exact:true }).click();
    const mediaFrame = page.frames().find(frame => frame.url().includes('youtube.com/embed/cT68Dz1jO94'));
    await expect.poll(() => mediaFrame.evaluate(() => document.querySelector('video')?.muted)).toBe(true);
    console.log('Actual video mute verified');
    await page.getByRole('button', { name:'UNMUTE MUSIC', exact:true }).click();
    await expect.poll(() => mediaFrame.evaluate(() => document.querySelector('video')?.muted)).toBe(false);
    console.log('Actual video unmute verified');
  }
  await page.getByRole('button', { name:/ENTER PORTFOLIO/ }).click();
  await expect(page.locator('.intro-player iframe')).toHaveCount(0);
  await expect(page.locator('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'REPLAY INTRO' }).click();
  await expect(play).toBeEnabled();
  const replayFrame = page.frames().find(frame => frame.url().includes('youtube.com/embed/cT68Dz1jO94'));
  const started = await replayFrame.evaluate(() => [...document.querySelectorAll('video')].some(video => !video.paused));
  expect(started).toBe(false);
  await play.click();
  await expect(page.locator('.intro-music-status')).toContainText('music is playing');
  await page.screenshot({ path: 'test-results/intro-live-mobile.png' });
  await page.getByRole('link', { name: 'Skip intro', exact: true }).click();
  await expect(page.locator('.intro-player iframe')).toHaveCount(0);
  console.log('Real track replay, mobile playback, and skip cleanup verified');
} finally { await browser.close(); }

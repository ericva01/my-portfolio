# Eric Va — personal portfolio

A responsive portfolio built with Next.js App Router, TypeScript, Tailwind CSS, GSAP, ScrollTrigger, and `@gsap/react`. The design combines an LCD green interface, pixel artwork, keypad buttons, and CRT project previews.

## Run locally

Use Node.js 20.9 or newer and npm:

```sh
npm install
npm run dev
```

Open http://localhost:3000. On Windows with restricted PowerShell scripts, use `npm.cmd` instead of `npm`.

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`next/font` downloads Press Start 2P and IBM Plex Mono during the build, then self-hosts them. The first build requires access to Google Fonts. System monospace fallbacks are configured.

## Edit content

All personal information, education, project descriptions, topic tags, demo paths, captions, and social links live in **`src/data/portfolio.ts`**. Email, phone (display and international dial link), and GitHub are configured with the supplied contact details. Empty optional LinkedIn, repository, and live-demo values do not produce links. Set `personal.siteUrl` to the complete public HTTPS URL to enable the canonical URL and Open Graph URL. No example domain or invented contact information is shipped.

The role and education descriptions reflect the supplied information. The two institutions are SETEC Institute and ISTAD. SETEC is ongoing study; ISTAD contains Full Stack Web Development and ITP - DevOps Engineering. The 50% scholarship belongs only to the Full Stack course. Education programs reference project IDs so titles and descriptions stay consistent with the Projects section. Education panels do not assert a chronological order. CAMBOSTACK and Glideo have empty technology arrays until confirmed technologies are supplied.

## Configure demo videos

Projects are grouped by `group: "academic" | "personal"`. Only projects with `videoDemo: true` render a CRT demo area; CAMBOSTACK and Autonomous have this enabled. Both academic projects now use their supplied `youtubeEmbedUrl` values. YouTube takes priority over an optional local video. To switch to local video, remove `youtubeEmbedUrl`. Video paths remain optional, so unconfigured demos never request files. Place academic demo videos in `public/videos/`, then uncomment or add the corresponding `videoSrc` in the central data file:

```ts
videoSrc: "/videos/cambostack-demo.mp4",
posterSrc: "/images/cambostack-poster.webp",
captions: [
  { src: "/videos/cambostack-en.vtt", srcLang: "en", label: "English", default: true },
],
```

The other suggested video path is `/videos/autonomous-demo.mp4`. Glideo has no video area, player, or video placeholder; it uses a pixel-style application window. Paths are relative to `public`; do not include `/public` in URLs. Only enable a path after the file exists. Prefer a broadly supported MP4 encoding and add WebVTT captions for spoken audio.

`RetroTV` embeds YouTube in a responsive 16:9 `aspect-video` screen with descriptive titles, lazy loading, fullscreen permission, and `strict-origin-when-cross-origin` referrers. Autoplay is disabled and inline mobile playback is enabled. YouTube retains its own controls. No scanlines, filters, pixelation, or playback animations cover either media type; GSAP animates the casing entrance. The dials and power indicator are decorative, not interactive controls.

YouTube players operate independently; no HTML video methods are called on iframes. Future coordination would require the [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference). Parameters follow the [YouTube player documentation](https://developers.google.com/youtube/player_parameters).

The optional local-video fallback retains native controls, fullscreen, inline playback, captions, and `preload="none"`. Starting a local video pauses other local videos only. Missing media configuration shows a designed placeholder; local media failures show an unavailable message.

## Images and styling

Put posters and future images in `public/images/`. Glideo supports an optional `screenshot: { src, alt, width, height }` object (see the commented example in the data file), rendered through `next/image`. Set the real image dimensions and descriptive alt text. Its screenshot and repository link remain hidden until configured; no image file is requested by default. The live project link is configured as https://fucuflow.ericva.site/. Posters belong in `posterSrc` and are handled by the HTML video element. For new content photos, use `next/image` with meaningful alt text and explicit dimensions. Current artwork is inline SVG, so it needs no image download or raster optimization. The favicon is `src/app/icon.svg`.

The palette, responsive layouts, CRT casing, and focus states are in `src/app/globals.css`. Tailwind is enabled through `@tailwindcss/postcss`. Reusable panels, headings, links, education entries, and project sections are in `src/components/`.

## Accessibility and animation

The page includes semantic sections, a skip link, active navigation, visible keyboard focus, and a native mobile disclosure menu with Escape dismissal. All page content and anchor links remain accessible without JavaScript. GSAP uses scoped `useGSAP`, `matchMedia`, cleanup, and reduced-motion preferences. Animation never gates content. The optional local-video power-indicator effect runs only after intentional playback and is disabled for reduced motion. YouTube playback is not animated.

Main text uses dark ink on pale green/off-white; dark sections use light text. Decorative overlays ignore pointer events and do not sit in the tab order. There is no contact form or simulated submission.

## Before publishing

- Supply the public site URL. Email, phone, and GitHub are already configured; LinkedIn remains hidden.
- Optionally add a Glideo screenshot and verified repository links. Academic YouTube demos and the Glideo live link are configured.
- Add only confirmed technology tags and any further factual project details.
- Run lint, type-check, and the production build.

Implementation references: [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation), [GSAP React integration](https://github.com/greensock/react), and [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()).


## Contact form Gmail setup

The form posts to `/api/contact` and sends plain-text email to `personal.email` in `src/data/portfolio.ts` (currently `ericva014@gmail.com`). Replies go to the visitor's email address. Credentials stay on the server.

1. Enable Google 2-Step Verification and create an app password: https://support.google.com/accounts/answer/185833
2. Copy `.env.example` to `.env.local`. Set `GMAIL_USER` to your sending Gmail address and `GMAIL_APP_PASSWORD` to the generated app password, not your normal Google password. Never commit this file.
3. Restart the development server. In production, add the same variables in your hosting provider and redeploy. Hosting must support a Next.js Node.js server and outbound Gmail SMTP; static exports cannot send mail.
4. Submit the form and check the Gmail inbox/spam folder. Delivery cannot be verified until credentials are configured. Success means Gmail accepted the email, not that inbox placement is guaranteed.

The endpoint validates fields and payload size, rejects cross-origin browser submissions, includes a honeypot, and limits attempts per email and per server process. For multiple instances, configure shared rate limiting at your hosting edge. Gmail sending limits and authentication guidance: https://nodemailer.com/guides/using-gmail


## Retro TV intro

The intro embeds `cT68Dz1jO94` using the YouTube IFrame Player API. Music starts only from a visitor action; the play button waits for `onReady`. Native YouTube controls remain available, including when browser autoplay policy blocks the API request. Enter, Skip, and Escape synchronously stop/destroy the player before the GSAP exit. Footer replay mounts a fresh player without autoplay. Session storage suppresses the intro after entry; if storage is blocked, the intro can reappear after a reload.

Run the dev server on port 3000, then `npx playwright test` for controlled browser regression tests (Chrome must be installed). `node tests/browser/live-intro.mjs` also checks the real YouTube track, actual mute state, and mobile playback; it needs internet access and an embeddable video. Browser screenshots are saved under `test-results/`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page, scroll-driven Islamic wedding invitation ("Adeeba & Ansar") built on TanStack Start (SSR) and deployed to Netlify. There is exactly one user-facing route: `/`.

The site is a digital rendering of a printed Malayalam invitation card. The bride's family are the hosts, so the bride is named first everywhere — hero, families grid, details panel, finale.

## Commands

Package manager is **bun** (`bun.lock`, `bunfig.toml`, Netlify runs `bun run build`).

```bash
bun install
bun run dev        # vite dev on http://localhost:8080 (host "::")
bun run build      # vite build + nitro (preset picked from env, see below)
bun run preview
bun run lint       # eslint . — prettier runs as an eslint rule, so lint catches formatting
bun run typecheck  # tsc --noEmit
bun run format     # prettier --write .
```

There is no test framework. To smoke-test a production build end to end:

```bash
bun run build && PORT=3111 node .output/server/index.mjs   # then curl localhost:3111
```

## Architecture

### Server / SSR stack

Vite + `tanstackStart` + `nitro` (nitro plugin only registers on `command === "build"`). The nitro preset is chosen in [vite.config.ts](vite.config.ts): `netlify` when `NETLIFY=true` or `CONTEXT=production`, otherwise `node-server`.

Three entry points, each with a distinct job:

- [src/router.tsx](src/router.tsx) — `getRouter()` creates the router with a fresh `QueryClient` per request, passed through router context.
- [src/start.ts](src/start.ts) — `createStart` with a request middleware that catches non-HTTP errors and returns a rendered HTML error page instead of a JSON 500. Errors carrying `statusCode` are re-thrown so TanStack handles them normally.
- [src/server.ts](src/server.ts) — the fetch handler wrapping `@tanstack/react-start/server-entry`. It exists because **h3 swallows in-handler throws into a `{"unhandled":true,"message":"HTTPError"}` JSON 500 that a plain try/catch never sees**; `normalizeCatastrophicSsrResponse` sniffs for that body and swaps in the HTML error page, logging the real error captured by [src/lib/error-capture.ts](src/lib/error-capture.ts). Don't "simplify" this away.

`vite.config.ts` marks `@tanstack/react-router` and `@tanstack/react-query` as `ssr.external` and dedupes React + query-core — both were needed to get the Nitro bundle working. Import protection errors on any client import of `**/server/**` or the Next.js `server-only` package (ESLint enforces the latter too, with a message pointing at the `*.server.ts` convention).

### Routing

File-based; see [src/routes/README.md](src/routes/README.md) for the conventions. `src/routeTree.gen.ts` is generated — never edit it. There is no `src/pages/`; `__root.tsx` is the only layout.

### Content

**All invitation copy, names, dates, venue, and Quranic verses live in [src/config/wedding.ts](src/config/wedding.ts)** as a single `as const` object. Content changes go there, not into components.

Things that must move together:
- `weddingDate` (ISO, drives the countdown and the calendar link) and the display strings `weddingDateLabel` / `weddingTimeLabel`.
- `bride.shortName` / `groom.shortName` feed the `person-card__crest` initial and the finale; `monogram` feeds the curtain seal.
- `grandparents` is an array of `{ first, second }` pairs — the printed card lists two couples per side without specifying paternal vs maternal, so don't reintroduce those labels.

### Page composition

[src/routes/index.tsx](src/routes/index.tsx) is the whole app: `MusicProvider` → `ScrollProgress` → `SmoothScroll` → seven sections → `MusicWidget`. Section order there is the scroll order.

Each section is a self-contained `<section id="…">` that:
1. Reads its copy from `wedding`.
2. Registers its own GSAP reveal in `useGSAP(..., { scope: rootRef })`, animating a section-scoped class (`.wm-rev`, `.fd-card-left`, etc.) via a `ScrollTrigger` on `rootRef`.
3. **Early-returns a `gsap.set(..., { opacity: 1, y: 0 })` when `prefers-reduced-motion` matches** — every animated component does this, and new ones must too, since the reveal classes start at `opacity: 0`.

Follow [WelcomeMessage.tsx](src/components/invitation/WelcomeMessage.tsx) as the template for a new section.

Light and dark sections alternate (`pat-light` / `pat-dark`), each carrying `seam-top` for the hairline gold rule at the boundary.

### Motion

- Always import GSAP from [src/lib/gsap.ts](src/lib/gsap.ts), never from `gsap` directly — that module is what registers `useGSAP`, `ScrollTrigger`, and `Flip`. `index.tsx` side-effect-imports it to guarantee registration order.
- [SmoothScroll.tsx](src/components/shared/SmoothScroll.tsx) drives Lenis and pipes `lenis.on("scroll", ScrollTrigger.update)`. It no-ops entirely under reduced motion. Cross-section navigation uses its exported `scrollToSection(id)`.

### SSR-sensitive components

[CountdownSection.tsx](src/components/invitation/CountdownSection.tsx) starts its state as `null` and fills in on mount, so the server and the first client render both emit `00`. Seeding it with a live `diff()` would hydration-mismatch every second. Anything else time- or random-dependent needs the same treatment.

### Audio

[MusicContext.tsx](src/context/MusicContext.tsx) owns a single Howler instance for `wedding.music.url`. Playback is unlocked only by the user tapping the seal in [InvitationCover.tsx](src/components/invitation/InvitationCover.tsx), which calls `startMusic()` — this is the autoplay-policy gesture, so don't move playback earlier.

### Styling

Tailwind v4, configured entirely in [src/styles.css](src/styles.css) (`@theme inline` tokens, no `tailwind.config`). The design system is hand-written CSS there — prefer these over ad-hoc hex values:

| Group | Classes |
| --- | --- |
| Surfaces | `.pat-light`, `.pat-dark`, `.seam-top`, `.card-light`, `.card-dark` |
| Hero | `.hero-scene`, `.hero-bg`, `.hero-vignette`, `.hero-frame`, `.corner-mark--*` |
| Cover | `.curtain-*`, `.seal`, `.seal__halo`, `.emblem` |
| Ornament | `.orn-*`, `.arch-ornament`, `.shimmer` / `.shimmer-light` |
| Content | `.details-*`, `.detail-cell*`, `.person-card*`, `.count-cell*`, `.wisher`, `.signature` |
| Controls | `.btn-gold`, `.btn-ghost`, `.btn-ghost-light`, `.music-pill`, `.scroll-progress` |

Palette: forest `#0c3620`, emerald `#0f5132`, ivory `#f6edd9`, cream `#fdf8f0`, gold `#c9a84c`. Token utilities (`text-gold`, `bg-forest`, `font-display`, `font-arabic`) come from `@theme`, so Tailwind opacity modifiers like `text-cream/70` work.

Arabic text uses `.font-arabic` (Scheherazade New, `direction: rtl`).

Every animation added to `styles.css` needs a matching entry in the `prefers-reduced-motion` block at the bottom. `.shimmer` in particular must fall back to a solid colour there — it paints text with `color: transparent`, so a disabled animation without the fallback renders invisible text.

## Conventions

- Path alias `@/*` → `src/*`.
- Server-only modules use the `*.server.ts` suffix (never the `server-only` package — ESLint blocks it).
- Public env vars need the `VITE_` prefix; `vite.config.ts` explicitly `define`s them so they survive the Nitro build.
- Prettier: 100 cols, double quotes, semicolons, trailing commas. It reformats compact GSAP config objects onto multiple lines — run `bun run format` rather than hand-aligning.
- ESLint ignores the generated output dirs (`dist`, `.output`, `.netlify`, `.tanstack`) and `routeTree.gen.ts`; without those it lints the Nitro bundle and reports thousands of prettier errors.
- `bunfig.toml` sets `minimumReleaseAge = 86400` — packages published in the last 24h will not install.

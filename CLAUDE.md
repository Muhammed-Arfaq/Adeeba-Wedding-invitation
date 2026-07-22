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
2. Registers its own GSAP reveal in `useGSAP(..., { scope: rootRef })`, animating the shared `.rv` class via a `ScrollTrigger` on `rootRef`. Use the `REVEAL` preset from [src/lib/gsap.ts](src/lib/gsap.ts) (`REVEAL.from` / `REVEAL.to` / `.stagger` / `.start`) so every band moves with one voice. `.rv-l` / `.rv-r` are the directional variants, used only by the two family cards.
3. **Early-returns a `gsap.set(".rv", { opacity: 1, y: 0, filter: "none" })` when `prefersReducedMotion()` returns true** — every animated component does this, and new ones must too, since `.rv` starts at `opacity: 0`.

Follow [WelcomeMessage.tsx](src/components/invitation/WelcomeMessage.tsx) as the template for a new section.

### The reveal pre-hide

`.rv` is only hidden when `<html>` carries `motion-ready`, which [src/lib/gsap.ts](src/lib/gsap.ts) adds at module scope. That ordering matters in both directions: the class lands before hydration paints (so nothing flashes in then animates out), and if JS never runs the class never appears, so every section renders fully visible instead of a blank page. The `prefers-reduced-motion` block re-shows `.rv` too, as a second belt-and-braces guard. Don't move that `classList.add` into a component effect — it would run after first paint and reintroduce the flash.

A GSAP tween whose `from` sets a class to `opacity: 0` must be a `fromTo` (its `immediateRender: true` is what keeps children of a revealing panel — `.dt-cell`, `.cnt-cell`, `.fb-wisher` — from flashing before their delayed tween starts).

Light and dark sections alternate (`pat-light` / `pat-dark`), each carrying `seam-top` for the hairline gold rule at the boundary.

### Motion

- Always import GSAP from [src/lib/gsap.ts](src/lib/gsap.ts), never from `gsap` directly — that module is what registers `useGSAP`, `ScrollTrigger`, and `Flip`, exports the shared `REVEAL` preset and `prefersReducedMotion()`, and sets the `motion-ready` class. `index.tsx` side-effect-imports it to guarantee registration order.
- The curtain in [InvitationCover.tsx](src/components/invitation/InvitationCover.tsx) is one GSAP timeline of seven labelled beats. The detail that makes it read as cloth rather than two sliding panels is beat 5: each `.curtain-fabric` scales toward its outer edge *while* its half translates away, so the pleats gather. Both are transform-only. The timeline `display: none`s `.curtain-stage` on complete, since offstage drapes are pure overdraw.
- The drapes are pale sage silk. Their pleats are **one irregular multi-stop gradient, not `repeating-linear-gradient`** — evenly spaced folds are the single biggest tell that a CSS curtain is fake. The right panel is mirrored by reversing that gradient's direction. Do not mirror it with `scale: -1 1`: with `transform-origin: right center` that flips the panel clean outside its own `overflow: hidden` (the right half vanishes entirely), and it fights the `scaleX` GSAP writes during the draw.

### Hero background

`.hero-bg` is the reference marble at `background-size: cover`. Because the image is light and its sage veining is locally dark, the invitation sits on `.hero-frame` — a frosted white panel — with `.hero-scrim` lifting the marble underneath. That pairing is what keeps ink text legible wherever the veining happens to fall; don't drop either and put text straight on the photo.

The hero content is in **normal flow with `min-h-svh`**, not `absolute inset-0`. Pinned to exactly one viewport height, the card was clipped at the top on short/landscape viewports; this way the section grows and the page scrolls instead.

`image.png` is a 1.5 MB PNG. It is the largest asset on the site by far and is in the critical path for first paint — worth converting to WebP/AVIF at ~1600px if load time matters.
- [SmoothScroll.tsx](src/components/shared/SmoothScroll.tsx) drives Lenis and pipes `lenis.on("scroll", ScrollTrigger.update)`. It no-ops entirely under reduced motion. Cross-section navigation uses its exported `scrollToSection(id)`.

### SSR-sensitive components

[CountdownSection.tsx](src/components/invitation/CountdownSection.tsx) starts its state as `null` and fills in on mount, so the server and the first client render both emit `00`. Seeding it with a live `diff()` would hydration-mismatch every second. Anything else time- or random-dependent needs the same treatment.

### Audio

[MusicContext.tsx](src/context/MusicContext.tsx) owns a single Howler instance for `wedding.music.url`. Playback is unlocked only by the user tapping the seal in [InvitationCover.tsx](src/components/invitation/InvitationCover.tsx), which calls `startMusic()` — this is the autoplay-policy gesture, so don't move playback earlier.

### Styling

Tailwind v4, configured entirely in [src/styles.css](src/styles.css) (`@theme inline` tokens, no `tailwind.config`). The design system is hand-written CSS there — prefer these over ad-hoc hex values:

| Group | Classes |
| --- | --- |
| Layout | `.section-pad` (drives `--section-y` / `--section-x`), `.rv`, `.rv-l`, `.rv-r` |
| Surfaces | `.page-marble`, `.pat-light`, `.pat-mint`, `.seam-top`, `.card-light`, `.card-mint` |
| Hero | `.hero-scene`, `.hero-bg`, `.hero-aurora`, `.hero-scrim`, `.hero-vignette`, `.hero-frame`, `.corner-mark--*`, `.scroll-cue` |
| Cover | `.curtain-stage`, `.curtain-valance`, `.curtain-half`, `.curtain-fabric`, `.curtain-sheen`, `.curtain-edge`, `.curtain-glow`, `.seal`, `.seal__halo`, `.emblem` |
| Ornament | `.orn-*` (right-hand rule is `.orn-line--rev`), `.arch-ornament`, `.family-link`, `.shimmer` / `.shimmer-light` |
| Content | `.details-*`, `.detail-cell*`, `.person-card*`, `.count-cell*`, `.venue-map`, `.wisher`, `.signature` |
| Controls | `.btn-gold`, `.btn-ghost`, `.music-pill`, `.scroll-progress` |

### Palette

**Every colour is sampled from [public/images/image.png](public/images/image.png)** — the mint-and-gold alcohol-ink marble that is also the hero background. `#f4f4ef` is the image's dominant tone (33% of its pixels) and anchors everything. Re-sample that file rather than inventing new values.

Neutrals: porcelain `#fbfbf8`, alabaster `#f4f4ef`, mist `#eaf1ea`. Sage ramp `--color-sage-50` `#e4ece4` → `--color-sage-700` `#35735b`. Ink `#22423a`. Gold `#c9a961`, deep gold `#96793a`.

`--color-forest` is kept as an alias of ink purely so existing `text-forest/NN` opacity utilities keep resolving; it is no longer a green.

### The marble slab

`.page-marble` is a single `position: fixed` layer holding the reference image, mounted once in [index.tsx](src/routes/index.tsx) with `main` above it at `z-10`. Every band on top is a **translucent wash**, so the stone reads as one continuous surface the content slides over. Per-section backgrounds were the obvious alternative and look worse — the same 1024px tile visibly restarts in every section. `position: fixed` is safe here only because Lenis scrolls the window without a wrapper transform; if `SmoothScroll` ever moves to a transformed wrapper, this layer breaks.

The wash opacities (~0.78 light, ~0.76 mint) are a **contrast budget, not a taste setting**. They are set as thin as the text allows: over the marble's darkest sage veining, ink at 80% opacity lands near 5:1. That is why body copy bottoms out at `text-forest/80` — dropping text opacity further, or thinning the wash, pushes small text under 4.5:1. Change the two together or not at all.

**The page has no dark bands.** Both surfaces are light — `.pat-light` (warm alabaster) alternating with `.pat-mint` (mint wash). So:
- Gold **text** is always `text-gold-deep` (`#96793a`, ~4.9:1). `text-gold` (`#c9a961`) is decoration only — as text on either band it fails WCAG.
- `SectionLabel`, `SectionTitle`, `RuledLabel` and `ArchOrnament` no longer take a `light` prop; there is nothing dark for them to sit on.
- `text-gold-soft` and `.shimmer-light` are pale variants left over for use on a dark surface. Nothing uses them. Don't reach for them on a light band.

Do not name a class `.rev` — that collided with the scroll-reveal class and left the right half of every `GoldDivider` permanently invisible.

Arabic text uses `.font-arabic` (Scheherazade New, `direction: rtl`).

### Mobile type scale

Mobile gets its own smaller scale, set in two places that must stay in step:
- **Component sizes** — the unprefixed Tailwind size is the mobile one, with `sm:` restoring the desktop size (`text-2xl sm:text-4xl`). Don't add a size without its `sm:` partner.
- **CSS-defined sizes** — anything sized in `styles.css` (`.count-cell__num`, `.detail-cell__value`, `.btn-gold`, `.seal`, …) steps down in the `@media (max-width: 639px)` block near the foot of the file.

Body copy bottoms out at ~13px (`text-[0.82rem]`); only display sizes and chrome go smaller. Resist scaling this by dropping the root `font-size` — Tailwind spacing is rem-based, so it would also shrink the 44px touch targets.

Every animation added to `styles.css` needs a matching entry in the `prefers-reduced-motion` block at the bottom. `.shimmer` in particular must fall back to a solid colour there — it paints text with `color: transparent`, so a disabled animation without the fallback renders invisible text.

## Conventions

- Path alias `@/*` → `src/*`.
- Server-only modules use the `*.server.ts` suffix (never the `server-only` package — ESLint blocks it).
- Public env vars need the `VITE_` prefix; `vite.config.ts` explicitly `define`s them so they survive the Nitro build.
- Prettier: 100 cols, double quotes, semicolons, trailing commas. It reformats compact GSAP config objects onto multiple lines — run `bun run format` rather than hand-aligning.
- ESLint ignores the generated output dirs (`dist`, `.output`, `.netlify`, `.tanstack`) and `routeTree.gen.ts`; without those it lints the Nitro bundle and reports thousands of prettier errors.
- `bunfig.toml` sets `minimumReleaseAge = 86400` — packages published in the last 24h will not install.

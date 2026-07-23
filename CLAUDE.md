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

**Scroll smoothness is measurable — measure it rather than tuning by eye.** Three rounds were lost to plausible-sounding theories. Node 22 has a global `WebSocket`, so a dependency-free CDP harness against the installed Chrome is enough: launch `--headless=new --remote-debugging-port=…`, click `.env-seal`, drive the page with real `Input.dispatchMouseEvent` `mouseWheel` events, and each frame record `scrollY` alongside every panel's `getBoundingClientRect().top`. A frozen panel's `top` must not move, so per-handoff drift is the number that matters. Two traps: reading seven rects per frame forces a synchronous layout and will itself dominate your frame-pacing numbers (measure pacing in a separate run that records only `performance.now()`); and once the handoff is composited, main-thread rects go stale by design, so drift there measures the main thread's bookkeeping, not what is on screen — check the composited path by stepping `window.scrollTo` and asserting `translateY == scrollY`.

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
- `credit` is the builder's own footer CTA (WhatsApp + phone) inviting others to commission a site like this — it renders at the foot of the finale. `credit.phone` and `credit.whatsapp` must agree (the `wa.me` link takes the number with no `+`, spaces, or dashes).

### The stack

[index.tsx](src/routes/index.tsx) wraps the seven sections in [StackScroll](src/components/shared/StackScroll.tsx). Every section carries `.panel`; each one overlaps the previous by `-2rem` with a rounded top edge and an upward shadow, and a scrubbed ScrollTrigger scales + dims the outgoing panel as the next covers it. Scrolling up reverses it exactly.

The freeze is done by translating the outgoing panel **down by exactly the distance the page scrolls during the handoff**, which cancels the scroll and holds it still — the same result as `position: fixed`, but scoped to the one viewport of scrolling it takes the next panel to cover it.

**That windowing is the whole point, so don't "simplify" it to `position: sticky` or ScrollTrigger's `pin`.** Either of those pins a panel for its full height, which caps it at one viewport of *visible* content — and Welcome, Families and the finale all run two to three screens tall on mobile, so everything below their first screen would become unreachable. Here they scroll normally right up until the handoff. Transforms don't affect layout, so displacing a panel a full screen adds no scroll height.

**The handoff runs on the compositor, not the main thread.** A `@supports (animation-timeline: scroll(root block))` block in [styles.css](src/styles.css) drives the `panel-handoff` keyframes off a scroll timeline; StackScroll only *measures*, writing `--stack-y`, `--stack-scale` and `animation-range` inline per panel. That is the whole fix for the flicker, and the reason is structural rather than a matter of tuning: on a phone, touch scrolling is composited while a JS-written transform is not, so a main-thread freeze spends every frame applying the previous frame's scroll offset to this frame's scroll position. A scroll-driven animation reads the offset the compositor is already applying, in the same frame, so it cannot be stale. Measured with a CDP harness driving real wheel events: `translateY` tracks `scrollY` 1:1 and the outgoing panel's `rect.top` holds at exactly 0 across the range.

Two things about that rule are load-bearing:
- **It selects structurally (`html.motion-ready .stack > .panel:not(:last-child)`), never via a class added from JS.** EnvelopeCover rebuilds its own `className` when the envelope opens and React writes the whole attribute, so an imperatively added class is silently wiped — on the one panel that needs it most. This cost a debugging round: `getAnimations()` returned nothing on the cover and the panel simply scrolled away. `motion-ready` lives on `<html>`, outside React.
- **Both keyframe values are `var()`s with identity defaults** (`--stack-y: 0px`, `--stack-scale: 1`), so a panel StackScroll hasn't measured — the last one, or any of them before the layout effect runs — animates from itself to itself and renders as if the rule weren't there. That's what makes it safe to give the whole stack one declarative rule and let JS decide by measurement which panels it applies to.

Use **longhands**, not the `animation` shorthand: the shorthand resets `animation-timeline` to `auto` and silently turns this into a zero-duration time-driven animation. And keep the comment blocks intact when editing near it — a stray `*/` dropped the whole rule from the bundle once, and it fails *silently* (the build succeeds, the panels just don't stick). Verify with `Get-Content <built css> -Raw` containing `panel-handoff`.

The GSAP path below is now the **fallback** for browsers without scroll-driven animations (Safari before 26, Firefox before 144). It is still correct — measured 0.0px drift on all six handoffs with `CSS.supports` stubbed to false — and everything in this list still applies to it:
- **One tween, one ScrollTrigger per panel, with `scrub: true`.** A numeric scrub is wrong for a *freeze* and the history here is a long detour around that. It drives `totalProgress` through an `expo` tween of that duration, restarted toward the new target on every update (`scrubTween` in ScrollTrigger.js). One 60fps frame is 2.8% of a 0.6s duration and `expo.out(0.028)` ≈ 0.175, so each frame closes only ~17% of the gap and the steady-state lag settles at ~4.7 frames of travel — roughly 190px at a moderate 40px/frame. Since the panel holds still only if `y` cancels the scroll *exactly*, that lag isn't smoothing, it's displacement: the panel rides visibly out of position while you scroll and eases back when you stop, in both directions. That was reported as the page being "pushed back and then set on correct place". `scrub: true` renders synchronously inside the scroll event, so `y` is always the current offset. The low-pass was masking per-frame cost rather than scroll noise, and the entries below are what let it go: the panel is promoted for the whole handoff, its ambient loops are paused, the phone reveals no longer animate an uncompositable blur, and Lenis writes the scroll from inside `gsap.ticker` so the transform lands in the same frame.
- **The stack animates `y` + `scale` only — never `opacity`.** Fading a panel whose `.paper-grain` uses `mix-blend-mode` forces a full recomposite every frame and flickers. The receding depth comes from the scale plus the incoming panel's top shadow, which is enough.
- **`snap: { y: 1 device px, scale: 1/2048 }` on the tween.** Both scroll engines decay asymptotically — Lenis's lerp on a wheel, the browser's own fling on touch — so for the best part of a second after the page has visibly stopped they keep moving a fraction of a pixel per frame. Unsnapped, every one of those frames wrote a new transform and re-rastered a full-screen textured panel for a change too small to see; that settling tail *is* the shimmer that appears just as the next panel comes to rest at the top. Snapped, they resolve to the same transform string, which Blink discards without invalidating style. Both steps are well under one physical pixel, so nothing steps visibly.
- **No permanent `will-change` on `.panel`, and `force3D: false` on the tween.** Promoting all seven full-screen panels to GPU layers at once strains mobile GPUs and can itself flicker — and `force3D: true` did exactly that: `fromTo` renders its `from` state immediately, so it stamped a `translate3d()` on all six panels at page load and Blink promoted every one. Six full-screen layers is enough tile memory on a phone for the compositor to evict and re-raster, which shows up as flicker. `.panel--handoff` is the only thing that promotes a panel now.
- **`will-change: transform` is added for the handoff and removed a beat after it ends**, via the trigger's `onToggle` toggling `.panel--handoff`. Without the hint Chrome re-rasterises the whole textured panel — grain blend, shadow and all — on every sub-pixel change of `scale`, which was the dominant cost behind the judder as the next panel neared the top. Scoped to the one or two panels actually in motion, so it doesn't become the all-seven case above. **The delay on the removal is load-bearing**: the trigger ends at "next panel's top reaches the viewport top", which is exactly where the flicker was reported. Dropping `will-change` there tears the composited layer down and forces a full re-raster, and the smallest scroll back re-creates it — ride the boundary and the panel is promoted and de-promoted over and over. Adding is still immediate (it happens a whole viewport before anything moves); only the release waits.
- **A promoted panel only rasters once if its contents hold still**, so `.panel--handoff` also pauses the ambient loops inside it — `.shimmer`, `.emblem__ring--outer`, `.particle`, `.scroll-cue__line`. `.shimmer` is the worst of them: `background-position` on `background-clip: text` can't be composited, so it repaints its headline every frame forever and drags the whole layer back through raster at the current scale. These are 7–40s loops; holding them for the one viewport of scrolling a handoff lasts is imperceptible. Any new infinite animation *inside a panel* belongs in that list.
- **No permanent `will-change` on `.particle` either** — twelve promoted layers inside the finale, whose raster scale changed with the panel every frame the stack scaled it. Same trap as `.rv` below.
- **No permanent `will-change` on `.rv`/`.rv-l`/`.rv-r` either.** Every revealing element in all seven panels used to be a GPU layer for the life of the page, and when the stack scales a panel the raster scale of every promoted descendant changes with it — dozens of re-rasterised layers per frame. The reveal tweens animate opacity/transform/filter, which Chrome already composites for their duration.
- **`ScrollTrigger.config({ ignoreMobileResize: true })`** in [src/lib/gsap.ts](src/lib/gsap.ts). Mobile browsers fire `resize` when the URL bar slides away — i.e. mid-scroll — and a full ScrollTrigger refresh there re-measures every panel and snaps the scrubbed transforms to the new numbers, landing as a jolt right at the handoff. Orientation changes still refresh.
- **Nothing may read layout inside a scroll frame.** [ScrollProgress.tsx](src/components/shared/ScrollProgress.tsx) used to read `document.documentElement.scrollHeight` in its rAF, forcing a synchronous layout on every scrolled frame, interleaved with the transforms StackScroll writes on the same frame. It now measures only on `resize` and on ScrollTrigger's `refresh` event.
- **Lenis runs on GSAP's ticker** ([SmoothScroll.tsx](src/components/shared/SmoothScroll.tsx)), not its own rAF. One shared frame means the held panel's transform and the scroll position advance together; the old separate-rAF version let the transform trail a frame.
- **No `backdrop-filter` inside a panel.** The dark `.card`, `.count-cell` and `.signature` use opaque fills, not blur. Re-blurring a moving backdrop every scrubbed frame was the dominant paint cost; a semi-opaque fill is visually identical over the textured band. `.music-pill` keeps its blur — it's fixed and never scrubbed.

### Panel theming

A panel declares its own foreground set as CSS custom properties; `.panel--dark` overrides them. Components then use `.t-fg` / `.t-fg2` / `.t-fg3` / `.t-accent` and inherit whichever band they sit in — which is why `SectionLabel`, `SectionTitle` and `ArchOrnament` take no `light` prop. To add a dark section, put `panel panel--dark pat-dark` on it and everything inside recolours itself.

Current rhythm is kraft ↔ black card stock: cover (dark), welcome, families (dark), details, countdown (dark), venue, finale (dark).

### Page composition

[src/routes/index.tsx](src/routes/index.tsx) is the whole app: `MusicProvider` → `ScrollProgress` → `SmoothScroll` → seven sections → `MusicWidget`. Section order there is the scroll order.

Each section is a self-contained `<section id="…">` that:
1. Reads its copy from `wedding`.
2. Registers its own GSAP reveal in `useGSAP(..., { scope: rootRef })`, animating the shared `.rv` class via a `ScrollTrigger` on `rootRef`. Use the `REVEAL` preset from [src/lib/gsap.ts](src/lib/gsap.ts) (`REVEAL.from` / `REVEAL.to` / `.stagger` / `.start`) so every band moves with one voice. `.rv-l` / `.rv-r` are the directional variants, used only by the two family cards.
   - **Reveal blur comes from `revealBlur(px)`, which returns `{}` on phones** — spread it into `from` *and* `to` (`revealBlur(0)`), or neither, since a `to` that animates to `blur(0px)` from no filter costs the same repaints. `REVEAL.start` is `top 82%`, which is inside the panel handoff by construction (the handoff runs from the incoming panel's top at the viewport bottom to the viewport top, so *every* start position is). An animated `filter: blur()` can't be composited — Chrome repaints each staggered element on every frame the tween runs, on exactly the frames the stack is already scaling a full-screen textured panel. Desktop GPUs absorb it; phones drop frames, and a dropped frame is what turns the scrubbed transform's steady one-frame lag into a varying one, which is what reads as vibration. Don't hard-code `filter: "blur(…)"` into a reveal.
3. **Early-returns a `gsap.set(".rv", { opacity: 1, y: 0, filter: "none" })` when `prefersReducedMotion()` returns true** — every animated component does this, and new ones must too, since `.rv` starts at `opacity: 0`.

Follow [WelcomeMessage.tsx](src/components/invitation/WelcomeMessage.tsx) as the template for a new section.

### The reveal pre-hide

`.rv` is only hidden when `<html>` carries `motion-ready`, which [src/lib/gsap.ts](src/lib/gsap.ts) adds at module scope. That ordering matters in both directions: the class lands before hydration paints (so nothing flashes in then animates out), and if JS never runs the class never appears, so every section renders fully visible instead of a blank page. The `prefers-reduced-motion` block re-shows `.rv` too, as a second belt-and-braces guard. Don't move that `classList.add` into a component effect — it would run after first paint and reintroduce the flash.

A GSAP tween whose `from` sets a class to `opacity: 0` must be a `fromTo` (its `immediateRender: true` is what keeps children of a revealing panel — `.dt-cell`, `.cnt-cell`, `.fb-wisher` — from flashing before their delayed tween starts).

Kraft and black-card panels alternate; see **The stack** and **Panel theming** above.

### Motion

- Always import GSAP from [src/lib/gsap.ts](src/lib/gsap.ts), never from `gsap` directly — that module is what registers `useGSAP`, `ScrollTrigger`, and `Flip`, exports the shared `REVEAL` preset and `prefersReducedMotion()`, and sets the `motion-ready` class. `index.tsx` side-effect-imports it to guarantee registration order.
- The envelope opening in [EnvelopeCover.tsx](src/components/invitation/EnvelopeCover.tsx) is one GSAP timeline of four labelled beats: the wax gives and falls, the flap hinges back, the letter draws out, then a blurred hand-off from the paper letter to the real card. Blur across that swap is what makes it read as one object resolving rather than two crossfading. The timeline `display: none`s the stage on complete.
- The envelope and the card it becomes share a single CSS grid cell (`grid-area: 1 / 1`), so the scene is as tall as whichever is bigger and neither is ever clipped. An earlier `absolute inset-0` version cut the card off on short/landscape viewports.
- **The photo envelope is a centred flex column: `.env-photo` → `.env-photo__frame` (the sized, aspect-locked artwork) + `.env-photo__hint` (the "tap to open" line) beneath it.** The two centre together as one group, so the hint is never pushed off-screen. `.env-photo__frame` is sized `min(100vw - 3rem, (100svh - 10rem) * 941/1672)` — deliberately smaller than the viewport so there is clear margin on every side and room for the hint. The plates/pocket/seal are positioned against `.env-photo__frame` (it's the `position: relative` box), not `.env-photo`.
  - **The hint's in-flow rule must out-specify `.env-hint`.** That element carries both classes (the open timeline fades `.env-hint`), and `.env-hint` positions the *desktop* hint `absolute; bottom: -3.5rem` — later in the file and at equal specificity, so it silently won and hung the phone hint below the centred group, off the bottom of the screen. Hence `.env-photo .env-photo__hint { position: static }`. Don't flatten it back to a single class.
- **The invitation card must not flash before the envelope.** The card is plain HTML (paints on SSR instantly) while the envelope is an image (loads later), so without guards you'd see the card first. Two things prevent it: `.env-slot[aria-hidden="true"] { opacity: 0 }` hides the card from the very first paint (it's SSR-rendered `aria-hidden="true"` while sealed, before GSAP hydrates), and the route `head` preloads both envelope WebPs (`media: (max-width: 639px)`, phone-only) so the artwork arrives up front. Verify the first-paint state with JS disabled — that's what the browser shows before hydration.
- **The envelope is centred by `.env-centre`, a layer of its own that is exactly one visible viewport tall** — `position: absolute; top: 0; height: var(--app-height, 100svh); display: grid; place-items: center`, with `.env-photo` / `.env-stage` as `grid-area: 1 / 1` children. Its top edge is the scene's top edge, which is the document top while sealed (scroll locked), so `place-items: center` is exactly the viewport centre and, critically, **independent of the scene's height**. Only the card (`.env-slot`) is a grid item of the scene, so the scene still grows to fit it. That decoupling is what stops the envelope *moving down while opening* (the card returning to flow used to inflate the scene and re-centre a grid-placed envelope mid-animation). The layer is `pointer-events: none` (the two envelopes re-enable it) so it can't swallow taps meant for the card once the envelope is gone.
  - **Centre it with layout, never with the CSS `translate` property.** GSAP's CSSPlugin folds the independent `translate`/`rotate`/`scale` properties into the `transform` matrix and then sets them to `none` (`_parseTransform`, CSSPlugin.js). A `translate: -50% -50%` here was therefore **frozen into pixels** the first time the drift tween touched the envelope — and since `useGSAP` is a *layout* effect it froze them before `--app-height` had been measured, so anything that resized the frame afterwards left the envelope off-centre with the hint pushed off the bottom. Emulators never showed it because there `innerHeight === 100svh`, so nothing resized. Grid placement re-centres by itself and has nothing for GSAP to clobber.
  - **The height it centres against is `--env-vh: min(100svh, var(--app-height, 100svh))`, declared on `.env-scene` and inherited by the layer and the frame.** Every misalignment reported here has had one shape — a source *over*-reported the visible height, so the centre landed too low, leaving a gap above the envelope and pushing the hint off the bottom. Both sources can over-report and neither under-reports meaningfully, so taking the smaller retires the whole class of bug. `100svh` is the viewport with dynamic toolbars *shown*, which is exactly the sealed state (scroll is locked, so the URL bar cannot retract); `--app-height` is `min(visualViewport.height, innerHeight)` from JS, measured in a layout effect, and covers the Androids that report `svh` as the large viewport. **Don't collapse this to a single source — that is what regressed twice.** `--app-height` stops updating once the envelope opens, so the freed URL bar doesn't invalidate styles on every scroll. The scene keeps `min-height: 100svh` (not `--env-vh`) so its background doesn't reflow when the URL bar toggles after opening.
  - The cover→first-section boundary is flush (`.env-scene + .panel { margin-top: 0 }`) so the cover's stack tween doesn't pre-start at scroll 0.
- [SmoothScroll.tsx](src/components/shared/SmoothScroll.tsx) runs Lenis (`lerp: 0.1` for a tight, non-floaty feel) off `gsap.ticker` with `lagSmoothing(0)`, and pipes `lenis.on("scroll", ScrollTrigger.update)`. It no-ops entirely under reduced motion. It keeps the live instance in a module singleton so `scrollToSection(id)` (Lenis-smooth) and `setScrollLocked(locked)` (the sealed-envelope gate) can reach it without a context.

### SSR-sensitive components

[CountdownSection.tsx](src/components/invitation/CountdownSection.tsx) starts its state as `null` and fills in on mount, so the server and the first client render both emit `00`. Seeding it with a live `diff()` would hydration-mismatch every second. Anything else time- or random-dependent needs the same treatment.

### Audio

[MusicContext.tsx](src/context/MusicContext.tsx) owns a single Howler instance for `wedding.music.url`. Playback is unlocked only by the user tapping the wax seal in [EnvelopeCover.tsx](src/components/invitation/EnvelopeCover.tsx), which calls `startMusic()` — this is the autoplay-policy gesture, so don't move playback earlier.

### Styling

Tailwind v4, configured entirely in [src/styles.css](src/styles.css) (`@theme inline` tokens, no `tailwind.config`). The design system is hand-written CSS there — prefer these over ad-hoc hex values:

| Group | Classes |
| --- | --- |
| Layout | `.stack`, `.panel`, `.panel--dark`, `.panel--handoff`, `.section-pad`, `.rv`, `.rv-l`, `.rv-r` |
| Surfaces | `.pat-light`, `.pat-mid`, `.pat-dark`, `.paper-grain`, `.card` |
| Tokens | `.t-fg`, `.t-fg2`, `.t-fg3`, `.t-accent` |
| Cover | `.env-scene`, `.env-centre`, `.env-stage`, `.env-slot`, `.envelope`, `.env-body`, `.env-fold--*`, `.env-letter`, `.env-flap`, `.env-flap__face--*`, `.env-seal`, `.env-halo`, `.env-glow`, `.hero-card`, `.corner-mark--*`, `.scroll-cue` |
| Ornament | `.orn-*` (right-hand rule is `.orn-line--rev`), `.arch-ornament`, `.family-link`, `.shimmer`, `.emblem` |
| Content | `.details-*`, `.detail-cell*`, `.person-card*`, `.count-cell*`, `.venue-map`, `.signature` |
| Controls | `.btn-gold`, `.btn-ghost`, `.music-pill`, `.scroll-progress` |

### Palette

Three families, taken from the wax-seal envelope reference: **kraft paper**, **black card stock**, **gold**. Nothing else — resist adding a fourth hue.

Kraft `--color-kraft-50` `#f6ecdb` → `--color-kraft-600` `#866a46`. Ink `--color-ink-900` `#16150f` → `--color-ink-600` `#3d382e`. Gold `#c9a44c`, light `#e8cf94`, pale `#f5e6bf`, deep `#785a1d`.

Reach for the `.t-*` utilities rather than these directly — the panel decides which end of the ramp applies. `--accent` is `#785a1d` on kraft (4.6:1) and `#e0c07a` on black (9:1); a single gold cannot clear 4.5:1 on both.

### The envelope

[EnvelopeCover.tsx](src/components/invitation/EnvelopeCover.tsx) ships **two** envelopes and swaps them at 640px:

- **Phones** — the supplied artwork, as two keyed plates (`envelope-body`, `envelope-flap`). The flap hinges on its own right edge, `transform-origin: 93.9% 50%`, measured from the plate: its right edge sits at x=884 of 941. The seal hit area is centred on the wax at (355, 836) → `left: 37.7%`. The wrapper carries the plates' native `941 / 1672` aspect so those percentages map to the image and not to the viewport.
- **Tablet and up** — the CSS/SVG envelope below, since the artwork is 9:16 and would letterbox badly on a wide screen.

Which one is live is a CSS decision (`@media (max-width: 639px)`); `openEnvelope()` mirrors it with `matchMedia` so the timeline drives the envelope the user can actually see. The pocket card behind the photo flap **starts at `opacity: 0`** — the flap is a triangle, so a rectangular card behind it pokes out at the corners while still sealed.

**The sealed envelope is the whole page.** On mount EnvelopeCover calls `setScrollLocked(true)` (from SmoothScroll), which adds `html.scroll-locked` (overflow hidden) and stops Lenis, so no wheel or touch reaches the sections stacked below; while sealed the section also carries `.env-sealed` (z-index 30) so it covers the 2rem overlap of the next panel.

**The cover → first-section boundary is flush (`.env-scene + .panel { margin-top: 0 }`), unlike every other boundary's `-2rem` overlap.** The overlap pulls the next panel up into the cover's viewport, which makes the cover's own stack tween start ~32px early at scroll 0 — pre-translating the sealed envelope downward so it sits low instead of centred. Keep this boundary flush; the envelope's centring depends on it.

**A panel shorter than the viewport is the other way that tween pre-starts, and it is the one that bites on real phones.** `.env-scene` is `min-height: 100svh` — the URL-bar-*shown* height — while ScrollTrigger measures the viewport with `window.innerHeight`, the URL-bar-*hidden* one. On Chrome Android the cover is therefore ~60px shorter than the viewport, so its handoff resolves to a *negative* scroll position and the cover renders translated ~56px down with the scale already easing off, before a single pixel has been scrolled. It reads as a gap above the envelope with the hint jammed against the bottom edge — and no emulator reproduces it, because there `svh === innerHeight`. Two things in [StackScroll.tsx](src/components/shared/StackScroll.tsx) handle it, and they must stay together:
- `start: "clamp(top bottom)"` stops the start resolving below scroll 0.
- `y` is `min(innerHeight, next's document offset)`, not plain `innerHeight`, so the travel still matches the (now shorter) scroll span the clamp produced. Measured drift across the handoff: 0.0px normally, 0.3px in the mismatched case. Use plain `innerHeight` and the cover over-travels by the difference. `openEnvelope()` calls `setScrollLocked(false)` and drops `.env-sealed`. Note `overflow: hidden` blocks *user* scroll but not programmatic `scrollTo` in Chrome — test the lock with a real wheel event, not `window.scrollTo`. With JS disabled the lock never applies, which is the right degradation: the envelope can't open, so the page must stay scrollable to reach the content.

Tapping the seal is also the autoplay gesture that starts the music, so playback must not move earlier.

#### Regenerating the plates

The originals (`Image1.png`, `Image2.png`) are `Format24bppRgb` — **no alpha**; what looks like a transparency checkerboard is painted into the pixels as near-white squares. They are keyed to real alpha by brightness + saturation: the artwork is either strongly coloured (kraft sat≈56, gold sat≈91) or dark (black stock max≈41), the checkerboard is bright and neutral in *two* tones, `#fefefe` and `#f5f5f5`. The bright cutoff has to clear 245 with room — an earlier cutoff of 250 left the darker squares at alpha 25 and the checkerboard stayed faintly visible.

The keyed PNGs are ~4.2 MB for the pair, so they are re-encoded to WebP (~327 KB, 92% smaller) and referenced through `<picture>` with the PNG as fallback. Both steps ran as throwaway scripts against the headless Chrome used for screenshots — there is no image library in the project, and none needs adding.

Three things there are load-bearing:
- **The flap needs two faces.** A single element with `backface-visibility: hidden` vanishes the moment it rotates past 90°. `.env-flap__face--front` (black) and `--back` (kraft liner, pre-rotated 180°) give it an outside and an inside.
- **The flap's `z-index` drops mid-tween.** Past halfway it must fall behind the letter, or it keeps painting over it.
- **The letter is sized by `top`/`bottom`, never `aspect-ratio`.** At a ratio of the envelope's *width* it came out half again as tall as the envelope and stuck out of the top while still sealed.

The seal is flat and matte on purpose: edge darkening plus a bright offset highlight turns it into a gold ball. Wax is a low disc — let the irregular `border-radius` and the cast shadow do the work.

### Paper

`.paper-grain` is one `feTurbulence` tile applied via `::after`, multiply-blended on light panels and overlay on dark. It replaced a 1.5 MB photographic background; keep textures procedural rather than reintroducing a large asset.

Do not name a class `.rev` — that collided with the scroll-reveal class and left the right half of every `GoldDivider` permanently invisible.

Arabic text uses `.font-arabic` (Scheherazade New, `direction: rtl`).

### Mobile type scale

Mobile gets its own smaller scale, set in two places that must stay in step:
- **Component sizes** — the unprefixed Tailwind size is the mobile one, with `sm:` restoring the desktop size (`text-2xl sm:text-4xl`). Don't add a size without its `sm:` partner.
- **CSS-defined sizes** — anything sized in `styles.css` (`.count-cell__num`, `.detail-cell__value`, `.btn-gold`, `.seal`, …) steps down in the `@media (max-width: 639px)` block near the foot of the file.

Body copy bottoms out at ~13px (`text-[0.82rem]`); only display sizes and chrome go smaller. Resist scaling this by dropping the root `font-size` — Tailwind spacing is rem-based, so it would also shrink the 44px touch targets.

Every animation added to `styles.css` needs a matching entry in the `prefers-reduced-motion` block at the bottom — and if it is an `infinite` one living *inside a panel*, a matching entry in the `.panel--handoff … { animation-play-state: paused }` rule too (see **The stack**). `.shimmer` in particular must fall back to a solid colour there — it paints text with `color: transparent`, so a disabled animation without the fallback renders invisible text.

## Conventions

- Path alias `@/*` → `src/*`.
- Server-only modules use the `*.server.ts` suffix (never the `server-only` package — ESLint blocks it).
- Public env vars need the `VITE_` prefix; `vite.config.ts` explicitly `define`s them so they survive the Nitro build.
- Prettier: 100 cols, double quotes, semicolons, trailing commas. It reformats compact GSAP config objects onto multiple lines — run `bun run format` rather than hand-aligning.
- ESLint ignores the generated output dirs (`dist`, `.output`, `.netlify`, `.tanstack`) and `routeTree.gen.ts`; without those it lints the Nitro bundle and reports thousands of prettier errors.
- `bunfig.toml` sets `minimumReleaseAge = 86400` — packages published in the last 24h will not install.

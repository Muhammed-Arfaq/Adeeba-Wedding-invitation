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

**Scroll smoothness is measurable — measure it rather than tuning by eye.** Three rounds were lost to plausible-sounding theories. Node 22 has a global `WebSocket`, so a dependency-free CDP harness against the installed Chrome is enough: launch `--headless=new --remote-debugging-port=…`, click `.env-seal`, drive the page with real `Input.dispatchMouseEvent` `mouseWheel` events, and each frame record `scrollY` alongside every panel's `getBoundingClientRect().top`. A frozen panel's `top` must not move, so per-handoff drift is the number that matters. Two traps: reading every panel's rect per frame forces a synchronous layout and will itself dominate your frame-pacing numbers (measure pacing in a separate run that records only `performance.now()`); and once the handoff is composited, main-thread rects go stale by design, so drift there measures the main thread's bookkeeping, not what is on screen — check the composited path by stepping `window.scrollTo` and asserting `translateY == scrollY`.

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

[index.tsx](src/routes/index.tsx) wraps the four sections in [StackScroll](src/components/shared/StackScroll.tsx). Every section carries `.panel`; each one overlaps the previous by `-2rem` with a rounded top edge and an upward shadow, and a scrubbed ScrollTrigger scales + dims the outgoing panel as the next covers it. Scrolling up reverses it exactly.

The freeze is done by translating the outgoing panel **down by exactly the distance the page scrolls during the handoff**, which cancels the scroll and holds it still — the same result as `position: fixed`, but scoped to the one viewport of scrolling it takes the next panel to cover it.

**That windowing is the whole point, so don't "simplify" it to `position: sticky` or ScrollTrigger's `pin`.** Either of those pins a panel for its full height, which caps it at one viewport of _visible_ content — and the merged details panel and the finale both run two to three screens tall on mobile, so everything below their first screen would become unreachable. Here they scroll normally right up until the handoff. Transforms don't affect layout, so displacing a panel a full screen adds no scroll height.

**The handoff runs on the compositor, not the main thread.** A `@supports (animation-timeline: scroll(root block))` block in [styles.css](src/styles.css) drives the `panel-handoff` keyframes off a scroll timeline; StackScroll only _measures_, writing `--stack-y`, `--stack-scale` and `animation-range` inline per panel. That is the whole fix for the flicker, and the reason is structural rather than a matter of tuning: on a phone, touch scrolling is composited while a JS-written transform is not, so a main-thread freeze spends every frame applying the previous frame's scroll offset to this frame's scroll position. A scroll-driven animation reads the offset the compositor is already applying, in the same frame, so it cannot be stale. Measured with a CDP harness driving real wheel events: `translateY` tracks `scrollY` 1:1 and the outgoing panel's `rect.top` holds at exactly 0 across the range.

Two things about that rule are load-bearing:

- **It selects structurally (`html.motion-ready .stack > .panel:not(:last-child)`), never via a class added from JS.** EnvelopeCover rebuilds its own `className` when the envelope opens and React writes the whole attribute, so an imperatively added class is silently wiped — on the one panel that needs it most. This cost a debugging round: `getAnimations()` returned nothing on the cover and the panel simply scrolled away. `motion-ready` lives on `<html>`, outside React.
- **Both keyframe values are `var()`s with identity defaults** (`--stack-y: 0px`, `--stack-scale: 1`), so a panel StackScroll hasn't measured — the last one, or any of them before the layout effect runs — animates from itself to itself and renders as if the rule weren't there. That's what makes it safe to give the whole stack one declarative rule and let JS decide by measurement which panels it applies to.

Use **longhands**, not the `animation` shorthand: the shorthand resets `animation-timeline` to `auto` and silently turns this into a zero-duration time-driven animation. And keep the comment blocks intact when editing near it — a stray `*/` dropped the whole rule from the bundle once, and it fails _silently_ (the build succeeds, the panels just don't stick). Verify with `Get-Content <built css> -Raw` containing `panel-handoff`.

The GSAP path below is now the **fallback** for browsers without scroll-driven animations (Safari before 26, Firefox before 144). It is still correct — measured 0.0px drift on all six handoffs with `CSS.supports` stubbed to false — and everything in this list still applies to it:

- **One tween, one ScrollTrigger per panel, with `scrub: true`.** A numeric scrub is wrong for a _freeze_ and the history here is a long detour around that. It drives `totalProgress` through an `expo` tween of that duration, restarted toward the new target on every update (`scrubTween` in ScrollTrigger.js). One 60fps frame is 2.8% of a 0.6s duration and `expo.out(0.028)` ≈ 0.175, so each frame closes only ~17% of the gap and the steady-state lag settles at ~4.7 frames of travel — roughly 190px at a moderate 40px/frame. Since the panel holds still only if `y` cancels the scroll _exactly_, that lag isn't smoothing, it's displacement: the panel rides visibly out of position while you scroll and eases back when you stop, in both directions. That was reported as the page being "pushed back and then set on correct place". `scrub: true` renders synchronously inside the scroll event, so `y` is always the current offset. The low-pass was masking per-frame cost rather than scroll noise, and the entries below are what let it go: the panel is promoted for the whole handoff, its ambient loops are paused, the phone reveals no longer animate an uncompositable blur, and Lenis writes the scroll from inside `gsap.ticker` so the transform lands in the same frame.
- **The stack animates `y` + `scale` only — never `opacity`.** Fading a panel whose `.paper-grain` uses `mix-blend-mode` forces a full recomposite every frame and flickers. The receding depth comes from the scale plus the incoming panel's top shadow, which is enough.
- **`snap: { y: 1 device px, scale: 1/2048 }` on the tween.** Both scroll engines decay asymptotically — Lenis's lerp on a wheel, the browser's own fling on touch — so for the best part of a second after the page has visibly stopped they keep moving a fraction of a pixel per frame. Unsnapped, every one of those frames wrote a new transform and re-rastered a full-screen textured panel for a change too small to see; that settling tail _is_ the shimmer that appears just as the next panel comes to rest at the top. Snapped, they resolve to the same transform string, which Blink discards without invalidating style. Both steps are well under one physical pixel, so nothing steps visibly.
- **No permanent `will-change` on `.panel`, and `force3D: false` on the tween.** Promoting every full-screen panel to a GPU layer at once strains mobile GPUs and can itself flicker — and `force3D: true` did exactly that: `fromTo` renders its `from` state immediately, so it stamped a `translate3d()` on every non-final panel at page load and Blink promoted every one. That many full-screen layers is enough tile memory on a phone for the compositor to evict and re-raster, which shows up as flicker. `.panel--handoff` is the only thing that promotes a panel now.
- **`will-change: transform` is added for the handoff and removed a beat after it ends**, via the trigger's `onToggle` toggling `.panel--handoff`. Without the hint Chrome re-rasterises the whole textured panel — grain blend, shadow and all — on every sub-pixel change of `scale`, which was the dominant cost behind the judder as the next panel neared the top. Scoped to the one or two panels actually in motion, so it doesn't become the all-panels case above. **The delay on the removal is load-bearing**: the trigger ends at "next panel's top reaches the viewport top", which is exactly where the flicker was reported. Dropping `will-change` there tears the composited layer down and forces a full re-raster, and the smallest scroll back re-creates it — ride the boundary and the panel is promoted and de-promoted over and over. Adding is still immediate (it happens a whole viewport before anything moves); only the release waits.
- **A promoted panel only rasters once if its contents hold still**, so `.panel--handoff` also pauses the ambient loops inside it — `.shimmer`, `.emblem__ring--outer`, `.particle`, `.scroll-cue__line`. `.shimmer` is the worst of them: `background-position` on `background-clip: text` can't be composited, so it repaints its headline every frame forever and drags the whole layer back through raster at the current scale. These are 7–40s loops; holding them for the one viewport of scrolling a handoff lasts is imperceptible. Any new infinite animation _inside a panel_ belongs in that list.
- **`.panel--idle` is the same idea widened from "mid-handoff" to "nowhere near the viewport", and it is what makes ambient dust on _every_ panel affordable.** [StackScroll](src/components/shared/StackScroll.tsx) sets it from an `IntersectionObserver` with a half-viewport `rootMargin`, in a plain `useEffect` — deliberately not inside the `useGSAP` beside it, which early-returns under reduced motion. Every mote becomes a composited layer while it animates, so before the gate, panels three screens away were paying for layers nobody could see: measured across the guided scroll, dust on all four panels took frames over 33ms from **2 to 16** and p99 from **19.6ms to 40.1ms**. Gated, it measures back at the no-dust baseline (0–7 over 33ms across three runs) with 24–36 of the 48 motes running at any moment instead of all 48. Don't pre-mark every panel idle on mount either — the observer's first callback lands a frame later, which flashes the cover's dust off and straight back on.
- **Headless frame numbers here vary enough between runs that a single sample proves nothing** — the first run of a batch is reliably the worst, and removing DOM nodes mid-run to build a comparison perturbs the very thing being measured. Take three runs and compare distributions, and treat the numbers as relative-only: headless rasterises in software.
- **No permanent `will-change` on `.particle` either** — twelve promoted layers inside the finale, whose raster scale changed with the panel every frame the stack scaled it. Same trap as `.rv` below.
- **No permanent `will-change` on `.rv`/`.rv-l`/`.rv-r` either.** Every revealing element in every panel used to be a GPU layer for the life of the page, and when the stack scales a panel the raster scale of every promoted descendant changes with it — dozens of re-rasterised layers per frame. The reveal tweens animate opacity/transform/filter, which Chrome already composites for their duration.
- **`ScrollTrigger.config({ ignoreMobileResize: true })`** in [src/lib/gsap.ts](src/lib/gsap.ts). Mobile browsers fire `resize` when the URL bar slides away — i.e. mid-scroll — and a full ScrollTrigger refresh there re-measures every panel and snaps the scrubbed transforms to the new numbers, landing as a jolt right at the handoff. Orientation changes still refresh.
- **Nothing may read layout inside a scroll frame.** [ScrollProgress.tsx](src/components/shared/ScrollProgress.tsx) used to read `document.documentElement.scrollHeight` in its rAF, forcing a synchronous layout on every scrolled frame, interleaved with the transforms StackScroll writes on the same frame. It now measures only on `resize` and on ScrollTrigger's `refresh` event.
- **Lenis runs on GSAP's ticker** ([SmoothScroll.tsx](src/components/shared/SmoothScroll.tsx)), not its own rAF. One shared frame means the held panel's transform and the scroll position advance together; the old separate-rAF version let the transform trail a frame.
- **No `backdrop-filter` inside a panel — this rule survived both the move to a glassmorphic UI and the flip to a light theme, and is the reason that UI is built the way it is.** Re-blurring a moving backdrop every scrubbed frame was the dominant paint cost here. Every raised surface (`.card`, `.details-panel`, `.count-cell`, `.signature`, `.hero-card`) is glass made from translucency, a sheen, a gold hairline and an inset highlight instead — see **Palette**. `.music-pill` is the sole exception and does blur: it's `position: fixed` and never scrubbed.

### Panel theming

Components use `.t-fg` / `.t-fg2` / `.t-fg3` / `.t-accent` and inherit the band they sit in — which is why `SectionLabel`, `SectionTitle` and `ArchOrnament` take no `light` prop. To add a section, put `panel panel--dark pat-dark` (or `pat-petrol`) on it and everything inside recolours itself.

Current rhythm is navy ↔ midnight, across four panels: cover (its own ground, deepest of all), details (`pat-navy`), countdown (`pat-midnight`), finale (`pat-navy`). **The page is dark blue throughout.**

**These two bands differ by DEPTH, not hue** — both are the same blue, one lighter than the other. That is the opposite of the pastel theme, which had to step the hue because on a light page a big tonal jump reads as a banding artefact. On a dark page tone is free again: depth reads as depth, and keeping one hue is what makes the deck read as a single dark blue room rather than two colours.

There is **one** foreground set, declared on `.panel`. `.panel--dark` is no longer on any panel, but its rules are deliberately kept: together they are a complete, working dark treatment for `.paper-grain`, `.shimmer`, `.card` and `.count-cell`, so adding the class back to a section is all it takes to get a dark band. Deleting them buys nothing.

**Deep gold is a background colour here, never a foreground.** `--color-gold-deep` `#785a1d` was the text colour on the old cream surfaces; on dark glass it is all but invisible. Converting the palette, the `rgba(120, 90, 29, …)` hairlines were caught by a search-and-replace but the `#785a1d` _hex_ ones were not, and `.detail-cell__label` shipped as unreadable dark-on-dark until a screenshot caught it. Foregrounds are `var(--accent)` `#e0c07a` or `var(--fg)`; `#2a1f08` stays where it belongs, as dark text sitting **on** a gold fill (`.btn-gold`, `.person-card__crest`).

### Page composition

[src/routes/index.tsx](src/routes/index.tsx) is the whole app: `MusicProvider` → `ScrollProgress` → `SmoothScroll` → four sections → `MusicWidget`. Section order there is the scroll order.

The deck was cut from seven panels to four to shorten the page. `WelcomeMessage`, `FamilyDetails` and `VenueExperience` are gone: the families grid, the ceremony cells and the venue map are now one [WeddingDetails.tsx](src/components/invitation/WeddingDetails.tsx) panel, and the standalone welcome band (its greeting, announcement lead and the Ar-Rum verse) was dropped along with its config keys. The cover still carries the Al-Furqan verse and the finale the closing dua, so the card keeps its voice.

Each section is a self-contained `<section id="…">` that:

1. Reads its copy from `wedding`.
2. Registers its own GSAP reveal in `useGSAP(..., { scope: rootRef })`, animating the shared `.rv` class via a `ScrollTrigger` on `rootRef`. Use the `REVEAL` preset from [src/lib/gsap.ts](src/lib/gsap.ts) (`REVEAL.from` / `REVEAL.to` / `.stagger` / `.start`) so every band moves with one voice. `.rv-l` / `.rv-r` are the directional variants, used only by the two family cards.

**A panel that runs two to three screens tall needs more than one trigger.** [WeddingDetails.tsx](src/components/invitation/WeddingDetails.tsx) is the merged families + ceremony + venue band, so it splits its reveals: `.fam-rv` fires off the panel top and `.det-rv` off the details block's own top. With a single trigger everything below the fold plays its entrance while off screen and is already sitting there, revealed, by the time you reach it. Both classes also carry `.rv`, which is what keeps the pre-hide rule in styles.css applying to them.

- **Reveal blur comes from `revealBlur(px)`, which returns `{}` on phones** — spread it into `from` _and_ `to` (`revealBlur(0)`), or neither, since a `to` that animates to `blur(0px)` from no filter costs the same repaints. `REVEAL.start` is `top 82%`, which is inside the panel handoff by construction (the handoff runs from the incoming panel's top at the viewport bottom to the viewport top, so _every_ start position is). An animated `filter: blur()` can't be composited — Chrome repaints each staggered element on every frame the tween runs, on exactly the frames the stack is already scaling a full-screen textured panel. Desktop GPUs absorb it; phones drop frames, and a dropped frame is what turns the scrubbed transform's steady one-frame lag into a varying one, which is what reads as vibration. Don't hard-code `filter: "blur(…)"` into a reveal.

3. **Early-returns a `gsap.set(".rv", { opacity: 1, y: 0, filter: "none" })` when `prefersReducedMotion()` returns true** — every animated component does this, and new ones must too, since `.rv` starts at `opacity: 0`.

Follow [CountdownSection.tsx](src/components/invitation/CountdownSection.tsx) as the template for a new section — it is the smallest one that does the whole pattern.

### The reveal pre-hide

`.rv` is only hidden when `<html>` carries `motion-ready`, which [src/lib/gsap.ts](src/lib/gsap.ts) adds at module scope. That ordering matters in both directions: the class lands before hydration paints (so nothing flashes in then animates out), and if JS never runs the class never appears, so every section renders fully visible instead of a blank page. The `prefers-reduced-motion` block re-shows `.rv` too, as a second belt-and-braces guard. Don't move that `classList.add` into a component effect — it would run after first paint and reintroduce the flash.

A GSAP tween whose `from` sets a class to `opacity: 0` must be a `fromTo` (its `immediateRender: true` is what keeps children of a revealing panel — `.dt-cell`, `.cnt-cell`, `.fb-wisher` — from flashing before their delayed tween starts).

Beige and navy panels alternate; see **The stack** and **Panel theming** above.

### Motion

- Always import GSAP from [src/lib/gsap.ts](src/lib/gsap.ts), never from `gsap` directly — that module is what registers `useGSAP`, `ScrollTrigger`, and `Flip`, exports the shared `REVEAL` preset and `prefersReducedMotion()`, and sets the `motion-ready` class. `index.tsx` side-effect-imports it to guarantee registration order.
- The envelope opening in [EnvelopeCover.tsx](src/components/invitation/EnvelopeCover.tsx) is one GSAP timeline of four labelled beats: the wax gives and falls, the flap hinges back, the letter draws out, then a blurred hand-off from the paper letter to the real card. Blur across that swap is what makes it read as one object resolving rather than two crossfading. The timeline `display: none`s the stage on complete.
- The envelope and the card it becomes share a single CSS grid cell (`grid-area: 1 / 1`), so the scene is as tall as whichever is bigger and neither is ever clipped. An earlier `absolute inset-0` version cut the card off on short/landscape viewports.
- **The photo envelope is a centred flex column: `.env-photo` → `.env-photo__frame` (the sized, aspect-locked artwork) + `.env-photo__hint` (the "tap to open" line) beneath it.** The two centre together as one group, so the hint is never pushed off-screen. `.env-photo__frame` is sized `min(100vw - 3rem, (100svh - 10rem) * 941/1672)` — deliberately smaller than the viewport so there is clear margin on every side and room for the hint. The plates/pocket/seal are positioned against `.env-photo__frame` (it's the `position: relative` box), not `.env-photo`.
  - **The hint's in-flow rule must out-specify `.env-hint`.** That element carries both classes (the open timeline fades `.env-hint`), and `.env-hint` positions the _desktop_ hint `absolute; bottom: -3.5rem` — later in the file and at equal specificity, so it silently won and hung the phone hint below the centred group, off the bottom of the screen. Hence `.env-photo .env-photo__hint { position: static }`. Don't flatten it back to a single class.
- **The invitation card must not flash before the envelope.** The card is plain HTML (paints on SSR instantly) while the envelope is an image (loads later), so without guards you'd see the card first. Two things prevent it: `.env-slot[aria-hidden="true"] { opacity: 0 }` hides the card from the very first paint (it's SSR-rendered `aria-hidden="true"` while sealed, before GSAP hydrates), and the route `head` preloads both envelope WebPs (`media: (max-width: 639px)`, phone-only) so the artwork arrives up front. Verify the first-paint state with JS disabled — that's what the browser shows before hydration.
- **The envelope is centred by `.env-centre`, a layer of its own that is exactly one visible viewport tall** — `position: absolute; top: 0; height: var(--app-height, 100svh); display: grid; place-items: center`, with `.env-photo` / `.env-stage` as `grid-area: 1 / 1` children. Its top edge is the scene's top edge, which is the document top while sealed (scroll locked), so `place-items: center` is exactly the viewport centre and, critically, **independent of the scene's height**. Only the card (`.env-slot`) is a grid item of the scene, so the scene still grows to fit it. That decoupling is what stops the envelope _moving down while opening_ (the card returning to flow used to inflate the scene and re-centre a grid-placed envelope mid-animation). The layer is `pointer-events: none` (the two envelopes re-enable it) so it can't swallow taps meant for the card once the envelope is gone.
  - **Centre it with layout, never with the CSS `translate` property.** GSAP's CSSPlugin folds the independent `translate`/`rotate`/`scale` properties into the `transform` matrix and then sets them to `none` (`_parseTransform`, CSSPlugin.js). A `translate: -50% -50%` here was therefore **frozen into pixels** the first time the drift tween touched the envelope — and since `useGSAP` is a _layout_ effect it froze them before `--app-height` had been measured, so anything that resized the frame afterwards left the envelope off-centre with the hint pushed off the bottom. Emulators never showed it because there `innerHeight === 100svh`, so nothing resized. Grid placement re-centres by itself and has nothing for GSAP to clobber.
  - **The height it centres against is `--env-vh: min(100svh, var(--app-height, 100svh))`, declared on `.env-scene` and inherited by the layer and the frame.** Every misalignment reported here has had one shape — a source _over_-reported the visible height, so the centre landed too low, leaving a gap above the envelope and pushing the hint off the bottom. Both sources can over-report and neither under-reports meaningfully, so taking the smaller retires the whole class of bug. `100svh` is the viewport with dynamic toolbars _shown_, which is exactly the sealed state (scroll is locked, so the URL bar cannot retract); `--app-height` is `min(visualViewport.height, innerHeight)` from JS, measured in a layout effect, and covers the Androids that report `svh` as the large viewport. **Don't collapse this to a single source — that is what regressed twice.** `--app-height` stops updating once the envelope opens, so the freed URL bar doesn't invalidate styles on every scroll. The scene keeps `min-height: 100svh` (not `--env-vh`) so its background doesn't reflow when the URL bar toggles after opening.
  - The cover→first-section boundary is flush (`.env-scene + .panel { margin-top: 0 }`) so the cover's stack tween doesn't pre-start at scroll 0.
- [SmoothScroll.tsx](src/components/shared/SmoothScroll.tsx) runs Lenis (`lerp: 0.1` for a tight, non-floaty feel) off `gsap.ticker` with `lagSmoothing(0)`, and pipes `lenis.on("scroll", ScrollTrigger.update)`. It no-ops entirely under reduced motion. It keeps the live instance in a module singleton so `scrollToSection(id)` (Lenis-smooth) and `setScrollLocked(locked)` (the sealed-envelope gate) can reach it without a context.

### The guided scroll

"View Invitation" on the hero card calls `autoScrollToEnd()` in [SmoothScroll.tsx](src/components/shared/SmoothScroll.tsx), which plays the whole card through to the foot of the page by itself. The scroll cue below it still just steps to `#details`.

- **It runs at a reading pace, not a transition pace.** `TOUR_SPEED` is 270px/s — about 15s for a phone-height page — so a line of body copy stays on screen for several seconds. It feels slow while tuning and correct in use; the instinct to speed it back up is the one to resist, and anyone in a hurry can just scroll.
- **Constant velocity through the middle, eased at both ends.** `tourEase` integrates a _velocity_ profile — smoothstep up over the first 12%, flat, smoothstep down — rather than using a cubic ease-in-out, whose peak velocity over a travel this long is twice its average: the middle of the card whips past while both ends crawl. Flat velocity also holds the per-frame scroll delta nearly constant, which is what keeps the composited handoff from re-rastering at a changing rate.
- **Wheel and touch need no cancel code.** Lenis routes them through `scrollTo(targetScroll + delta)`, and during a _programmatic_ scroll it pins `targetScroll` to the current animated position (`onUpdate` in lenis.mjs), so a nudge resumes from wherever the tour has reached instead of flinging the reader at its destination. Keys are the gap — Lenis's virtual scroll never sees them — so they are cancelled by hand, and the listener is torn down by a timer because `onComplete` does not fire for an interrupted tour.
- **Reduced motion gets no tour**, just a step to `#details`. A long unattended pan is precisely what that setting is asking us not to do.

**Both scroll-measuring harnesses are easy to write wrongly; two specific traps cost a round each here.**

- A **scroll timeline advances during the frame's rendering steps, not on a forced style recalc.** Stepping `window.scrollTo` and reading `getComputedStyle(panel).transform` in one synchronous task therefore reports the _previous_ frame's value for every sample — a flat `translateY: 0` across the whole range, which looks exactly like a broken handoff. Yield two `requestAnimationFrame`s between the scroll and the read. Done properly the answer is 0.0px drift on every handoff, `translateY` tracking `scrollY` 1:1.
- **Read the range the page resolved, not one you recompute.** StackScroll walks the entire `offsetParent` chain (`docTop`) precisely because a panel's `offsetTop` is relative to the wrong box; a harness that uses `next.offsetTop` invents its own expected values and reports drift of exactly one viewport.

Frame pacing in headless is measurable but not comparable to a device — headless rasterises in software and runs rAF uncapped (~7ms median here, not 16.7ms), so treat those numbers as relative-only.

### SSR-sensitive components

[CountdownSection.tsx](src/components/invitation/CountdownSection.tsx) starts its state as `null` and fills in on mount, so the server and the first client render both emit `00`. Seeding it with a live `diff()` would hydration-mismatch every second. Anything else time- or random-dependent needs the same treatment.

### Audio

[MusicContext.tsx](src/context/MusicContext.tsx) owns a single Howler instance for `wedding.music.url`. Playback is unlocked only by the user tapping the wax seal in [EnvelopeCover.tsx](src/components/invitation/EnvelopeCover.tsx), which calls `startMusic()` — this is the autoplay-policy gesture, so don't move playback earlier.

### Styling

Tailwind v4, configured entirely in [src/styles.css](src/styles.css) (`@theme inline` tokens, no `tailwind.config`). The design system is hand-written CSS there — prefer these over ad-hoc hex values:

| Group    | Classes                                                                                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout   | `.stack`, `.panel`, `.panel--dark`, `.panel--handoff`, `.section-pad`, `.rv`, `.rv-l`, `.rv-r`                                                                                                                                            |
| Surfaces | `.pat-navy`, `.pat-midnight`, `.paper-grain`, `.card`                                                                                                                                                                                     |
| Tokens   | `.t-fg`, `.t-fg2`, `.t-fg3`, `.t-accent`; glass is `--glass` / `--glass-border` / `--glass-hi` / `--glass-shadow` (properties on `.panel`, not classes)                                                                                   |
| Cover    | `.env-scene`, `.env-centre`, `.env-stage`, `.env-slot`, `.envelope`, `.env-body`, `.env-fold--*`, `.env-letter`, `.env-flap`, `.env-flap__face--*`, `.env-seal`, `.env-halo`, `.env-glow`, `.hero-card`, `.corner-mark--*`, `.scroll-cue` |
| Ornament | `.orn-*` (right-hand rule is `.orn-line--rev`), `.arch-ornament`, `.family-link`, `.shimmer`, `.emblem`, `.particles`/`.particle` (on every panel; gated by `.panel--idle`)                                                               |
| Content  | `.details-*`, `.detail-cell*`, `.person-card*`, `.count-cell*`, `.venue-map`, `.signature`                                                                                                                                                |
| Controls | `.btn-gold`, `.btn-ghost`, `.music-pill`, `.scroll-progress`                                                                                                                                                                              |

### Palette

Three families: **dark blue**, **warm cream**, **gold**. Nothing else — resist adding a fourth hue.

Two blues, one hue: navy `--color-navy-800` `#152340` is the lighter band and midnight `--color-midnight-800` `#0a1424` the deeper, with ramps to `--color-navy-500` `#2b436b` and `--color-midnight-900` `#060e1a`. Text is `--color-cream` `#e9e2d0` — warm rather than white, so it belongs to the gold's ramp and **nothing on the page is a neutral**. Gold `#c9a44c`, light `#e8cf94`, pale `#f5e6bf`, deep `#785a1d`.

**On a dark ground gold must come from the PALE end of the ramp.** `--accent` is `#e0c07a`; the light themes' `#6f5318` measures about 1.6:1 on midnight and disappears. This choice inverts every time the ground does, and it has caught something on each swap — the hints, the scroll-progress bar's pale stop (a highlight here, a gap on light), the detail-cell labels. Reach for the `.t-*` utilities rather than the hexes.

**The dust inverts too.** On a light band a mote had to be a small _solid_ form — higher alpha, tight falloff — or it vanished into the paper; on a dark one it reads from its own glow, so it goes pale and soft again. See `.particle`.

**The envelope is themed too** — pale blue-grey body, deep navy flap, gold wax — so nothing on the page is left over from an earlier palette. The card _inside_ it (`.env-letter`, `.env-photo__pocket`) is dark blue glass, matching the `.hero-card` it becomes. Those two are near-identical rules and a search-and-replace crossed them once, leaving the phone pocket light while the desktop letter went dark — check both.

The cover keeps its **own** ground rather than reusing a band. Which way it needs to go flips with the theme: on a light page the envelope had to be pushed pale and the ground made _deeper_ so it did not dissolve into the band; on a dark page the body has to stay clearly _lighter_ than the ground for the same reason. The mapping in `plates.mjs` carries that as a comment.

**Glass, and why it has no `backdrop-filter`.** Every raised surface shares one recipe, declared as `--glass` / `--glass-border` / `--glass-hi` / `--glass-shadow` on `.panel`: a white gradient, a gold hairline, an inset top highlight and a drop shadow, plus a `::before` sheen that falls steeply from the top edge. **Light glass inverts the dark recipe rather than reusing it** — the fill is near-opaque white over a tinted band instead of white-at-8%-over-dark, and the shadow is wide and faint instead of deep and black; the lift comes from the paper around the pane being warmer than the pane. That sheen is what sells it — an edge-lit pane reads as glass, a flat translucent rectangle reads as a tint. A real blur is ruled out by the scrub-cost rule in **The stack**, and would in any case return nearly the pixels it was given, since these backdrops are smooth gradients. `.detail-cell` deliberately uses a _lighter_ mix than `--glass`: it sits inside `.details-panel`, and stacking the full recipe twice muddied both sheets.

**Light grounds are less forgiving than dark ones for the tertiary text.** Pale text fading on a dark band drifts toward the accent and keeps contrast; dark text fading on a light band just washes out. `--fg-3` runs at **0.70** here against 0.62 in the dark theme — at 0.62 it measured 3.9:1 on the cover band, under AA. Compute contrast rather than eyeballing it, compositing alpha foregrounds over the actual band, and remember the glass lightens whatever it sits on.

**The other light-ground trap is pale gold used as text.** `.env-hint` and `.env-photo__hint` both shipped invisible (`rgba(232,207,148,.85)` and `rgba(240,220,170,.95)` on ivory) — and they must be fixed **separately**, because `.env-photo .env-photo__hint` out-specifies `.env-hint` by design (see the cover notes). The same applies to `.scroll-progress`, whose gradient had a `#f5e6bf` stop that became a gap in the bar.

### The envelope

[EnvelopeCover.tsx](src/components/invitation/EnvelopeCover.tsx) ships **two** envelopes and swaps them at 640px:

- **Phones** — the supplied artwork, as two keyed plates (`envelope-body`, `envelope-flap`). The flap hinges on its own right edge, `transform-origin: 93.9% 50%`, measured from the plate: its right edge sits at x=884 of 941. The seal hit area is centred on the wax at (355, 836) → `left: 37.7%`. The wrapper carries the plates' native `941 / 1672` aspect so those percentages map to the image and not to the viewport.
- **Tablet and up** — the CSS/SVG envelope below, since the artwork is 9:16 and would letterbox badly on a wide screen.

Which one is live is a CSS decision (`@media (max-width: 639px)`); `openEnvelope()` mirrors it with `matchMedia` so the timeline drives the envelope the user can actually see. The pocket card behind the photo flap **starts at `opacity: 0`** — the flap is a triangle, so a rectangular card behind it pokes out at the corners while still sealed.

**The sealed envelope is the whole page.** On mount EnvelopeCover calls `setScrollLocked(true)` (from SmoothScroll), which adds `html.scroll-locked` (overflow hidden) and stops Lenis, so no wheel or touch reaches the sections stacked below; while sealed the section also carries `.env-sealed` (z-index 30) so it covers the 2rem overlap of the next panel.

**The cover → first-section boundary is flush (`.env-scene + .panel { margin-top: 0 }`), unlike every other boundary's `-2rem` overlap.** The overlap pulls the next panel up into the cover's viewport, which makes the cover's own stack tween start ~32px early at scroll 0 — pre-translating the sealed envelope downward so it sits low instead of centred. Keep this boundary flush; the envelope's centring depends on it.

**A panel shorter than the viewport is the other way that tween pre-starts, and it is the one that bites on real phones.** `.env-scene` is `min-height: 100svh` — the URL-bar-_shown_ height — while ScrollTrigger measures the viewport with `window.innerHeight`, the URL-bar-_hidden_ one. On Chrome Android the cover is therefore ~60px shorter than the viewport, so its handoff resolves to a _negative_ scroll position and the cover renders translated ~56px down with the scale already easing off, before a single pixel has been scrolled. It reads as a gap above the envelope with the hint jammed against the bottom edge — and no emulator reproduces it, because there `svh === innerHeight`. Two things in [StackScroll.tsx](src/components/shared/StackScroll.tsx) handle it, and they must stay together:

- `start: "clamp(top bottom)"` stops the start resolving below scroll 0.
- `y` is `min(innerHeight, next's document offset)`, not plain `innerHeight`, so the travel still matches the (now shorter) scroll span the clamp produced. Measured drift across the handoff: 0.0px normally, 0.3px in the mismatched case. Use plain `innerHeight` and the cover over-travels by the difference. `openEnvelope()` calls `setScrollLocked(false)` and drops `.env-sealed`. Note `overflow: hidden` blocks _user_ scroll but not programmatic `scrollTo` in Chrome — test the lock with a real wheel event, not `window.scrollTo`. With JS disabled the lock never applies, which is the right degradation: the envelope can't open, so the page must stay scrollable to reach the content.

Tapping the seal is also the autoplay gesture that starts the music, so playback must not move earlier.

#### Regenerating the plates

The originals (`Image1.png`, `Image2.png`) are `Format24bppRgb` — **no alpha**; what looks like a transparency checkerboard is painted into the pixels as near-white squares. They are keyed to real alpha by brightness + saturation: the artwork is either strongly coloured (kraft sat≈56, gold sat≈91) or dark (black stock max≈41), the checkerboard is bright and neutral in _two_ tones, `#fefefe` and `#f5f5f5`. The bright cutoff has to clear 245 with room — an earlier cutoff of 250 left the darker squares at alpha 25 and the checkerboard stayed faintly visible.

The keyed PNGs are ~4.2 MB for the pair, so they are re-encoded to WebP (~327 KB, 92% smaller) and referenced through `<picture>` with the PNG as fallback. Both steps ran as throwaway scripts against the headless Chrome used for screenshots — there is no image library in the project, and none needs adding.

#### Recolouring the plates

**The originals are `ae740c2:public/images/envelope-{body,flap}.webp` — kraft body, black flap.** Always re-derive from that commit. Recolouring a recolour compounds, and the plates have been retargeted four times now (beige/navy, sage/forest, blue-grey/navy…).

**Do NOT reach for `git checkout HEAD -- public/images/…`.** That was the instruction here and it is wrong: the recoloured plates get committed, so HEAD holds whatever the _last_ theme was. It failed silently and cost a round — the body came back nearly neutral grey because sage's saturation had already been crushed once, and the flap's keying rim count dropped from 3984 to 264 because a green flap reads as "gold" to the saturation key.

**Check the input, don't assume it.** `plates.mjs` prints a fingerprint of what it actually decoded: the true originals are body `meanSat ≈ 0.39, darkFrac 0`, flap `meanSat ≈ 0.07, darkFrac ≈ 0.86`, and the flap's rim drop is **3984 px**. Any other numbers mean a recoloured plate got in. It also reads the files from disk as `data:` URLs rather than over HTTP — an HTTP origin put Chrome's disk cache, a possibly-stale `http.server`, and IPv4-vs-IPv6 resolution of `localhost` between the file and the canvas, and a cache-bust plus a fresh profile still did not clear it. The recolour is another throwaway canvas script; four things about it were learned the hard way and will bite anyone repeating it:

- **Key each plate differently, and never on lightness.** The body plate is 100% paper (h≈30, s 0.2–0.6). The flap plate is bimodal: the card stock is essentially _neutral_ (s≈0) while the wax seal is the only saturated thing on it — but the seal's rim and cast shadow run down to l≈0.2, well inside the stock's own lightness range. Keying the flap on lightness recolours the seal's shadow and rings the wax in blue. Saturation (`s >= 0.18` is gold) separates them cleanly.
- **Hue-rotating the black flap does nothing** — it is neutral, so the saturation must be _set_, not shifted.
- **The plates do not meet.** Along the flap's diagonal there is a sliver where both plates are transparent and the page shows through. It has always been there and was invisible only while the flap and the page were both black; against a recoloured flap it becomes visible — a black wedge on the dark theme, a pale line on the light one. Diagnose gaps by forcing the scene background to magenta — a gap goes magenta, a dark region stays dark. The fix is a flood-fill from the image border to find interior holes and grow flap colour into them; restricting to _interior_ holes is what stops the envelope's outline growing and fringing against the page.
- **The flap's edge residue is mid-GREY, not near-white.** The plates were cut from a painted near-white checkerboard, so every edge carries blended pixels — and because this plate's artwork is black, those blend to grey. Feeding grey through the navy transform turns it pale blue, and those pixels then seed the gap fill and smear a bright band across the seam. Since the plate holds only stock (l < 0.2) and seal (already excluded as gold), anything neutral and lighter is residue by construction: drop it before computing the union. Do **not** instead erode by alpha — the paper texture carries part-alpha speckles throughout, so an alpha-threshold erosion punches pinholes through the middle of both plates.

Three things about the CSS envelope are load-bearing:

- **The flap needs two faces.** A single element with `backface-visibility: hidden` vanishes the moment it rotates past 90°. `.env-flap__face--front` (navy) and `--back` (beige liner, pre-rotated 180°) give it an outside and an inside.
- **The flap's `z-index` drops mid-tween.** Past halfway it must fall behind the letter, or it keeps painting over it.
- **The letter is sized by `top`/`bottom`, never `aspect-ratio`.** At a ratio of the envelope's _width_ it came out half again as tall as the envelope and stuck out of the top while still sealed.

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

Every animation added to `styles.css` needs a matching entry in the `prefers-reduced-motion` block at the bottom — and if it is an `infinite` one living _inside a panel_, a matching entry in the `.panel--handoff … { animation-play-state: paused }` rule too (see **The stack**). `.shimmer` in particular must fall back to a solid colour there — it paints text with `color: transparent`, so a disabled animation without the fallback renders invisible text.

## Conventions

- Path alias `@/*` → `src/*`.
- Server-only modules use the `*.server.ts` suffix (never the `server-only` package — ESLint blocks it).
- Public env vars need the `VITE_` prefix; `vite.config.ts` explicitly `define`s them so they survive the Nitro build.
- Prettier: 100 cols, double quotes, semicolons, trailing commas. It reformats compact GSAP config objects onto multiple lines — run `bun run format` rather than hand-aligning.
- ESLint ignores the generated output dirs (`dist`, `.output`, `.netlify`, `.tanstack`) and `routeTree.gen.ts`; without those it lints the Nitro bundle and reports thousands of prettier errors.
- `bunfig.toml` sets `minimumReleaseAge = 86400` — packages published in the last 24h will not install.

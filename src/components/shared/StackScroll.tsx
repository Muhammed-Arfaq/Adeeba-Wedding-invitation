import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Storytelling stack: the panel you are leaving genuinely freezes while the
 * next one slides up over it, then it recedes behind. Scrubbed, so scrolling
 * back up reverses it exactly.
 *
 * The freeze is done by translating the outgoing panel *down* by exactly the
 * distance the page scrolls during the handoff, which cancels the scroll and
 * holds it still on screen — the same result as `position: fixed`, but only
 * for the one viewport of scrolling it takes the next panel to cover it.
 *
 * That windowing is the whole point. Pinning a panel for its full height (via
 * `position: sticky` or ScrollTrigger's `pin`) would cap it at one viewport of
 * visible content, and Welcome, Families and the finale all run two to three
 * screens tall on mobile — everything below their first screen would become
 * unreachable. Here they scroll normally right up until the handoff.
 */
export function StackScroll({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const panels = gsap.utils.toArray<HTMLElement>(".panel");

      /* One physical pixel, and a scale step finer than one physical pixel of
         panel width. Both scroll engines decay asymptotically — Lenis's lerp on
         a wheel, the browser's own fling on touch — so for the best part of a
         second after the page has visibly stopped they keep moving a fraction
         of a pixel per frame. Snapped, those frames resolve to the *same*
         transform string, which Blink discards without invalidating style; left
         continuous, each one re-rastered a full-screen textured panel for a
         change too small to see. That settling tail is the shimmer that shows
         up just as the next panel comes to rest at the top. */
      const dpx = 1 / (window.devicePixelRatio || 1);
      const clearTimers: Array<() => void> = [];

      panels.forEach((panel, i) => {
        const next = panels[i + 1];
        if (!next) return; // nothing covers the last one

        /* Timer for dropping the GPU-layer hint again — see `onToggle`. */
        let unpromote = 0;
        clearTimers.push(() => window.clearTimeout(unpromote));

        /* One tween, one ScrollTrigger per panel — fewer moving parts for the
           scrubber to keep in sync each frame.

           `y` holds the panel still: +1 viewport of downward travel over
           exactly 1 viewport of scroll cancels the scroll, so it reads as
           frozen while the next page slides up over it (whose shadow + rounded
           top sells the depth). Transforms don't affect layout, so the
           full-screen displacement adds no scroll height. A slight scale back
           lets it recede behind the incoming page.

           Smoothness: `scrub: 0.6` low-pass-filters the scroll so the transform
           doesn't vibrate against the scroller's sub-pixel values (the reported
           flicker as the next page nears the top); `snap` keeps the settling
           tail from re-rastering for changes below a physical pixel; and we
           deliberately do NOT animate opacity — fading a panel whose
           `.paper-grain` uses `mix-blend-mode` forces a full recomposite every
           frame and flickers.

           `force3D` is deliberately OFF. It sounds like the safe choice, but
           `fromTo` renders its `from` state immediately, so `force3D: true`
           stamps a `translate3d()` on all six panels at page load and Blink
           promotes every one of them — six full-screen composited layers held
           for the life of the page. That is precisely the all-panels-at-once
           promotion the CSS warns against, and on a phone it is enough tile
           memory to make the compositor evict and re-raster, which shows up as
           flicker. Promotion is `.panel--handoff`'s job now: `will-change`
           says the same thing to Blink, and only for the panel in motion. */
        gsap.fromTo(
          panel,
          { y: 0, scale: 1 },
          {
            /* Travel exactly the distance the page scrolls during the handoff,
               which is what cancels the scroll and holds the panel still.

               That is normally one viewport — but not for a panel shorter than
               the viewport. `.env-scene` is `100svh`, the URL-bar-*shown*
               height, while ScrollTrigger measures the viewport with
               `window.innerHeight`, the URL-bar-*hidden* one; on Chrome Android
               the cover is therefore ~60px shorter than the viewport, its
               handoff resolves to a negative scroll position, and the clamp
               below starts it at 0 over a correspondingly shorter span. Taking
               the next panel's document offset as the ceiling matches `y` to
               that span. It resolves to plain `innerHeight` in every ordinary
               case, and the expression is scroll-position independent, so it is
               safe to re-evaluate during a refresh. */
            y: () =>
              Math.min(window.innerHeight, next.getBoundingClientRect().top + window.scrollY),
            scale: 0.96,
            ease: "none",
            force3D: false,
            transformOrigin: "50% 0%",
            /* 1/2048 of scale is under a fifth of a pixel across a phone-width
               panel — invisible, and coarse enough that the settling tail
               resolves to a repeat of the last transform rather than a new one. */
            snap: { y: dpx, scale: 1 / 2048 },
            scrollTrigger: {
              trigger: next,
              /* `clamp()` keeps the start from resolving to a NEGATIVE scroll
                 position. Without it, a panel shorter than the viewport is
                 already part-way through its handoff at scroll 0 — the cover
                 was rendering translated ~56px down with the scale already
                 easing off, which reads as a gap above the envelope and pushes
                 the "tap the seal" hint against the bottom edge. */
              start: "clamp(top bottom)", // next panel's top enters the viewport
              end: "top top", // ...and reaches the viewport top
              scrub: 0.6,
              invalidateOnRefresh: true, // innerHeight is re-read on refresh
              /* Hold a stable GPU layer for the handoff, and let go again after,
                 so we never promote more than the panels actually in motion.
                 Without the hint Chrome re-rasterises the whole textured panel
                 on every sub-pixel change of `scale`; with it the panel rasters
                 once and scales on the GPU.

                 The *release* is delayed, and that is the point. This trigger
                 ends at "next panel's top reaches the viewport top" — exactly
                 the moment the flicker was reported. Dropping `will-change`
                 there tears the composited layer down and forces a full
                 re-raster, and the smallest scroll back re-creates it; ride the
                 boundary and the panel is promoted and de-promoted over and
                 over, which is the flicker rather than a symptom of it. Adding
                 is still immediate — it happens a whole viewport before
                 anything moves — but the drop waits for the panel to have been
                 done for a beat, so scrubbing across the seam never triggers it. */
              onToggle: (self) => {
                window.clearTimeout(unpromote);
                if (self.isActive) panel.classList.add("panel--handoff");
                else
                  unpromote = window.setTimeout(
                    () => panel.classList.remove("panel--handoff"),
                    650,
                  );
              },
            },
          },
        );
      });

      /* Panel heights depend on fonts and the lazy map iframe, both of which
         land after the first measure. Without this the trigger positions are
         computed against the wrong layout. */
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      const t = window.setTimeout(refresh, 600);

      return () => {
        window.removeEventListener("load", refresh);
        window.clearTimeout(t);
        clearTimers.forEach((clear) => clear());
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="stack">
      {children}
    </div>
  );
}

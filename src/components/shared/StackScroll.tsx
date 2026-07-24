import { useEffect, useRef, type ReactNode } from "react";
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

  /* Mark panels that are nowhere near the viewport, so `.panel--idle` can stop
     their ambient loops — see the note beside that rule in styles.css. Every
     panel now carries drifting dust, and each mote is a composited layer while
     it animates; without this, panels three screens away were paying for
     layers nobody could see, and the guided scroll measured 16 frames over
     33ms instead of 2.

     Deliberately NOT inside the `useGSAP` below, which early-returns under
     reduced motion — and deliberately not pre-marking every panel idle, since
     the observer's first callback lands a frame later and that would flash the
     cover's dust off and straight back on. */
  useEffect(() => {
    const panels = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(":scope > .panel") ?? [],
    );
    if (!panels.length || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("panel--idle", !e.isIntersecting);
      },
      /* Half a viewport of lead-in, so dust is already drifting by the time a
         panel is scrolled to rather than starting as you arrive. */
      { rootMargin: "50% 0px 50% 0px" },
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const panels = gsap.utils.toArray<HTMLElement>(".panel");

      /* Run the handoff on the compositor where the browser can. A scroll-driven
         animation derives its progress from the same scroll offset the
         compositor is applying, in the same frame, so the counter-translation
         that holds the outgoing panel still can never be a frame stale.

         That staleness is the whole of what was left. The geometry is already
         exact (measured: 0.0px of drift across every handoff) and the main
         thread is not short of time (~7ms/frame, and switching off the grain
         blend, the particles, the sheen or the panel shadow moves none of it).
         But on a phone touch scrolling is composited and this transform is not,
         so the panel spends every frame applying the previous frame's scroll
         offset to this frame's scroll position. No main-thread scrub can fix
         that — and no desktop emulator shows it, which is why it survived two
         rounds of tuning. */
      const composited = CSS.supports("animation-timeline: scroll(root block)");

      /* Layout offset, walking `offsetTop` rather than `getBoundingClientRect`
         so a panel that is itself mid-handoff doesn't report its *transformed*
         position and poison the measurement. */
      const docTop = (el: HTMLElement) => {
        let y = 0;
        for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null)
          y += n.offsetTop;
        return y;
      };

      /* The same span the ScrollTrigger below resolves to: start where the next
         panel's top enters the viewport (never below scroll 0 — see the clamp
         note), end where it reaches the top, travel the distance between, which
         is one viewport except for a cover shorter than one. Only ever called
         outside a scroll frame — on setup and on ScrollTrigger's `refresh`,
         which already ignores the mobile URL-bar resize. */
      const measure = () => {
        panels.forEach((panel, i) => {
          const next = panels[i + 1];
          if (!next) return;
          const end = docTop(next);
          const start = Math.max(0, end - window.innerHeight);
          panel.style.setProperty("--stack-y", `${end - start}px`);
          panel.style.setProperty("--stack-scale", "0.96");
          panel.style.setProperty("animation-range", `${start}px ${end}px`);
        });
      };

      if (composited) {
        measure();
        ScrollTrigger.addEventListener("refresh", measure);
      }

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

        /* Hold a stable GPU layer for the handoff, and let go again after, so we
           never promote more than the panels actually in motion. It also pauses
           the panel's ambient loops (see the CSS), which matters on both paths:
           a composited animation keeps running regardless, but a layer whose
           contents repaint still has to be re-rastered at the current scale.

           The *release* is delayed, and that is the point. This trigger ends at
           "next panel's top reaches the viewport top" — exactly the moment the
           flicker was first reported. Dropping `will-change` there tears the
           composited layer down and forces a full re-raster, and the smallest
           scroll back re-creates it; ride the boundary and the panel is promoted
           and de-promoted over and over, which is the flicker rather than a
           symptom of it. Adding is still immediate — it happens a whole viewport
           before anything moves — but the drop waits for the panel to have been
           done for a beat, so scrubbing across the seam never triggers it. */
        const onToggle = (self: { isActive: boolean }) => {
          window.clearTimeout(unpromote);
          if (self.isActive) panel.classList.add("panel--handoff");
          else unpromote = window.setTimeout(() => panel.classList.remove("panel--handoff"), 650);
        };

        /* `clamp()` keeps the start from resolving to a NEGATIVE scroll
           position. Without it, a panel shorter than the viewport is already
           part-way through its handoff at scroll 0 — the cover was rendering
           translated ~56px down with the scale already easing off, which reads
           as a gap above the envelope and pushes the "tap the seal" hint against
           the bottom edge. `measure()` above clamps the CSS range the same way. */
        const start = "clamp(top bottom)"; // next panel's top enters the viewport
        const end = "top top"; //             ...and reaches the viewport top

        if (composited) {
          /* The transform belongs to the compositor on this path; all that is
             left for the main thread is the promotion/ambient-loop toggle, which
             is two class changes per handoff rather than one write per frame. */
          ScrollTrigger.create({ trigger: next, start, end, onToggle });
          return;
        }

        /* Fallback: the same animation on the main thread, for browsers without
           scroll-driven animations (Safari before 26, Firefox before 144).

           One tween, one ScrollTrigger per panel — fewer moving parts for the
           scrubber to keep in sync each frame.

           `y` holds the panel still: +1 viewport of downward travel over
           exactly 1 viewport of scroll cancels the scroll, so it reads as
           frozen while the next page slides up over it (whose shadow + rounded
           top sells the depth). Transforms don't affect layout, so the
           full-screen displacement adds no scroll height. A slight scale back
           lets it recede behind the incoming page.

           Smoothness: `scrub: true` keeps the freeze exact (see the note on it
           below — a numeric scrub reads as the panel sliding out of place and
           settling back); `snap` keeps the settling tail from re-rastering for
           changes below a physical pixel; and we
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
              start,
              end,
              /* `true`, not a number, and this is not negotiable for a freeze.
                 A numeric scrub drives `totalProgress` through an `expo` tween
                 of that duration, restarted toward the new target on every
                 update (ScrollTrigger.js, `scrubTween`). One 60fps frame is
                 2.8% of a 0.6s duration and `expo.out(0.028)` ≈ 0.175, so each
                 frame closes only ~17% of the gap and the steady-state lag
                 settles at ~4.7 frames of travel — around 190px at a moderate
                 40px/frame. The panel is only frozen if `y` cancels the scroll
                 *exactly*, so that lag is not smoothing, it is displacement:
                 the panel visibly rides out of position while you scroll and
                 eases back once you stop, in both directions. `true` renders
                 the tween synchronously inside the scroll event instead, so `y`
                 is always the current scroll offset and the panel genuinely
                 holds still.

                 This is why the earlier low-pass was there, and why it can go
                 now: it was masking per-frame cost, not scroll noise. The panel
                 is promoted for the whole handoff, its ambient loops are
                 paused, the reveals no longer animate an uncompositable blur on
                 phones, and Lenis writes the scroll from inside `gsap.ticker`
                 so the transform lands in the same frame — see the notes on
                 each. Reintroduce a numeric scrub and the displacement comes
                 straight back. */
              scrub: true,
              invalidateOnRefresh: true, // innerHeight is re-read on refresh
              onToggle,
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
        /* useGSAP's context reverts the tweens and triggers it created; the
           inline properties are ours to undo. Clearing them leaves the CSS rule
           animating from identity to identity, which is inert. */
        if (composited) {
          ScrollTrigger.removeEventListener("refresh", measure);
          panels.forEach((panel) => {
            panel.style.removeProperty("--stack-y");
            panel.style.removeProperty("--stack-scale");
            panel.style.removeProperty("animation-range");
          });
        }
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

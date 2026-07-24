import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/* Module singleton so scrollToSection / setScrollLocked can reach the live
   instance from anywhere without prop-drilling a context. */
let lenis: Lenis | null = null;

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* lerp instead of duration+easing: a fixed catch-up factor tracks the
       input tightly (no long glide that trails the wheel and reads as lag),
       while still smoothing frame to frame. */
    const instance = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis = instance;

    instance.on("scroll", ScrollTrigger.update);

    /* Drive Lenis from GSAP's ticker so the scroll position and every
       scrubbed transform advance on the SAME rAF. Running Lenis on its own
       requestAnimationFrame — as before — let the held/stacked panels update
       a frame behind the scroll, which is exactly the lag being reported. */
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /* A lock may have been requested (by the sealed envelope) before Lenis
       existed — honour it now. */
    if (document.documentElement.classList.contains("scroll-locked")) instance.stop();

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  return <>{children}</>;
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── The guided scroll ──────────────────────────────────────────────────
   "View Invitation" plays the whole card through to the foot of the page by
   itself. Two numbers shape how it feels. */

/** Pixels per second at the steady middle of the travel.
 *
 *  This is a *reading* pace, not a transition: a line of body copy stays on
 *  screen for several seconds, which is the whole point of the guided scroll.
 *  It works out around 15s for a phone-height page. It felt slow to tune and
 *  reads correctly in use — the instinct to speed it back up is the one to
 *  resist, and anyone who wants to go faster can simply scroll. */
const TOUR_SPEED = 270;
/** …clamped, so a short desktop page isn't over in a blink and a very tall
    phone page doesn't become a feature film. */
const TOUR_MIN_S = 12;
const TOUR_MAX_S = 40;
/** Fraction of the travel spent ramping the speed up, and again down. */
const TOUR_RAMP = 0.12;

/**
 * Constant velocity through the middle, eased at both ends.
 *
 * The obvious choice is a cubic ease-in-out, but over a travel this long its
 * peak velocity is twice the average — the middle of the card whips past
 * while both ends crawl. This integrates a *velocity* profile instead:
 * smoothstep up over the first `TOUR_RAMP`, flat, smoothstep down. The
 * result reads as deliberate rather than elastic, and it holds the per-frame
 * scroll delta nearly constant, which is what keeps the composited panel
 * handoffs from having to re-raster at a changing rate.
 */
function tourEase(t: number) {
  const a = TOUR_RAMP;
  const total = 1 - a; // area under the velocity profile, for normalising
  const ramp = (u: number) => u ** 3 - u ** 4 / 2; // ∫ smoothstep, = 0.5 at u=1
  if (t <= a) return (a * ramp(t / a)) / total;
  if (t < 1 - a) return (a / 2 + (t - a)) / total;
  return 1 - (a * ramp((1 - t) / a)) / total;
}

const TAKEOVER_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
  " ",
  "Escape",
]);

let endTour: (() => void) | null = null;

/**
 * Scroll from wherever we are to the foot of the page, smoothly, and hand
 * control straight back the moment the reader wants it.
 *
 * Wheel and touch need no help: Lenis routes them through
 * `scrollTo(targetScroll + delta)`, and during a *programmatic* scroll it
 * keeps `targetScroll` pinned to the current animated position (see
 * `onUpdate` in lenis.mjs), so a nudge resumes from wherever the tour has
 * reached instead of flinging the reader at its destination. Keys are the
 * gap — Lenis's virtual scroll doesn't observe them — so they are cancelled
 * here by hand.
 */
export function autoScrollToEnd() {
  if (typeof window === "undefined") return;

  /* Under reduced motion a long unattended pan is precisely the thing the
     setting is asking us not to do; step to the first content panel instead.
     Same path when Lenis never mounted, which is the same condition. */
  if (!lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.getElementById("details")?.scrollIntoView({ block: "start" });
    return;
  }

  const instance = lenis;
  endTour?.();

  const distance = instance.limit - instance.scroll;
  if (distance < 8) return;

  const duration = Math.min(TOUR_MAX_S, Math.max(TOUR_MIN_S, distance / TOUR_SPEED));

  const onKey = (e: KeyboardEvent) => {
    if (!TAKEOVER_KEYS.has(e.key)) return;
    /* Retarget to where we already are: that replaces the running animation
       without moving anything, so the reader keeps the position they can see. */
    instance.scrollTo(instance.scroll, { immediate: true, force: true });
    endTour?.();
  };

  /* onComplete only fires if the tour runs to the end — an interrupted one is
     simply replaced — so the timer is what guarantees the listener goes away. */
  const timer = window.setTimeout(() => endTour?.(), duration * 1000 + 1000);
  endTour = () => {
    window.clearTimeout(timer);
    window.removeEventListener("keydown", onKey);
    endTour = null;
  };
  window.addEventListener("keydown", onKey, { passive: true });

  instance.scrollTo("bottom", {
    duration,
    easing: tourEase,
    onComplete: () => endTour?.(),
  });
}

/** Gate scrolling — used to hold the page on the sealed envelope until it is
 *  opened. Toggles a class (works even before Lenis mounts / under reduced
 *  motion) and stops Lenis so wheel and touch are ignored too. */
export function setScrollLocked(locked: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("scroll-locked", locked);
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

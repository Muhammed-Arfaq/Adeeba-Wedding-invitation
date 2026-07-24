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
   itself — one screenful at a time, pausing on each to be read.

   It used to be a single continuous glide at a constant 270px/s. Stepping is
   not merely a slower version of that: a continuous pan gives every line the
   same fraction of a second in the comfortable middle of the screen, whereas
   dwelling holds a whole screenful still long enough to actually read it.
   The pause is the feature; the travel between pauses is just transport. */

/** How far a *filler* step travels, as a fraction of the viewport — used only
    to cross a panel taller than one screen. Deliberately shy of a full screen
    so the last line or two of the previous screenful stays visible; a clean
    1.0 loses your place at every step. */
const STEP_VIEWPORT_RATIO = 0.85;
/** Seconds of travel per step… */
const STEP_SECONDS = 1.6;
/** …and seconds held still afterwards, reading. */
const DWELL_SECONDS = 2;

/** Document offset of an element, walking `offsetParent` rather than using a
 *  rect — a panel that is mid-handoff reports its *transformed* position, and
 *  that would poison the stop list. Same reason StackScroll does this. */
function docTop(el: HTMLElement) {
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null)
    y += n.offsetTop;
  return y;
}

/**
 * Where the tour pauses, in document order.
 *
 * **Every panel top is a stop.** That is the point of the whole thing: a panel
 * top is the one position where the panel is fully composed and its handoff
 * has not started, so it is the only place a pause shows a clean page rather
 * than one sliding under the next. Stepping by a fixed fraction of the
 * viewport instead — as this did first — lands wherever it happens to land and
 * the pause falls mid-sentence, or mid-handoff.
 *
 * Panels taller than a screen also get filler stops on the way through, or the
 * 2–3 screen details panel would be one long uninterrupted slide with nothing
 * to read it by. A filler is skipped when it would land within about a quarter
 * screen of the next panel top, which would otherwise read as a stutter
 * immediately before the real stop.
 */
function buildStops(limit: number, viewport: number) {
  const panels = Array.from(document.querySelectorAll<HTMLElement>(".stack > .panel"));
  const anchors = panels
    .map(docTop)
    .concat(limit)
    .filter((y) => y > 0 && y <= limit)
    .sort((a, b) => a - b);

  const stops: number[] = [];
  let cursor = 0;
  for (const anchor of anchors) {
    while (anchor - cursor > viewport * 1.25) {
      cursor = Math.min(anchor, cursor + viewport * STEP_VIEWPORT_RATIO);
      if (anchor - cursor > viewport * 0.25) stops.push(cursor);
    }
    stops.push(anchor);
    cursor = anchor;
  }
  return [...new Set(stops.map(Math.round))].sort((a, b) => a - b);
}

/**
 * Sine ease-in-out, for one step.
 *
 * The old continuous tour deliberately avoided an ease-in-out — over a very
 * long travel its peak velocity is twice the average, so the middle whipped
 * past. That reasoning does not carry here: a step is short and *should*
 * start and stop, and sine keeps the peak to ~1.57x the average, which is
 * gentler at both ends than a cubic.
 */
function stepEase(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
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
 * Step to the foot of the page, a screenful at a time, and hand control
 * straight back the moment the reader wants it.
 *
 * Two different mechanisms cover the two states, which is worth knowing
 * before "simplifying" either away:
 *
 *  - **Mid-step**, a wheel or touch is handled by Lenis itself: it routes
 *    them through `scrollTo(targetScroll + delta)`, which replaces the
 *    running animation. Our `onComplete` therefore never fires, so no next
 *    step is ever queued and the tour simply stops. Lenis also pins
 *    `targetScroll` to the current animated position during a *programmatic*
 *    scroll (`onUpdate` in lenis.mjs), so the reader resumes from where the
 *    tour had reached rather than being flung at its destination.
 *  - **Mid-dwell**, nothing is animating and there is no animation to
 *    replace, so the pending timer has to be cancelled explicitly. That is
 *    what the listeners below are for — without them a nudge during a pause
 *    would be overridden a moment later by the next step.
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

  if (instance.limit - instance.scroll < 8) return;

  /* Resolved once, up front, rather than accumulated a step at a time from
     the live scroll position — incremental stepping drifts, and drift is
     exactly what stops a pause landing on a panel top. */
  const stops = buildStops(instance.limit, window.innerHeight).filter(
    (y) => y > instance.scroll + 4,
  );
  if (!stops.length) return;

  let timer = 0;
  let i = 0;

  const takeOver = (e: Event) => {
    if (e.type === "keydown" && !TAKEOVER_KEYS.has((e as KeyboardEvent).key)) return;
    endTour?.();
  };

  /* A backstop in case a step's `onComplete` never arrives and no takeover
     event follows either — the listeners would otherwise outlive the tour. */
  const safety = window.setTimeout(
    () => endTour?.(),
    (stops.length + 1) * (STEP_SECONDS + DWELL_SECONDS) * 1000 + 4000,
  );

  endTour = () => {
    window.clearTimeout(timer);
    window.clearTimeout(safety);
    window.removeEventListener("wheel", takeOver);
    window.removeEventListener("touchstart", takeOver);
    window.removeEventListener("keydown", takeOver);
    endTour = null;
  };

  window.addEventListener("wheel", takeOver, { passive: true });
  window.addEventListener("touchstart", takeOver, { passive: true });
  window.addEventListener("keydown", takeOver, { passive: true });

  const step = () => {
    if (i >= stops.length) {
      endTour?.();
      return;
    }
    const target = stops[i++];
    instance.scrollTo(target, {
      duration: STEP_SECONDS,
      easing: stepEase,
      onComplete: () => {
        timer = window.setTimeout(step, DWELL_SECONDS * 1000);
      },
    });
  };

  step();
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

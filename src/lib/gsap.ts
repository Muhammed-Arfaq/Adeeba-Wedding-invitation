import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip);

/* Mobile browsers fire `resize` every time the URL bar slides in or out, i.e.
   in the middle of the scroll gesture that hides it. Left alone, ScrollTrigger
   answers with a full refresh — re-measuring every panel and snapping the
   scrubbed transforms to the new numbers — which lands as a jolt right at the
   panel handoff. This ignores height-only resizes on touch devices, which is
   exactly the browser-chrome case; orientation changes still refresh. */
ScrollTrigger.config({ ignoreMobileResize: true });

/* Reveal classes (.rv/.rv-l/.rv-r) start at opacity:0, but only once this
   class is on <html>. Setting it here — at module scope, on the import that
   index.tsx already pulls in for its side effect — means it lands before
   hydration paints. If JS never runs, the class never appears and every
   section renders fully visible instead of staying blank. */
if (typeof document !== "undefined") {
  document.documentElement.classList.add("motion-ready");
}

/* Phones skip the reveal's blur. The reveals fire at `top 82%`, which is inside
   the panel handoff by construction — the handoff runs from the incoming
   panel's top at the viewport bottom to the viewport top, so every start
   position sits within it. An animated `filter: blur()` cannot be composited:
   Chrome repaints each of the eight-or-so staggered elements on every frame the
   tween runs, on exactly the frames the stack is already scaling a full-screen
   textured panel. Desktop GPUs absorb that; phones drop frames, and a dropped
   frame is what turns the scrubbed transform's steady one-frame lag into a
   varying one — which is what the eye reads as vibration. Same reveal, minus
   the one part of it that can't be done on the GPU.

   Evaluated at module scope: this module is imported for its side effects
   before hydration, and REVEAL is only ever read inside `useGSAP`, so the
   server's value (desktop) is never rendered. */
const PHONE = typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

/** Reveal blur, or nothing on phones. Pair `revealBlur(n)` in `from` with
 *  `revealBlur(0)` in `to` so the property is absent from both or neither —
 *  a `to` that animates to `blur(0px)` from no filter costs the same repaints. */
export const revealBlur = (px: number) => (PHONE ? {} : { filter: `blur(${px}px)` });

/** Shared reveal defaults, so every section moves with one voice. */
export const REVEAL = {
  from: { opacity: 0, y: 34, ...revealBlur(6) },
  to: {
    opacity: 1,
    y: 0,
    ...revealBlur(0),
    duration: 0.9,
    ease: "power3.out",
  },
  stagger: 0.11,
  start: "top 82%",
};

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export { gsap, useGSAP, ScrollTrigger, Flip };

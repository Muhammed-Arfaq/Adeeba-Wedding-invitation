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

/** Shared reveal defaults, so every section moves with one voice. */
export const REVEAL = {
  from: { opacity: 0, y: 34, filter: "blur(6px)" },
  to: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.9,
    ease: "power3.out",
  },
  stagger: 0.11,
  start: "top 82%",
} as const;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export { gsap, useGSAP, ScrollTrigger, Flip };

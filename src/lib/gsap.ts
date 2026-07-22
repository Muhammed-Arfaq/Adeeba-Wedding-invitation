import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip);

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

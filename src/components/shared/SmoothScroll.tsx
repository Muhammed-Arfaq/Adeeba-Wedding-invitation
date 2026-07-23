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

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/** Thin gold bar across the top tracking how far through the invitation you are. */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let max = 0;

    /* `scrollHeight` flushes pending layout. Reading it inside the scroll frame
       — as this used to — forced a synchronous layout on every scrolled frame,
       interleaved with the transforms StackScroll writes on the same frame, and
       that thrash is felt as judder during the panel handoff. The document only
       changes height when something reflows, so measure it then instead. */
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
      update();
    };

    const update = () => {
      frame = 0;
      const el = barRef.current;
      if (!el) return;
      const ratio = max > 0 ? window.scrollY / max : 0;
      el.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    /* Panel heights settle after fonts and the lazy map land; ScrollTrigger
       already re-measures then, so piggyback rather than poll. */
    ScrollTrigger.addEventListener("refresh", measure);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ScrollTrigger.removeEventListener("refresh", measure);
    };
  }, []);

  return <div ref={barRef} className="scroll-progress" aria-hidden />;
}

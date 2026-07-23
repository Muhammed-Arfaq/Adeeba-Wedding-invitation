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

      panels.forEach((panel, i) => {
        const next = panels[i + 1];
        if (!next) return; // nothing covers the last one

        const st = {
          trigger: next,
          start: "top bottom", // next panel's top enters the viewport
          end: "top top", // ...and reaches the viewport top
          scrub: true,
          invalidateOnRefresh: true, // innerHeight is read on refresh, not once
        } as const;

        /* Hold it still: +1 viewport of travel over exactly 1 viewport of
           scroll. Transforms don't affect layout, so this adds no scroll
           height even though the panel is displaced a full screen down. */
        gsap.fromTo(
          panel,
          { y: 0 },
          { y: () => window.innerHeight, ease: "none", scrollTrigger: st },
        );

        /* ...and let it sink away behind the incoming page. */
        gsap.fromTo(
          panel,
          { scale: 1, opacity: 1 },
          {
            scale: 0.92,
            opacity: 0.35,
            ease: "none",
            transformOrigin: "50% 0%",
            scrollTrigger: st,
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

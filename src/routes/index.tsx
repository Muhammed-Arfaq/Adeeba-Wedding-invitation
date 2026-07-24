import { createFileRoute } from "@tanstack/react-router";
import { EnvelopeCover } from "@/components/invitation/EnvelopeCover";
import { StackScroll } from "@/components/shared/StackScroll";
import { WeddingDetails } from "@/components/invitation/WeddingDetails";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { FinalBlessing } from "@/components/invitation/FinalBlessing";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { MusicProvider } from "@/context/MusicContext";
import { MusicWidget } from "@/components/shared/MusicWidget";
import { wedding } from "@/config/wedding";
import "@/lib/gsap"; /* ensure plugins are registered */

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: wedding.meta.title },
      { name: "description", content: wedding.meta.description },
      { property: "og:title", content: wedding.meta.ogTitle },
      { property: "og:description", content: wedding.meta.ogDescription },
    ],
    /* The sealed envelope is the first thing on screen — fetch its plates up
       front so it doesn't pop in after the page. `media` keeps it phone-only
       (the artwork is swapped for the CSS envelope at ≥640px). */
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/images/envelope-body.webp",
        type: "image/webp",
        media: "(max-width: 639px)",
      },
      {
        rel: "preload",
        as: "image",
        href: "/images/envelope-flap.webp",
        type: "image/webp",
        media: "(max-width: 639px)",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MusicProvider>
      <ScrollProgress />
      <SmoothScroll>
        <main className="relative overflow-x-hidden">
          {/* Panel order here is both the scroll order and the stacking
              order — each one deals over the last. Light and dark alternate
              so the deck reads as kraft paper interleaved with black card. */}
          <StackScroll>
            <EnvelopeCover />
            <WeddingDetails />
            <CountdownSection />
            <FinalBlessing />
          </StackScroll>
        </main>
      </SmoothScroll>
      <MusicWidget />
    </MusicProvider>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { InvitationCover } from "@/components/invitation/InvitationCover";
import { WelcomeMessage } from "@/components/invitation/WelcomeMessage";
import { FamilyDetails } from "@/components/invitation/FamilyDetails";
import { WeddingDetails } from "@/components/invitation/WeddingDetails";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { VenueExperience } from "@/components/invitation/VenueExperience";
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
  }),
  component: Index,
});

function Index() {
  return (
    <MusicProvider>
      <ScrollProgress />
      {/* One continuous marble slab behind every band. Fixed rather than a
          per-section background so the stone reads as a single surface the
          content slides over, instead of the same 1024px tile restarting in
          each section. Lenis scrolls the window and applies no wrapper
          transform, so `position: fixed` stays put. */}
      <div className="page-marble" aria-hidden />
      <SmoothScroll>
        <main className="relative z-10 overflow-x-hidden">
          <InvitationCover />
          <WelcomeMessage />
          <FamilyDetails />
          <WeddingDetails />
          <CountdownSection />
          <VenueExperience />
          <FinalBlessing />
        </main>
      </SmoothScroll>
      <MusicWidget />
    </MusicProvider>
  );
}

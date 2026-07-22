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
      <SmoothScroll>
        <main className="overflow-x-hidden">
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

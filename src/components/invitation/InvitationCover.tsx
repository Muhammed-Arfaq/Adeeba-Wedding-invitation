import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { wedding } from "@/config/wedding";
import { useMusic } from "@/context/MusicContext";
import { scrollToSection } from "@/components/shared/SmoothScroll";
import { Particles } from "@/components/shared/Particles";
import { GoldDivider } from "@/components/shared/GoldDivider";
import { Emblem786 } from "@/components/shared/Emblem";

export function InvitationCover() {
  const rootRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);
  const [opened, setOpened] = useState(false);
  const { startMusic } = useMusic();

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.set(contentRef.current, { opacity: 0 });

      /* seal breathes gently until tapped */
      gsap.to(promptRef.current, {
        scale: 1.04,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "center center",
      });

      /* drapes sway almost imperceptibly */
      gsap.to(leftRef.current, {
        scaleX: 1.008,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "left center",
      });
      gsap.to(rightRef.current, {
        scaleX: 1.008,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "right center",
      });
    },
    { scope: rootRef },
  );

  function openCurtain() {
    if (openedRef.current) return;
    openedRef.current = true;
    setOpened(true);
    startMusic();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set([leftRef.current, rightRef.current], { display: "none" });
      gsap.set(contentRef.current, { opacity: 1 });
      gsap.set(".hero-line", { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
    tl.to(promptRef.current, { scale: 0.7, opacity: 0, duration: 0.45, ease: "power2.in" })
      .to(leftRef.current, { x: "-101%", duration: 2, ease: "power3.inOut" }, 0.2)
      .to(rightRef.current, { x: "101%", duration: 2, ease: "power3.inOut" }, 0.32)
      .to(contentRef.current, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0.9)
      .fromTo(
        ".hero-line",
        { opacity: 0, y: 38 },
        { opacity: 1, y: 0, stagger: 0.13, duration: 0.85, ease: "power2.out" },
        1.1,
      );
  }

  return (
    <section ref={rootRef} id="cover" aria-label="Invitation cover" className="hero-scene">
      <div className="hero-bg absolute inset-0" aria-hidden />
      <div className="hero-vignette" aria-hidden />
      <Particles />

      <div
        ref={contentRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 py-16 text-center"
        aria-hidden={!opened}
      >
        <div className="relative w-full max-w-sm sm:max-w-md">
          <div className="hero-frame" aria-hidden>
            <span className="corner-mark corner-mark--tl" />
            <span className="corner-mark corner-mark--tr" />
            <span className="corner-mark corner-mark--bl" />
            <span className="corner-mark corner-mark--br" />
          </div>

          <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14">
            <div className="hero-line flex justify-center">
              <Emblem786 />
            </div>

            <p className="hero-line mt-5 font-arabic text-lg leading-loose text-gold-soft sm:text-xl">
              {wedding.quran.cover.arabic}
            </p>

            <GoldDivider className="hero-line" />

            <p className="hero-line text-[0.62rem] tracking-[0.38em] uppercase text-cream/70">
              {wedding.cover.subtitle}
            </p>

            <h1 className="hero-line mt-5 font-display text-3xl font-semibold tracking-wider text-cream sm:text-4xl">
              {wedding.bride.displayName}
            </h1>
            <p className="hero-line my-2 font-arabic text-2xl text-gold sm:text-3xl" aria-hidden>
              &amp;
            </p>
            <h1 className="hero-line font-display text-3xl font-semibold tracking-wider text-cream sm:text-4xl">
              {wedding.groom.displayName}
            </h1>

            <GoldDivider className="hero-line" />

            <p className="hero-line font-display text-base tracking-wide text-cream/90">
              {wedding.weddingDateLabel}
            </p>
            <p className="hero-line mt-1 text-xs text-cream/70">
              {wedding.ceremonyName} &nbsp;·&nbsp; {wedding.weddingTimeLabel}
            </p>
            <p className="hero-line mt-1 text-xs text-cream/60">
              {wedding.venue.name}, {wedding.venue.location}
            </p>

            <button
              type="button"
              onClick={() => scrollToSection("welcome")}
              className="hero-line btn-gold mt-8"
            >
              View Invitation
            </button>
          </div>
        </div>
      </div>

      <div ref={leftRef} className="curtain-half left" aria-hidden>
        <div className="curtain-fabric" />
        <div className="curtain-edge-left" />
        <div className="curtain-tassel left" />
        {[14, 30, 50, 68, 84].map((pos) => (
          <div
            key={pos}
            className="curtain-fold absolute top-0 bottom-0 w-px bg-black/25"
            style={{ left: `${pos}%` }}
          />
        ))}
      </div>
      <div ref={rightRef} className="curtain-half right" aria-hidden>
        <div className="curtain-fabric" />
        <div className="curtain-edge-right" />
        <div className="curtain-tassel right" />
        {[16, 32, 50, 70, 86].map((pos) => (
          <div
            key={pos}
            className="curtain-fold absolute top-0 bottom-0 w-px bg-black/25"
            style={{ left: `${pos}%` }}
          />
        ))}
      </div>

      {!opened && (
        <>
          <button
            type="button"
            onClick={openCurtain}
            className="curtain-hit"
            aria-label="Open the invitation"
          />

          <div ref={promptRef} className="curtain-prompt" aria-hidden>
            <div className="flex flex-col items-center gap-5">
              <div className="seal">
                <span className="seal__halo" />
                <span className="seal__halo" />
                <span className="seal__inner">
                  <span className="seal__mono">
                    {wedding.monogram.left}&amp;{wedding.monogram.right}
                  </span>
                </span>
              </div>
              <p className="text-[0.6rem] tracking-[0.35em] uppercase text-gold-soft/85">
                {wedding.cover.curtainPrompt}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

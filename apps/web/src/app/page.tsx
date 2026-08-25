"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TrackPicker } from "@/components/hero/TrackPicker";
import { DtoLayerStack } from "@/components/hero/DtoLayerStack";
import { IntroCurtain } from "@/components/hero/IntroCurtain";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { useMessages } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import type { Language } from "@/lib/workshop/types";
import { HERO_TRANSITION_MS } from "@/components/hero/heroMotion";

const PICKER_LABEL_ID = "track-picker-label";

/** 6px accent node between the eyebrow's three words. */
function EyebrowDot() {
  return (
    <span
      aria-hidden="true"
      className="size-[6px] shrink-0 rounded-full bg-bg-accent"
    />
  );
}

export default function Home() {
  const { state, selectLanguage } = useWorkshop();
  const messages = useMessages();
  const router = useRouter();
  const [previewTrack, setPreviewTrack] = useState<Language | null>(null);
  const [committedTrack, setCommittedTrack] = useState<Language | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const displayedTrack = previewTrack ?? state.language;
  // The illustration warms its renderer up behind the curtain and only reveals
  // once the plane starts lifting, so the opening move of the stack lands in
  // front of someone rather than behind a white plane.
  const [introLifted, setIntroLifted] = useState(false);
  const handleIntroLift = useCallback(() => setIntroLifted(true), []);
  // The curtain waits on this rather than on a fixed duration: whatever the
  // renderer actually needs is what the intro actually absorbs.
  const [stackSettled, setStackSettled] = useState(false);
  const handleStackSettled = useCallback(() => setStackSettled(true), []);

  useEffect(
    () => () => {
      if (transitionTimer.current) {
        window.clearTimeout(transitionTimer.current);
      }
    },
    [],
  );

  function activateTrack(language: Language) {
    if (committedTrack) {
      return;
    }

    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      router.push("/workshop");
      return;
    }

    setPreviewTrack(language);
    setCommittedTrack(language);
    transitionTimer.current = window.setTimeout(() => {
      router.push("/workshop");
    }, HERO_TRANSITION_MS);
  }

  return (
    <>
      {/* The landing has no header bar, so the language control sits on its
          own — pinned to the same top-right corner the workshop header puts
          it in, above the illustration rather than inside it. */}
      <div className="fixed top-[clamp(16px,2.4svh,26px)] right-[clamp(16px,2.2vw,32px)] z-30">
        <LocaleSwitcher />
      </div>

      <main className="relative flex flex-1 flex-col overflow-x-hidden bg-bg-canvas min-[1280px]:h-svh min-[1280px]:max-h-svh min-[1280px]:overflow-hidden">
        <section className="relative mx-auto flex w-full max-w-[1672px] flex-col px-[clamp(24px,6.28vw,105px)] pt-[clamp(56px,8vw,131px)] pb-[48px] min-[1280px]:h-[min(100svh,941px)] min-[1280px]:shrink-0 min-[1280px]:px-0 min-[1280px]:pt-0 min-[1280px]:pb-0">
          <div className="relative z-10 flex w-full max-w-[921px] flex-col min-[1280px]:absolute min-[1280px]:top-[clamp(56px,13.92svh,131px)] min-[1280px]:left-[105px]">
            <p className="flex items-center gap-[11px] text-[15px] leading-[1.2] font-bold tracking-[0.0133em] text-text-primary uppercase">
              {messages.landing.eyebrow[0]}
              <EyebrowDot />
              {messages.landing.eyebrow[1]}
              <EyebrowDot />
              {messages.landing.eyebrow[2]}
            </p>

            <h1 className="mt-[37px] text-text-primary">
              <span className="-ml-px block text-[clamp(2.75rem,8.2vw,137px)] leading-none font-bold tracking-[-0.0496em] uppercase min-[1280px]:-ml-[3px]">
                {messages.landing.workshop}
              </span>
              <span className="mt-[12px] block text-[clamp(2rem,5.98vw,100px)] leading-none font-bold tracking-[-0.0458em]">
                DTO<span className="text-text-accent">&amp;</span>Mapping
              </span>
            </h1>

            <p className="mt-[37px] max-w-[32ch] text-[clamp(1rem,1.32vw,22px)] leading-[1.64] tracking-[-0.0136em] text-text-secondary min-[1280px]:max-w-[520px]">
              {messages.landing.lede}
            </p>

            <h2
              id={PICKER_LABEL_ID}
              className="mt-[54px] text-[15px] leading-[1.2] font-bold tracking-[0.0133em] text-text-primary uppercase"
            >
              {messages.landing.pickerHeading}
            </h2>

            <div className="mt-[28px]">
              <TrackPicker
                value={state.language}
                onChange={selectLanguage}
                onActivate={activateTrack}
                previewed={previewTrack}
                committed={committedTrack}
                onPreviewChange={setPreviewTrack}
                labelledBy={PICKER_LABEL_ID}
              />
            </div>
          </div>

          {/* At the Figma breakpoint this keeps the exact 722 × 941 right-hand
            frame, optically lowered so the visible stack spans from the
            eyebrow to the language-card band. Below it the illustration
            rejoins document flow so picker order stays unchanged. */}
          <DtoLayerStack
            previewTrack={displayedTrack}
            selectedTrack={committedTrack}
            expanded={previewTrack !== null}
            readyToReveal={introLifted}
            onSettled={handleStackSettled}
            className="relative z-0 mt-[48px] h-[clamp(340px,96vw,540px)] w-full min-[1280px]:absolute min-[1280px]:top-[clamp(18px,2.92svh,28px)] min-[1280px]:right-0 min-[1280px]:mt-0 min-[1280px]:h-[min(100svh,941px)] min-[1280px]:w-[722px]"
          />
        </section>
      </main>

      {/* Outside `main` on purpose. A `position: fixed` plane is clipped by any
          ancestor that establishes a containing block — a `transform`, `filter`
          or `contain` anywhere above it — and the hero is exactly the kind of
          subtree that acquires one. Kept as a sibling of the page, it cannot. */}
      <IntroCurtain sceneReady={stackSettled} onLift={handleIntroLift} />
    </>
  );
}
